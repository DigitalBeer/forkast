import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  createClient,
  SupabaseClient,
} from 'https://esm.sh/@supabase/supabase-js@2';

interface FilterRequest {
  startDate?: string; // ISO date string
  days?: number; // Number of days to plan for
  filters?: {
    mealTypes?: string[]; // e.g., ["breakfast", "lunch", "dinner"]
    dietaryTypes?: string[]; // e.g., ["vegetarian", "gluten-free"]
  };
}

interface MealSuggestionResponse {
  date: string; // ISO date string
  mealType: string; // e.g., "breakfast", "lunch", "dinner"
  meal: {
    id: string;
    name: string;
    image_url?: string;
    tags: string[];
    meal_type?: string;
    last_prepared?: string | null;
  };
  reason?: string; // Optional explanation for the suggestion
}

type LastPreparedMap = Record<number, string>;
type PreferenceScoreMap = Record<number, number>;

// Stable stringify to ensure consistent cache key payloads
function stableStringify(value: unknown): string {
  const sortObject = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sortObject);
    if (v && typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      const sortedKeys = Object.keys(obj).sort();
      const out: Record<string, unknown> = {};
      for (const k of sortedKeys) out[k] = sortObject(obj[k]);
      return out;
    }
    return v;
  };
  return JSON.stringify(sortObject(value));
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function buildCacheKey(
  userId: string | null,
  variant: 'legacy' | 'filtered',
  payload: Record<string, unknown>,
): Promise<string> {
  const version = 'v1';
  const keyObj = { version, user: userId ?? 'anon', variant, payload };
  const serialized = stableStringify(keyObj);
  return sha256Hex(serialized);
}

async function tryGetCacheJson(
  supabase: SupabaseClient | null,
  userId: string | null,
  key: string,
): Promise<unknown | null> {
  try {
    if (!supabase) return null;
    const uid = userId ?? 'anon';
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('suggestions_cache')
      .select('response')
      .eq('user_id', uid)
      .eq('key', key)
      .gte('expires_at', nowIso)
      .maybeSingle();
    if (error) return null;
    return (data as { response: unknown } | null)?.response ?? null;
  } catch {
    return null;
  }
}

async function trySetCacheJson(
  supabase: SupabaseClient | null,
  userId: string | null,
  key: string,
  payload: unknown,
  ttlSec: number,
): Promise<void> {
  try {
    if (!supabase) return;
    const uid = userId ?? 'anon';
    const expires_at = new Date(Date.now() + ttlSec * 1000).toISOString();
    await supabase
      .from('suggestions_cache')
      .upsert({ user_id: uid, key, response: payload, expires_at })
      .select();
  } catch {
    // ignore cache write errors
  }
}

