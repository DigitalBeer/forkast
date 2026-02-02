import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RecommendedMeal {
  id: string;
  name: string;
  imageUrl?: string;
  reason: string;
  score: number;
  sourceUserCount: number;
}

interface SimilarityResult {
  userId: string;
  similarity: number;
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { fetch, headers: { Authorization: req.headers.get('Authorization') ?? '' } }
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const adminClient = createClient(supabaseUrl, serviceRoleKey, { global: { fetch } });

    // Step 1: Get current user's meals
    const { data: currentMeals } = await adminClient.from('meals').select('name').eq('user_id', user.id);
    if (!currentMeals || currentMeals.length === 0) {
      return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Keep both original names (for DB queries) and lowercase (for comparison)
    const currentMealNamesOriginal = currentMeals.map(m => m.name);
    const currentMealNames = new Set(currentMeals.map(m => m.name.toLowerCase()));

    // Step 2: OPTIMIZATION - Find users who share at least one meal
    // FIX: Use original case for database query (case-sensitive match)
    const { data: sharingUsers } = await adminClient
      .from('meals')
      .select('user_id')
      .in('name', currentMealNamesOriginal)
      .neq('user_id', user.id);

    if (!sharingUsers || sharingUsers.length === 0) {
      return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const candidateUserIds = Array.from(new Set(sharingUsers.map(u => u.user_id)));

    // Step 3: Fetch candidate users' full inventories (only for those who share)
    // AND Check privacy (if users opted out - assuming 'public_recommendations' column in profiles)
    const { data: candidateMeals } = await adminClient
      .from('meals')
      .select('user_id, name, image_url')
      .in('user_id', candidateUserIds);

    if (!candidateMeals) return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Grouping for similarity calculation
    const userMealsMap = new Map<string, Set<string>>();
    const userObjectMap = new Map<string, Array<{name: string, image_url?: string}>>();

    candidateMeals.forEach(m => {
      if (!userMealsMap.has(m.user_id)) {
        userMealsMap.set(m.user_id, new Set());
        userObjectMap.set(m.user_id, []);
      }
      userMealsMap.get(m.user_id)!.add(m.name.toLowerCase());
      userObjectMap.get(m.user_id)!.push({ name: m.name, image_url: m.image_url });
    });

    // Step 4: Similarity calculation
    const similarities: Array<{userId: string, similarity: number}> = [];
    userMealsMap.forEach((mealNames, userId) => {
      const sim = calculateJaccardSimilarity(currentMealNames, mealNames);
      if (sim > 0) similarities.push({ userId, similarity: sim });
    });

    similarities.sort((a, b) => b.similarity - a.similarity);
    const topUsers = similarities.slice(0, 10); // Take top 10 similar users for better recommendations

    // Step 5: Recommendation scoring
    const mealScores = new Map<string, { name: string, imageUrl?: string, score: number, sourceCount: number, common: string[] }>();
    
    // FIX: Add error handling for dismissals query
    const { data: dismissals, error: dismissalsError } = await adminClient
      .from('recommendation_dismissals')
      .select('meal_name')
      .eq('user_id', user.id)
      .gte('expires_at', new Date().toISOString());
    
    if (dismissalsError) {
      console.error('[WARN] Failed to fetch dismissals, continuing without filtering:', dismissalsError);
    }
    const dismissed = new Set(dismissals?.map(d => d.meal_name.toLowerCase()) || []);

    topUsers.forEach(u => {
      const meals = userObjectMap.get(u.userId)!;
      const common = Array.from(currentMealNames).filter(name => userMealsMap.get(u.userId)!.has(name)).slice(0, 2);
      
      meals.forEach(m => {
        const nameLower = m.name.toLowerCase();
        if (currentMealNames.has(nameLower) || dismissed.has(nameLower)) return;

        const existing = mealScores.get(nameLower);
        if (existing) {
          existing.score += u.similarity;
          existing.sourceCount++;
        } else {
          mealScores.set(nameLower, { name: m.name, imageUrl: m.image_url, score: u.similarity, sourceCount: 1, common });
        }
      });
    });

    const recommendations: RecommendedMeal[] = Array.from(mealScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((m, i) => ({
        id: `rec-${i}`,
        name: m.name,
        imageUrl: m.imageUrl,
        sourceUserCount: m.sourceCount,
        score: Math.round(m.score * 100) / 100,
        reason: m.common.length > 0 
          ? `Users who like ${m.common.join(' and ')} also enjoy this`
          : 'Based on your overall taste profile'
      }));

    return new Response(JSON.stringify(recommendations), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});

