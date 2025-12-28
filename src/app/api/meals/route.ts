import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { PostgrestError } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: meals, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meals:', error);
      return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
    }

    const normalized = (meals || []).map((m) => {
      const mapped = {
        ...m,
        id: m.id?.toString?.() ?? String(m.id),
        tags: (m as { dietary_tags?: string[] | null }).dietary_tags ?? [],
        sourceUrl: (m as { source_url?: string | null }).source_url ?? undefined,
      } as Record<string, unknown>;

      delete (mapped as { dietary_tags?: unknown }).dietary_tags;
      delete (mapped as { source_url?: unknown }).source_url;

      return mapped;
    });

    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/meals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;

    const id = typeof body.id === 'string' ? body.id : undefined;
    const name = typeof body.name === 'string' ? body.name : '';
    const description = typeof body.description === 'string' ? body.description : undefined;

    const mealTypeRaw = body.meal_type;
    const meal_type = typeof mealTypeRaw === 'string' && mealTypeRaw ? mealTypeRaw : 'Dinner';

    const tags = Array.isArray(body.tags) ? (body.tags.filter((t) => typeof t === 'string') as string[]) : [];

    const ingredientsRaw = body.ingredients;
    const ingredients = Array.isArray(ingredientsRaw)
      ? JSON.stringify(ingredientsRaw)
      : typeof ingredientsRaw === 'string'
        ? ingredientsRaw
        : JSON.stringify([]);

    const instructions = typeof body.instructions === 'string' ? body.instructions : undefined;

    const sourceUrlRaw = body.sourceUrl;
    const source_url = typeof sourceUrlRaw === 'string' ? sourceUrlRaw : undefined;

    const image_url = typeof body.image_url === 'string' ? body.image_url : undefined;

    if (!name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const basePayload: Record<string, unknown> = {
      id: id ? (Number.isFinite(Number(id)) ? Number(id) : id) : undefined,
      user_id: user.id,
      name,
      meal_type,
      description,
      ingredients,
      instructions,
      image_url,
    };

    const payloadWithDietaryTags: Record<string, unknown> = {
      ...basePayload,
      dietary_tags: tags,
      source_url,
    };

    const payloadWithTagsSnake: Record<string, unknown> = {
      ...basePayload,
      tags,
      source_url,
    };

    const payloadWithTagsCamel: Record<string, unknown> = {
      ...basePayload,
      tags,
      sourceUrl: source_url,
    };

    const payloadMinimal: Record<string, unknown> = {
      ...basePayload,
      source_url,
    };

    let meal: unknown;
    let upsertError: PostgrestError | null = null;

    {
      const result = await supabase
        .from('meals')
        .upsert(payloadWithDietaryTags)
        .select('*')
        .single();
      meal = result.data;
      upsertError = result.error;
    }

    // Some environments still use older schema (e.g., tags/sourceUrl instead of dietary_tags/source_url).
    if (upsertError?.code === 'PGRST204') {
      const missingColumn = upsertError.message || '';
      // Primary mismatch we see in tests: dietary_tags doesn't exist.
      if (missingColumn.includes('dietary_tags')) {
        const retry = await supabase
          .from('meals')
          .upsert(payloadWithTagsSnake)
          .select('*')
          .single();
        meal = retry.data;
        upsertError = retry.error;
      }

      // If tags column also doesn't exist, retry with minimal payload (no tags).
      if (upsertError?.code === 'PGRST204' && (upsertError.message || '').includes('tags')) {
        const retry = await supabase
          .from('meals')
          .upsert(payloadMinimal)
          .select('*')
          .single();
        meal = retry.data;
        upsertError = retry.error;
      }

      // If snake_case source_url doesn't exist, fall back to camelCase sourceUrl.
      if (upsertError?.code === 'PGRST204' && (upsertError.message || '').includes('source_url')) {
        const retry = await supabase
          .from('meals')
          .upsert(payloadWithTagsCamel)
          .select('*')
          .single();
        meal = retry.data;
        upsertError = retry.error;
      }
    }

    if (upsertError) {
      console.error('Error saving meal:', upsertError);
      return NextResponse.json(
        { error: upsertError.message || 'Failed to save meal' },
        { status: 500 }
      );
    }

    const record = meal as Record<string, unknown>;
    return NextResponse.json(
      {
        ...record,
        id: (record as { id?: unknown }).id?.toString?.() ?? String((record as { id?: unknown }).id),
        tags:
          (record as { dietary_tags?: string[] | null }).dietary_tags ??
          (record as { tags?: string[] | null }).tags ??
          [],
        sourceUrl:
          (record as { source_url?: string | null }).source_url ??
          (record as { sourceUrl?: string | null }).sourceUrl ??
          undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/meals:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
