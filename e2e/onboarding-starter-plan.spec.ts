import { test, expect } from '@playwright/test';

test.describe('Onboarding Starter Plan (AC 6)', () => {
  test('new user lands on dashboard with a visible weekly plan after signup', async ({
    page,
  }) => {
    // Generate unique test user credentials
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    // Navigate to signup page
    await page.goto('/signup');

    // Fill out the signup form
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Wait for signup to complete and onboarding wizard to appear
    await expect(page.getByText('Set up your taste profile')).toBeVisible({
      timeout: 10000,
    });

    // Complete the onboarding wizard (or skip it)
    // The wizard should have a complete or skip button
    const skipButton = page.getByRole('button', { name: /skip/i });
    const completeButton = page.getByRole('button', { name: /complete/i });

    if (await skipButton.isVisible()) {
      await skipButton.click();
    } else if (await completeButton.isVisible()) {
      await completeButton.click();
    }

    // Wait for the confirmation message about email
    await expect(
      page.getByText(/check your email to confirm/i),
    ).toBeVisible({ timeout: 5000 });

    // Note: In a real E2E test, we would need to handle email confirmation.
    // For now, we assume the test user is auto-confirmed or we use a test account.

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for the dashboard to load
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 10000 });

    // Assert that the dashboard shows a plan (not the empty state)
    // The empty state shows "Aww, you have no plans, why not make one?"
    const emptyStateText = page.getByText(
      /Aww, you have no plans, why not make one?/i,
    );
    await expect(emptyStateText).not.toBeVisible({ timeout: 5000 });

    // Verify that a plan widget is visible
    // This could be a "Current Plan" widget or similar
    const planWidget = page.getByText(/Current Plan|Weekly Plan|Your Plan/i);
    await expect(planWidget).toBeVisible({ timeout: 5000 });
  });

  test('starter plan is created even when user skips onboarding', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const testEmail = `test-skip-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    await page.goto('/signup');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText('Set up your taste profile')).toBeVisible({
      timeout: 10000,
    });

    // Skip the onboarding wizard
    await page.getByRole('button', { name: /skip/i }).click();

    await expect(
      page.getByText(/check your email to confirm/i),
    ).toBeVisible({ timeout: 5000 });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 10000 });

    // Assert empty state is not shown
    const emptyStateText = page.getByText(
      /Aww, you have no plans, why not make one?/i,
    );
    await expect(emptyStateText).not.toBeVisible({ timeout: 5000 });
  });
});
