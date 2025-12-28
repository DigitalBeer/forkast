import { test, expect } from '@playwright/test';

// Enable tracing on first retry and retain traces for failures
// This helps us debug flaky tests by preserving context
// See https://playwright.dev/docs/trace-viewer
// Traces will be saved under playwright-report
// You can view them with: npx playwright show-report

// Test data
const testMeal = {
  name: 'Test Meal ' + Math.random().toString(36).substring(2, 8),
  description: 'This is a test meal created by Playwright',
  sourceUrl: 'example.com/test-recipe',
  ingredients: [
    { name: 'Test Ingredient 1', quantity: '2', unit: 'g' },
    { name: 'Test Ingredient 2', quantity: '1', unit: 'cup' }
  ],
  instructions: '1. Test step one\n2. Test step two',
  tags: ['test', 'e2e']
};

// Helper function to wait for the page to be fully loaded
const waitForPageLoad = async (page) => {
  // Wait for both network idle and DOM content to be loaded for max reliability
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.waitForLoadState('domcontentloaded'),
  ]);
};

test.describe('Meal Management', () => {
  // Capture browser console messages for each test to aid debugging
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      // Capture relevant logs for debugging
      if (['log', 'warning', 'error'].includes(msg.type())) {
        console.log(`[browser ${msg.type()}] ${msg.text()}`);
      }
    });
  });
  test.beforeEach(() => {
    // Add retry logic for flaky tests
    test.slow(); // Give these tests more time
  });

  // Basic page-level sanity test for the Meal Repertoire page
    test('renders first page of meal cards and paginates', async ({ page }) => {
    // This test now also covers the basic 'add meal' flow to ensure data exists.
    // Navigate to new meal page
    await page.goto('/meals/new');
    await waitForPageLoad(page);

    // Use a unique name for each test run to avoid conflicts
    const uniqueMealName = `${testMeal.name} ${Date.now()}`;
    await page.getByLabel('Meal Name').fill(uniqueMealName);
    await page.getByLabel('Description').fill(testMeal.description);
    await page.getByTestId('save-meal').click();

    // Wait for the navigation to the meals page to complete *before* checking for the toast.
    // This avoids a race condition where the page navigates before the toast can be rendered.
    await page.waitForURL('/meals', { timeout: 10000 });

    // Assert that the success toast is visible on the new page
    await expect(page.locator('[data-sonner-toast][data-type="success"]')).toBeVisible();
    await page.waitForResponse(resp => resp.url().includes('/api/meals') && resp.status() === 200);
    await waitForPageLoad(page);

    // Now, verify that the meal card for our new meal is visible
    const newMealCard = page.locator(`[data-testid="meal-card"]:has-text("${uniqueMealName}")`);
    await expect(newMealCard).toBeVisible({ timeout: 15000 });

    // For pagination checks, use a general locator for all cards
    const allCards = page.locator('[data-testid="meal-card"]');

    // Ensure we have at least one card
    const count = await allCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify pagination if multiple pages exist
    const nextBtn = page.getByTestId('next-page');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForLoadState('networkidle');
      // After pagination, the first card of the new set should be visible
      await expect(allCards.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('can delete a meal', async ({ page }) => {
    // First, create a meal to delete
    await page.goto('/meals/new');
    await waitForPageLoad(page);
    const uniqueMealName = `${testMeal.name} ${Date.now()}`;
    await page.getByLabel('Meal Name').fill(uniqueMealName);
    await page.getByLabel('Description').fill('A meal to be deleted');
    await page.getByTestId('save-meal').click();
    await expect(page.locator('[data-sonner-toast][data-type="success"]')).toBeVisible();
    await page.waitForURL('/meals', { timeout: 10000 });
    await waitForPageLoad(page);

    // Now, find the meal and delete it
    const mealCard = page.locator(`[data-testid="meal-card"]:has-text("${uniqueMealName}")`);
    await expect(mealCard).toBeVisible({ timeout: 15000 });

    // Click the delete button on the card
    await mealCard.getByTestId('delete-meal-btn').click();

    // Confirm deletion in the modal
    const confirmationModal = page.locator('[role="dialog"]');
    await expect(confirmationModal).toBeVisible();
    await confirmationModal.getByTestId('confirm-delete-btn').click();

    // Assert that the success toast is visible
    await expect(page.locator('[data-sonner-toast][data-type="success"]')).toBeVisible();

    // Assert that the meal card is no longer visible (optimistic update)
    await expect(mealCard).not.toBeVisible({ timeout: 10000 });
  });

    test('can add a new meal', async ({ page }) => {
    // Navigate to new meal page to ensure a clean start
    await page.goto('/meals/new');
    await waitForPageLoad(page);
    
    // Wait for form to be fully loaded
    await page.waitForSelector('form');
    
    // Use a unique name for each test run to avoid conflicts
    const uniqueMealName = `${testMeal.name} ${Date.now()}`;
    await page.getByLabel('Meal Name').fill(uniqueMealName);
    await page.getByLabel('Description').fill(testMeal.description);
    await page.getByLabel('Source URL').fill(testMeal.sourceUrl);
    
    // Add ingredients
    for (let i = 0; i < testMeal.ingredients.length; i++) {
      const ingredient = testMeal.ingredients[i];
      // The first ingredient row is already visible
      if (i > 0) {
        await page.getByTestId('add-ingredient').click();
        // Wait for the new ingredient row to appear before trying to fill it
        const newIngredientIndex = i + 1;
        await expect(page.locator(`[data-testid="ingredient-${newIngredientIndex}-name"]`)).toBeVisible();
      }
      const ingredientIndex = i + 1; // data-testid is 1-based
      await page.locator(`[data-testid="ingredient-${ingredientIndex}-name"]`).fill(ingredient.name);
      await page.locator(`[data-testid="ingredient-${ingredientIndex}-quantity"]`).fill(ingredient.quantity);
      await page.locator(`[data-testid="ingredient-${ingredientIndex}-unit"]`).selectOption(ingredient.unit);
    }
    
    // Add tags using the TagAutocomplete component
    const tagInput = page.getByTestId('tag-input');
    for (const tag of testMeal.tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
      // Wait for the tag to appear in the list
      await expect(page.locator(`[data-testid^="tag-"]:has-text("${tag}")`)).toBeVisible();
    }
    
    // Add instructions
    await page.getByLabel('Cooking Instructions').fill(testMeal.instructions);
    
    // Save and assert success toast
    await page.getByTestId('save-meal').click();
    await expect(page.locator('[data-sonner-toast][data-type="success"]')).toBeVisible();

    // Wait for navigation and for the meals to be fetched
    await page.waitForURL('/meals', { timeout: 15000 });
    await page.waitForResponse(resp => resp.url().includes('/api/meals') && resp.status() === 200);
    await waitForPageLoad(page);

    // Search for the newly created meal
    const searchInput = page.getByTestId('meals-search');
    await searchInput.fill(uniqueMealName);
    await searchInput.press('Enter');

    // Wait for the search to complete and the card to be visible
    await waitForPageLoad(page);
    const newMealCard = page.locator(`[data-testid="meal-card"]:has-text("${uniqueMealName}")`);
    await expect(newMealCard).toBeVisible({ timeout: 15000 });
  });

    test('can edit an existing meal', async ({ page }) => {
    // First, create a meal to be edited, using a unique name.
    const uniqueMealName = `${testMeal.name} ${Date.now()}`;
    await page.goto('/meals/new');
    await waitForPageLoad(page);
    await page.getByLabel('Meal Name').fill(uniqueMealName);
    await page.getByLabel('Description').fill(testMeal.description);
    await page.getByTestId('save-meal').click();

    // Assert that the success toast is visible
    await expect(page.locator('[data-sonner-toast][data-type="success"]')).toBeVisible();
    await page.waitForURL('/meals', { timeout: 10000 });

    // Now, find and edit the meal we just created.
    await waitForPageLoad(page);
    const searchInput = page.getByTestId('meals-search');
    await searchInput.fill(uniqueMealName);
    await searchInput.press('Enter');
    
    const mealCard = page.locator(`[data-testid="meal-card"]`).filter({ hasText: uniqueMealName }).first();
    await expect(mealCard).toBeVisible({ timeout: 10000 });
    
    await mealCard.hover();
    const editButton = mealCard.getByRole('button', { name: /edit/i }).first();
    await editButton.click({ timeout: 5000 });
    
    // Wait for the edit form to load and update the meal details
    await page.waitForSelector('form');
    const updatedName = `${uniqueMealName} (Updated)`;
    await page.getByLabel('Meal Name').fill(updatedName);
    
    // Add a new tag
    const tagInput = page.getByTestId('tag-input');
    await tagInput.fill('updated');
    await tagInput.press('Enter');
    
    // Save and assert success toast
    await page.getByTestId('save-meal').click();
    await expect(page.locator('[data-sonner-toast][data-type="success"]')).toBeVisible();
    
    // Wait for navigation and for the meals to be fetched
    await page.waitForURL('/meals', { timeout: 10000 });
    await page.waitForResponse(resp => resp.url().includes('/api/meals') && resp.status() === 200);
    
    // Verify the updated meal appears in the list
    await searchInput.fill(updatedName);
    await searchInput.press('Enter');
    const updatedMealCard = page.locator(`[data-testid="meal-card"]:has-text("${updatedName}")`);
    await expect(updatedMealCard).toBeVisible({ timeout: 10000 });
  });

  test('shows validation errors for required fields', async ({ page }) => {
    await page.goto('/meals/new');
    
    // Try to submit the form without filling required fields
    await page.getByTestId('save-meal').click();
    
    // Verify validation messages for name
    await expect(page.getByText('Name is required')).toBeVisible();
    
    // Fill in just the name and try again
    await page.getByLabel('Meal Name').fill('Test Validation');
    
    // Add an invalid ingredient (empty name) and try to submit
    await page.locator('[data-testid="ingredient-1-quantity"]').fill('1');
    await page.getByTestId('save-meal').click();
    
    // Verify ingredient validation
    await expect(page.getByText('Ingredient required')).toBeVisible();
  });

  test('shows an error toast on server error during meal creation', async ({ page }) => {
    // Mock the API route to simulate a server error
    await page.route('**/api/meals', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    // Navigate to the new meal page and fill out the form
    await page.goto('/meals/new');
    await waitForPageLoad(page);
    await page.getByLabel('Meal Name').fill('Server Error Test');
    await page.getByTestId('save-meal').click();

    // Assert that the error toast is visible
    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toBeVisible();

    // Ensure we are still on the new meal page
    expect(page.url()).toContain('/meals/new');
  });

  test('can open and use the measurement converter on an ingredient', async ({ page }) => {
    // Navigate to new meal page
    await page.goto('/meals/new');
    await waitForPageLoad(page);

    // Fill in required meal name
    await page.getByLabel('Meal Name').fill('Converter Test Meal');

    // Add an ingredient with a convertible unit
    await page.locator('[data-testid="ingredient-1-name"]').fill('Flour');
    await page.locator('[data-testid="ingredient-1-quantity"]').fill('500');
    await page.locator('[data-testid="ingredient-1-unit"]').selectOption('g');

    // Click the Convert button for the first ingredient
    const convertBtn = page.getByTestId('convert-ingredient-1');
    await expect(convertBtn).toBeEnabled();
    await convertBtn.click();

    // Verify the converter dialog opens
    const converterDialog = page.locator('[role="dialog"][aria-label="Measurement converter"]');
    await expect(converterDialog).toBeVisible();

    // Verify the from value is pre-filled
    const fromValueInput = page.getByTestId('converter-from-value');
    await expect(fromValueInput).toHaveValue('500');

    // Select target unit (kg)
    await page.getByTestId('converter-to-unit').selectOption('kg');

    // Verify the result shows the converted value
    const resultInput = page.getByTestId('converter-result');
    await expect(resultInput).toHaveValue('0.5');

    // Click Apply to update the ingredient
    await page.getByTestId('converter-apply').click();

    // Verify the converter closes
    await expect(converterDialog).not.toBeVisible();

    // Verify the ingredient was updated
    await expect(page.locator('[data-testid="ingredient-1-unit"]')).toHaveValue('kg');
  });

  test('convert button is disabled for non-convertible units', async ({ page }) => {
    await page.goto('/meals/new');
    await waitForPageLoad(page);

    // Add an ingredient with a non-convertible unit (pinch)
    await page.locator('[data-testid="ingredient-1-name"]').fill('Salt');
    await page.locator('[data-testid="ingredient-1-quantity"]').fill('1');
    await page.locator('[data-testid="ingredient-1-unit"]').selectOption('pinch');

    // Verify the Convert button is disabled
    const convertBtn = page.getByTestId('convert-ingredient-1');
    await expect(convertBtn).toBeDisabled();
  });
});
