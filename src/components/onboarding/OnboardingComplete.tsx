'use client';

interface OnboardingCompleteProps {
  onDone: () => void;
  dietaryCount: number;
  ingredientCount: number;
}

export default function OnboardingComplete({ onDone, dietaryCount, ingredientCount }: OnboardingCompleteProps) {
  return (
    <div className="flex flex-col items-center text-center py-8 max-w-sm mx-auto">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all set!</h2>
      <p className="text-gray-500 mb-2">
        {dietaryCount > 0 && (
          <span className="block">{dietaryCount} dietary {dietaryCount === 1 ? 'preference' : 'preferences'} saved.</span>
        )}
        {ingredientCount > 0 && (
          <span className="block">{ingredientCount} {ingredientCount === 1 ? 'ingredient' : 'ingredients'} to avoid saved.</span>
        )}
        {dietaryCount === 0 && ingredientCount === 0 && (
          <span>Your profile is ready — you can update preferences anytime in Account Settings.</span>
        )}
      </p>
      <p className="text-sm text-gray-400 mb-8">Check your email to confirm your account.</p>

      <button
        type="button"
        onClick={onDone}
        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
      >
        Start Planning Meals
      </button>
    </div>
  );
}
