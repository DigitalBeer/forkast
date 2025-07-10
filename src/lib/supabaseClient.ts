import { createBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton Supabase browser client.
 *
 * The client is created lazily on first access and reused across the app to
 * ensure a single connection pool and consistent auth state.
 */
let browserClient: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (!browserClient) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
    }
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return browserClient;
}
