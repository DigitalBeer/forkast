import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface UserRecommendation {
  id: string;
  name: string;
  imageUrl?: string;
  reason: string;
  score: number;
  sourceUserCount: number;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user via session (avoids rate-limiting getUser() calls)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json([], { status: 200 });
    }

    // Get limit from query params (default 5)
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // Call the Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/get-user-recommendations`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ limit }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ERROR] Edge Function returned ${response.status}: ${errorText}`);
      // Fall back to empty array instead of error
      return NextResponse.json([], { status: 200 });
    }

    const recommendations: UserRecommendation[] = await response.json();
    
    return NextResponse.json(recommendations.slice(0, limit), { status: 200 });

  } catch (error) {
    console.error("[ERROR] in /api/recommendations:", error);
    return NextResponse.json({ error: 'Error fetching recommendations' }, { status: 500 });
  }
}
