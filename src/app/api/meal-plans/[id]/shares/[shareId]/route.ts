import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
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
    const shareId = parseInt(resolvedParams.shareId);
    
    if (isNaN(mealPlanId) || isNaN(shareId)) {
      return NextResponse.json({ error: 'Invalid ID parameters' }, { status: 400 });
    }

    // Verify user owns the meal plan and share
    const { data: share, error: shareError } = await supabase
      .from('meal_plan_shares')
      .select(`
        id,
        meal_plan_id,
        created_by,
        meal_plans!inner(user_id)
      `)
      .eq('id', shareId)
      .eq('meal_plan_id', mealPlanId)
      .eq('created_by', user.id)
      .single();

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Delete the share
    const { error: deleteError } = await supabase
      .from('meal_plan_shares')
      .delete()
      .eq('id', shareId)
      .eq('created_by', user.id);

    if (deleteError) {
      console.error('Error deleting share:', deleteError);
      return NextResponse.json({ error: 'Failed to delete share' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Share deleted successfully' });

  } catch (error) {
    console.error('Error in share deletion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
