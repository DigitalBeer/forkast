'use client';

import React from 'react';
import { Check } from 'lucide-react';
import type { ShoppingListItem } from '@/lib/shopping/aggregate';

interface MealPlanDetails {
  id: string;
  startDate: string;
  endDate: string;
  meals: Record<
    string,
    Record<string, { id: string; name: string; ingredients?: unknown[] }>
  >;
}

interface ExtendedItem extends ShoppingListItem {
  isChecked: boolean;
  haveIt: boolean;
}

interface MealGroupedViewProps {
  mealPlan: MealPlanDetails | null;
  items: ShoppingListItem[];
  onToggleHaveIt: (name: string) => void;
  onToggleChecked: (name: string) => void;
  needToBuyItems: ExtendedItem[];
  alreadyHaveItems: ExtendedItem[];
}

const MEAL_TYPE_ORDER = ['Breakfast', 'Lunch', 'Dinner'];

export function MealGroupedView({
  mealPlan,
  onToggleHaveIt,
  onToggleChecked,
  needToBuyItems,
  alreadyHaveItems,
}: MealGroupedViewProps) {
  if (!mealPlan) {
    return <p className="text-gray-500">No meal plan data available.</p>;
  }

  // Get sorted dates
  const sortedDates = Object.keys(mealPlan.meals).sort();

  // Create lookups for checked and have-it states
  const checkedMap = new Map(
    [...needToBuyItems, ...alreadyHaveItems].map(item => [
      item.name.toLowerCase(),
      item.isChecked,
    ]),
  );
  const haveItMap = new Map(
    [...needToBuyItems, ...alreadyHaveItems].map(item => [
      item.name.toLowerCase(),
      item.haveIt,
    ]),
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateFormatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return { dayName, dateFormatted };
  };

  return (
    <div className="space-y-4">
      {sortedDates.map(date => {
        const dayMeals = mealPlan.meals[date];
        const { dayName, dateFormatted } = formatDate(date);

        if (!dayMeals || Object.keys(dayMeals).length === 0) {
          return null;
        }

        return (
          <div
            key={date}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Day Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {dayName}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {dateFormatted}
                </span>
              </h2>
            </div>

            {/* Meals for the Day */}
            <div className="divide-y divide-gray-100">
              {MEAL_TYPE_ORDER.map(mealType => {
                const mealKey = mealType.toLowerCase() as keyof typeof dayMeals;
                const meal = dayMeals[mealKey] || dayMeals[mealType];

                if (!meal) return null;

                const ingredients =
                  (meal.ingredients as Array<{
                    name: string;
                    quantity?: number;
                    unit?: string;
                  }>) || [];

                return (
                  <div key={mealType} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium uppercase text-gray-500">
                        {mealType}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {meal.name}
                      </span>
                    </div>

                    {ingredients.length > 0 ? (
                      <ul className="space-y-1 ml-4">
                        {ingredients
                          .filter(ing => ing.name && ing.name.trim() !== '')
                          .map((ing, idx) => {
                            const isChecked =
                              checkedMap.get(ing.name?.toLowerCase() || '') ||
                              false;
                            const isHaveIt =
                              haveItMap.get(ing.name?.toLowerCase() || '') ||
                              false;

                            return (
                              <li
                                key={`${ing.name}-${ing.unit || 'no-unit'}-${idx}`}
                                className="flex items-center gap-2 text-sm"
                              >
                                <button
                                  onClick={() =>
                                    ing.name &&
                                    onToggleChecked(
                                      `${ing.name.toLowerCase()}|${ing.unit?.toLowerCase() || ''}`,
                                    )
                                  }
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    isChecked
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3" />}
                                </button>
                                <span
                                  className={
                                    isChecked
                                      ? 'text-gray-400 line-through'
                                      : 'text-gray-700'
                                  }
                                >
                                  {ing.quantity && `${ing.quantity} `}
                                  {ing.unit && `${ing.unit} `}
                                  {ing.name}
                                </span>
                                {!isHaveIt && (
                                  <button
                                    onClick={() =>
                                      ing.name &&
                                      onToggleHaveIt(
                                        `${ing.name.toLowerCase()}|${ing.unit?.toLowerCase() || ''}`,
                                      )
                                    }
                                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-700 transition-colors"
                                  >
                                    Have it?
                                  </button>
                                )}
                                {isHaveIt && (
                                  <span className="text-xs text-green-600">
                                    (have it)
                                  </span>
                                )}
                              </li>
                            );
                          })}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400 ml-4">
                        No ingredients listed
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {sortedDates.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No meals found in this plan.
        </p>
      )}
    </div>
  );
}
