import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface SaveMealPlanRequest {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  meals: {
    [date: string]: {
      breakfast?: { id: string; name: string };
      lunch?: { id: string; name: string };
      dinner?: { id: string; name: string };
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SaveMealPlanRequest;
    const { startDate, endDate, meals } = body;

    // Validation
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: startDate and endDate' },
        { status: 400 },
      );
    }

    // Initialize Supabase client with user session
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    const plannedMeals: Array<{
      meal_id: string;
      planned_for_date: string;
      meal_type: string;
    }> = [];

    for (const [date, dayMeals] of Object.entries(meals)) {
      if (dayMeals.breakfast?.id) {
        plannedMeals.push({
          meal_id: dayMeals.breakfast.id,
          planned_for_date: date,
          meal_type: 'breakfast',
        });
      }
      if (dayMeals.lunch?.id) {
        plannedMeals.push({
          meal_id: dayMeals.lunch.id,
          planned_for_date: date,
          meal_type: 'lunch',
        });
      }
      if (dayMeals.dinner?.id) {
        plannedMeals.push({
          meal_id: dayMeals.dinner.id,
          planned_for_date: date,
          meal_type: 'dinner',
        });
      }
    }

    // Validate meal ownership before creating the plan
    const mealIds = plannedMeals
      .map(m => m.meal_id)
      .filter((id): id is string => Boolean(id));

    const uniqueMealIds = [...new Set(mealIds)];

    if (uniqueMealIds.length > 0) {
      const { data: ownedMeals, error: ownershipError } = await supabase
        .from('meals')
        .select('id')
        .eq('user_id', user.id)
        .in('id', uniqueMealIds);

      if (ownershipError) {
        console.error('Error validating meal ownership:', ownershipError);
        return NextResponse.json(
          { error: 'Failed to validate meal ownership' },
          { status: 500 },
        );
      }

      const ownedIds = new Set((ownedMeals || []).map(m => String(m.id)));
      const invalidIds = uniqueMealIds.filter(id => !ownedIds.has(id));

      if (invalidIds.length > 0) {
        return NextResponse.json(
          {
            error: 'Some meals do not belong to you',
            invalidMealIds: invalidIds,
          },
          { status: 403 },
        );
      }
    }

    // First check if tables exist
    const { data: _tables, error: tablesError } = await supabase
      .from('meal_plans')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.error('Table does not exist or is not accessible:', tablesError);
      return NextResponse.json(
        {
          error: `Database table issue: ${tablesError.message}. Please run 'supabase db push' to apply migrations.`,
        },
        { status: 500 },
      );
    }

    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        start_date: startDate,
        end_date: endDate,
      })
      .select()
      .single();

    if (planError) {
      console.error(
        'Error creating meal plan:',
        JSON.stringify(planError, null, 2),
      );
      console.error('Plan error details:', planError);
      return NextResponse.json(
        {
          error: `Failed to create meal plan: ${planError.message || planError.code || 'Unknown error'}`,
        },
        { status: 500 },
      );
    }

    // Insert all planned meals
    if (plannedMeals.length > 0) {
      const mealsWithPlanId = plannedMeals.map(meal => ({
        ...meal,
        meal_plan_id: mealPlan.id,
      }));

      const { error: mealsError } = await supabase
        .from('planned_meals')
        .insert(mealsWithPlanId);

      if (mealsError) {
        console.error(
          'Error inserting planned meals:',
          JSON.stringify(mealsError, null, 2),
        );
        // Try to clean up the meal plan if meals failed
        await supabase.from('meal_plans').delete().eq('id', mealPlan.id);
        return NextResponse.json(
          {
            error: `Failed to save meals: ${mealsError.message || mealsError.code || 'Unknown error'}`,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        message: 'Meal plan saved successfully',
        mealPlanId: mealPlan.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error in POST /api/meal-plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// GET endpoint to fetch latest meal plan
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    // Get the most recent meal plan
    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (planError) {
      if (planError.code === 'PGRST116') {
        // No meal plan found
        return NextResponse.json(null, { status: 200 });
      }
      console.error('Error fetching meal plan:', planError);
      return NextResponse.json(
        { error: 'Failed to fetch meal plan' },
        { status: 500 },
      );
    }

    if (!mealPlan) {
      return NextResponse.json(null, { status: 200 });
    }

    // Get planned meals for this plan
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
      `,
      )
      .eq('meal_plan_id', mealPlan.id);

    if (mealsError) {
      console.error('Error fetching planned meals:', mealsError);
      return NextResponse.json(
        { error: 'Failed to fetch planned meals' },
        { status: 500 },
      );
    }

    // Transform to frontend format
    const meals: Record<
      string,
      {
        breakfast?: {
          id: string;
          name: string;
          type: string;
          thumbnail?: string;
        };
        lunch?: { id: string; name: string; type: string; thumbnail?: string };
        dinner?: { id: string; name: string; type: string; thumbnail?: string };
      }
    > = {};

    for (const pm of plannedMeals || []) {
      const date = pm.planned_for_date;
      if (!meals[date]) {
        meals[date] = {};
      }

      const meal = pm.meals as {
        id: number;
        name: string;
        meal_type: string;
        image_url?: string;
      };
      meals[date][pm.meal_type as 'breakfast' | 'lunch' | 'dinner'] = {
        id: meal.id.toString(),
        name: meal.name,
        type: meal.meal_type,
        thumbnail: meal.image_url,
      };
    }

    return NextResponse.json(
      {
        id: mealPlan.id.toString(),
        startDate: mealPlan.start_date,
        endDate: mealPlan.end_date,
        weekStart: mealPlan.start_date,
        meals,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error in GET /api/meal-plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
