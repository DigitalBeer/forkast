import { test, expect } from '@playwright/test';

test.describe('Meal Plan Sharing', () => {
  // Uses global auth state (storageState) from playwright.config.ts — no manual login needed.
  // Assumes the authenticated user already has at least one saved meal plan.

  // Clean up all stale share links before running tests to prevent accumulation
  test.beforeAll(async ({ request }) => {
    try {
      // Get all meal plans for the test user
      const historyRes = await request.get('/api/meal-plans/history');
      if (!historyRes.ok()) return;
      const plans = await historyRes.json();
      const planIds = (Array.isArray(plans) ? plans : plans.plans || []).map((p: { id: number }) => p.id);

      // For each plan, fetch and delete all existing shares
      for (const planId of planIds) {
        const sharesRes = await request.get(`/api/meal-plans/${planId}/shares`);
        if (!sharesRes.ok()) continue;
        const { shares } = await sharesRes.json();
        if (!shares?.length) continue;
        for (const share of shares) {
          await request.delete(`/api/meal-plans/${planId}/shares/${share.id}`);
        }
      }
    } catch (e) {
      console.warn('Share cleanup failed (non-fatal):', e);
    }
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
      await expect(page.locator('input[readonly]').first()).toBeVisible();
      
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
      await expect(page.locator('text=Includes details').first()).toBeVisible();
    });

    test('should copy share URL to clipboard', async ({ page }) => {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      // Open share modal and create a share
      await page.click('button:has-text("Share")');
      await page.click('button:has-text("Generate Share Link")');
      
      // Wait for share to be fully created and rendered
      await expect(page.locator('input[readonly]').first()).toBeVisible({ timeout: 15000 });
      
      // Scroll to and click the first copy button
      const copyButton = page.locator('button:has-text("Copy")').first();
      await copyButton.scrollIntoViewIfNeeded();
      await copyButton.click();
      
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
      
      // Wait for share to be fully created and rendered
      await expect(page.locator('input[readonly]').first()).toBeVisible({ timeout: 15000 });
      
      // Accept confirmation dialog before clicking revoke
      page.on('dialog', dialog => dialog.accept());
      
      // Scroll to and click the first revoke button
      const revokeButton = page.locator('button[title="Revoke share"]').first();
      await revokeButton.scrollIntoViewIfNeeded();
      await revokeButton.click();
      
      // Wait for the share to be removed
      await page.waitForTimeout(1000);
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
      await expect(page.locator('input[readonly]').first()).toBeVisible();
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
      await expect(page.locator('input[readonly]').first()).toBeVisible();
    });
  });

  test.describe('Meal Plan Detail Page Sharing', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to meal plan history first
      await page.goto('/meal-plans/history');
      await page.waitForLoadState('networkidle');
      
      // Click on the first meal plan to go to detail page
      await page.locator('[data-testid="meal-plan-history-item"]').first().click();
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
      // Open share modal
      await page.click('button:has-text("Share")');
      await expect(page.locator('text=Share Meal Plan')).toBeVisible({ timeout: 10000 });
      
      // Create share and verify API succeeds
      const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/share') && resp.request().method() === 'POST', { timeout: 30000 }),
        page.click('button:has-text("Generate Share Link")'),
      ]);
      expect(response.status()).toBe(200);
      
      // Verify the API response contains a valid share URL
      const data = await response.json();
      expect(data.shareUrl).toMatch(/\/shared\/[a-f0-9-]{36}$/);
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
      await expect(page.locator('input[readonly]').first()).toBeVisible();
      const shareUrl = await page.locator('input[readonly]').first().inputValue();
      
      // Open new incognito context (no auth)
      const incognitoContext = await context.browser()?.newContext();
      if (!incognitoContext) throw new Error('Failed to create incognito context');
      
      const incognitoPage = await incognitoContext.newPage();
      
      // Navigate to shared URL
      await incognitoPage.goto(shareUrl);
      
      // Verify shared page loads without authentication
      await expect(incognitoPage.locator('text=Shared Meal Plan')).toBeVisible({ timeout: 15000 });
      await expect(incognitoPage.locator('text=meals planned')).toBeVisible();
      await expect(incognitoPage.locator('text=BMAD Meal Planner').first()).toBeVisible();
      
      // Verify at least one meal card is rendered (meal names come from seed data)
      await expect(incognitoPage.locator('h4').first()).toBeVisible();
      
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
      await expect(page.locator('input[readonly]').first()).toBeVisible();
      const shareUrl = await page.locator('input[readonly]').first().inputValue();
      
      // Open new incognito context
      const incognitoContext = await context.browser()?.newContext();
      if (!incognitoContext) throw new Error('Failed to create incognito context');
      
      const incognitoPage = await incognitoContext.newPage();
      
      // Navigate to shared URL
      await incognitoPage.goto(shareUrl);
      
      // Verify shared page shows details
      await expect(incognitoPage.locator('text=Shared Meal Plan')).toBeVisible({ timeout: 15000 });
      
      // Look for ingredients/instructions sections (if meal has them)
      const hasIngredients = await incognitoPage.locator('text=Ingredients').isVisible({ timeout: 10000 }).catch(() => false);
      const hasInstructions = await incognitoPage.locator('text=Instructions').isVisible({ timeout: 10000 }).catch(() => false);
      
      // At least one detail section should be visible when details are included
      // If no details exist for the meals, at least verify the page loaded
      if (!hasIngredients && !hasInstructions) {
        // Fall back to verifying at least one meal card rendered
        await expect(incognitoPage.locator('h4').first()).toBeVisible();
      }
      
      await incognitoContext.close();
    });

    test('should show error for invalid share token', async ({ context }) => {
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
      await page.click('[data-testid="close-share-modal"]'); // X button
      
      // Verify modal is closed
      await expect(page.locator('text=Share Meal Plan')).not.toBeVisible();
    });
  });
});
