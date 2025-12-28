import { test, expect } from '@playwright/test';

// NOTE: Relies on globalSetup authentication and baseURL from playwright.config.ts

async function openShoppingList(page) {
  await page.goto('/planner');
  await page.getByRole('button', { name: 'Shopping List' }).click();
  await expect(page.getByRole('dialog', { name: 'Shopping List' })).toBeVisible();
}

test.describe('Shopping List (E2E)', () => {
  test('drawer opens/closes and validates meal plan ID', async ({ page }) => {
    await openShoppingList(page);

    // Invalid meal plan id (0) should show validation error
    const idInput = page.locator('input[placeholder="Meal Plan ID"]');
    await idInput.fill('0');
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.getByText('Please enter a valid numeric meal plan ID')).toBeVisible();

    // Close via Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Shopping List' })).toBeHidden();
  });

  test('add custom item, toggle checkbox, and persist checked state key', async ({ page }) => {
    await openShoppingList(page);

    // Fill a meal plan id so checked state persists under a specific key
    const planId = '123';
    await page.locator('input[placeholder="Meal Plan ID"]').fill(planId);

    // Add custom item
    await page.locator('input[placeholder="Name"]').fill('Apples');
    await page.locator('input[placeholder="Qty"]').fill('2');
    await page.locator('input[placeholder="Unit"]').fill('pcs');
    await page.locator('select').selectOption('produce');
    await page.getByRole('button', { name: 'Add' }).click();

    // Expect item to appear in the produce section
    const itemRow = page.locator('li', { hasText: 'apples' });
    await expect(itemRow).toBeVisible();

    // Toggle checkbox and expect line-through class on text span
    const checkbox = itemRow.locator('input[type="checkbox"]');
    const textSpan = itemRow.locator('span').first();
    await checkbox.check();
    await expect(textSpan).toHaveClass(/line-through/);

    // Persisted key should be present in localStorage for this meal plan id
    const persisted = await page.evaluate((id) => localStorage.getItem(`shopping_checked_${id}`), planId);
    expect(persisted).toContain('apples|pcs');

    // Close via Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Shopping List' })).toBeHidden();
  });

  test('can convert a shopping list item with convertible unit', async ({ page }) => {
    await openShoppingList(page);

    // Add a custom item with a convertible unit (g)
    await page.locator('input[placeholder="Name"]').fill('sugar');
    await page.locator('input[placeholder="Qty"]').fill('1000');
    await page.locator('input[placeholder="Unit"]').fill('g');
    await page.locator('select').selectOption('pantry');
    await page.getByRole('button', { name: 'Add' }).click();

    // Expect item to appear
    const itemRow = page.locator('li', { hasText: 'sugar' });
    await expect(itemRow).toBeVisible();

    // Click the Convert button
    const convertBtn = page.getByTestId('convert-shopping-item-sugar');
    await expect(convertBtn).toBeVisible();
    await convertBtn.click();

    // Verify the converter dialog opens
    const converterDialog = page.locator('[role="dialog"][aria-label="Measurement converter"]');
    await expect(converterDialog).toBeVisible();

    // Select target unit (kg)
    await page.getByTestId('converter-to-unit').selectOption('kg');

    // Verify the result shows the converted value
    const resultInput = page.getByTestId('converter-result');
    await expect(resultInput).toHaveValue('1');

    // Click Apply to update the item
    await page.getByTestId('converter-apply').click();

    // Verify the converter closes
    await expect(converterDialog).not.toBeVisible();

    // Verify the item was updated (now shows kg instead of g)
    await expect(itemRow).toContainText('1 kg');

    // Close via Escape
    await page.keyboard.press('Escape');
  });

  test('convert button only shows for items with convertible units', async ({ page }) => {
    await openShoppingList(page);

    // Add a custom item with a non-convertible unit
    await page.locator('input[placeholder="Name"]').fill('eggs');
    await page.locator('input[placeholder="Qty"]').fill('12');
    await page.locator('input[placeholder="Unit"]').fill('pcs');
    await page.locator('select').selectOption('dairy');
    await page.getByRole('button', { name: 'Add' }).click();

    // Expect item to appear
    const itemRow = page.locator('li', { hasText: 'eggs' });
    await expect(itemRow).toBeVisible();

    // Convert button should NOT be visible for non-convertible units
    const convertBtn = page.getByTestId('convert-shopping-item-eggs');
    await expect(convertBtn).not.toBeVisible();

    // Close via Escape
    await page.keyboard.press('Escape');
  });
});
