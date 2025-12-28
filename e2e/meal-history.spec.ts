import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Test data
const TEST_USER = {
  email: 'test@example.com',
  password: 'test-password',
};

const TEST_MEAL = {
  name: 'Test Meal for History',
  description: 'A test meal for history tracking',
  ingredients: [{ name: 'Ingredient 1', amount: 1, unit: 'piece' }],
  instructions: 'Test instructions',
};

test.describe.skip('Meal History Tracking (disabled pending UI implementation)', () => {
  let page;
  let supabase;
  let testMealId;
  let testUserId;

  test.beforeAll(async () => {
    // Initialize Supabase client for test data setup
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    supabase = createClient(supabaseUrl, supabaseKey);

    // Sign in the test user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (error) {
      // If sign in fails, try to create the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });
      
      if (signUpError) throw signUpError;
      testUserId = signUpData.user?.id;
    } else {
      testUserId = data.user?.id;
    }

    // Create a test meal
    const { data: mealData, error: mealError } = await supabase
      .from('meals')
      .insert([{
        name: TEST_MEAL.name,
        description: TEST_MEAL.description,
        ingredients: TEST_MEAL.ingredients,
        instructions: TEST_MEAL.instructions,
        user_id: testUserId,
      }])
      .select('id')
      .single();

    if (mealError) throw mealError;
    testMealId = mealData.id;
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the login page and sign in
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL('**/dashboard');
  });

  test.afterEach(async () => {
    // no-op; Playwright disposes the page fixture automatically
  });

  test.afterAll(async () => {
    // Clean up test data
    if (testMealId) {
      await supabase.from('meals').delete().eq('id', testMealId);
    }
    
    // Delete test user's history
    if (testUserId) {
      await supabase.from('meal_history').delete().eq('user_id', testUserId);
    }
    
    // Do NOT call signOut() - it invalidates the refresh token server-side
    // which breaks other tests running in parallel that share the same user session
  });

  test('should track meal view history', async () => {
    // Navigate to the meal detail page
    await page.goto(`/meals/${testMealId}`);
    
    // Wait for the page to load
    await page.waitForSelector('h1');
    
    // Verify the meal details are displayed
    await expect(page.locator('h1')).toContainText(TEST_MEAL.name);
    
    // Check if the view was recorded in the history
    await page.waitForTimeout(1000); // Give some time for the history to be recorded
    
    // Verify the history was recorded
    const { data: history, error } = await supabase
      .from('meal_history')
      .select('*')
      .eq('meal_id', testMealId)
      .eq('action_type', 'viewed')
      .limit(1);

    expect(error).toBeNull();
    expect(history).toHaveLength(1);
    expect(history?.[0].user_id).toBe(testUserId);
  });

  test('should track meal planning', async () => {
    // Navigate to the meal planning page (interactive planner)
    await page.goto('/planner');
    
    // Click the "Add to Plan" button for the test meal
    const addToPlanButton = page.locator(`[data-testid="add-to-plan-${testMealId}"]`);
    await addToPlanButton.click();
    
    // Wait for the planning modal to appear and confirm
    await page.click('button:has-text("Confirm")');
    
    // Check if the plan was recorded in the history
    await page.waitForTimeout(1000); // Give some time for the history to be recorded
    
    // Verify the history was recorded
    const { data: history, error } = await supabase
      .from('meal_history')
      .select('*')
      .eq('meal_id', testMealId)
      .eq('action_type', 'planned')
      .limit(1);

    expect(error).toBeNull();
    expect(history).toHaveLength(1);
    expect(history?.[0].user_id).toBe(testUserId);
  });

  test('should display meal history in the history page', async () => {
    // First, ensure there's some history
    await supabase.from('meal_history').insert([
      {
        user_id: testUserId,
        meal_id: testMealId,
        action_type: 'viewed',
        action_date: new Date().toISOString(),
      },
      {
        user_id: testUserId,
        meal_id: testMealId,
        action_type: 'planned',
        action_date: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      },
    ]);
    
    // Navigate to the history page
    await page.goto('/history');
    
    // Wait for the history to load
    await page.waitForSelector('[data-testid="history-list"]');
    
    // Verify the history items are displayed
    const historyItems = page.locator('[data-testid="history-item"]');
    await expect(historyItems).toHaveCount(2);
    
    // Verify the most recent action is first (viewed should be first because it's more recent)
    await expect(historyItems.first().locator('[data-testid="action-type"]'))
      .toContainText('viewed');
    await expect(historyItems.last().locator('[data-testid="action-type"]'))
      .toContainText('planned');
      
    // Verify the meal name is displayed
    await expect(historyItems.first().locator('[data-testid="meal-name"]'))
      .toContainText(TEST_MEAL.name);
  });
});
