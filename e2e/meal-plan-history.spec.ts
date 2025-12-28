import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable must be set for this test.`);
  return value;
}

test.describe('Meal Plan History', () => {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const email = requireEnv('TEST_USER_EMAIL');
  const password = requireEnv('TEST_USER_PASSWORD');

  const startDate = '2099-01-01';
  const endDate = '2099-01-07';

  let supabase: ReturnType<typeof createClient>;
  let userId: string | null = null;
  let mealId: number | null = null;

  test.beforeAll(async () => {
    // Use persistSession: false to avoid rotating tokens that would invalidate
    // the browser session established by globalSetup
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      throw signInError || new Error('Failed to sign in');
    }

    userId = data.user.id;

    const uniqueMealName = `E2E Meal Plan History ${Date.now()}`;

    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: userId,
        name: uniqueMealName,
        meal_type: 'Dinner',
        description: 'Seed meal for meal plan history tests',
        ingredients: JSON.stringify([{ name: 'Test Ingredient', quantity: '1', unit: 'cup' }]),
        instructions: 'Seed instructions',
      })
      .select('id')
      .single();

    if (mealError) throw mealError;
    mealId = meal.id as number;

    const { data: plan, error: planError } = await supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
      })
      .select('id')
      .single();

    if (planError) throw planError;
    const mealPlanId = plan.id as number;

    const { error: plannedMealsError } = await supabase.from('planned_meals').insert([
      {
        meal_plan_id: mealPlanId,
        meal_id: mealId,
        planned_for_date: startDate,
        meal_type: 'dinner',
      },
    ]);

    if (plannedMealsError) throw plannedMealsError;
  });

  test.afterAll(async () => {
    if (userId) {
      await supabase
        .from('meal_plans')
        .delete()
        .eq('user_id', userId)
        .eq('start_date', startDate);
    }

    if (mealId) {
      await supabase.from('meals').delete().eq('id', mealId);
    }

    // Do NOT call signOut() here - it invalidates the refresh token server-side
    // which breaks other tests running in parallel that share the same user session
  });

  test('can view history, open detail, and duplicate a plan', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/meal-plans/history');
    await page.waitForURL('**/meal-plans/history');

    await page.waitForResponse(
      (resp) => resp.url().includes('/api/meal-plans/history') && resp.status() === 200,
      { timeout: 90_000 }
    );

    const list = page.locator('[data-testid="meal-plan-history-list"]');
    await expect(list).toBeVisible({ timeout: 90_000 });

    const firstItem = page.locator('[data-testid="meal-plan-history-item"]').first();
    await expect(firstItem).toBeVisible({ timeout: 90_000 });

    await firstItem.click();
    await page.waitForURL(/\/meal-plans\/(\d+)/);

    await page.waitForResponse(
      (resp) => resp.url().includes('/api/meal-plans/') && resp.status() === 200,
      { timeout: 90_000 }
    );

    await expect(page.getByRole('heading', { name: 'Meal Plan', level: 1 })).toBeVisible({
      timeout: 30_000,
    });

    const duplicateBtn = page.getByTestId('duplicate-meal-plan');
    await expect(duplicateBtn).toBeVisible();

    await duplicateBtn.click();
    await page.waitForURL(/\/meal-plans\/(\d+)/);

    const url = page.url();
    const newId = url.split('/').pop();
    expect(newId).toBeTruthy();

    await page.goto('/meal-plans/history');
    const historyResp = await page.waitForResponse(
      (resp) => resp.url().includes('/api/meal-plans/history'),
      { timeout: 90_000 }
    );

    if (historyResp.status() !== 200) {
      throw new Error(
        `Unexpected /api/meal-plans/history status after duplication: ${historyResp.status()} ${await historyResp.text()}`
      );
    }

    await expect(list).toBeVisible({ timeout: 90_000 });

    const newest = page.locator('[data-testid="meal-plan-history-item"]').first();
    await expect(newest).toBeVisible({ timeout: 30_000 });
    await expect(newest).toHaveAttribute('href', `/meal-plans/${newId}`);

    const duplicatedCard = page.locator('[data-testid="meal-plan-history-list"] > div', {
      has: page.locator(`a[href="/meal-plans/${newId}"]`),
    });

    await duplicatedCard.locator('button[data-testid="delete-meal-plan"]').click();
    await page.getByTestId('confirm-delete-btn').click();
    await expect(page.locator(`a[href="/meal-plans/${newId}"]`)).toHaveCount(0, {
      timeout: 30_000,
    });
  });
});
