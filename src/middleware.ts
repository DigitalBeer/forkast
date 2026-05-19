import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    // Missing env vars in local dev – skip auth checks
    return NextResponse.next();
  }

  // Response must be re-created inside setAll so that route handlers
  // receive the request with refreshed auth cookies.
  let supabaseResponse = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Use getSession() instead of getUser() to avoid hitting the Supabase API
  // on every request. getSession() reads from the cookie locally (fast) and
  // only makes a network call when the access token needs refreshing.
  // This avoids 429 rate limits when many workers run in parallel.
  let session;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch (authError) {
    // Auth service error (e.g., blocked by adblocker extension).
    // Don't crash — let the page render; the client will handle auth state.
    console.error('Middleware auth error:', authError);
  }

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/minimal',
    '/debug',
    '/reset-password',
    '/shared',
    '/auth/confirm',
  ];
  const isPublicRoute = publicRoutes.some(
    route =>
      req.nextUrl.pathname === route ||
      req.nextUrl.pathname.startsWith(route + '/'),
  );

  // Only redirect page routes to login; API routes handle their own 401 responses
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  if (!session && !isPublicRoute && !isApiRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    // Distinguish auth service errors from normal "no session" so the
    // client can clear stale localStorage state instead of looping.
    if (session === undefined) {
      redirectUrl.searchParams.set('reason', 'session_error');
    }
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
