'use client';

import { useState } from 'react';
import type { UserPreferences } from '@/lib/data/dietary-options';
import DietaryPreferencesStep from './DietaryPreferencesStep';
import DislikedIngredientsStep from './DislikedIngredientsStep';
import MealTypeStep from './MealTypeStep';
import OnboardingComplete from './OnboardingComplete';

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const STEPS = ['Dietary', 'Ingredients', 'Meal Types'] as const;

const EMPTY_PREFS: UserPreferences = {
  dietaryPreferences: [],
  dislikedIngredients: [],
  mealTypePreferences: { breakfast: [], lunch: [], dinner: [] },
};

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<UserPreferences>(EMPTY_PREFS);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLastStep = step === STEPS.length - 1;

  const savePreferences = async (completed: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dietaryPreferences: prefs.dietaryPreferences,
          dislikedIngredients: prefs.dislikedIngredients,
          mealTypePreferences: prefs.mealTypePreferences,
          onboardingCompleted: completed,
        }),
      });
      if (!res.ok) throw new Error('Failed to save preferences');
    } catch {
      setError('Could not save preferences. You can update them later in Account Settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (isLastStep) {
      await savePreferences(true);
      setDone(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = async () => {
    await savePreferences(false);
    onSkip();
  };

  if (done) {
    return (
      <OnboardingComplete
        onDone={onComplete}
        dietaryCount={prefs.dietaryPreferences.length}
        ingredientCount={prefs.dislikedIngredients.length}
      />
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={`text-xs font-medium ${i <= step ? 'text-green-600' : 'text-gray-400'}`}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      {/* Step content */}
      <div className="min-h-64">
        {step === 0 && (
          <DietaryPreferencesStep
            selected={prefs.dietaryPreferences}
            onChange={(ids) => setPrefs((p) => ({ ...p, dietaryPreferences: ids }))}
          />
        )}
        {step === 1 && (
          <DislikedIngredientsStep
            selected={prefs.dislikedIngredients}
            onChange={(items) => setPrefs((p) => ({ ...p, dislikedIngredients: items }))}
          />
        )}
        {step === 2 && (
          <MealTypeStep
            selected={prefs.mealTypePreferences}
            onChange={(mtp) => setPrefs((p) => ({ ...p, mealTypePreferences: mtp }))}
          />
        )}
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSkip}
          disabled={saving}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip for now
        </button>
        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={saving}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="px-6 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
