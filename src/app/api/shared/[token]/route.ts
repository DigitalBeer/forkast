import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role client to bypass RLS for public access
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.EDGE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find the share record by token
    const { data: share, error: shareError } = await supabaseServiceRole
      .from('meal_plan_shares')
      .select(`
        id,
        meal_plan_id,
        include_details,
        expires_at,
        created_at,
        meal_plans!inner(
          id,
          start_date,
          end_date,
          created_at
        )
      `)
      .eq('share_token', token)
      .single();

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check if share has expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Share has expired' }, { status: 410 });
    }

    // Get planned meals for this meal plan
    const { data: plannedMeals, error: mealsError } = await supabaseServiceRole
      .from('planned_meals')
      .select(`
        id,
        planned_for_date,
        meal_type,
        meals!inner(
          id,
          name,
          description,
          ${share.include_details ? 'ingredients, instructions,' : ''}
          tags,
          created_at
        )
      `)
      .eq('meal_plan_id', share.meal_plan_id)
      .order('planned_for_date')
      .order('meal_type');

    if (mealsError) {
      console.error('Error fetching planned meals:', mealsError);
      return NextResponse.json({ error: 'Failed to fetch meal plan data' }, { status: 500 });
    }

    // Structure the response data (sanitized, no user PII)
    const mealPlanData = Array.isArray(share.meal_plans) ? share.meal_plans[0] : share.meal_plans;
    const mealPlan = {
      id: mealPlanData.id,
      weekStartDate: mealPlanData.start_date,
      weekEndDate: mealPlanData.end_date,
      createdAt: mealPlanData.created_at,
      sharedAt: share.created_at,
      includeDetails: share.include_details
    };

    // Group meals by date and type
    const mealsByDate: Record<string, Record<string, any>> = {};
    
    plannedMeals.forEach((plannedMeal: any) => {
      const dateKey = plannedMeal.planned_for_date;
      if (!mealsByDate[dateKey]) {
        mealsByDate[dateKey] = {};
      }
      
      const meal = {
        id: plannedMeal.meals.id,
        name: plannedMeal.meals.name,
        description: plannedMeal.meals.description,
        tags: plannedMeal.meals.tags,
        ...(share.include_details && {
          ingredients: plannedMeal.meals.ingredients,
          instructions: plannedMeal.meals.instructions
        })
      };
      
      mealsByDate[dateKey][plannedMeal.meal_type] = meal;
    });

    return NextResponse.json({
      mealPlan,
      meals: mealsByDate
    });

  } catch (error) {
    console.error('Error in shared meal plan fetch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}