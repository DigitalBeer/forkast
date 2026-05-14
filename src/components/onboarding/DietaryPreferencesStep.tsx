'use client';

import { DIETARY_OPTIONS } from '@/lib/data/dietary-options';

interface DietaryPreferencesStepProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function DietaryPreferencesStep({ selected, onChange }: DietaryPreferencesStepProps) {
  const toggle = (id: string) => {
    onChange(
      selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Dietary Preferences</h2>
      <p className="text-sm text-gray-500 mb-6">Select all that apply — we will tailor your meal suggestions.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DIETARY_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`relative flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              <span className="text-3xl mb-2">{opt.icon}</span>
              <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
              <span className="text-xs text-gray-500 mt-0.5">{opt.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
