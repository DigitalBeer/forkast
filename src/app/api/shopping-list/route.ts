import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { aggregateFromMeals, IngredientFormatError } from '@/lib/shopping/aggregate';

export async function GET(req: NextRequest) {
  const requestId = (globalThis.crypto as Crypto | undefined)?.randomUUID?.() ?? `req-${Date.now()}`;
  const url = new URL(req.url);
  const mealPlanIdParam = url.searchParams.get('mealPlanId');

  try {
    // Validate query param
    if (!mealPlanIdParam) {
      return NextResponse.json(
        { error: 'mealPlanId is required' },
        { status: 400 }
      );
    }

    const mealPlanIdNum = Number(mealPlanIdParam);
    if (!Number.isFinite(mealPlanIdNum) || mealPlanIdNum <= 0) {
      return NextResponse.json(
        { error: 'mealPlanId must be a positive number' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Auth
    const { data: { session }, error: userError } = await supabase.auth.getSession();
    if (userError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    // Ensure meal plan exists and belongs to user
    const { data: plan, error: planError } = await supabase
      .from('meal_plans')
      .select('id, user_id, start_date, end_date')
      .eq('id', mealPlanIdNum)
      .single();

    if (planError && planError.code === 'PGRST116') { // row not found
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }
    if (planError) {
      console.error(`[${requestId}] Error fetching meal plan:`, planError);
      return NextResponse.json({ error: 'Failed to fetch meal plan', requestId }, { status: 500 });
    }

    if (!plan || plan.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get planned meals for this plan
    const { data: planned, error: plannedError } = await supabase
      .from('planned_meals')
      .select('meal_id')
      .eq('meal_plan_id', mealPlanIdNum);

    if (plannedError) {
      console.error(`[${requestId}] Error fetching planned meals:`, plannedError);
      return NextResponse.json({ error: 'Failed to fetch planned meals', requestId }, { status: 500 });
    }

    if (!planned || planned.length === 0) {
      return NextResponse.json({ error: 'Meal plan contains no meals' }, { status: 404 });
    }

    const mealIds = Array.from(new Set(planned.map((p) => p.meal_id)));

    // Fetch meals and their ingredients for aggregation
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('id, name, ingredients, user_id')
      .in('id', mealIds)
      .eq('user_id', user.id);

    if (mealsError) {
      console.error(`[${requestId}] Error fetching meals:`, mealsError);
      return NextResponse.json({ error: 'Failed to fetch meals', requestId }, { status: 500 });
    }

    if (!meals || meals.length === 0) {
      return NextResponse.json({ error: 'No meals found for this plan' }, { status: 404 });
    }

    try {
      const items = aggregateFromMeals(
        meals.map((m) => ({ id: m.id, name: m.name, ingredients: m.ingredients }))
      );

      if (items.length === 0) {
        return NextResponse.json({ error: 'No ingredients found for this plan' }, { status: 404 });
      }

      return NextResponse.json({
        planId: mealPlanIdNum,
        count: items.length,
        items,
      }, { status: 200 });
    } catch (err) {
      if (err instanceof IngredientFormatError) {
        console.error(`[${requestId}] IngredientFormatError:`, err.message);
        return NextResponse.json({ error: 'Invalid ingredient data format', details: err.message }, { status: 422 });
      }
      console.error(`[${requestId}] Unexpected aggregation error:`, err);
      return NextResponse.json({ error: 'Failed to aggregate ingredients', requestId }, { status: 500 });
    }
  } catch (error) {
    console.error(`[${requestId}] Unexpected error in /api/shopping-list:`, error);
    return NextResponse.json({ error: 'Internal Server Error', requestId }, { status: 500 });
  }
}
