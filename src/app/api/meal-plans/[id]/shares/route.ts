import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const mealPlanId = parseInt(resolvedParams.id);
    if (isNaN(mealPlanId)) {
      return NextResponse.json({ error: 'Invalid meal plan ID' }, { status: 400 });
    }

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

    // Get all shares for this meal plan
    const { data: shares, error: sharesError } = await supabase
      .from('meal_plan_shares')
      .select('*')
      .eq('meal_plan_id', mealPlanId)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (sharesError) {
      console.error('Error fetching shares:', sharesError);
      return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 });
    }

    // Generate share URLs and filter out expired shares
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const now = new Date();
    
    const activeShares = shares
      .filter(share => !share.expires_at || new Date(share.expires_at) > now)
      .map(share => ({
        id: share.id,
        shareToken: share.share_token,
        shareUrl: `${baseUrl}/shared/${share.share_token}`,
        includeDetails: share.include_details,
        expiresAt: share.expires_at,
        createdAt: share.created_at
      }));

    return NextResponse.json({ shares: activeShares });

  } catch (error) {
    console.error('Error in shares list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
