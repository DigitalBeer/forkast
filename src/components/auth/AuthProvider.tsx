'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const { setUser, setLoading } = useAuthStore.getState();
    const supabase = createClient();

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!session?.user) {
          // Server says unauthenticated — ensure local state is cleared
          setUser(null);
          try {
            localStorage.removeItem('auth-state');
            localStorage.removeItem('forkast-auth-state-v1');
          } catch {
            // ignore
          }
        } else {
          setUser(session.user);
        }
      })
      .catch(() => {
        setUser(null);
        try {
          localStorage.removeItem('auth-state');
          localStorage.removeItem('forkast-auth-state-v1');
        } catch {
          // ignore
        }
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        try {
          localStorage.removeItem('auth-state');
          localStorage.removeItem('forkast-auth-state-v1');
        } catch {
          // ignore
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
