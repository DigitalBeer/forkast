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
    const idInput = page.getByTestId('meal-plan-id-input');
    await idInput.fill('0');
    await page.getByTestId('generate-button').click();
    await expect(page.getByText('Please enter a valid numeric meal plan ID')).toBeVisible();

    // Close via Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Shopping List' })).toBeHidden();
  });

  test('add custom item and toggle checkbox', async ({ page }) => {
    await openShoppingList(page);

    // Fill a meal plan id so checked state persists under a specific key
    const planId = '123';
    await page.getByTestId('meal-plan-id-input').fill(planId);

    // Add custom item
    await page.getByTestId('custom-item-name').fill('Apples');
    await page.getByTestId('custom-item-qty').fill('2');
    await page.getByTestId('custom-item-unit').fill('pcs');
    await page.getByTestId('custom-item-category').selectOption('produce');
    await page.getByTestId('add-custom-button').click();

    // Expect item to appear in the Need to Buy section
    const needToBuySection = page.getByTestId('section-header-need-to-buy');
    await expect(needToBuySection).toBeVisible();

    // Check that item counter is displayed
    await expect(needToBuySection).toContainText('1');

    // Close via Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Shopping List' })).toBeHidden();
  });

  test('can mark item as "Have it" and it moves to Already Have section', async ({ page }) => {
    await openShoppingList(page);

    // Fill a meal plan id
    const planId = '456';
    await page.getByTestId('meal-plan-id-input').fill(planId);

    // Add custom item
    await page.getByTestId('custom-item-name').fill('Bananas');
    await page.getByTestId('custom-item-qty').fill('3');
    await page.getByTestId('custom-item-unit').fill('pcs');
    await page.getByTestId('custom-item-category').selectOption('produce');
    await page.getByTestId('add-custom-button').click();

    // Find the item in Need to Buy section
    const needToBuySection = page.getByTestId('section-header-need-to-buy');
    await expect(needToBuySection).toBeVisible();
    await needToBuySection.click(); // Expand if needed

    // Find the "Have it?" button for the item and click it
    const haveItButton = page.getByTestId('toggle-have-it-bananas|pcs');
    await expect(haveItButton).toBeVisible();
    await haveItButton.click();

    // Now the Already Have section should show the item
    const alreadyHaveSection = page.getByTestId('section-header-already-have');
    await expect(alreadyHaveSection).toBeVisible();
    await expect(alreadyHaveSection).toContainText('1');

    // Close via Escape
    await page.keyboard.press('Escape');
  });

  test('Manage Staples button opens staples dialog', async ({ page }) => {
    await openShoppingList(page);

    // Fill a meal plan id and add an item to see the Manage Staples button
    await page.getByTestId('meal-plan-id-input').fill('789');
    await page.getByTestId('custom-item-name').fill('Milk');
    await page.getByTestId('custom-item-qty').fill('1');
    await page.getByTestId('custom-item-unit').fill('quart');
    await page.getByTestId('custom-item-category').selectOption('dairy');
    await page.getByTestId('add-custom-button').click();

    // Click Manage Staples button
    const manageStaplesBtn = page.getByTestId('manage-staples-button');
    await expect(manageStaplesBtn).toBeVisible();
    await manageStaplesBtn.click();

    // Verify the staples dialog opens
    await expect(page.getByText('Manage Pantry Staples')).toBeVisible();
    await expect(page.getByText('Spices & Seasonings')).toBeVisible();
    await expect(page.getByText('Oils & Fats')).toBeVisible();

    // Close the dialog by clicking outside or pressing Escape
    await page.keyboard.press('Escape');
  });

  test('can add and remove custom staples', async ({ page }) => {
    await openShoppingList(page);

    // Add an item to activate staples management
    await page.getByTestId('meal-plan-id-input').fill('101');
    await page.getByTestId('custom-item-name').fill('Test Item');
    await page.getByTestId('custom-item-qty').fill('1');
    await page.getByTestId('custom-item-unit').fill('unit');
    await page.getByTestId('custom-item-category').selectOption('other');
    await page.getByTestId('add-custom-button').click();

    // Open Manage Staples dialog
    await page.getByTestId('manage-staples-button').click();
    await expect(page.getByText('Manage Pantry Staples')).toBeVisible();

    // Add a custom staple
    await page.getByTestId('new-staple-input').fill('Custom Spice');
    await page.getByTestId('new-staple-category').selectOption('spices');
    await page.getByTestId('add-staple-button').click();

    // Verify the custom staple appears
    await expect(page.getByText('custom spice')).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('staple items are automatically marked as "Already Have"', async ({ page }) => {
    await openShoppingList(page);

    // Fill a meal plan id
    const planId = '202';
    await page.getByTestId('meal-plan-id-input').fill(planId);

    // Add an item that matches a default staple (salt)
    await page.getByTestId('custom-item-name').fill('Salt');
    await page.getByTestId('custom-item-qty').fill('1');
    await page.getByTestId('custom-item-unit').fill('tbsp');
    await page.getByTestId('custom-item-category').selectOption('pantry');
    await page.getByTestId('add-custom-button').click();

    // Since "salt" is a default staple, it should appear in Already Have section
    const alreadyHaveSection = page.getByTestId('section-header-already-have');
    await expect(alreadyHaveSection).toBeVisible();
    await expect(alreadyHaveSection).toContainText('1');

    // Expand the Already Have section and verify salt is there with "Pantry staple" label
    await alreadyHaveSection.click();
    await expect(page.getByText('Pantry staple')).toBeVisible();

    // Close via Escape
    await page.keyboard.press('Escape');
  });

  test('reset "Have it" button clears selections', async ({ page }) => {
    await openShoppingList(page);

    // Fill a meal plan id
    const planId = '303';
    await page.getByTestId('meal-plan-id-input').fill(planId);

    // Add a non-staple item
    await page.getByTestId('custom-item-name').fill('Chicken Breast');
    await page.getByTestId('custom-item-qty').fill('2');
    await page.getByTestId('custom-item-unit').fill('lbs');
    await page.getByTestId('custom-item-category').selectOption('meat');
    await page.getByTestId('add-custom-button').click();

    // Mark as "Have it"
    const haveItButton = page.getByTestId('toggle-have-it-chicken breast|lbs');
    await expect(haveItButton).toBeVisible();
    await haveItButton.click();

    // Verify it moved to Already Have
    const alreadyHaveSection = page.getByTestId('section-header-already-have');
    await expect(alreadyHaveSection).toContainText('1');

    // Click reset button
    await page.getByTestId('reset-have-it-button').click();

    // After reset, non-staple items should be back in Need to Buy
    const needToBuySection = page.getByTestId('section-header-need-to-buy');
    await expect(needToBuySection).toContainText('1');

    // Close via Escape
    await page.keyboard.press('Escape');
  });
});
