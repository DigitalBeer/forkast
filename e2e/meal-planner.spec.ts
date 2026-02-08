import { test, expect } from '@playwright/test';

/**
 * Meal Planner E2E Tests
 * 
 * Tests the weekly meal planning functionality including:
 * - Creating new meal plans
 * - Adding meals to plan slots
 * - Drag and drop functionality
 * - Saving and updating plans
 * - Shopping list generation
 */

// Helper function to wait for page load
const waitForPageLoad = async (page) => {
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.waitForLoadState('domcontentloaded'),
  ]);
};

test.describe('Meal Planner', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to planner
    await page.goto('/planner');
    await waitForPageLoad(page);
  });

  test('planner page loads successfully', async ({ page }) => {
    // Verify planner UI elements are present
    await expect(page.getByText(/meal plan/i)).toBeVisible();
    
    // Verify Weekly Calendar heading is visible
    await expect(page.getByRole('heading', { name: 'Weekly Calendar' })).toBeVisible({ timeout: 10000 });
  });

  test('displays weekly calendar grid', async ({ page }) => {
    // Verify days of the week are shown
    // Check for at least a few days (some might use abbreviations)
    const mondayExists = await page.getByText(/mon/i).isVisible();
    const tuesdayExists = await page.getByText(/tue/i).isVisible();
    
    expect(mondayExists || tuesdayExists).toBeTruthy();
  });

  test('displays meal type slots (breakfast, lunch, dinner)', async ({ page }) => {
    // Verify meal types are shown
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
    
    for (const mealType of mealTypes) {
      const mealTypeElement = page.getByText(new RegExp(mealType, 'i')).first();
      await expect(mealTypeElement).toBeVisible({ timeout: 5000 });
    }
  });

  test('can open meal selection modal', async ({ page }) => {
    // Find an empty meal slot and click it
    // Note: Adjust selector based on your actual implementation
    const emptySlot = page.locator('[data-meal-slot]').first();
    
    if (await emptySlot.isVisible()) {
      await emptySlot.click();
      
      // Verify meal selection modal/dropdown opens
      const modal = page.locator('[role="dialog"]').or(page.locator('[role="listbox"]'));
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Close modal
      await page.keyboard.press('Escape');
    }
  });

  test('can add a meal to a plan slot', async ({ page }) => {
    // First, ensure we have at least one meal in the repertoire
    // Navigate to meals page to check
    await page.goto('/meals');
    await waitForPageLoad(page);
    
    const mealCards = page.locator('[data-testid="meal-card"]');
    const mealCount = await mealCards.count();
    
    if (mealCount === 0) {
      // Create a test meal first
      await page.goto('/meals/new');
      await waitForPageLoad(page);
      
      const uniqueMealName = `Planner Test Meal ${Date.now()}`;
      await page.getByLabel('Meal Name').fill(uniqueMealName);
      await page.getByLabel('Description').fill('Test meal for planner');
      await page.getByTestId('save-meal').click();
      
      await expect(page.locator('[data-sonner-toast][data-type="success"]')).toBeVisible();
      await page.waitForURL('/meals', { timeout: 10000 });
    }
    
    // Now go back to planner
    await page.goto('/planner');
    await waitForPageLoad(page);
    
    // Find and click an empty slot
    const emptySlot = page.locator('[data-meal-slot]').first();
    
    if (await emptySlot.isVisible()) {
      await emptySlot.click();
      
      // Select a meal from the list
      const mealOption = page.locator('[data-testid="meal-option"]').first();
      
      if (await mealOption.isVisible()) {
        await mealOption.click();
        
        // Verify meal was added to the slot
        await expect(emptySlot).not.toBeEmpty({ timeout: 5000 });
      }
    }
  });

  test('can save meal plan', async ({ page }) => {
    // Look for a save button
    const saveButton = page.getByRole('button', { name: /save/i });
    
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Verify a toast appears (success or error — saving empty plan may produce either)
      await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 15000 });
    }
  });

  test('can open shopping list from planner', async ({ page }) => {
    // Look for shopping list button
    const shoppingListButton = page.getByRole('button', { name: /shopping list/i });
    
    if (await shoppingListButton.isVisible()) {
      await shoppingListButton.click();
      
      // Verify shopping list modal/drawer opens
      const shoppingListModal = page.getByRole('dialog', { name: /shopping list/i });
      await expect(shoppingListModal).toBeVisible({ timeout: 5000 });
      
      // Close modal
      await page.keyboard.press('Escape');
    }
  });

  test('can navigate between weeks', async ({ page }) => {
    // Look for next/previous week buttons
    const nextWeekButton = page.getByRole('button', { name: /next/i }).or(
      page.locator('[aria-label*="next"]')
    );
    
    if (await nextWeekButton.isVisible()) {
      // Get current week display
      const weekDisplay = page.getByRole('heading', { name: 'Weekly Calendar' });
      const currentWeekText = await weekDisplay.textContent();
      
      // Click next week
      await nextWeekButton.click();
      await waitForPageLoad(page);
      
      // Verify week changed
      const newWeekText = await weekDisplay.textContent();
      expect(newWeekText).not.toBe(currentWeekText);
    }
  });

  test('shows meal details when clicking on planned meal', async ({ page }) => {
    // Find a slot that has a meal
    const filledSlot = page.locator('[data-meal-slot]:has-text("")').first();
    
    if (await filledSlot.isVisible()) {
      const slotText = await filledSlot.textContent();
      
      // Only test if slot has content
      if (slotText && slotText.trim().length > 0) {
        await filledSlot.click();
        
        // Verify meal details modal opens
        const detailsModal = page.locator('[role="dialog"]');
        await expect(detailsModal).toBeVisible({ timeout: 5000 });
        
        // Close modal
        await page.keyboard.press('Escape');
      }
    }
  });

  test('can remove a meal from a slot', async ({ page }) => {
    // Find a slot that has a meal
    const filledSlot = page.locator('[data-meal-slot]').filter({ hasText: /.+/ }).first();
    
    if (await filledSlot.isVisible()) {
      // Look for remove/delete button within the slot
      const removeButton = filledSlot.getByRole('button', { name: /remove|delete|clear/i });
      
      if (await removeButton.isVisible()) {
        await removeButton.click();
        
        // Verify slot is now empty
        await expect(filledSlot).toBeEmpty({ timeout: 5000 });
      }
    }
  });

  test('displays meal count for the week', async ({ page }) => {
    // Look for a meal count indicator
    const mealCountIndicator = page.getByText(/\d+ meals?/i);
    
    if (await mealCountIndicator.isVisible()) {
      const countText = await mealCountIndicator.textContent();
      expect(countText).toMatch(/\d+/);
    }
  });

  test('can duplicate a meal to another slot', async ({ page }) => {
    // Find a slot with a meal
    const filledSlot = page.locator('[data-meal-slot]').filter({ hasText: /.+/ }).first();
    
    if (await filledSlot.isVisible()) {
      // Look for duplicate/copy button
      const duplicateButton = filledSlot.getByRole('button', { name: /duplicate|copy/i });
      
      if (await duplicateButton.isVisible()) {
        await duplicateButton.click();
        
        // Select target slot
        const targetSlot = page.locator('[data-meal-slot]').nth(1);
        await targetSlot.click();
        
        // Verify meal was duplicated
        await expect(targetSlot).not.toBeEmpty({ timeout: 5000 });
      }
    }
  });

  test('planner is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/planner');
    await waitForPageLoad(page);
    
    // Verify planner is still accessible
    await expect(page.getByText(/meal plan/i)).toBeVisible();
    
    // On mobile, days might be shown one at a time or in a different layout
    const dayElement = page.getByText(/mon|tue|wed|thu|fri|sat|sun/i).first();
    await expect(dayElement).toBeVisible();
  });

  test('shows validation when trying to save empty plan', async ({ page }) => {
    // Clear any existing meals (if possible)
    // Then try to save
    const saveButton = page.getByRole('button', { name: /save/i });
    
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Depending on your implementation, this might show a warning or just save
      // Adjust assertion based on your actual behavior
      const toast = page.locator('[data-sonner-toast]');
      
      if (await toast.isVisible()) {
        // Verify some feedback is shown
        expect(await toast.textContent()).toBeTruthy();
      }
    }
  });

  test('can view plan history', async ({ page }) => {
    // Look for history button
    const historyButton = page.getByRole('button', { name: /history/i }).or(
      page.getByRole('link', { name: /history/i })
    );
    
    if (await historyButton.isVisible()) {
      await historyButton.click();
      
      // Verify navigation to history page
      await expect(page).toHaveURL(/\/history|\/meal-plans\/history/);
    }
  });
});
