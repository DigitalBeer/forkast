import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const limitRaw = searchParams.get('limit');
    const offsetRaw = searchParams.get('offset');

    const limit = Math.min(Math.max(parseInt(limitRaw || '20', 10) || 20, 1), 50);
    const offset = Math.max(parseInt(offsetRaw || '0', 10) || 0, 0);

    const {
      data: plans,
      error: plansError,
      count,
    } = await supabase
      .from('meal_plans')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (plansError) {
      console.error('Error fetching meal plan history:', plansError);
      return NextResponse.json({ error: 'Failed to fetch meal plan history' }, { status: 500 });
    }

    const planIds = (plans || []).map((p) => p.id);

    const plannedMealsByPlanId = new Map<
      number,
      Array<{ meal_name?: string | null }>
    >();

    if (planIds.length > 0) {
      const { data: plannedMeals, error: mealsError } = await supabase
        .from('planned_meals')
        .select(
          `
          meal_plan_id,
          meals:meal_id (
            name
          )
        `
        )
        .in('meal_plan_id', planIds);

      if (mealsError) {
        console.error('Error fetching planned meals for history summary:', mealsError);
        return NextResponse.json({ error: 'Failed to fetch meal plan history' }, { status: 500 });
      }

      for (const pm of plannedMeals || []) {
        const planId = pm.meal_plan_id as number;
        const meal = pm.meals as { name?: string | null } | null;

        const existing = plannedMealsByPlanId.get(planId) || [];
        existing.push({ meal_name: meal?.name ?? null });
        plannedMealsByPlanId.set(planId, existing);
      }
    }

    const totalCount = count ?? 0;

    const data = (plans || []).map((plan) => {
      const items = plannedMealsByPlanId.get(plan.id as number) || [];

      const sampleMeals: string[] = [];
      const seen = new Set<string>();

      for (const item of items) {
        const name = (item.meal_name || '').trim();
        if (!name) continue;
        if (seen.has(name)) continue;
        seen.add(name);
        sampleMeals.push(name);
        if (sampleMeals.length >= 3) break;
      }

      return {
        id: (plan.id as number).toString(),
        startDate: plan.start_date,
        endDate: plan.end_date,
        createdAt: plan.created_at,
        summary: {
          mealCount: items.length,
          sampleMeals,
        },
      };
    });

    const hasMore = offset + limit < totalCount;

    return NextResponse.json(
      {
        data,
        count: totalCount,
        hasMore,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/meal-plans/history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
