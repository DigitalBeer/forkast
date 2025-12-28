import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getRecommendations } from '@/lib/recommendations/engine';
import type { Meal } from '@/types/meal';

export async function GET(req: NextRequest) {
  console.log("--- [LOG] /api/recommendations endpoint hit ---");

  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log("[LOG] No authenticated user, returning empty recommendations");
      return NextResponse.json([], { status: 200 });
    }

    // Get limit from query params (default 5)
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // Fetch all user's meals
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id);

    if (mealsError) {
      console.error("[ERROR] Failed to fetch meals:", mealsError);
      return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
    }

    if (!meals || meals.length === 0) {
      console.log("[LOG] No meals found for user, returning empty recommendations");
      return NextResponse.json([], { status: 200 });
    }

    // Fetch user's meal history
    const { data: history, error: historyError } = await supabase
      .from('meal_history')
      .select('meal_id, action_date')
      .eq('user_id', user.id)
      .order('action_date', { ascending: false });

    if (historyError) {
      console.error("[ERROR] Failed to fetch meal history:", historyError);
      // Continue without history - recommendations will still work
    }

    // Transform history to the format expected by the engine
    const userHistory = (history || []).map(h => ({
      meal_id: h.meal_id.toString(),
      last_eaten: h.action_date,
    }));

    // Transform meals to match the Meal type
    const transformedMeals: Meal[] = meals.map(m => ({
      id: m.id.toString(),
      name: m.name,
      meal_type: m.meal_type,
      image_url: m.image_url || undefined,
      tags: m.dietary_tags || [],
      last_prepared: undefined, // Will be calculated from history
    }));

    // Generate recommendations
    const recommendations = getRecommendations(
      user,
      transformedMeals,
      userHistory,
      { limit }
    );

    console.log(`[LOG] Returning ${recommendations.length} recommendations`);
    return NextResponse.json(recommendations, { status: 200 });

  } catch (error) {
    console.error("[ERROR] in /api/recommendations:", error);
    return NextResponse.json({ error: 'Error fetching recommendations' }, { status: 500 });
  }
}
