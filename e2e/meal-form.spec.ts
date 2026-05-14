import { test, expect } from '@playwright/test';

test.describe('MealForm Validation', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the page with the MealForm. 
    // Assuming a '/meals/new' route exists for creating a new meal.
    await page.goto('/meals/new');
    // Wait for the form to be visible to ensure the page has loaded
    await expect(page.getByTestId('meal-form')).toBeVisible();
  });

  test('should display a validation error for an invalid source URL', async ({ page }) => {
    // Fill in the required name field to isolate the URL validation
    await page.getByLabel('Meal Name').fill('My Test Meal');

    // Enter an invalid URL
    const urlInput = page.getByLabel('Source URL');
    await urlInput.fill('not a valid url');

    // Click the submit button to trigger validation
    await page.getByRole('button', { name: 'Save Meal' }).click();

    // Check for the validation error message
    const errorMessage = page.locator('.text-destructive');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText('Please enter a valid URL (e.g., example.com or http://example.com)');
  });

  test('should display a validation error for an empty name', async ({ page }) => {
    // Leave the name field empty and click submit
    await page.getByRole('button', { name: 'Save Meal' }).click();

    // Check for the validation error message associated with the name field
    const errorMessage = page.locator('#name-error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText('Name is required');
  });

});
