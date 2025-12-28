import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const planId = Number.parseInt(id, 10);

    if (!Number.isFinite(planId)) {
      return NextResponse.json({ error: 'Invalid meal plan id' }, { status: 400 });
    }

    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();

    if (planError) {
      if (planError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      console.error('Error fetching meal plan:', planError);
      return NextResponse.json({ error: 'Failed to fetch meal plan' }, { status: 500 });
    }

    const { data: plannedMeals, error: mealsError } = await supabase
      .from('planned_meals')
      .select(
        `
        *,
        meals:meal_id (
          id,
          name,
          meal_type,
          image_url
        )
      `
      )
      .eq('meal_plan_id', planId);

    if (mealsError) {
      console.error('Error fetching planned meals:', mealsError);
      return NextResponse.json({ error: 'Failed to fetch planned meals' }, { status: 500 });
    }

    const meals: Record<
      string,
      {
        breakfast?: { id: string; name: string; type: string; thumbnail?: string };
        lunch?: { id: string; name: string; type: string; thumbnail?: string };
        dinner?: { id: string; name: string; type: string; thumbnail?: string };
      }
    > = {};

    for (const pm of plannedMeals || []) {
      const date = pm.planned_for_date as string;
      if (!meals[date]) {
        meals[date] = {};
      }

      const meal = pm.meals as { id: number; name: string; meal_type: string; image_url?: string };
      meals[date][pm.meal_type as 'breakfast' | 'lunch' | 'dinner'] = {
        id: meal.id.toString(),
        name: meal.name,
        type: meal.meal_type,
        thumbnail: meal.image_url,
      };
    }

    return NextResponse.json(
      {
        id: (mealPlan.id as number).toString(),
        startDate: mealPlan.start_date,
        endDate: mealPlan.end_date,
        weekStart: mealPlan.start_date,
        meals,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/meal-plans/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const planId = Number.parseInt(id, 10);

    if (!Number.isFinite(planId)) {
      return NextResponse.json({ error: 'Invalid meal plan id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Error deleting meal plan:', error);
      return NextResponse.json({ error: 'Failed to delete meal plan' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/meal-plans/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
