import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authDir = path.join('e2e', '.auth');

const authFilesByProjectName: Record<string, string> = {
  chromium: path.join(authDir, 'user.chromium.json'),
  firefox: path.join(authDir, 'user.firefox.json'),
  webkit: path.join(authDir, 'user.webkit.json'),
};

async function globalSetup(config: FullConfig) {
  fs.mkdirSync(authDir, { recursive: true });
  fs.mkdirSync(path.join('e2e', 'logs'), { recursive: true });

  const { baseURL } = config.projects[0].use;

  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set for the tests.');
  }

  // Use browser-based login to capture the exact auth state the app creates.
  // This ensures cookies and localStorage match what Supabase SSR expects.
  // We only need to do this once with chromium - the auth state is browser-agnostic.
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to login page with generous timeout for dev server cold start
  await page.goto(`${baseURL}/login`, { waitUntil: 'commit', timeout: 300_000 });
  await page.locator('#email').waitFor({ state: 'visible', timeout: 180_000 });

  await page.screenshot({ path: 'e2e/logs/before-login-attempt.png' });

  // Perform login
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();

  // Wait for successful redirect away from login page
  try {
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 120_000 });
  } catch (e) {
    await page.screenshot({ path: 'e2e/logs/login-failure.png' });
    console.error(`Login failed. Current URL: ${page.url()}`);
    throw new Error('Login failed. Check e2e/logs/login-failure.png');
  }

  await page.screenshot({ path: 'e2e/logs/after-login-redirect.png' });

  // Wait for the page to be fully loaded (dashboard visible)
  try {
    await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ state: 'visible', timeout: 120_000 });
  } catch (e) {
    await page.screenshot({ path: 'e2e/logs/after-login-not-ready.png' });
    throw new Error('Post-login page not ready. Check e2e/logs/after-login-not-ready.png');
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
