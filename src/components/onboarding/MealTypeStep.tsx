'use client';

import { MEAL_TYPE_OPTIONS } from '@/lib/data/dietary-options';
import type { UserPreferences } from '@/lib/data/dietary-options';

interface MealTypeStepProps {
  selected: UserPreferences['mealTypePreferences'];
  onChange: (prefs: UserPreferences['mealTypePreferences']) => void;
}

const SECTIONS = [
  { key: 'breakfast' as const, label: 'Breakfast', emoji: '🌅' },
  { key: 'lunch' as const, label: 'Lunch', emoji: '☀️' },
  { key: 'dinner' as const, label: 'Dinner', emoji: '🌙' },
];

export default function MealTypeStep({ selected, onChange }: MealTypeStepProps) {
  const toggle = (meal: keyof UserPreferences['mealTypePreferences'], id: string) => {
    const current = selected[meal] ?? [];
    const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id];
    onChange({ ...selected, [meal]: next });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Meal Preferences</h2>
      <p className="text-sm text-gray-500 mb-6">What styles do you enjoy? Pick as many as you like.</p>

      <div className="space-y-6">
        {SECTIONS.map(({ key, label, emoji }) => (
          <div key={key}>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {emoji} {label}
            </h3>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPE_OPTIONS[key].map((opt) => {
                const isSelected = (selected[key] ?? []).includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle(key, opt.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                      isSelected
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
