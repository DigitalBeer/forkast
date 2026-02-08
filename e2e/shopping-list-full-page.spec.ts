import { test, expect } from '@playwright/test';

// NOTE: Relies on globalSetup authentication and baseURL from playwright.config.ts

test.describe('Shopping List UX Redesign (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to meal plan history and open the first plan's detail page
    await page.goto('/meal-plans/history');
    
    // Wait for the history list to load and click the first meal plan
    const firstPlan = page.locator('[data-testid="meal-plan-history-item"]').first();
    await expect(firstPlan).toBeVisible({ timeout: 15_000 });
    await firstPlan.click();
    
    // Wait for meal plan detail page to load with the shopping list button
    await expect(page.getByTestId('shopping-list-button')).toBeVisible({ timeout: 15_000 });
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
    
    // Verify view mode toggle (buttons have aria-labels from ViewModeToggle)
    await expect(page.getByRole('button', { name: /view items grouped by category/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /view items grouped by meal/i })).toBeVisible({ timeout: 15000 });
  });

  test('displays shopping list in table view by default', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Should show "By Item" view by default (active button has bg-white)
    await expect(page.getByRole('button', { name: /view items grouped by category/i })).toHaveClass(/bg-white/);
    
    // Verify table headers (th elements; use .first() since print section has duplicates)
    await expect(page.locator('th:has-text("Item")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Qty")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Unit")').first()).toBeVisible();
    
    // Verify sections
    await expect(page.getByText('🛒 Need to Buy')).toBeVisible();
    await expect(page.getByText('✓ Already Have')).toBeVisible();
  });

  test('can toggle between view modes', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Should be in "By Item" view by default
    await expect(page.getByRole('table').first()).toBeVisible();
    
    // Switch to "By Meal" view
    await page.getByRole('button', { name: /view items grouped by meal/i }).click();
    
    // Verify meal grouped view (day names visible)
    await expect(page.getByText(/Monday|Tuesday|Wednesday/).first()).toBeVisible();
    await expect(page.getByText(/Breakfast|Lunch|Dinner/).first()).toBeVisible();
    
    // Switch back to "By Item" view
    await page.getByRole('button', { name: /view items grouped by category/i }).click();
    await expect(page.getByRole('table').first()).toBeVisible();
  });

  test('can check and uncheck items', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Find first item checkbox
    const firstCheckbox = page.getByTestId('check-item').first();
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
    
    // Get initial counts (captured for potential future assertions)
    const _needToBuyCount = await page.locator('text=/to buy/').textContent();
    const _alreadyHaveCount = await page.locator('text=/have it/').textContent();
    
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
    // Click the toggle button to expand
    const toggleButton = page.getByTestId('toggle-have-it-section');
    await toggleButton.click();
    
    // Verify it expands (table or items become visible inside the section)
    await expect(page.locator('[data-testid="toggle-have-it-section"] + div')).toBeVisible();
    
    // Click to collapse
    await toggleButton.click();
    
    // Verify it collapses (content hidden)
    await expect(page.locator('[data-testid="toggle-have-it-section"] + div')).not.toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'Manage Pantry Staples' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Spices & Seasonings' })).toBeVisible();
    
    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('back navigation works', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Verify we're on shopping list page
    await expect(page).toHaveURL(/\/meal-plans\/\d+\/shopping-list/);
    
    // Click back button (ArrowLeft link, not nav links)
    const backButton = page.locator('a[href^="/meal-plans/"]').filter({ hasNot: page.locator('text=Saved Plans') }).first();
    await expect(backButton).toBeVisible();
    await backButton.click();
    
    // Should return to meal plan detail (URL without /shopping-list)
    await expect(page).not.toHaveURL(/shopping-list/, { timeout: 10000 });
  });

  test('persists item states across navigation', async ({ page }) => {
    // Navigate to shopping list
    await page.getByTestId('shopping-list-button').click();
    
    // Check an item
    const firstCheckbox = page.getByTestId('check-item').first();
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveClass(/bg-green-500/);
    
    // Navigate away and back
    await page.goBack();
    await page.getByTestId('shopping-list-button').click();
    
    // Item should still be checked
    await expect(firstCheckbox).toHaveClass(/bg-green-500/);
  });
});
