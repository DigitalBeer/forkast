import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { format, addDays, startOfWeek } from 'date-fns';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const today = new Date();
    const weekStart = format(
      startOfWeek(today, { weekStartsOn: 1 }),
      'yyyy-MM-dd',
    );
    const weekEnd = format(addDays(new Date(weekStart), 6), 'yyyy-MM-dd');

    // Fetch user's meals
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('id, name, meal_type, image_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (mealsError) {
      console.error('Error fetching meals for seed:', mealsError);
      return NextResponse.json(
        { error: 'Failed to fetch meals' },
        { status: 500 },
      );
    }

    // Group by meal type
    const byType: Record<string, typeof meals> = {};
    for (const meal of meals || []) {
      const type = (meal.meal_type || 'Dinner').toLowerCase();
      if (!byType[type]) byType[type] = [];
      byType[type].push(meal);
    }

    // Build plan: one per day for 7 days
    const planMeals: Record<
      string,
      Partial<Record<string, { id: string; name: string }>>
    > = {};
    const days = Array.from({ length: 7 }, (_, i) =>
      format(addDays(new Date(weekStart), i), 'yyyy-MM-dd'),
    );
    const mealTypes = ['breakfast', 'lunch', 'dinner'];

    for (let i = 0; i < days.length; i++) {
      const date = days[i];
      planMeals[date] = {};
      for (const type of mealTypes) {
        const pool = byType[type] || [];
        if (pool.length > 0) {
          const meal = pool[i % pool.length];
          planMeals[date][type] = {
            id: meal.id.toString(),
            name: meal.name,
          };
        }
      }
    }

    // Insert plan
    const { data: plan, error: planError } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        start_date: weekStart,
        end_date: weekEnd,
      })
      .select()
      .single();

    if (planError || !plan) {
      console.error('Error creating seed plan:', planError);
      return NextResponse.json(
        { error: 'Failed to create plan' },
        { status: 500 },
      );
    }

    // Insert planned_meals
    const plannedMeals: Array<{
      meal_plan_id: number;
      meal_id: string;
      planned_for_date: string;
      meal_type: string;
    }> = [];

    for (const [date, dayMeals] of Object.entries(planMeals)) {
      for (const [mealType, meal] of Object.entries(dayMeals || {})) {
        if (meal) {
          plannedMeals.push({
            meal_plan_id: plan.id as number,
            meal_id: meal.id,
            planned_for_date: date,
            meal_type: mealType,
          });
        }
      }
    }

    if (plannedMeals.length > 0) {
      const { error: insertError } = await supabase
        .from('planned_meals')
        .insert(plannedMeals);

      if (insertError) {
        console.error('Failed to insert planned meals:', insertError);
        // Best-effort: don't fail the whole request
      }
    }

    return NextResponse.json(
      { success: true, planId: plan.id },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error in POST /api/meal-plans/seed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
