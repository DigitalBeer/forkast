// @ts-nocheck
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Protect routes under /dashboard (adjust paths as needed)
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      headers: req.headers,
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    const redirectUrl = new URL("/login", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
