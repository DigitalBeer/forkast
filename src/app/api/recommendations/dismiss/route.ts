import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get authenticated user via session (avoids rate-limiting getUser() calls)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    const body = await req.json();
    const { mealName } = body;

    if (!mealName || typeof mealName !== 'string') {
      return NextResponse.json({ error: 'mealName is required' }, { status: 400 });
    }

    // Calculate expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Insert or update dismissal record
    const { error: insertError } = await supabase
      .from('recommendation_dismissals')
      .upsert({
        user_id: user.id,
        meal_name: mealName,
        dismissed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'user_id,meal_name',
      });

    if (insertError) {
      console.error("[ERROR] Failed to dismiss recommendation:", insertError);
      return NextResponse.json({ error: 'Failed to dismiss recommendation' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("[ERROR] in /api/recommendations/dismiss:", error);
    return NextResponse.json({ error: 'Error dismissing recommendation' }, { status: 500 });
  }
}
