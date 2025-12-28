import { test, expect } from '@playwright/test';

test.describe('Meal Suggestions', () => {
  test('displays meal suggestions when the API returns data', async ({ page }) => {
    // Mock the API response before navigating to the page
    await page.route('**/functions/v1/get-meal-suggestions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', name: 'Taco Salad', image_url: '/taco.jpg' },
          { id: '2', name: 'Pizza', image_url: '/pizza.jpg' },
        ]),
      });
    });

    await page.goto('/planner');

    // Suggestions are auto-fetched on mount - wait for them to appear
    await expect(page.getByText('Taco Salad')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Pizza')).toBeVisible();
  });

  test('displays a message when there is insufficient data', async ({ page }) => {
    // Mock an empty array response
    await page.route('**/functions/v1/get-meal-suggestions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/planner');

    // Check for the empty-state message in the component
    await expect(page.getByText(/No suggestions available/i)).toBeVisible({ timeout: 30_000 });
  });

  test('displays an error message when the API call fails', async ({ page }) => {
    // Mock a server error response
    await page.route('**/functions/v1/get-meal-suggestions', async route => {
      await route.fulfill({
        status: 500,
        body: 'Internal Server Error',
      });
    });

    await page.goto('/planner');

    // Check for the error message - the page shows error state when fetch fails
    await expect(page.getByText(/Failed to fetch filtered meal suggestions/i)).toBeVisible({ timeout: 30_000 });
  });
});
