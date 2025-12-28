import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role client to bypass RLS for public access
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MealPlanShare {
  id: number;
  meal_plan_id: number;
  include_details: boolean;
  expires_at: string | null;
  created_at: string;
  meal_plans: {
    id: number;
    week_start_date: string;
    week_end_date: string;
    created_at: string;
  };
}

interface PlannedMeal {
  id: number;
  meal_date: string;
  meal_type: string;
  meals: {
    id: number;
    name: string;
    description: string | null;
    prep_time: number | null;
    cook_time: number | null;
    servings: number | null;
    ingredients?: any;
    instructions?: string | null;
    dietary_tags: string[] | null;
    created_at: string;
  };
}

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
          week_start_date,
          week_end_date,
          created_at
        )
      `)
      .eq('share_token', token)
      .single();

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    const typedShare = share as MealPlanShare;

    // Check if share has expired
    if (typedShare.expires_at && new Date(typedShare.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Share has expired' }, { status: 410 });
    }

    // Get planned meals for this meal plan
    const { data: plannedMeals, error: mealsError } = await supabaseServiceRole
      .from('planned_meals')
      .select(`
        id,
        meal_date,
        meal_type,
        meals!inner(
          id,
          name,
          description,
          prep_time,
          cook_time,
          servings,
          ${typedShare.include_details ? 'ingredients, instructions,' : ''}
          dietary_tags,
          created_at
        )
      `)
      .eq('meal_plan_id', typedShare.meal_plan_id)
      .order('meal_date')
      .order('meal_type');

    if (mealsError) {
      console.error('Error fetching planned meals:', mealsError);
      return NextResponse.json({ error: 'Failed to fetch meal plan data' }, { status: 500 });
    }

    const typedPlannedMeals = plannedMeals as PlannedMeal[];

    // Structure the response data (sanitized, no user PII)
    const mealPlan = {
      id: typedShare.meal_plans.id,
      weekStartDate: typedShare.meal_plans.week_start_date,
      weekEndDate: typedShare.meal_plans.week_end_date,
      createdAt: typedShare.meal_plans.created_at,
      sharedAt: typedShare.created_at,
      includeDetails: typedShare.include_details
    };

    // Group meals by date and type
    const mealsByDate: Record<string, Record<string, any>> = {};
    
    typedPlannedMeals.forEach(plannedMeal => {
      const dateKey = plannedMeal.meal_date;
      if (!mealsByDate[dateKey]) {
        mealsByDate[dateKey] = {};
      }
      
      const meal = {
        id: plannedMeal.meals.id,
        name: plannedMeal.meals.name,
        description: plannedMeal.meals.description,
        prepTime: plannedMeal.meals.prep_time,
        cookTime: plannedMeal.meals.cook_time,
        servings: plannedMeal.meals.servings,
        dietaryTags: plannedMeal.meals.dietary_tags,
        ...(typedShare.include_details && {
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