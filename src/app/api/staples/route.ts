import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type Staple } from "@/lib/data/default-staples";

/**
 * GET /api/staples - Fetch user's pantry staples
 */
export async function GET() {
  const requestId =
    (globalThis.crypto as Crypto | undefined)?.randomUUID?.() ??
    `req-${Date.now()}`;

  try {
    const supabase = await createSupabaseServerClient();

    // Auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's staples
    const { data: staples, error: staplesError } = await supabase
      .from("user_staples")
      .select("id, ingredient_text, category, created_at")
      .eq("user_id", user.id)
      .order("ingredient_text", { ascending: true });

    if (staplesError) {
      console.error(`[${requestId}] Error fetching staples:`, staplesError);
      return NextResponse.json(
        { error: "Failed to fetch staples", requestId },
        { status: 500 }
      );
    }

    // If no staples found, return empty array (frontend will use defaults)
    if (!staples || staples.length === 0) {
      return NextResponse.json({ staples: [], count: 0 }, { status: 200 });
    }

    // Transform to Staple format
    const formattedStaples: Staple[] = staples.map((s) => ({
      id: `db-${s.id}`,
      name: s.ingredient_text,
      category: s.category || "other",
    }));

    return NextResponse.json(
      { staples: formattedStaples, count: formattedStaples.length },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[${requestId}] Unexpected error in GET /api/staples:`, error);
    return NextResponse.json(
      { error: "Internal Server Error", requestId },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staples - Save user's pantry staples (replaces all existing)
 */
export async function POST(req: NextRequest) {
  const requestId =
    (globalThis.crypto as Crypto | undefined)?.randomUUID?.() ??
    `req-${Date.now()}`;

  try {
    const supabase = await createSupabaseServerClient();

    // Auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { staples } = body as { staples: Staple[] };

    if (!Array.isArray(staples)) {
      return NextResponse.json(
        { error: "Invalid request: staples must be an array" },
        { status: 400 }
      );
    }

    // Validate staples
    const validatedStaples = staples.filter(
      (s) =>
        s &&
        typeof s.name === "string" &&
        s.name.trim().length > 0 &&
        typeof s.category === "string"
    );

    // Delete existing staples for user
    const { error: deleteError } = await supabase
      .from("user_staples")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error(`[${requestId}] Error deleting existing staples:`, deleteError);
      return NextResponse.json(
        { error: "Failed to update staples", requestId },
        { status: 500 }
      );
    }

    // Insert new staples if any
    if (validatedStaples.length > 0) {
      const insertData = validatedStaples.map((s) => ({
        user_id: user.id,
        ingredient_text: s.name.toLowerCase().trim(),
        category: s.category,
      }));

      const { error: insertError } = await supabase
        .from("user_staples")
        .insert(insertData);

      if (insertError) {
        console.error(`[${requestId}] Error inserting staples:`, insertError);
        return NextResponse.json(
          { error: "Failed to save staples", requestId },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: true, count: validatedStaples.length },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[${requestId}] Unexpected error in POST /api/staples:`, error);
    return NextResponse.json(
      { error: "Internal Server Error", requestId },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/staples - Delete a specific staple by ingredient text
 */
export async function DELETE(req: NextRequest) {
  const requestId =
    (globalThis.crypto as Crypto | undefined)?.randomUUID?.() ??
    `req-${Date.now()}`;

  try {
    const supabase = await createSupabaseServerClient();

    // Auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get ingredient from query params
    const url = new URL(req.url);
    const ingredient = url.searchParams.get("ingredient");

    if (!ingredient) {
      return NextResponse.json(
        { error: "Missing ingredient parameter" },
        { status: 400 }
      );
    }

    // Delete the staple
    const { error: deleteError, count } = await supabase
      .from("user_staples")
      .delete()
      .eq("user_id", user.id)
      .eq("ingredient_text", ingredient.toLowerCase().trim());

    if (deleteError) {
      console.error(`[${requestId}] Error deleting staple:`, deleteError);
      return NextResponse.json(
        { error: "Failed to delete staple", requestId },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, deleted: count || 0 },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[${requestId}] Unexpected error in DELETE /api/staples:`, error);
    return NextResponse.json(
      { error: "Internal Server Error", requestId },
      { status: 500 }
    );
  }
}
