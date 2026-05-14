import { Page, expect } from '@playwright/test';

/**
 * Reusable Test Utilities for Forkast E2E Tests
 * 
 * This module provides common helper functions to reduce code duplication
 * and improve test maintainability.
 */

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.waitForLoadState('domcontentloaded'),
  ]);
}

/**
 * Wait for a specific API response
 */
export async function waitForApiResponse(
  page: Page, 
  endpoint: string,
  timeout = 10000
): Promise<void> {
  await page.waitForResponse(
    resp => resp.url().includes(endpoint) && resp.status() === 200,
    { timeout }
  );
}

/**
 * Create a unique test meal with optional custom data
 */
export async function createTestMeal(
  page: Page, 
  mealData?: Partial<{
    name: string;
    description: string;
    sourceUrl: string;
    ingredients: Array<{ name: string; quantity: string; unit: string }>;
    instructions: string;
    tags: string[];
  }>
): Promise<string> {
  const uniqueName = mealData?.name || `Test Meal ${Date.now()}`;
  
  await page.goto('/meals/new');
  await waitForPageLoad(page);
  
  // Fill basic fields
  await page.getByLabel('Meal Name').fill(uniqueName);
  await page.getByLabel('Description').fill(mealData?.description || 'Test description');
  
  if (mealData?.sourceUrl) {
    await page.getByLabel('Source URL').fill(mealData.sourceUrl);
  }
  
  // Add ingredients if provided
  if (mealData?.ingredients && mealData.ingredients.length > 0) {
    for (let i = 0; i < mealData.ingredients.length; i++) {
      const ingredient = mealData.ingredients[i];
      
      if (i > 0) {
        await page.getByTestId('add-ingredient').click();
        await expect(page.locator(`[data-testid="ingredient-${i + 1}-name"]`)).toBeVisible();
      }
      
      const ingredientIndex = i + 1;
      await page.locator(`[data-testid="ingredient-${ingredientIndex}-name"]`).fill(ingredient.name);
      await page.locator(`[data-testid="ingredient-${ingredientIndex}-quantity"]`).fill(ingredient.quantity);
      await page.locator(`[data-testid="ingredient-${ingredientIndex}-unit"]`).selectOption(ingredient.unit);
    }
  }
  
  // Add tags if provided
  if (mealData?.tags && mealData.tags.length > 0) {
    const tagInput = page.getByTestId('tag-input');
    for (const tag of mealData.tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
      await expect(page.locator(`[data-testid^="tag-"]:has-text("${tag}")`)).toBeVisible();
    }
  }
  
  // Add instructions if provided
  if (mealData?.instructions) {
    await page.getByLabel('Cooking Instructions').fill(mealData.instructions);
  }
  
  // Save meal
  await page.getByTestId('save-meal').click();
  await expect(page.locator('[data-sonner-toast][data-type="success"]')).toBeVisible();
  await page.waitForURL('/meals', { timeout: 10000 });
  
  return uniqueName;
}

/**
 * Delete a meal by name
 */
export async function deleteMeal(page: Page, mealName: string): Promise<void> {
  await page.goto('/meals');
  await waitForPageLoad(page);
  
  // Search for the meal
  const searchInput = page.getByTestId('meals-search');
  await searchInput.fill(mealName);
  await searchInput.press('Enter');
  await waitForPageLoad(page);
  
  // Find and delete the meal
  const mealCard = page.locator(`[data-testid="meal-card"]:has-text("${mealName}")`);
  await expect(mealCard).toBeVisible({ timeout: 10000 });
  
  await mealCard.getByTestId('delete-meal-btn').click();
  
  // Confirm deletion
  const confirmationModal = page.locator('[role="dialog"]');
  await expect(confirmationModal).toBeVisible();
  await confirmationModal.getByTestId('confirm-delete-btn').click();
  
  // Wait for success
  await expect(page.locator('[data-sonner-toast][data-type="success"]')).toBeVisible();
  await expect(mealCard).not.toBeVisible({ timeout: 10000 });
}

/**
 * Search for a meal by name
 */
