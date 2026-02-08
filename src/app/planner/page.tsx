'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, startOfWeek, addDays } from 'date-fns';
import { WeeklyCalendar } from '@/components/plan/WeeklyCalendar';
import { MealSuggestionPanel } from '@/components/plan/MealSuggestionPanel';
import { DIETARY_TYPES, type Meal, type MealType, type DietaryType } from '@/types/meal';
import { getFilteredMealSuggestions } from '@/lib/services/suggestionService';
import type { MealSuggestion } from '@/lib/services/suggestionService';
import { toast } from 'sonner';
import { MealHistoryService } from '@/lib/data/meal-history.service';

type MealPlan = {
  [date: string]: Partial<Record<MealType, Meal>>;
};

export default function PlannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [weekStart, _setWeekStart] = useState(() => {
    const startParam = searchParams.get('start');
    if (startParam) return startParam;
    const today = new Date();
    return format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  });

  const [meals, setMeals] = useState<MealPlan>({});
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter state from URL params
  const [dietaryTypes, setDietaryTypes] = useState<DietaryType[]>([]);
  const [mealTypes, setMealTypes] = useState<string[]>(['All']);
  const [mealCount, setMealCount] = useState<number>(7);

  const filtersActive = dietaryTypes.length > 0 || !mealTypes.includes('All') || mealCount !== 7;

  // Initialize filters from URL on mount
  useEffect(() => {
    const startParam = searchParams.get('start');
    const dietaryParam = searchParams.get('dietary');
    const mealsParam = searchParams.get('meals');

    if (startParam) {
      _setWeekStart(startParam);
    }

    if (dietaryParam) {
      const types = dietaryParam.split(',').filter((t): t is DietaryType => DIETARY_TYPES.includes(t as DietaryType));
      setDietaryTypes(types);
    }

    if (mealsParam) {
      const mapped: Array<string | null> = mealsParam
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => {
          const lower = t.toLowerCase();
          if (lower === 'all') return 'All';
          if (lower === 'breakfast') return 'Breakfast';
          if (lower === 'lunch') return 'Lunch';
          if (lower === 'dinner') return 'Dinner';
          return null;
        });

      const types = mapped.filter((t): t is string => t !== null);

      setMealTypes(types.length > 0 ? types : ['All']);
    }
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = useCallback((dietary: DietaryType[], meals: string[], startOverride?: string) => {
    const params = new URLSearchParams();
    params.set('start', startOverride ?? weekStart);
    if (dietary.length > 0) params.set('dietary', dietary.join(','));

    const mealsForUrl = meals
      .filter((m) => m !== 'All')
      .map((m) => m.toLowerCase());

    if (mealsForUrl.length > 0 && mealsForUrl.length < 3) {
      params.set('meals', mealsForUrl.join(','));
    }

    const newURL = params.toString() ? `/planner?${params.toString()}` : '/planner';
    router.replace(newURL, { scroll: false });
  }, [router, weekStart]);

  const handleDietaryChange = (types: DietaryType[]) => {
    setDietaryTypes(types);
    updateURL(types, mealTypes);
  };

  const handleMealTypesChange = (types: string[]) => {
    setMealTypes(types);
    updateURL(dietaryTypes, types);
  };

  const handleClearFilters = () => {
    setDietaryTypes([]);
    setMealTypes(['All']);
    setMealCount(7);
    router.replace(`/planner?start=${weekStart}`, { scroll: false });
  };

  const handleWeekStartChange = (next: string) => {
    if (!next) return;
    _setWeekStart(next);
    setMeals({});
    setHoveredSlotId(null);
    updateURL(dietaryTypes, mealTypes, next);
  };

  const handleSavePlan = async () => {
    setIsSaving(true);
    try {
      // Prepare the meal plan data
      type MealPlanPayload = Record<
        string,
        {
          breakfast?: { id: string; name: string };
          lunch?: { id: string; name: string };
          dinner?: { id: string; name: string };
        }
      >;

      const planData = {
        startDate: weekStart,
        endDate: format(addDays(new Date(weekStart), 6), 'yyyy-MM-dd'),
        meals: Object.entries(meals).reduce<MealPlanPayload>((acc, [date, dayMeals]) => {
          acc[date] = {};
          if (dayMeals.Breakfast) {
            acc[date].breakfast = {
              id: dayMeals.Breakfast.id,
              name: dayMeals.Breakfast.name
            };
          }
          if (dayMeals.Lunch) {
            acc[date].lunch = {
              id: dayMeals.Lunch.id,
              name: dayMeals.Lunch.name
            };
          }
          if (dayMeals.Dinner) {
            acc[date].dinner = {
              id: dayMeals.Dinner.id,
              name: dayMeals.Dinner.name
            };
          }
          return acc;
        }, {} as MealPlanPayload)
      };

      const response = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save meal plan');
      }

      await response.json();
      toast.success('Meal plan saved successfully!');

      // Record meal history for each saved meal
      Object.entries(meals).forEach(([date, dayMeals]) => {
        Object.entries(dayMeals).forEach(([mealType, meal]) => {
          if (meal) {
            MealHistoryService.recordMealAction(
              meal.id,
              'planned',
              { date, mealType }
            ).catch(err => console.error('Failed to record meal history:', err));
          }
        });
      });

      // Redirect to the plan view after saving
      router.push('/plan');

    } catch (error) {
      console.error('Error saving meal plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save meal plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    setError(null);
    try {
      const data = await getFilteredMealSuggestions({
        startDate: weekStart,
        days: 7,
        filters: {
          dietaryTypes: dietaryTypes.length > 0 ? dietaryTypes : undefined,
          mealTypes: !mealTypes.includes('All') && mealTypes.length > 0 ? mealTypes.map((m) => m.toLowerCase()) : undefined,
        },
      }, { skipCache: true }); // Bypass cache to see latest changes

      type FlatMealSuggestion = {
        id: string;
        name: string;
        image_url?: string;
        meal_type?: string;
        last_prepared?: string | null;
      };

      type NestedMealSuggestion = {
        meal?: FlatMealSuggestion;
      };

      const mappedSuggestions = (data as Array<FlatMealSuggestion | NestedMealSuggestion>).flatMap((item) => {
        const candidate = (item as NestedMealSuggestion).meal ?? (item as FlatMealSuggestion);

        if (!candidate || typeof candidate !== 'object') return [];
        if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string') return [];

        const normalizedLastPrepared = candidate.last_prepared ?? undefined;
        const normalizedMeal = {
          ...candidate,
          last_prepared: normalizedLastPrepared,
        };

        return [
          {
            id: candidate.id,
            name: candidate.name,
            image_url: candidate.image_url,
            meal_type: candidate.meal_type,
            last_prepared: normalizedLastPrepared,
            meal: normalizedMeal,
          },
        ];
      });

      setSuggestions(mappedSuggestions.slice(0, mealCount));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    }
  };

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    handleGenerateSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dietaryTypes, mealTypes, mealCount, weekStart]);

  const handleMealDrop = (date: string, mealType: MealType, meal: Meal) => {
    setMeals(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [mealType]: meal,
      },
    }));
  };

  const handleRemove = (date: string, mealType: MealType) => {
    setMeals(prev => {
      const updated = { ...prev };
      if (updated[date]) {
        const dayMeals = { ...updated[date] };
        delete dayMeals[mealType];
        if (Object.keys(dayMeals).length === 0) {
          delete updated[date];
        } else {
          updated[date] = dayMeals;
        }
      }
      return updated;
    });
  };

  const handleDuplicate = (_date: string, _mealType: MealType, meal: Meal) => {
    // Find next empty slot
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(format(d, 'yyyy-MM-dd'));
    }

    const types: MealType[] = ['Breakfast', 'Lunch', 'Dinner'];
    for (const day of days) {
      for (const type of types) {
        if (!meals[day]?.[type]) {
          handleMealDrop(day, type, meal);
          return;
        }
      }
    }
  };

  const handleMealSwap = (
    sourceDate: string,
    sourceMealType: MealType,
    targetDate: string,
    targetMealType: MealType
  ) => {
    setMeals(prev => {
      const sourceMeal = prev[sourceDate]?.[sourceMealType];
      const targetMeal = prev[targetDate]?.[targetMealType];

      if (!sourceMeal || !targetMeal) return prev;

      return {
        ...prev,
        [sourceDate]: {
          ...prev[sourceDate],
          [sourceMealType]: targetMeal,
        },
        [targetDate]: {
          ...prev[targetDate],
          [targetMealType]: sourceMeal,
        },
      };
    });
  };

  const handleCooked = async (date: string, mealType: MealType, meal: Meal) => {
    // Record the 'cooked' action in meal history
    try {
      await MealHistoryService.recordMealAction(
        meal.id,
        'cooked',
        { date, mealType, source: 'meal-plan' }
      );

      toast.success(`Marked "${meal.name}" as cooked`);
    } catch (error) {
      console.error('Failed to record cooked action:', error);
    }
  };

  const handleSkip = async (date: string, mealType: MealType, meal: Meal) => {
    // Record the 'skip' action in meal history
    try {
      await MealHistoryService.recordMealAction(
        meal.id,
        'skipped',
        { date, mealType, source: 'meal-plan' }
      );

      // Remove the meal from the plan since it was skipped
      handleRemove(date, mealType);

      toast.success(`Skipped "${meal.name}"`);
    } catch (error) {
      console.error('Failed to record skip action:', error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Plan Your Meals</h1>
        </div>

        {/* Horizontal Filter Bar */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Week Start */}
            <div className="w-full lg:w-56">
              <label className="block text-sm font-medium text-gray-700 mb-2">Week starting</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => handleWeekStartChange(e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                data-testid="plan-week-start"
              />
            </div>

            {/* Meal Type Filters */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Meal Types</label>
              <div className="flex flex-wrap gap-2">
                {['All', 'Breakfast', 'Lunch', 'Dinner'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      if (type === 'All') {
                        handleMealTypesChange(['All']);
                      } else {
                        const isSelected = mealTypes.includes(type);
                        const updated = isSelected
                          ? mealTypes.filter(t => t !== type && t !== 'All')
                          : mealTypes.includes('All')
                            ? [type]
                            : [...mealTypes.filter(t => t !== 'All'), type];
                        handleMealTypesChange(updated.length > 0 ? updated : ['All']);
                      }
                    }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${mealTypes.includes(type)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Filters */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Preferences</label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_TYPES.map((diet) => {
                  const isSelected = dietaryTypes.includes(diet);
                  return (
                    <button
                      key={diet}
                      onClick={() => {
                        const updated = isSelected
                          ? dietaryTypes.filter(d => d !== diet)
                          : [...dietaryTypes, diet];
                        handleDietaryChange(updated);
                      }}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${dietaryTypes.includes(diet)
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {diet}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meal Count Selector */}
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-2">Meal Count</label>
              <input
                type="number"
                min="1"
                max="14"
                value={mealCount}
                onChange={(e) => {
                  const value = Math.min(14, Math.max(1, parseInt(e.target.value) || 1));
                  setMealCount(value);
                }}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end gap-2">
              {filtersActive && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 text-sm text-blue-700 hover:underline whitespace-nowrap"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <WeeklyCalendar
              weekStart={weekStart}
              meals={meals}
              onMealDrop={handleMealDrop}
              onMealSwap={handleMealSwap}
              onRemove={handleRemove}
              onDuplicate={handleDuplicate}
              onCooked={handleCooked}
              onSkip={handleSkip}
              onHover={setHoveredSlotId}
              hoveredSlotId={hoveredSlotId}
            />
          </div>

          {/* Suggestions Panel - Takes 1 column */}
          <div className="lg:col-span-1">
            <MealSuggestionPanel
              suggestions={suggestions}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-30 sm:relative sm:bg-transparent sm:border-0 sm:shadow-none sm:p-0">
          <div className="max-w-7xl mx-auto flex justify-end gap-4">
            <button
              onClick={handleSavePlan}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed shadow-sm transition-colors text-lg flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Plan'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
