import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    const resolvedParams = await params;
    const mealPlanId = parseInt(resolvedParams.id);
    if (isNaN(mealPlanId)) {
      return NextResponse.json({ error: 'Invalid meal plan ID' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { includeDetails = false, expiresAt } = body;

    // Verify user owns the meal plan
    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .select('id, user_id')
      .eq('id', mealPlanId)
      .eq('user_id', user.id)
      .single();

    if (planError || !mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    // Create share record
    const { data: share, error: shareError } = await supabase
      .from('meal_plan_shares')
      .insert({
        meal_plan_id: mealPlanId,
        include_details: includeDetails,
        expires_at: expiresAt || null,
        created_by: user.id
      })
      .select('*')
      .single();

    if (shareError) {
      console.error('Error creating share:', shareError);
      return NextResponse.json({ error: 'Failed to create share' }, { status: 500 });
    }

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const shareUrl = `${baseUrl}/shared/${share.share_token}`;

    return NextResponse.json({
      id: share.id,
      shareToken: share.share_token,
      shareUrl,
      includeDetails: share.include_details,
      expiresAt: share.expires_at,
      createdAt: share.created_at
    });

  } catch (error) {
    console.error('Error in share creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
