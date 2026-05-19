'use client';

import { useRouter } from 'next/navigation';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default function OnboardingPageClient() {
  const router = useRouter();

  const handleComplete = async () => {
    try {
      await fetch('/api/meal-plans/seed', { method: 'POST' });
    } catch (e) {
      console.error('Failed to create starter plan:', e);
    }
    router.push('/account');
  };

  const handleSkip = async () => {
    try {
      await fetch('/api/meal-plans/seed', { method: 'POST' });
    } catch (e) {
      console.error('Failed to create starter plan:', e);
    }
    router.push('/account');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Taste Preferences
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Update your dietary needs and meal preferences.
          </p>
        </div>
        <OnboardingWizard onComplete={handleComplete} onSkip={handleSkip} />
      </div>
    </div>
  );
}
