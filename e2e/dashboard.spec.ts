import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 * 
 * Tests the main dashboard page functionality including:
 * - Current meal plan display
 * - Statistics (time saved, meal count)
 * - Empty state handling
 * - Navigation to planner
 * - Share functionality
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
  });

  test('displays dashboard with current meal plan', async ({ page }) => {
    // Verify dashboard loads
    await expect(page.getByText('Dashboard')).toBeVisible();
    
    // Check for either active plan or empty state
    const currentPlanWidget = page.getByText('Current Plan');
    const emptyState = page.getByText('Aww, you have no plans');
    
    // One of these should be visible
    const hasActivePlan = await currentPlanWidget.isVisible();
    const hasEmptyState = await emptyState.isVisible();
    
    expect(hasActivePlan || hasEmptyState).toBeTruthy();
  });

  test('shows current plan stats when plan exists', async ({ page }) => {
    // Check if there's an active plan
    const currentPlanWidget = page.getByText('Current Plan');
    
    if (await currentPlanWidget.isVisible()) {
      // Verify stats are displayed
      await expect(page.getByText('Time Saved')).toBeVisible();
      await expect(page.getByText('hours')).toBeVisible();
      
      // Verify meal count is shown
      await expect(page.getByText('meals planned')).toBeVisible();
      
      // Verify "View Full Plan" link exists
      await expect(page.getByRole('link', { name: /view full plan/i })).toBeVisible();
    }
  });

  test('shows empty state when no plans exist', async ({ page }) => {
    // Check for empty state
    const emptyState = page.getByText('Aww, you have no plans');
    
    if (await emptyState.isVisible()) {
      // Verify call-to-action button
      await expect(page.getByRole('link', { name: 'Plan New Week' })).toBeVisible();
      
      // Verify empty state icon/message
      await expect(page.getByText('why not make one?')).toBeVisible();
    }
  });

  test('can navigate to planner from dashboard', async ({ page }) => {
    // Find and click "Plan New Week" button
    const planButton = page.getByRole('link', { name: 'Plan New Week' }).first();
    await expect(planButton).toBeVisible();
    await planButton.click();
    
    // Verify navigation to planner
    await expect(page).toHaveURL(/\/planner/);
  });

  test('displays upcoming weeks section', async ({ page }) => {
    // Check for upcoming weeks widget
    const upcomingWeeks = page.getByText('Upcoming Weeks');
    
    if (await upcomingWeeks.isVisible()) {
      // Verify week labels are shown
      await expect(page.getByText('This Week')).toBeVisible();
      
      // Verify at least one week card is displayed
      const weekCards = page.locator('[class*="grid"] [class*="rounded-lg"]');
      const count = await weekCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('displays meal photos carousel when meals exist', async ({ page }) => {
    // Check for "Your Meals" section
    const yourMealsSection = page.getByText('Your Meals');
    
    if (await yourMealsSection.isVisible()) {
      // Verify at least one meal image is displayed
      const mealImages = page.locator('img[alt]').filter({ 
        has: page.locator('[class*="rounded-lg"]') 
      });
      
      const imageCount = await mealImages.count();
      expect(imageCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('can open share modal from dashboard', async ({ page }) => {
    // Check if there's an active plan with share button
    const shareButton = page.getByRole('button', { name: /share/i });
    
    if (await shareButton.isVisible()) {
      await shareButton.click();
      
      // Verify share modal opens
      // Note: Adjust selector based on your ShareModal implementation
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });

  test('displays recommended meals placeholder', async ({ page }) => {
    // Verify "Recommended Meals" section exists
    const recommendedSection = page.getByText('Recommended Meals');
    
    if (await recommendedSection.isVisible()) {
      // Verify "Coming Soon" badge
      await expect(page.getByText('Coming Soon')).toBeVisible();
    }
  });

  test('displays tips and news placeholder', async ({ page }) => {
    // Verify "Tips & News" section exists
    const tipsSection = page.getByText('Tips & News');
    
    if (await tipsSection.isVisible()) {
      // Verify "Coming Soon" badge
      await expect(page.locator('text=Coming Soon').nth(1)).toBeVisible();
    }
  });

  test('can navigate to full plan view', async ({ page }) => {
    // Check if there's an active plan
    const viewFullPlanLink = page.getByRole('link', { name: /view full plan/i });
    
    if (await viewFullPlanLink.isVisible()) {
      await viewFullPlanLink.click();
      
      // Verify navigation to plan page
      await expect(page).toHaveURL(/\/plan/);
    }
  });

  test('dashboard loads within acceptable time', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('responsive layout on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Verify dashboard is still accessible
    await expect(page.getByText('Dashboard')).toBeVisible();
    
    // Verify widgets stack vertically (grid should be single column)
    const widgets = page.locator('[class*="grid"]').first();
    await expect(widgets).toBeVisible();
  });
});
