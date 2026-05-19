import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AuthConfirmPage({
  searchParams,
}: {
  searchParams: { code?: string; type?: string };
}) {
  const code = searchParams.code;
  const type = searchParams.type;

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-destructive">Invalid Link</h1>
          <p className="mt-2 text-muted-foreground">
            The confirmation code is missing or expired.
          </p>
          <a
            href="/login"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-destructive">
            Confirmation Failed
          </h1>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <a
            href="/login"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }

  // Success — redirect based on type
  if (type === 'signup' || type === 'email_change') {
    redirect('/onboarding');
  }

  redirect('/');
}
