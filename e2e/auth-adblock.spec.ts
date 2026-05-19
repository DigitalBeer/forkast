import { test, expect } from '@playwright/test';

/**
 * Adblocker Auth Loop E2E Tests
 *
 * AC5: Verifies the app handles cookie-blocking privacy tools gracefully.
 * When auth cookies are missing/blocked but localStorage has a stale user,
 * the client should clear stale state and redirect to /login once (no loop).
 *
 * NOTE: These tests run WITHOUT authentication state to simulate
 * a fresh/blocked-cookie environment.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Adblocker Auth Resilience', () => {
  test('redirects to login once when cookies are cleared (no redirect loop)', async ({
    page,
  }) => {
    // Navigate to a protected route — should redirect to /login
    await page.goto('/planner');

    // Wait for redirect to settle
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Verify we are on the login page
    await expect(page).toHaveURL(/\/login/);

    // Wait a few seconds to ensure no redirect loop occurs
    // (if a loop existed, the URL would keep changing or the page would keep reloading)
    await page.waitForTimeout(3000);

    // Still on login page — no loop
    await expect(page).toHaveURL(/\/login/);

    // Verify login page is interactive (not stuck in a loading/redirect state)
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('clears stale localStorage auth state when session is missing', async ({
    page,
  }) => {
    // Pre-seed localStorage with a stale auth state to simulate
    // a scenario where cookies expired but localStorage still has a user object.
    await page.context().addInitScript(() => {
      window.addEventListener('DOMContentLoaded', () => {
        localStorage.setItem(
          'forkast-auth-state-v1',
          JSON.stringify({
            user: {
              id: 'stale-user-id',
              email: 'stale@example.com',
              aud: 'authenticated',
              role: 'authenticated',
            },
          }),
        );
      });
    });

    // Navigate to a protected route
    await page.goto('/planner');

    // Should redirect to login (not loop)
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);

    // Verify stale localStorage was cleared by the AuthProvider
    const localStorageValue = await page.evaluate(() =>
      localStorage.getItem('forkast-auth-state-v1'),
    );

    // The AuthProvider should have cleared the stale state
    // It may be null or contain user: null after cleanup
    if (localStorageValue !== null) {
      const parsed = JSON.parse(localStorageValue);
      expect(parsed.user).toBeNull();
    }
  });

  test('public routes render without redirect when cookies are missing', async ({
    page,
  }) => {
    // Public routes should not redirect to login
    const publicRoutes = ['/', '/login', '/signup'];

    for (const route of publicRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Should NOT redirect away from the requested route
      await expect(page).toHaveURL(new RegExp(route), { timeout: 5000 });
    }
  });

  test('/auth/confirm is accessible without authentication', async ({ page }) => {
    // AC4: /auth/confirm should be in publicRoutes
    await page.goto('/auth/confirm');
    await page.waitForLoadState('networkidle');

    // Should not redirect to login
    await expect(page).toHaveURL(/\/auth\/confirm/, { timeout: 5000 });
  });

  test('login page remains stable for 5 seconds (no redirect loop)', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Collect URLs over 5 seconds to detect any redirect loop
    const urls: string[] = [];
    const interval = setInterval(() => {
      urls.push(page.url());
    }, 500);

    await page.waitForTimeout(5000);
    clearInterval(interval);

    // All recorded URLs should still be /login
    const uniqueUrls = new Set(urls.map(u => new URL(u).pathname));
    expect(uniqueUrls.size).toBe(1);
    expect(uniqueUrls.has('/login')).toBe(true);
  });
});
