import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { scrapeRecipe, ScrapingErrorCode, ScrapingErrorMessages } from '@/lib/scraping/recipe-scraper';

/**
 * POST /api/recipes/scrape
 * Scrapes recipe data from a URL (Premium feature)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    // Check premium subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    const isPremium = profile?.subscription_status === 'premium';

    if (!isPremium) {
      return NextResponse.json(
        {
          error: ScrapingErrorMessages[ScrapingErrorCode.PREMIUM_REQUIRED],
          code: ScrapingErrorCode.PREMIUM_REQUIRED,
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const url = typeof body.url === 'string' ? body.url.trim() : '';

    if (!url) {
      return NextResponse.json(
        {
          error: ScrapingErrorMessages[ScrapingErrorCode.INVALID_URL],
          code: ScrapingErrorCode.INVALID_URL,
        },
        { status: 400 }
      );
    }

    // Scrape the recipe
    const result = await scrapeRecipe(url);

    if (!result.success || !result.recipe) {
      const errorCode = result.error?.code || ScrapingErrorCode.PARSING_FAILED;
      return NextResponse.json(
        {
          error: result.error?.message || ScrapingErrorMessages[errorCode],
          code: errorCode,
        },
        { status: 422 }
      );
    }

    // Return the scraped recipe data
    return NextResponse.json(
      {
        success: true,
        recipe: result.recipe,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/recipes/scrape:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: ScrapingErrorCode.NETWORK_ERROR,
      },
      { status: 500 }
    );
  }
}
