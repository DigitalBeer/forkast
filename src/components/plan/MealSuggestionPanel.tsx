'use client';

import { MealCard } from './MealCard';
import type { Meal } from '@/types/meal';
import type { MealSuggestion } from '@/lib/services/suggestionService';

interface MealSuggestionPanelProps {
  suggestions: MealSuggestion[] | Meal[];
}

export function MealSuggestionPanel({ suggestions }: MealSuggestionPanelProps) {
  // Remove duplicates by ID
  const uniqueSuggestions = Array.from(new Map(suggestions.map(item => [item.id, item])).values());

  return (
    <div className="bg-card rounded-xl shadow-lg p-6 flex flex-col border border-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-serif font-semibold text-foreground">Meal Suggestions</h3>
      </div>

      {/* Suggestions List */}
      <div className="h-[800px] overflow-y-auto pr-2">
        {uniqueSuggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No suggestions available. Click &apos;Refresh Suggestions&apos; to get new suggestions.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {uniqueSuggestions.map(meal => (
              <MealCard key={meal.id} meal={meal as Meal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
