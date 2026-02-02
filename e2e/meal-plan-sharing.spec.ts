import { test, expect } from '@playwright/test';

test.describe('Meal Plan Sharing', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/');
    
    // Ensure we have a meal plan to share
    await page.goto('/planner');
    await page.waitForLoadState('networkidle');
    
    // Add a quick meal if no plan exists
    const hasMeals = await page.locator('[data-testid="meal-slot"]').first().isVisible();
    if (!hasMeals) {
      await page.click('[data-testid="add-meal-button"]');
      await page.fill('[data-testid="meal-name"]', 'Test Meal for Sharing');
      await page.click('[data-testid="save-meal"]');
      await page.waitForLoadState('networkidle');
    }
    
    // Save the plan
    await page.click('[data-testid="save-plan"]');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Dashboard Sharing', () => {
    test.beforeEach(async ({ page }) => {
      // Go back to dashboard
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('should open share modal when share button is clicked', async ({ page }) => {
      // Click the share button
      await page.click('button:has-text("Share")');
      
      // Verify modal opens
      await expect(page.locator('text=Share Meal Plan')).toBeVisible();
      await expect(page.locator('text=Create New Share Link')).toBeVisible();
      await expect(page.locator('button:has-text("Generate Share Link")')).toBeVisible();
    });

    test('should create a share link with basic options', async ({ page }) => {
      // Open share modal
      await page.click('button:has-text("Share")');
      
      // Create share without details
      await page.click('button:has-text("Generate Share Link")');
      
      // Wait for share to be created
      await expect(page.locator('text=Active Share Links')).toBeVisible();
      await expect(page.locator('input[readonly]')).toBeVisible();
      
      // Verify the share URL format
      const shareUrlInput = page.locator('input[readonly]').first();
      const shareUrl = await shareUrlInput.inputValue();
      expect(shareUrl).toMatch(/\/shared\/[a-f0-9-]{36}$/);
    });

    test('should create a share link with meal details included', async ({ page }) => {
      // Open share modal
      await page.click('button:has-text("Share")');
      
      // Enable include details
      await page.check('input[type="checkbox"]');
      
      // Create share
      await page.click('button:has-text("Generate Share Link")');
      
      // Wait for share to be created
      await expect(page.locator('text=Active Share Links')).toBeVisible();
      await expect(page.locator('text=Includes details')).toBeVisible();
    });

    test('should copy share URL to clipboard', async ({ page }) => {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      // Open share modal and create a share
      await page.click('button:has-text("Share")');
      await page.click('button:has-text("Generate Share Link")');
      
      // Wait for share to be created
      await expect(page.locator('text=Active Share Links')).toBeVisible();
      
      // Click copy button
      await page.click('button:has-text("Copy")');
      
      // Verify copy feedback
      await expect(page.locator('text=Copied')).toBeVisible();
      
      // Verify clipboard content
      const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardContent).toMatch(/\/shared\/[a-f0-9-]{36}$/);
    });

    test('should delete/revoke a share link', async ({ page }) => {
      // Open share modal and create a share
      await page.click('button:has-text("Share")');
      await page.click('button:has-text("Generate Share Link")');
      
      // Wait for share to be created
      await expect(page.locator('text=Active Share Links')).toBeVisible();
      
      // Click delete button
      page.on('dialog', dialog => dialog.accept()); // Accept confirmation dialog
      await page.click('button[title="Revoke share"]');
      
      // Verify share is removed
      await expect(page.locator('text=No active share links')).toBeVisible();
    });
  });

  test.describe('Plan Page Sharing', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to plan page
      await page.goto('/plan');
      await page.waitForLoadState('networkidle');
    });

    test('should open share modal from plan page', async ({ page }) => {
      // Click the share button on plan page
      await page.click('button:has-text("Share")');
      
      // Verify modal opens
      await expect(page.locator('text=Share Meal Plan')).toBeVisible();
      await expect(page.locator('text=Create New Share Link')).toBeVisible();
    });

    test('should create share link from plan page', async ({ page }) => {
      // Open share modal and create share
      await page.click('button:has-text("Share")');
      await page.click('button:has-text("Generate Share Link")');
      
      // Verify share is created
      await expect(page.locator('text=Active Share Links')).toBeVisible();
      await expect(page.locator('input[readonly]')).toBeVisible();
    });
  });

  test.describe('Meal Plan History Sharing', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to meal plan history
      await page.goto('/meal-plans/history');
      await page.waitForLoadState('networkidle');
    });

    test('should open share modal from history page', async ({ page }) => {
      // Click the first share button in the history list
      await page.click('button:has-text("Share")');
      
      // Verify modal opens
      await expect(page.locator('text=Share Meal Plan')).toBeVisible();
      await expect(page.locator('text=Create New Share Link')).toBeVisible();
    });

    test('should create share link from history page', async ({ page }) => {
      // Open share modal and create share
      await page.click('button:has-text("Share")');
      await page.click('button:has-text("Generate Share Link")');
      
      // Verify share is created
      await expect(page.locator('text=Active Share Links')).toBeVisible();
      await expect(page.locator('input[readonly]')).toBeVisible();
    });
  });

  test.describe('Meal Plan Detail Page Sharing', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to meal plan history first
      await page.goto('/meal-plans/history');
      await page.waitForLoadState('networkidle');
      
      // Click on the first meal plan to go to detail page
      await page.click('[data-testid="meal-plan-history-item"]');
      await page.waitForLoadState('networkidle');
    });

    test('should open share modal from detail page', async ({ page }) => {
      // Click the share button on detail page
      await page.click('button:has-text("Share")');
      
      // Verify modal opens
      await expect(page.locator('text=Share Meal Plan')).toBeVisible();
      await expect(page.locator('text=Create New Share Link')).toBeVisible();
    });

    test('should create share link from detail page', async ({ page }) => {
      // Open share modal and create share
      await page.click('button:has-text("Share")');
      await page.click('button:has-text("Generate Share Link")');
      
      // Verify share is created
      await expect(page.locator('text=Active Share Links')).toBeVisible();
      await expect(page.locator('input[readonly]')).toBeVisible();
    });
  });

  test.describe('Shared Page Functionality', () => {
    test('should display shared meal plan without authentication', async ({ page, context }) => {
      // Go back to dashboard first
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Create a share link first
      await page.click('button:has-text("Share")');
      await page.click('button:has-text("Generate Share Link")');
      
      // Get the share URL
      await expect(page.locator('input[readonly]')).toBeVisible();
      const shareUrl = await page.locator('input[readonly]').first().inputValue();
      
      // Open new incognito context (no auth)
      const incognitoContext = await context.browser()?.newContext();
      if (!incognitoContext) throw new Error('Failed to create incognito context');
      
      const incognitoPage = await incognitoContext.newPage();
      
      // Navigate to shared URL
      await incognitoPage.goto(shareUrl);
      
      // Verify shared page loads without authentication
      await expect(incognitoPage.locator('text=Shared Meal Plan')).toBeVisible();
      await expect(incognitoPage.locator('text=meals planned')).toBeVisible();
      await expect(incognitoPage.locator('text=BMAD Meal Planner')).toBeVisible();
      
      // Verify meal content is displayed
      await expect(incognitoPage.locator('text=Test Meal for Sharing')).toBeVisible();
      
      await incognitoContext.close();
    });

    test('should display shared meal plan with details when enabled', async ({ page, context }) => {
      // Go back to dashboard first
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Create a share link with details
      await page.click('button:has-text("Share")');
      await page.check('input[type="checkbox"]'); // Include details
      await page.click('button:has-text("Generate Share Link")');
      
      // Get the share URL
      await expect(page.locator('input[readonly]')).toBeVisible();
      const shareUrl = await page.locator('input[readonly]').first().inputValue();
      
      // Open new incognito context
      const incognitoContext = await context.browser()?.newContext();
      if (!incognitoContext) throw new Error('Failed to create incognito context');
      
      const incognitoPage = await incognitoContext.newPage();
      
      // Navigate to shared URL
      await incognitoPage.goto(shareUrl);
      
      // Verify shared page shows details
      await expect(incognitoPage.locator('text=Shared Meal Plan')).toBeVisible();
      
      // Look for ingredients/instructions sections (if meal has them)
      const hasIngredients = await incognitoPage.locator('text=Ingredients').isVisible();
      const hasInstructions = await incognitoPage.locator('text=Instructions').isVisible();
      
      // At least one detail section should be visible when details are included
      expect(hasIngredients || hasInstructions).toBeTruthy();
      
      await incognitoContext.close();
    });

    test('should show error for invalid share token', async ({ page, context }) => {
      // Open new incognito context
      const incognitoContext = await context.browser()?.newContext();
      if (!incognitoContext) throw new Error('Failed to create incognito context');
      
      const incognitoPage = await incognitoContext.newPage();
      
      // Navigate to invalid share URL
      await incognitoPage.goto('/shared/invalid-token-12345');
      
      // Verify error message
      await expect(incognitoPage.locator('text=This shared meal plan was not found')).toBeVisible();
      
      await incognitoContext.close();
    });
  });

  test.describe('Modal Interactions', () => {
    test.beforeEach(async ({ page }) => {
      // Go back to dashboard
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('should close share modal when X button is clicked', async ({ page }) => {
      // Open share modal
      await page.click('button:has-text("Share")');
      await expect(page.locator('text=Share Meal Plan')).toBeVisible();
      
      // Close modal
      await page.click('button:has([class*="text-gray-400"])'); // X button
      
      // Verify modal is closed
      await expect(page.locator('text=Share Meal Plan')).not.toBeVisible();
    });
  });
});
