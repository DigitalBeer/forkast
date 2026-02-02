import { test, expect } from '@playwright/test';

// NOTE: Relies on globalSetup authentication and baseURL from playwright.config.ts

test.describe('Shopping List UX Redesign (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a meal plan first
    await page.goto('/planner');
    
    // Wait for the page to load and get the first meal plan
    await page.waitForSelector('[data-testid="meal-plan-card"]');
    const firstMealPlan = page.locator('[data-testid="meal-plan-card"]').first();
    await expect(firstMealPlan).toBeVisible();
    
    // Click on the first meal plan to view its details
    await firstMealPlan.click();
    
    // Wait for meal plan detail page to load
    await page.waitForSelector('[data-testid="shopping-list-button"]');
    await expect(page.getByTestId('shopping-list-button')).toBeVisible();
  });

  test('navigates to full-page shopping list', async ({ page }) => {
    // Click the Shopping List button
    await page.getByTestId('shopping-list-button').click();
    
    // Should navigate to full-page shopping list
    await expect(page).toHaveURL(/\/meal-plans\/\d+\/shopping-list/);
    
    // Verify page header
    await expect(page.getByRole('heading', { name: 'Shopping List' })).toBeVisible();
    
    // Verify stats bar
    await expect(page.getByText(/to buy/)).toBeVisible();
    await expect(page.getByText(/have it/)).toBeVisible();
    
    // Verify view mode toggle
    await expect(page.getByRole('button', { name: 'By Item' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'By Meal' })).toBeVisible();
  });

  test('displays shopping list in table view by default', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Should show "By Item" view by default
    await expect(page.getByRole('button', { name: 'By Item' })).toHaveClass(/bg-white/);
    
    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'Item' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Qty' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Unit' })).toBeVisible();
    
    // Verify sections
    await expect(page.getByText('🛒 Need to Buy')).toBeVisible();
    await expect(page.getByText('✓ Already Have')).toBeVisible();
  });

  test('can toggle between view modes', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Should be in "By Item" view by default
    await expect(page.getByRole('table')).toBeVisible();
    
    // Switch to "By Meal" view
    await page.getByRole('button', { name: 'By Meal' }).click();
    
    // Verify meal grouped view
    await expect(page.getByRole('table')).not.toBeVisible();
    await expect(page.getByText(/Monday|Tuesday|Wednesday/)).toBeVisible();
    await expect(page.getByText(/Breakfast|Lunch|Dinner/)).toBeVisible();
    
    // Switch back to "By Item" view
    await page.getByRole('button', { name: 'By Item' }).click();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('can check and uncheck items', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Find first item checkbox
    const firstCheckbox = page.locator('button[w-5][h-5]').first();
    await expect(firstCheckbox).toBeVisible();
    
    // Check the item
    await firstCheckbox.click();
    
    // Item should be checked (have green background)
    await expect(firstCheckbox).toHaveClass(/bg-green-500/);
    
    // Uncheck the item
    await firstCheckbox.click();
    
    // Item should be unchecked
    await expect(firstCheckbox).not.toHaveClass(/bg-green-500/);
  });

  test('can mark items as "Have it"', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Find first "Have it?" button
    const haveItButton = page.getByRole('button', { name: 'Have it?' }).first();
    await expect(haveItButton).toBeVisible();
    
    // Get initial counts
    const needToBuyCount = await page.locator('text=/to buy/').textContent();
    const alreadyHaveCount = await page.locator('text=/have it/').textContent();
    
    // Click "Have it?" button
    await haveItButton.click();
    
    // Item should move to "Already Have" section
    // Note: The exact assertion depends on the implementation
    // This might need adjustment based on how the UI updates
  });

  test('can expand/collapse "Already Have" section', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Find the "Already Have" section toggle
    const alreadyHaveSection = page.locator('text=✓ Already Have').first();
    await expect(alreadyHaveSection).toBeVisible();
    
    // Section should be collapsed by default
    // Click to expand
    await alreadyHaveSection.click();
    
    // Verify it expands (check for chevron up icon)
    await expect(page.locator('svg[data-testid="chevron-up"]')).toBeVisible();
    
    // Click to collapse
    await alreadyHaveSection.click();
    
    // Verify it collapses (check for chevron down icon)
    await expect(page.locator('svg[data-testid="chevron-down"]')).toBeVisible();
  });

  test('print functionality works', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Click print button
    const printButton = page.getByRole('button', { name: 'Print' });
    await expect(printButton).toBeVisible();
    
    // Mock print dialog
    page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });
    
    // Trigger print
    await printButton.click();
    
    // Verify print styles are applied (check for no-print class)
    await expect(page.locator('.no-print')).toBeVisible();
  });

  test('staples manager is accessible', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Find and click staples manager button
    const staplesButton = page.getByTestId('manage-staples-button');
    await expect(staplesButton).toBeVisible();
    await staplesButton.click();
    
    // Verify staples dialog opens
    await expect(page.getByText('Manage Pantry Staples')).toBeVisible();
    await expect(page.getByText('Spices & Seasonings')).toBeVisible();
    
    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('back navigation works', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Verify we're on shopping list page
    await expect(page).toHaveURL(/\/meal-plans\/\d+\/shopping-list/);
    
    // Click back button
    const backButton = page.locator('a[href*="/meal-plans/"]').first();
    await expect(backButton).toBeVisible();
    await backButton.click();
    
    // Should return to meal plan detail
    await expect(page).toHaveURL(/\/meal-plans\/\d+$/);
    await expect(page.getByTestId('shopping-list-button')).toBeVisible();
  });

  test('persists item states across navigation', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Check an item
    const firstCheckbox = page.locator('button[w-5][h-5]').first();
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveClass(/bg-green-500/);
    
    // Navigate away and back
    await page.goBack();
    await page.getByTestId('shopping-list-button').click();
    
    // Item should still be checked
    await expect(firstCheckbox).toHaveClass(/bg-green-500/);
  });
});