export async function searchMeal(page: Page, mealName: string): Promise<void> {
  await page.goto('/meals');
  await waitForPageLoad(page);
  
  const searchInput = page.getByTestId('meals-search');
  await searchInput.fill(mealName);
  await searchInput.press('Enter');
  await waitForPageLoad(page);
}

/**
 * Take a screenshot with timestamp for debugging
 */
export async function takeTimestampedScreenshot(
  page: Page, 
  name: string,
  fullPage = true
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `e2e/logs/${name}-${timestamp}.png`,
    fullPage 
  });
}

/**
 * Mock an API route with custom response
 */
export async function mockApiRoute(
  page: Page,
  endpoint: string,
  response: Record<string, unknown>,
  status = 200
): Promise<void> {
  await page.route(`**/${endpoint}`, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Mock API error for testing error handling
 */
export async function mockApiError(
  page: Page,
  endpoint: string,
  status = 500,
  message = 'Internal Server Error'
): Promise<void> {
  await page.route(`**/${endpoint}`, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ message }),
    });
  });
}

/**
 * Clear all toast notifications
 */
export async function clearToasts(page: Page): Promise<void> {
  const toasts = page.locator('[data-sonner-toast]');
  const count = await toasts.count();
  
  for (let i = 0; i < count; i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
  }
}

/**
 * Wait for a toast message to appear
 */
export async function waitForToast(
  page: Page, 
  type: 'success' | 'error' | 'info' = 'success',
  timeout = 5000
): Promise<void> {
  await expect(page.locator(`[data-sonner-toast][data-type="${type}"]`))
    .toBeVisible({ timeout });
}

/**
 * Login helper for tests that need authentication
 */
export async function login(
  page: Page,
  email?: string,
  password?: string
): Promise<void> {
  const testEmail = email || process.env.TEST_USER_EMAIL;
  const testPassword = password || process.env.TEST_USER_PASSWORD;
  
  if (!testEmail || !testPassword) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set');
  }
  
  await page.goto('/login');
  await page.locator('#email').fill(testEmail);
  await page.locator('#password').fill(testPassword);
  await page.getByRole('button', { name: /log in/i }).click();
  
  // Wait for successful login
  await page.waitForURL('**/meals/new', { timeout: 15000 });
}

/**
 * Logout helper
 */
export async function logout(page: Page): Promise<void> {
  // Open profile menu if it exists
  const profileButton = page.getByRole('button', { name: /profile|account|menu/i });
  if (await profileButton.isVisible()) {
    await profileButton.click();
  }
  
  // Click logout
  const logoutButton = page.getByRole('button', { name: /log out|sign out/i }).or(
    page.getByRole('link', { name: /log out|sign out/i })
  );
  
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('**/login', { timeout: 10000 });
  }
}

/**
 * Generate a unique identifier for test data
 */
export function generateUniqueId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique email for testing
 */
export function generateTestEmail(): string {
  return `test+${Date.now()}@example.com`;
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Check if element exists (without throwing error)
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.count() > 0;
  } catch {
    return false;
  }
}

/**
 * Retry an action until it succeeds or max attempts reached
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError || new Error('Retry action failed');
}

/**
 * Fill form field with retry logic
 */
export async function fillFieldWithRetry(
  page: Page,
  selector: string,
  value: string,
  maxAttempts = 3
): Promise<void> {
  await retryAction(async () => {
    await page.locator(selector).fill(value);
    const currentValue = await page.locator(selector).inputValue();
    if (currentValue !== value) {
      throw new Error(`Field value mismatch: expected "${value}", got "${currentValue}"`);
    }
  }, maxAttempts);
}

/**
 * Open shopping list drawer
 */
export async function openShoppingList(page: Page): Promise<void> {
  await page.goto('/planner');
  await page.getByRole('button', { name: 'Shopping List' }).click();
  await expect(page.getByRole('dialog', { name: 'Shopping List' })).toBeVisible();
}

/**
 * Close modal/dialog by pressing Escape
 */
export async function closeModal(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300); // Wait for animation
}

/**
 * Verify page has no console errors
 */
export async function verifyNoConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Wait a bit to collect errors
  await page.waitForTimeout(1000);
  
  if (errors.length > 0) {
    throw new Error(`Console errors detected: ${errors.join(', ')}`);
  }
}
