import { chromium, FullConfig, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authDir = path.join('e2e', '.auth');

const authFilesByProjectName: Record<string, string> = {
  chromium: path.join(authDir, 'user.chromium.json'),
  firefox: path.join(authDir, 'user.firefox.json'),
  webkit: path.join(authDir, 'user.webkit.json'),
};

const authReuseMaxAgeMs = 10 * 60 * 1000; // 10 minutes – Supabase JWT may expire quickly

function isSessionExpired(authFile: string): boolean {
  try {
    const data = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    for (const origin of data.origins ?? []) {
      for (const item of origin.localStorage ?? []) {
        if (item.name === 'auth-state' && typeof item.value === 'string') {
          const parsed = JSON.parse(item.value);
          // Navigate to the session expiry: auth-state.state.session.expires_at
          const expiresAt = parsed?.state?.session?.expires_at;
          if (typeof expiresAt === 'number') {
            const nowSec = Math.floor(Date.now() / 1000);
            const remaining = expiresAt - nowSec;
            console.log(
              `Auth session expires in ${remaining}s (expires_at=${expiresAt})`,
            );
            return remaining < 60; // less than 1 minute remaining → expired
          }
        }
      }
    }
    // If we can't find an expiry, be conservative and treat as expired
    console.log(
      'Could not find session expiry in auth state – treating as expired',
    );
    return true;
  } catch (e) {
    console.log(
      'Could not parse auth state for expiry check – treating as expired',
    );
    return true;
  }
}

function reuseFreshAuthState() {
  const chromiumAuthFile = authFilesByProjectName.chromium;

  if (!fs.existsSync(chromiumAuthFile)) {
    return false;
  }

  const ageMs = Date.now() - fs.statSync(chromiumAuthFile).mtimeMs;
  if (ageMs >= authReuseMaxAgeMs) {
    console.log(
      'Auth state file older than 10 minutes – performing fresh login.',
    );
    return false;
  }

  if (isSessionExpired(chromiumAuthFile)) {
    console.log(
      'Auth session expired or near expiry – performing fresh login.',
    );
    return false;
  }

  for (const authFile of Object.values(authFilesByProjectName)) {
    if (authFile !== chromiumAuthFile) {
      fs.copyFileSync(chromiumAuthFile, authFile);
    }
  }

  console.log(
    'Reusing existing auth state (session valid, file < 10 min old).',
  );
  return true;
}

async function fillLoginForm(page: Page, email: string, password: string) {
  const emailInput = page.locator('#email');
  const passwordInput = page.locator('#password');

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await page.waitForTimeout(250);

    const emailValue = await emailInput.inputValue();
    const passwordValue = await passwordInput.inputValue();

    if (emailValue === email && passwordValue === password) {
      return;
    }
  }

  throw new Error(
    'Login form did not retain credentials after fill. Check hydration/readiness.',
  );
}

async function globalSetup(config: FullConfig) {
  fs.mkdirSync(authDir, { recursive: true });
  fs.mkdirSync(path.join('e2e', 'logs'), { recursive: true });

  if (reuseFreshAuthState()) {
    return;
  }

  const { baseURL } = config.projects[0].use;

  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set for the tests.',
    );
  }

  // Use browser-based login to capture the exact auth state the app creates.
  // This ensures cookies and localStorage match what Supabase SSR expects.
  // We only need to do this once with chromium - the auth state is browser-agnostic.
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to login page with generous timeout for dev server cold start.
  // Wait past the first committed HTML so the client-side login form is hydrated
  // before filling controlled inputs.
  await page.goto(`${baseURL}/login`, {
    waitUntil: 'domcontentloaded',
    timeout: 300_000,
  });
  await page.locator('#email').waitFor({ state: 'visible', timeout: 180_000 });
  await page
    .waitForLoadState('networkidle', { timeout: 60_000 })
    .catch(() => undefined);

  await page.screenshot({ path: 'e2e/logs/before-login-attempt.png' });

  // Perform login
  await fillLoginForm(page, email, password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForTimeout(1000);

  // Wait for successful redirect away from login page
  try {
    await page.waitForURL(url => !url.pathname.includes('/login'), {
      timeout: 120_000,
    });
  } catch (e) {
    await page.screenshot({ path: 'e2e/logs/login-failure.png' });
    const visibleFormText = await page
      .locator('form')
      .textContent({ timeout: 1000 })
      .catch(() => '');
    console.error(`Login failed. Current URL: ${page.url()}`);
    console.error(`Login form text: ${visibleFormText}`);
    throw new Error('Login failed. Check e2e/logs/login-failure.png');
  }

  await page.screenshot({ path: 'e2e/logs/after-login-redirect.png' });

  // Wait for the page to be fully loaded (dashboard visible)
  try {
    await page
      .getByRole('heading', { name: 'Dashboard' })
      .waitFor({ state: 'visible', timeout: 120_000 });
  } catch (e) {
    await page.screenshot({ path: 'e2e/logs/after-login-not-ready.png' });
    throw new Error(
      'Post-login page not ready. Check e2e/logs/after-login-not-ready.png',
    );
  }

  // Wait for all network activity to settle so auth cookies are fully written
  await page.waitForLoadState('networkidle');

  // Save the authenticated state - this captures the exact cookies and localStorage
  // that the app created during login, ensuring perfect compatibility
  const storageState = await context.storageState();

  // Write the same state to all project files (auth is browser-agnostic)
  for (const projectName of Object.keys(authFilesByProjectName)) {
    const authFile = authFilesByProjectName[projectName];
    fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2), 'utf-8');
  }

  await browser.close();
}

export default globalSetup;
