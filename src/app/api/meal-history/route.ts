import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const actionTypes = searchParams.get('actionTypes')?.split(',');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
        const supabase = await createSupabaseServerClient();

    // Get the current user
    const { data: { session }, error: userError } = await supabase.auth.getSession();
    
    if (userError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const user = session.user;

    // Build the query
    let query = supabase
      .from('meal_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('action_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters if provided
    if (actionTypes && actionTypes.length > 0) {
      query = query.in('action_type', actionTypes);
    }

    if (startDate) {
      query = query.gte('action_date', startDate);
    }

    if (endDate) {
      query = query.lte('action_date', endDate);
    }

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching meal history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch meal history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      hasMore: (offset + (data?.length || 0)) < (count || 0),
    });

  } catch (error) {
    console.error('Unexpected error in meal history API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
