import { test, expect } from '@playwright/test';

/**
 * Onboarding Wizard E2E Tests
 *
 * Tests the taste profile wizard at /onboarding (authenticated) and
 * the account page "Edit" preferences link.
 *
 * These tests run WITH the global authenticated session.
 */

test.describe('Onboarding wizard (/onboarding)', () => {
  test('page loads and shows the wizard', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByText('Taste Preferences')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Dietary Preferences')).toBeVisible();
  });

  test('shows progress labels for all three steps', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByText('Dietary')).toBeVisible();
    await expect(page.getByText('Ingredients')).toBeVisible();
    await expect(page.getByText('Meal Types')).toBeVisible();
  });

  test('dietary option cards are clickable and show selection', async ({ page }) => {
    await page.goto('/onboarding');
    const veganCard = page.getByText('Vegan').locator('..');
    await veganCard.click();
    // After clicking, the card should gain a green border (via class)
    await expect(veganCard).toHaveClass(/border-green-500/);
  });

  test('Next advances to Disliked Ingredients step', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Disliked Ingredients')).toBeVisible();
  });

  test('Back returns to previous step', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByText('Dietary Preferences')).toBeVisible();
  });

  test('second step shows quick allergen buttons', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('+ peanuts')).toBeVisible();
  });

  test('allergen quick-add creates a tag', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByText('+ peanuts').click();
    await expect(page.getByText('peanuts')).toBeVisible();
  });

  test('third step shows meal type pill buttons', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Meal Preferences')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continental' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Italian' })).toBeVisible();
  });

  test('Finish button appears on last step', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).not.toBeVisible();
  });

  test('completing wizard saves preferences and redirects to /account', async ({ page }) => {
    await page.goto('/onboarding');
    // Step 1: select a dietary preference
    await page.getByText('Vegan').click();
    await page.getByRole('button', { name: 'Next' }).click();
    // Step 2: skip ingredients
    await page.getByRole('button', { name: 'Next' }).click();
    // Step 3: finish
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page).toHaveURL(/\/account/, { timeout: 10000 });
  });

  test('Skip for now redirects to /account without completing', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByText('Skip for now').click();
    await expect(page).toHaveURL(/\/account/, { timeout: 10000 });
  });
});

test.describe('Account page preferences card', () => {
  test('shows Taste Preferences card', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByText('Taste Preferences')).toBeVisible({ timeout: 10000 });
  });

  test('Edit link navigates to /onboarding', async ({ page }) => {
    await page.goto('/account');
    await page.getByRole('link', { name: 'Edit' }).filter({ hasText: 'Edit' }).first().click();
    await expect(page).toHaveURL(/\/onboarding/);
  });
});
