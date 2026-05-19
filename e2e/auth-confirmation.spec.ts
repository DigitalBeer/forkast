import { test, expect } from '@playwright/test';

/**
 * Email Confirmation E2E Tests
 *
 * Tests the email confirmation flow for new user signups.
 * Verifies that:
 * - The /auth/confirm page handles valid confirmation codes
 * - The /auth/confirm page handles missing/invalid codes
 * - Users are redirected to /onboarding after successful signup confirmation
 *
 * NOTE: These tests run WITHOUT authentication state
 */

// Run without stored auth state so we can test unauthenticated flows
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Email Confirmation', () => {
  test('shows error when confirmation code is missing', async ({ page }) => {
    await page.goto('/auth/confirm');

    // Should display "Invalid Link" error
    await expect(page.getByRole('heading', { name: /invalid link/i })).toBeVisible();
    await expect(page.getByText(/confirmation code is missing/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /back to login/i })).toBeVisible();

    // Should still be on the confirm page (no redirect)
    await expect(page).toHaveURL(/\/auth\/confirm/);
  });

  test('shows error when confirmation code is invalid', async ({ page }) => {
    await page.goto('/auth/confirm?code=invalid_mock_code&type=signup');

    // Should display "Confirmation Failed" error
    const failedHeading = page.getByRole('heading', { name: /confirmation failed/i });
    await expect(failedHeading).toBeVisible({ timeout: 10000 });

    // Should show a link back to login
    await expect(page.getByRole('link', { name: /back to login/i })).toBeVisible();
  });

  test('redirects to onboarding after successful signup confirmation', async ({ page }) => {
    // Mock the Supabase auth exchange to simulate a successful confirmation.
    // Since we can't actually send/receive emails in CI, we intercept the
    // Supabase API call and return a successful session response.
    await page.route('**/auth/v1/token*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'mock-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
          },
        }),
      });
    });

    // Also mock the /user route that getSession may call
    await page.route('**/auth/v1/user*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-user-id',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/auth/confirm?code=mock_signup_code&type=signup');

    // Should redirect to onboarding after successful exchange
    await page.waitForURL('**/onboarding', { timeout: 15000 });
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('redirects to home for non-signup confirmation types', async ({ page }) => {
    // Mock successful exchange for a non-signup type (e.g., recovery)
    await page.route('**/auth/v1/token*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'mock-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
          },
        }),
      });
    });

    await page.route('**/auth/v1/user*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-user-id',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
        }),
      });
    });

    // Use 'recovery' type — should redirect to home, not onboarding
    await page.goto('/auth/confirm?code=mock_recovery_code&type=recovery');

    // Should redirect to home page
    await page.waitForURL('**/', { timeout: 15000 });
    await expect(page).toHaveURL(/^.*\/$/);
  });

  test('displays Forkast branding (not generic Supabase styling)', async ({ page }) => {
    await page.goto('/auth/confirm');

    // Verify the page uses the app's design system classes
    // The component uses Tailwind classes like bg-background, text-destructive, text-primary
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verify the error page structure matches Forkast's styling
    const errorContainer = page.locator('.min-h-screen.flex.items-center.justify-center');
    await expect(errorContainer).toBeVisible();
  });
});