async function getSupabase(req: Request): Promise<SupabaseClient | null> {
  const url =
    Deno.env.get('SUPABASE_URL') ||
    Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ||
    '';
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anon =
    Deno.env.get('SUPABASE_ANON_KEY') ||
    Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    '';

  if (!url) {
    console.error('[ERROR] Missing SUPABASE_URL');
    return null;
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  console.log(
    `[DEBUG] Auth header present: ${!!authHeader}, length: ${authHeader.length}`,
  );

  // Use service role key if available (bypasses RLS); always forward the caller's JWT
  // so auth.getUser(token) can verify the requesting user's identity.
  if (serviceRole) {
    console.log('[DEBUG] Using service role key for database access');
    return createClient(url, serviceRole, {
      global: { fetch, headers: { Authorization: authHeader } },
    });
  }

  if (!anon) {
    console.error('[ERROR] Missing SUPABASE_ANON_KEY');
    return null;
  }

  return createClient(url, anon, {
    global: { fetch, headers: { Authorization: authHeader } },
  });
}

async function fetchLastPreparedMap(
  supabase: SupabaseClient | null,
  mealIds: number[],
): Promise<LastPreparedMap> {
  const map: LastPreparedMap = {};
  if (!supabase || mealIds.length === 0) return map;

  // First try to get last_prepared from the meals table (most reliable)
  const { data: mealData, error: mealError } = await supabase
    .from('meals')
    .select('id, last_prepared')
    .in('id', mealIds);

  if (!mealError && mealData) {
    for (const meal of mealData as Array<{
      id: number;
      last_prepared: string | null;
    }>) {
      if (meal.last_prepared) {
        map[meal.id] = meal.last_prepared;
      }
    }
  }

  // For meals without last_prepared in the meals table, check meal_history
  const missingIds = mealIds.filter(id => !map[id]);
  if (missingIds.length > 0) {
    const { data, error } = await supabase
      .from('meal_history')
      .select('meal_id, action_date')
      .in('meal_id', missingIds)
      .order('action_date', { ascending: false });
    if (error) {
      console.error('Failed to fetch meal history:', error);
      return map;
    }
    for (const row of data as Array<{ meal_id: number; action_date: string }>) {
      if (map[row.meal_id] === undefined) {
        map[row.meal_id] = row.action_date;
      }
    }
  }

  return map;
}

async function fetchPreferenceScoreMap(
  supabase: SupabaseClient | null,
  mealIds: number[],
  daysLookback = 90,
): Promise<PreferenceScoreMap> {
  const map: PreferenceScoreMap = {};
  if (!supabase || mealIds.length === 0) return map;
  const since = new Date();
  since.setDate(since.getDate() - daysLookback);
  const { data, error } = await supabase
    .from('meal_history')
    .select('meal_id, action_type, action_date')
    .in('meal_id', mealIds)
    .gte('action_date', since.toISOString());
  if (error) {
    console.error('Failed to fetch preference signals:', error);
    return map;
  }
  for (const row of data as Array<{ meal_id: number; action_type: string }>) {
    const weight =
      row.action_type === 'cooked'
        ? 2
        : row.action_type === 'planned'
          ? 1
          : row.action_type === 'skipped'
            ? -1
            : 0;
    map[row.meal_id] = (map[row.meal_id] ?? 0) + weight;
  }
  return map;
}

serve(async req => {
  console.log('[VERSION] 2024-12-12-v3 - Fixed meal type selection');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody: FilterRequest & { skipCache?: boolean } = await req
      .json()
      .catch(() => ({}) as FilterRequest);
    const supabase = await getSupabase(req);

    // Authenticate user upfront — required for data isolation.
    // Extract the JWT and pass it explicitly so auth.getUser works with both
    // service-role clients (which have no implicit session) and anon clients.
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    let userId: string | null = null;
    try {
      if (supabase) {
        const { data: userData, error: authError } = token
          ? await supabase.auth.getUser(token)
          : await supabase.auth.getUser();
        if (authError || !userData?.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          });
        }
        userId = userData.user.id;
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const ttlSec = Number(Deno.env.get('SUGGESTIONS_CACHE_TTL_SEC') || '900');

    // Check if this is a legacy request (no filter fields provided)
    const isLegacyRequest =
      !requestBody.startDate && !requestBody.days && !requestBody.filters;
    const skipCache = Boolean(requestBody.skipCache);

    if (isLegacyRequest) {
      // Cache lookup (legacy)
      const legacyKey = await buildCacheKey(userId, 'legacy', {});
      if (!skipCache) {
        const cached = await tryGetCacheJson(supabase, userId, legacyKey);
        if (cached) {
          return new Response(JSON.stringify(cached), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
      }
      // Fetch real meals from database for legacy path
      let legacyMeals: Array<{
        id: string;
        name: string;
        image_url: string;
        last_prepared: string | null;
      }> = [];
      {
        const { data, error } = await supabase
          .from('meals')
          .select('id, name, image_url')
          .eq('user_id', userId);

        if (!error && data) {
          legacyMeals = data.map(
            (m: { id: number; name: string; image_url: string | null }) => ({
              id: m.id.toString(),
              name: m.name,
              image_url: m.image_url || '',
              last_prepared: null as string | null,
            }),
          );
          console.log(
            `[DEBUG] Legacy path: Fetched ${legacyMeals.length} meals from database`,
          );
        } else if (error) {
          console.error('[ERROR] Legacy path: Failed to fetch meals:', error);
        }
      }

      // Use only real meals from database (no fallback)
      const suggestions = legacyMeals;

      // LRU prioritization using meal_history: compute last_prepared per meal and sort ascending (least recently used first).
      const ids = suggestions
        .map(s => Number(s.id))
        .filter(n => Number.isFinite(n));
      const lastMap = await fetchLastPreparedMap(supabase, ids);
      const prefMap = await fetchPreferenceScoreMap(supabase, ids);
      const enriched = suggestions
        .map(s => ({
          ...s,
          last_prepared: lastMap[Number(s.id)] ?? null,
        }))
        .sort((a, b) => {
          const aKey = a.last_prepared
            ? new Date(a.last_prepared).getTime()
            : 0;
          const bKey = b.last_prepared
            ? new Date(b.last_prepared).getTime()
            : 0;
          if (aKey !== bKey) {
            return aKey - bKey; // least-recently-used first; never-used first
          }
          // Secondary: user preference score (higher is better)
          const aPref = prefMap[Number(a.id)] ?? 0;
          const bPref = prefMap[Number(b.id)] ?? 0;
          return bPref - aPref;
        });

      // Cache write (legacy)
      if (!skipCache) {
        await trySetCacheJson(supabase, userId, legacyKey, enriched, ttlSec);
      }

      return new Response(JSON.stringify(enriched), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Handle filtered requests
    const startDate =
      requestBody.startDate || new Date().toISOString().split('T')[0];
    const days = requestBody.days || 7;
    const mealTypes = requestBody.filters?.mealTypes || [];
    const dietaryTypes = requestBody.filters?.dietaryTypes || [];
    const filterByMealType = mealTypes.length > 0;

    // Fetch real meals from database
    let dbMeals: Array<{
      id: number;
      name: string;
      image_url: string | null;
      tags: string[] | null;
      meal_type: string | null;
      last_prepared: string | null;
    }> = [];
    {
      const { data, error } = await supabase
        .from('meals')
        .select('id, name, image_url, tags, meal_type, last_prepared')
        .eq('user_id', userId);

      if (!error && data) {
        dbMeals = data as Array<{
          id: number;
          name: string;
          image_url: string | null;
          tags: string[] | null;
          meal_type: string | null;
          last_prepared: string | null;
        }>;
        console.log(`[DEBUG] Fetched ${dbMeals.length} meals from database`);
      } else if (error) {
        console.error('[ERROR] Failed to fetch meals from database:', error);
      }
    }

    // Transform DB meals to expected format
    const allMeals = dbMeals.map(m => ({
      id: m.id.toString(),
      name: m.name,
      image_url: m.image_url || '',
      tags: m.tags || [],
      meal_type: m.meal_type,
      last_prepared: m.last_prepared,
    }));

    // Use only real meals from database (no fallback)
    const mealsToUse = allMeals;

    // Filter meals based on meal type and dietary restrictions
    console.log('[DEBUG] Filtering meals. Available meal types:', [
      ...new Set(allMeals.map(m => m.meal_type)),
    ]);
    console.log('[DEBUG] Requested meal types:', mealTypes);
    const filteredMeals = mealsToUse.filter(meal => {
      // Filter by meal type only when an explicit filter was provided
      if (filterByMealType) {
        const mealTypeLower = meal.meal_type?.toLowerCase();
        const matchesMealType = mealTypes.some(
          type => type.toLowerCase() === mealTypeLower,
        );
        if (!matchesMealType) return false;
      }

      // Filter by dietary restrictions (case-insensitive)
      if (dietaryTypes.length === 0) return true;
      return dietaryTypes.some(dietType =>
        meal.tags.some(tag => tag.toLowerCase() === dietType.toLowerCase()),
      );
    });
    console.log('[DEBUG] Filtered to', filteredMeals.length, 'meals');

    if (filteredMeals.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Generate suggestions for the requested date range and meal types
    const suggestions: MealSuggestionResponse[] = [];

    // LRU prioritization: sort candidate meals by last_prepared ascending (null first)
    // Cache lookup (filtered)
    const cachePayload = {
      startDate,
      days,
      mealTypes, // preserve order in key for deterministic outputs by requested order
      dietaryTypes: [...dietaryTypes].sort(), // order-agnostic for dietary filters
    } as const;
    const filteredKey = await buildCacheKey(
      userId,
      'filtered',
      cachePayload as unknown as Record<string, unknown>,
    );
    if (!skipCache) {
      const cached = await tryGetCacheJson(supabase, userId, filteredKey);
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }
    const candidateIds = filteredMeals
      .map(m => Number(m.id))
      .filter(n => Number.isFinite(n));
    const prefMap = await fetchPreferenceScoreMap(supabase, candidateIds);
    const sortedMeals = [...filteredMeals].sort((a, b) => {
      const aKey = a.last_prepared ? new Date(a.last_prepared).getTime() : 0;
      const bKey = b.last_prepared ? new Date(b.last_prepared).getTime() : 0;
      if (aKey !== bKey) {
        return aKey - bKey; // least-recently-used first
      }
      // Secondary: preference score (higher preferred)
      const aPref = prefMap[Number(a.id)] ?? 0;
      const bPref = prefMap[Number(b.id)] ?? 0;
      return bPref - aPref;
    });

    // Return all sorted meals as suggestions (not a weekly plan)
    for (const meal of sortedMeals) {
      suggestions.push({
        date: startDate, // Use requested start date for all
        mealType: meal.meal_type || 'unknown',
        meal: {
          id: meal.id,
          name: meal.name,
          image_url: meal.image_url,
          tags: meal.tags,
          meal_type: meal.meal_type || undefined, // Convert null to undefined
          last_prepared: meal.last_prepared || undefined, // Convert null to undefined
        },
        reason:
          dietaryTypes.length > 0
            ? `Matches your ${dietaryTypes.join(', ')} preferences`
            : 'Recommended based on variety',
      });
    }

    // Cache write (filtered)
    if (!skipCache) {
      await trySetCacheJson(supabase, userId, filteredKey, suggestions, ttlSec);
    }

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
