import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    __PRINT_CALLS__?: number;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable must be set for this test.`);
  return value;
}

test.describe('Meal Plan Printing', () => {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const email = requireEnv('TEST_USER_EMAIL');
  const password = requireEnv('TEST_USER_PASSWORD');

  const startDate = '2099-02-01';
  const endDate = '2099-02-07';

  let supabase: ReturnType<typeof createClient>;
  let userId: string | null = null;
  let mealId: number | null = null;
  let mealPlanId: number | null = null;

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

    const uniqueMealName = `E2E Meal Plan Printing ${Date.now()}`;

    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: userId,
        name: uniqueMealName,
        meal_type: 'Dinner',
        description: 'Seed meal for meal plan printing tests',
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
    mealPlanId = plan.id as number;

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

    // Do NOT call signOut() - it invalidates the refresh token server-side
    // which breaks other tests running in parallel that share the same user session
  });

  test('dashboard and detail Print buttons call window.print()', async ({ page }) => {
    await page.addInitScript(() => {
      window.__PRINT_CALLS__ = window.__PRINT_CALLS__ ?? 0;
      try {
        Object.defineProperty(window, 'print', {
          value: () => {
            window.__PRINT_CALLS__ = (window.__PRINT_CALLS__ ?? 0) + 1;
          },
          configurable: true,
        });
      } catch {
        // Fallback for environments where defineProperty fails.
        window.print = () => {
          window.__PRINT_CALLS__ = (window.__PRINT_CALLS__ ?? 0) + 1;
        };
      }
    });

    // Navigate to the Plan view page (not dashboard) where print button is located
    await page.goto('/plan');

    const printBtn = page.getByTestId('print-meal-plan');
    await expect(printBtn).toBeVisible({ timeout: 15_000 });

    const planViewBefore = await page.evaluate(() => window.__PRINT_CALLS__ ?? 0);
    await printBtn.click();

    const planViewCalls = await page.evaluate(() => {
      return window.__PRINT_CALLS__ ?? 0;
    });
    expect(planViewCalls).toBe(planViewBefore + 1);

    // Navigate via the UI to history page
    await page.getByRole('link', { name: 'View History' }).click();
    await page.waitForURL('**/meal-plans/history', { timeout: 120_000 });
    await expect(page.locator('[data-testid="meal-plan-history-list"]')).toBeVisible({
      timeout: 30_000,
    });

    const firstHistoryItem = page.locator('[data-testid="meal-plan-history-item"]').first();
    await expect(firstHistoryItem).toBeVisible({ timeout: 30_000 });
    await firstHistoryItem.click();
    await page.waitForURL(/\/meal-plans\/(\d+)$/, { timeout: 120_000 });

    const detailPrintBtn = page.getByTestId('print-meal-plan');
    await expect(detailPrintBtn).toBeVisible({ timeout: 30_000 });

    const detailBefore = await page.evaluate(() => window.__PRINT_CALLS__ ?? 0);
    await detailPrintBtn.click();

    const detailCalls = await page.evaluate(() => {
      return window.__PRINT_CALLS__ ?? 0;
    });
    expect(detailCalls).toBe(detailBefore + 1);
  });
});
