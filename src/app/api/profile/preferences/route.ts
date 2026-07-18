import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const requestId =
    (globalThis.crypto as Crypto | undefined)?.randomUUID?.() ??
    `req-${Date.now()}`;

  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { session },
      error: userError,
    } = await supabase.auth.getSession();
    if (userError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("dietary_preferences, disliked_ingredients, meal_type_preferences, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(`[${requestId}] Error fetching profile:`, profileError);
      return NextResponse.json(
        { error: "Failed to fetch preferences", requestId },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        dietaryPreferences: profile?.dietary_preferences || [],
        dislikedIngredients: profile?.disliked_ingredients || [],
        mealTypePreferences: profile?.meal_type_preferences || {},
        onboardingCompleted: profile?.onboarding_completed || false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[${requestId}] Unexpected error in GET /api/preferences:`, error);
    return NextResponse.json(
      { error: "Internal Server Error", requestId },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const requestId =
    (globalThis.crypto as Crypto | undefined)?.randomUUID?.() ??
    `req-${Date.now()}`;

  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { session },
      error: userError,
    } = await supabase.auth.getSession();
    if (userError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    const body = await req.json();
    const {
      dietaryPreferences = [],
      dislikedIngredients = [],
      mealTypePreferences = {},
      onboardingCompleted = false,
    } = body;

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        dietary_preferences: dietaryPreferences,
        disliked_ingredients: dislikedIngredients,
        meal_type_preferences: mealTypePreferences,
        onboarding_completed: onboardingCompleted,
      });

    if (upsertError) {
      console.error(`[${requestId}] Error updating preferences:`, upsertError);
      return NextResponse.json(
        { error: "Failed to update preferences", requestId },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`[${requestId}] Unexpected error in PUT /api/preferences:`, error);
    return NextResponse.json(
      { error: "Internal Server Error", requestId },
      { status: 500 }
    );
  }
}