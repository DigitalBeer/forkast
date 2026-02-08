import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    const { id } = params;
    const sourcePlanId = Number.parseInt(id, 10);

    if (!Number.isFinite(sourcePlanId)) {
      return NextResponse.json({ error: 'Invalid meal plan id' }, { status: 400 });
    }

    const { data: sourcePlan, error: sourcePlanError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', sourcePlanId)
      .eq('user_id', user.id)
      .single();

    if (sourcePlanError) {
      if (sourcePlanError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      console.error('Error fetching source meal plan:', sourcePlanError);
      return NextResponse.json({ error: 'Failed to fetch meal plan' }, { status: 500 });
    }

    const { data: sourcePlannedMeals, error: sourceMealsError } = await supabase
      .from('planned_meals')
      .select('meal_id, planned_for_date, meal_type')
      .eq('meal_plan_id', sourcePlanId);

    if (sourceMealsError) {
      console.error('Error fetching source planned meals:', sourceMealsError);
      return NextResponse.json({ error: 'Failed to fetch planned meals' }, { status: 500 });
    }

    const { data: newPlan, error: newPlanError } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        start_date: sourcePlan.start_date,
        end_date: sourcePlan.end_date,
      })
      .select()
      .single();

    if (newPlanError) {
      console.error('Error creating duplicated meal plan:', newPlanError);
      return NextResponse.json({ error: 'Failed to duplicate meal plan' }, { status: 500 });
    }

    const mealsToInsert = (sourcePlannedMeals || []).map((pm) => ({
      meal_plan_id: newPlan.id,
      meal_id: pm.meal_id,
      planned_for_date: pm.planned_for_date,
      meal_type: pm.meal_type,
    }));

    if (mealsToInsert.length > 0) {
      const { error: insertMealsError } = await supabase
        .from('planned_meals')
        .insert(mealsToInsert);

      if (insertMealsError) {
        console.error('Error inserting duplicated planned meals:', insertMealsError);
        await supabase.from('meal_plans').delete().eq('id', newPlan.id);
        return NextResponse.json({ error: 'Failed to duplicate meal plan' }, { status: 500 });
      }
    }

    return NextResponse.json(
      { mealPlanId: (newPlan.id as number).toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/meal-plans/[id]/duplicate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
