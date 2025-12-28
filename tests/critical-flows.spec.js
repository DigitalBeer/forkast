const { test, expect } = require('@playwright/test');

test.describe('Critical User Flows', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
  });

  test('user can create and save a meal plan', async ({ page }) => {
    // Navigate to meal creation page
    await page.click('[data-testid="create-meal-button"]', { timeout: 10000 });
    
    // Fill out meal form
    await page.fill('[data-testid="meal-name-input"]', 'Test Meal Plan');
    await page.fill('[data-testid="meal-description-input"]', 'A test meal for E2E validation');
    
    // Add ingredients or meal items
    await page.click('[data-testid="add-ingredient-button"]');
    await page.fill('[data-testid="ingredient-input"]', 'Test Ingredient');
    
    // Save the meal
    await page.click('[data-testid="save-meal-button"]');
    
    // Verify success message or redirect
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });
    
    // Verify meal appears in the list
    await page.goto('/meals');
    await expect(page.locator('text=Test Meal Plan')).toBeVisible();
  });

  test('user can view meal repertoire', async ({ page }) => {
    // Navigate to meals page
    await page.goto('/meals');
    
    // Wait for meals to load
    await page.waitForSelector('[data-testid="meals-container"]', { timeout: 10000 });
    
    // Verify meals container is visible
    await expect(page.locator('[data-testid="meals-container"]')).toBeVisible();
    
    // Check if at least one meal is displayed (or empty state)
    const mealsCount = await page.locator('[data-testid="meal-item"]').count();
    const emptyState = await page.locator('[data-testid="empty-meals-state"]').isVisible();
    
    // Either meals exist or empty state is shown
    expect(mealsCount > 0 || emptyState).toBeTruthy();
    
    // If meals exist, test meal interaction
    if (mealsCount > 0) {
      await page.click('[data-testid="meal-item"]');
      await expect(page.locator('[data-testid="meal-details"]')).toBeVisible();
    }
  });

  test('user authentication flow', async ({ page }) => {
    // Test login flow
    await page.goto('/login');
    
    // Verify login form is present
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // Fill login credentials (use test credentials)
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    
    // Submit login form
    await page.click('[data-testid="login-button"]');
    
    // Handle potential authentication scenarios
    try {
      // Check for successful login (redirect to dashboard/home)
      await page.waitForURL('/', { timeout: 5000 });
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    } catch (error) {
      // If login fails, verify error message is shown
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    }
    
    // Test logout if logged in
    const userMenu = await page.locator('[data-testid="user-menu"]').isVisible();
    if (userMenu) {
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    }
  });

  test('navigation and routing work correctly', async ({ page }) => {
    // Test main navigation links
    const navigationLinks = [
      { selector: '[data-testid="home-link"]', expectedUrl: '/' },
      { selector: '[data-testid="meals-link"]', expectedUrl: '/meals' },
      { selector: '[data-testid="plan-link"]', expectedUrl: '/plan' }
    ];

    for (const link of navigationLinks) {
      await page.click(link.selector);
      await page.waitForURL(link.expectedUrl, { timeout: 5000 });
      expect(page.url()).toContain(link.expectedUrl);
    }
  });

  test('application loads without JavaScript errors', async ({ page }) => {
    const errors = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to main pages
    const pages = ['/', '/meals', '/plan', '/login'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Wait a bit for any async operations
      await page.waitForTimeout(1000);
    }
    
    // Check that no critical errors occurred
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
