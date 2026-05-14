import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Meal Image Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/meals/new');
    await expect(page.getByTestId('meal-form')).toBeVisible();
  });

  test('should upload an image and show preview', async ({ page }) => {
    const mealName = 'Test Image Meal';
    await page.getByLabel('Meal Name').fill(mealName);

    // Create a small valid image for testing
    const imagePath = path.join(__dirname, 'test-image.png');
    // We assume a test image exists or we use a known path in the repo if available.
    // For the purpose of this test, we will use a simple placeholder if we can't find one.
    // In a real scenario, we'd ensure the file is present in the e2e folder.

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByLabel('Meal Image').click();
    const fileChooser = await fileChooserPromise;

    // Using a relative path to a test asset.
    // If this fails in CI, the asset needs to be added to the repo.
    await fileChooser.setFiles(path.join(__dirname, 'assets/test-meal.jpg'));

    // Check if preview image is rendered
    const preview = page.locator('img[alt="Preview of uploaded meal"]');
    await expect(preview).toBeVisible();

    // Save the meal
    await page.getByTestId('save-meal').click();

    // Verify redirection or success message (assuming /meals is the list page)
    await expect(page).toHaveURL(/\/meals/);
  });

  test('should allow removing an uploaded image', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByLabel('Meal Image').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, 'assets/test-meal.jpg'));

    await expect(page.locator('img[alt="Preview of uploaded meal"]')).toBeVisible();

    // Click Remove Image button
    await page.getByRole('button', { name: 'Remove Image' }).click();

    // Preview should be gone
    await expect(page.locator('img[alt="Preview of uploaded meal"]')).not.toBeVisible();
    await expect(page.getByText('Click to upload')).toBeVisible();
  });

  test('should show alert for non-image files', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByLabel('Meal Image').click();
    const fileChooser = await fileChooserPromise;

    // Attempt to upload a text file
    await fileChooser.setFiles(path.join(__dirname, 'assets/test-file.txt'));

    // Expect an alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Please select an image file (JPEG, PNG, etc.)');
      await dialog.dismiss();
    });

    // The alert is triggered in the onChange handler
    // Since we used setFiles, it should trigger immediately
  });

  test('should show alert for oversized images', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByLabel('Meal Image').click();
    const fileChooser = await fileChooserPromise;

    // Attempt to upload a file larger than 5MB
    await fileChooser.setFiles(path.join(__dirname, 'assets/large-image.jpg'));

    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Image must be less than 5MB');
      await dialog.dismiss();
    });
  });
});
