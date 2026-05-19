'use client';

import { FormEvent, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import type { AuthState } from '@/store/auth';
import {
  hasAnonymousData,
  migrateAnonymousData,
  getAnonymousDataPreview,
} from '@/lib/migration/anonymousDataMigration';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [dataPreview, setDataPreview] = useState({
    mealCount: 0,
    planDrafts: 0,
  });
  const setUser = useAuthStore((s: AuthState) => s.setUser);

  useEffect(() => {
    const checkData = hasAnonymousData();
    setHasData(checkData);
    if (checkData) {
      setDataPreview(getAnonymousDataPreview());
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setUser(data.user ?? null);

      // Migrate anonymous data if user exists and has data
      if (data.user && hasData) {
        const migrationResult = await migrateAnonymousData(data.user.id);
        if (!migrationResult.success) {
          setMessage('Account created! Note: Some data migration failed.');
        }
      }

      // Create starter plan after migration completes
      try {
        await fetch('/api/meal-plans/seed', { method: 'POST' });
      } catch (e) {
        console.error('Failed to create starter plan:', e);
      }

      setLoading(false);
      setShowWizard(true);
    }
  };

  if (showWizard) {
    return (
      <div className="w-full">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Set up your taste profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tell us your preferences so we can suggest meals you will love.
          </p>
        </div>
        {message && (
          <p className="text-amber-600 text-sm mb-4 text-center">{message}</p>
        )}
        <OnboardingWizard
          onComplete={() =>
            setMessage(
              'All done! Please check your email to confirm your account.',
            )
          }
          onSkip={() =>
            setMessage(
              'Preferences skipped. Please check your email to confirm your account.',
            )
          }
        />
        {message && message.includes('check your email') && (
          <p className="text-green-600 text-sm mt-4 text-center">{message}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {hasData && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-900 font-medium">📦 Data Migration</p>
          <p className="text-xs text-blue-700 mt-1">
            Your {dataPreview.mealCount} meal(s) will be automatically saved to
            your new account.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {message && <p className="text-green-600 text-sm">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Sign Up'}
      </button>
    </form>
  );
}
