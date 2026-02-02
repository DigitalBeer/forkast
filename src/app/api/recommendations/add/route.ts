import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface AddMealRequest {
  name: string;
  imageUrl?: string;
  mealType?: string;
}

export async function POST(req: NextRequest) {
  console.log("--- [LOG] /api/recommendations/add endpoint hit ---");

  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log("[LOG] No authenticated user");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AddMealRequest = await req.json();
    const { name, imageUrl, mealType } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Check if user already has a meal with this name
    const { data: existingMeal } = await supabase
      .from('meals')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', name)
      .maybeSingle();

    if (existingMeal) {
      console.log(`[LOG] User already has meal: ${name}`);
      return NextResponse.json({ error: 'You already have this meal in your repertoire' }, { status: 409 });
    }

    // Insert new meal
    const { data: newMeal, error: insertError } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        name,
        image_url: imageUrl || null,
        meal_type: mealType || 'Dinner',
        description: 'Added from recommendations',
        dietary_tags: [],
      })
      .select('id, name, image_url, meal_type')
      .single();

    if (insertError) {
      console.error("[ERROR] Failed to add meal:", insertError);
      return NextResponse.json({ error: 'Failed to add meal' }, { status: 500 });
    }

    console.log(`[LOG] Added meal from recommendation: ${name} (id: ${newMeal.id})`);
    return NextResponse.json({ 
      success: true, 
      meal: newMeal 
    }, { status: 201 });

  } catch (error) {
    console.error("[ERROR] in /api/recommendations/add:", error);
    return NextResponse.json({ error: 'Error adding meal' }, { status: 500 });
  }
}
