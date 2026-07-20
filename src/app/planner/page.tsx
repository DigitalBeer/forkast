'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, startOfWeek, addDays } from 'date-fns';
import { WeeklyCalendar } from '@/components/plan/WeeklyCalendar';
import { MealSuggestionPanel } from '@/components/plan/MealSuggestionPanel';
import { PaperPage } from '@/components/layout/PaperPage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DIETARY_TYPES,
  type Meal,
  type MealType,
  type DietaryType,
} from '@/types/meal';
import { getFilteredMealSuggestions } from '@/lib/services/suggestionService';
import type { MealSuggestion } from '@/lib/services/suggestionService';
import { toast } from 'sonner';
import { MealHistoryService } from '@/lib/data/meal-history.service';
import {
  createUndoSnapshot,
  UNDO_TOAST_DURATION_MS,
} from '@/lib/meal-plan/undo-stack';
import { useAuthStore } from '@/store/auth';

type MealPlan = {
  [date: string]: Partial<Record<MealType, Meal>>;
};

export default function PlannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore(s => s.user);

  const [weekStart, _setWeekStart] = useState(() => {
    const startParam = searchParams.get('start');
    if (startParam) return startParam;
    const today = new Date();
    return format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  });

  const [meals, setMeals] = useState<MealPlan>({});
  const undoSnapshotRef = useRef<MealPlan | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [replaceDialogMeal, setReplaceDialogMeal] = useState<{
    meal: Meal;
    slotType: MealType;
  } | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(new Date(weekStart), i), 'yyyy-MM-dd'),
    );
  }, [weekStart]);

  // Filter state from URL params
  const [dietaryTypes, setDietaryTypes] = useState<DietaryType[]>([]);
  const [mealTypes, setMealTypes] = useState<string[]>(['All']);
  const [mealCount, setMealCount] = useState<number>(7);

  // User taste preferences (used as defaults when no manual filters are set)
  const [profileDietaryPrefs, setProfileDietaryPrefs] = useState<string[]>([]);

  const filtersActive =
    dietaryTypes.length > 0 || !mealTypes.includes('All') || mealCount !== 7;

  // Initialize filters from URL on mount
  useEffect(() => {
    const startParam = searchParams.get('start');
    const dietaryParam = searchParams.get('dietary');
    const mealsParam = searchParams.get('meals');

    if (startParam) {
      _setWeekStart(startParam);
    }

    if (dietaryParam) {
      const types = dietaryParam
        .split(',')
        .filter((t): t is DietaryType =>
          DIETARY_TYPES.includes(t as DietaryType),
        );
      setDietaryTypes(types);
    }

    if (mealsParam) {
      const mapped: Array<string | null> = mealsParam
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => {
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

  // Fetch user taste preferences to use as dietary defaults
  useEffect(() => {
    fetch('/api/profile/preferences')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.dietaryPreferences?.length) {
          setProfileDietaryPrefs(data.dietaryPreferences);
        }
      })
      .catch(() => {});
  }, []);

  // Load existing meal plan for the selected week
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/meal-plans?weekStart=${weekStart}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data?.meals) return;
        const loaded: MealPlan = {};
        for (const [date, dayMeals] of Object.entries(data.meals)) {
          const dm = dayMeals as {
            breakfast?: { id: string; name: string; type: string; thumbnail?: string };
            lunch?: { id: string; name: string; type: string; thumbnail?: string };
            dinner?: { id: string; name: string; type: string; thumbnail?: string };
          };
          const mapped: Partial<Record<MealType, Meal>> = {};
          if (dm.breakfast) {
            mapped.Breakfast = {
              id: dm.breakfast.id,
              name: dm.breakfast.name,
              meal_type: 'Breakfast',
              image_url: dm.breakfast.thumbnail,
              tags: [],
            };
          }
          if (dm.lunch) {
            mapped.Lunch = {
              id: dm.lunch.id,
              name: dm.lunch.name,
              meal_type: 'Lunch',
              image_url: dm.lunch.thumbnail,
              tags: [],
            };
          }
          if (dm.dinner) {
            mapped.Dinner = {
              id: dm.dinner.id,
              name: dm.dinner.name,
              meal_type: 'Dinner',
              image_url: dm.dinner.thumbnail,
              tags: [],
            };
          }
          loaded[date] = mapped;
        }
        setMeals(loaded);
      })
      .catch(err => console.error('Failed to load meal plan:', err))
      .finally(() => {
        if (!cancelled) setPlanLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const clearUndoSnapshot = useCallback(() => {
    undoSnapshotRef.current = null;
    clearUndoTimer();
  }, [clearUndoTimer]);

  const captureUndo = useCallback(
    (currentMeals: MealPlan) => {
      undoSnapshotRef.current = createUndoSnapshot(currentMeals);
      clearUndoTimer();
      undoTimerRef.current = setTimeout(() => {
        undoSnapshotRef.current = null;
        undoTimerRef.current = null;
      }, UNDO_TOAST_DURATION_MS);
    },
    [clearUndoTimer],
  );

  const restoreUndo = useCallback(() => {
    if (!undoSnapshotRef.current) return;

    setMeals(undoSnapshotRef.current);
    clearUndoSnapshot();
    toast.success('Undone.');
  }, [clearUndoSnapshot]);

  const showUndoToast = useCallback(
    (message: string) => {
      toast.success(message, {
        action: { label: 'Undo', onClick: restoreUndo },
        duration: UNDO_TOAST_DURATION_MS,
      });
    },
    [restoreUndo],
  );

  useEffect(() => clearUndoTimer, [clearUndoTimer]);

  // Update URL when filters change
  const updateURL = useCallback(
    (dietary: DietaryType[], meals: string[], startOverride?: string) => {
      const params = new URLSearchParams();
      params.set('start', startOverride ?? weekStart);
      if (dietary.length > 0) params.set('dietary', dietary.join(','));

      const mealsForUrl = meals
        .filter(m => m !== 'All')
        .map(m => m.toLowerCase());

      if (mealsForUrl.length > 0 && mealsForUrl.length < 3) {
        params.set('meals', mealsForUrl.join(','));
      }

      const newURL = params.toString()
        ? `/planner?${params.toString()}`
        : '/planner';
      router.replace(newURL, { scroll: false });
    },
    [router, weekStart],
  );

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
    setPlanLoaded(false);
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
        meals: Object.entries(meals).reduce<MealPlanPayload>(
          (acc, [date, dayMeals]) => {
            acc[date] = {};
            if (dayMeals.Breakfast) {
              acc[date].breakfast = {
                id: dayMeals.Breakfast.id,
                name: dayMeals.Breakfast.name,
              };
            }
            if (dayMeals.Lunch) {
              acc[date].lunch = {
                id: dayMeals.Lunch.id,
                name: dayMeals.Lunch.name,
              };
            }
            if (dayMeals.Dinner) {
              acc[date].dinner = {
                id: dayMeals.Dinner.id,
                name: dayMeals.Dinner.name,
              };
            }
            return acc;
          },
          {} as MealPlanPayload,
        ),
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
            MealHistoryService.recordMealAction(meal.id, 'planned', {
              date,
              mealType,
            }).catch(err =>
              console.error('Failed to record meal history:', err),
            );
          }
        });
      });

      // Redirect to the plan view after saving
      router.push('/plan');
    } catch (error) {
      console.error('Error saving meal plan:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save meal plan',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!user) return;
    setError(null);
    try {
      // Use explicit user-set filters; fall back to saved profile preferences
      const effectiveDietaryTypes =
        dietaryTypes.length > 0
          ? dietaryTypes
          : (profileDietaryPrefs as DietaryType[]).filter(
              (p): p is DietaryType => DIETARY_TYPES.includes(p as DietaryType),
            );

      const data = await getFilteredMealSuggestions(
        {
          startDate: weekStart,
          days: 7,
          filters: {
            dietaryTypes:
              effectiveDietaryTypes.length > 0
                ? effectiveDietaryTypes
                : undefined,
            mealTypes:
              !mealTypes.includes('All') && mealTypes.length > 0
                ? mealTypes.map(m => m.toLowerCase())
                : undefined,
          },
        },
        { skipCache: true },
      ); // Bypass cache to see latest changes

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

      const mappedSuggestions = (
        data as Array<FlatMealSuggestion | NestedMealSuggestion>
      ).flatMap(item => {
        const candidate =
          (item as NestedMealSuggestion).meal ?? (item as FlatMealSuggestion);

        if (!candidate || typeof candidate !== 'object') return [];
        if (
          typeof candidate.id !== 'string' ||
          typeof candidate.name !== 'string'
        )
          return [];

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
      setError(
        err instanceof Error ? err.message : 'Failed to load suggestions',
      );
    }
  };

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    handleGenerateSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dietaryTypes, mealTypes, mealCount, weekStart, profileDietaryPrefs]);

  // Handle addMeal param: auto-place a meal from the Meals page into the first available slot
  const addMealHandledRef = useRef(false);
  useEffect(() => {
    if (addMealHandledRef.current) return;
    if (!planLoaded) return;
    const addMealFlag = searchParams.get('addMeal');
    if (!addMealFlag) return;

    const stored = sessionStorage.getItem('addMealToPlan');
    if (!stored) return;

    let meal: Meal;
    try {
      meal = JSON.parse(stored) as Meal;
    } catch {
      sessionStorage.removeItem('addMealToPlan');
      return;
    }

    addMealHandledRef.current = true;
    sessionStorage.removeItem('addMealToPlan');

    const rawType = meal.meal_type;
    const slotType: MealType =
      rawType === 'Breakfast' || rawType === 'Lunch' || rawType === 'Dinner'
        ? rawType
        : 'Dinner';

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(format(addDays(new Date(weekStart), i), 'yyyy-MM-dd'));
    }

    for (const day of days) {
      if (!meals[day]?.[slotType]) {
        setMeals(prev => ({
          ...prev,
          [day]: { ...prev[day], [slotType]: meal },
        }));
        toast.success(
          `Added "${meal.name}" to ${format(new Date(day), 'EEEE')} ${slotType}`,
        );
        const params = new URLSearchParams(searchParams.toString());
        params.delete('addMeal');
        router.replace(`/planner?${params.toString()}`, { scroll: false });
        return;
      }
    }

    setReplaceDialogMeal({ meal, slotType });
  }, [searchParams, weekStart, meals, router, planLoaded]);

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
    targetMealType: MealType,
  ) => {
    // Capture undo BEFORE state update (avoid side effects inside setState updater)
    captureUndo(meals);

    setMeals(prev => {
      const sourceMeal = prev[sourceDate]?.[sourceMealType];
      const targetMeal = prev[targetDate]?.[targetMealType];

      if (!sourceMeal || !targetMeal) return prev;

      if (sourceDate === targetDate) {
        // Same day – merge both slot changes into a single key to avoid overwrite
        return {
          ...prev,
          [sourceDate]: {
            ...prev[sourceDate],
            [sourceMealType]: targetMeal,
            [targetMealType]: sourceMeal,
          },
        };
      }

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

    showUndoToast('Swap done.');
  };

  const handleMealReplace = (
    sourceDate: string,
    sourceMealType: MealType,
    targetDate: string,
    targetMealType: MealType,
    meal: Meal,
  ) => {
    // Capture undo BEFORE state update (avoid side effects inside setState updater)
    captureUndo(meals);

    setMeals(prev => {
      const sourceMeal = prev[sourceDate]?.[sourceMealType];
      const targetMeal = prev[targetDate]?.[targetMealType];

      if (!sourceMeal || !targetMeal) return prev;

      const updated: MealPlan = {
        ...prev,
        [targetDate]: {
          ...prev[targetDate],
          [targetMealType]: meal,
        },
      };

      if (sourceDate !== targetDate || sourceMealType !== targetMealType) {
        const sourceDayMeals = { ...updated[sourceDate] };
        delete sourceDayMeals[sourceMealType];

        if (Object.keys(sourceDayMeals).length === 0) {
          delete updated[sourceDate];
        } else {
          updated[sourceDate] = sourceDayMeals;
        }
      }

      return updated;
    });

    showUndoToast('Replace done.');
  };

  const handleCooked = async (date: string, mealType: MealType, meal: Meal) => {
    // Record the 'cooked' action in meal history
    try {
      await MealHistoryService.recordMealAction(meal.id, 'cooked', {
        date,
        mealType,
        source: 'meal-plan',
      });

      toast.success(`Marked "${meal.name}" as cooked`);
    } catch (error) {
      console.error('Failed to record cooked action:', error);
    }
  };

  const handleSkip = async (date: string, mealType: MealType, meal: Meal) => {
    // Record the 'skip' action in meal history
    try {
      await MealHistoryService.recordMealAction(meal.id, 'skipped', {
        date,
        mealType,
        source: 'meal-plan',
      });

      // Remove the meal from the plan since it was skipped
      handleRemove(date, mealType);

      toast.success(`Skipped "${meal.name}"`);
    } catch (error) {
      console.error('Failed to record skip action:', error);
    }
  };

  if (error) {
    return (
      <PaperPage>
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800 font-serif">
          {error}
        </div>
      </PaperPage>
    );
  }

  return (
    <PaperPage>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-xs font-serif uppercase tracking-widest text-forkast-forest mb-1">
              The Week Ahead
            </div>
            <h1 className="font-hand text-5xl font-bold text-forkast-ink leading-none">
              Plan Your Meals
            </h1>
          </div>
        </div>

        {/* Horizontal Filter Bar */}
        <div
          className="rounded p-4 md:p-5 wobble"
          style={{
            background: 'rgba(168,50,50,0.04)',
            border: '1.4px solid var(--forkast-rule)',
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Week Start */}
            <div className="w-full lg:w-56">
              <label className="block text-xs font-serif uppercase tracking-widest text-forkast-forest mb-2">
                Week starting
              </label>
              <input
                type="date"
                value={weekStart}
                onChange={e => handleWeekStartChange(e.target.value)}
                className="w-full px-3 py-1 text-sm border-b-2 border-forkast-ink bg-transparent font-hand text-base focus:outline-none focus:border-forkast-crimson"
                data-testid="plan-week-start"
              />
            </div>

            {/* Meal Type Filters */}
            <div className="flex-1">
              <label className="block text-xs font-serif uppercase tracking-widest text-forkast-ink mb-2">
                Meal Types
              </label>
              <div className="flex flex-wrap gap-2">
                {['All', 'Breakfast', 'Lunch', 'Dinner'].map(type => (
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
                        handleMealTypesChange(
                          updated.length > 0 ? updated : ['All'],
                        );
                      }
                    }}
                    className={`px-3 py-1 text-sm rounded-full transition-colors font-serif wobble ${
                      mealTypes.includes(type)
                        ? 'text-forkast-paper'
                        : 'text-forkast-ink hover:bg-muted'
                    }`}
                    style={
                      mealTypes.includes(type)
                        ? { background: 'var(--forkast-ink)', border: '1.3px solid var(--forkast-ink)' }
                        : { border: '1.3px solid var(--forkast-ink)' }
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Filters */}
            <div className="flex-1">
              <label className="block text-xs font-serif uppercase tracking-widest text-forkast-forest mb-2">
                Dietary Preferences
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_TYPES.map(diet => {
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
                      className={`px-3 py-1 text-sm rounded-full transition-colors font-serif wobble ${
                        isSelected
                          ? 'text-forkast-paper'
                          : 'text-forkast-forest hover:bg-muted'
                      }`}
                      style={
                        isSelected
                          ? { background: 'var(--forkast-forest)', border: '1.3px solid var(--forkast-forest)' }
                          : { border: '1.3px solid var(--forkast-forest)' }
                      }
                    >
                      {diet}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meal Count Selector */}
            <div className="w-32">
              <label className="block text-xs font-serif uppercase tracking-widest text-forkast-ink mb-2">
                Meal Count
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={mealCount}
                onChange={e => {
                  const value = Math.min(
                    14,
                    Math.max(1, parseInt(e.target.value) || 1),
                  );
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
                  className="px-3 py-2 text-sm font-serif text-forkast-crimson hover:underline whitespace-nowrap"
                >
                  clear filters
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
              onMealReplace={handleMealReplace}
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
            <MealSuggestionPanel suggestions={suggestions} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-forkast-paper border-t border-forkast-rule shadow-lg z-30 sm:relative sm:bg-transparent sm:border-0 sm:shadow-none sm:p-0">
          <div className="flex justify-end gap-4">
            <button
              onClick={handleSavePlan}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-6 py-3 bg-cookbook-terracotta text-cookbook-cream font-hand rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-opacity text-xl flex items-center justify-center gap-2 wobble"
              style={{ transform: 'rotate(-1deg)' }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Plan →'
              )}
            </button>
          </div>
        </div>
      </div>

      <Dialog open={!!replaceDialogMeal} onOpenChange={(open) => {
        if (!open) {
          const params = new URLSearchParams(searchParams.toString());
          params.delete('addMeal');
          router.replace(`/planner?${params.toString()}`, { scroll: false });
          setReplaceDialogMeal(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Replace a {replaceDialogMeal?.slotType}</DialogTitle>
            <DialogDescription>
              All {replaceDialogMeal?.slotType} slots are full this week. Choose a day to replace with{' '}
              &ldquo;{replaceDialogMeal?.meal.name}&rdquo;:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {replaceDialogMeal && weekDays
              .filter(d => meals[d]?.[replaceDialogMeal.slotType])
              .map(day => (
                <div
                  key={day}
                  className="flex items-center justify-between p-2 border border-gray-200 rounded"
                >
                  <div className="text-sm">
                    <span className="font-medium">{format(new Date(day), 'EEEE')}</span>
                    <span className="text-gray-500 ml-2">
                      {meals[day]?.[replaceDialogMeal.slotType]?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      captureUndo(meals);
                      setMeals(prev => ({
                        ...prev,
                        [day]: {
                          ...prev[day],
                          [replaceDialogMeal.slotType]: replaceDialogMeal.meal,
                        },
                      }));
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete('addMeal');
                      router.replace(`/planner?${params.toString()}`, { scroll: false });
                      setReplaceDialogMeal(null);
                      showUndoToast(`Replaced with "${replaceDialogMeal.meal.name}"`);
                    }}
                    className="px-3 py-1 text-sm bg-forkast-crimson text-white rounded hover:opacity-90"
                  >
                    Replace
                  </button>
                </div>
              ))}
          </div>
          <DialogClose asChild>
            <button className="mt-2 px-4 py-2 text-sm text-gray-600 hover:underline font-serif">
              Cancel
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </PaperPage>
  );
}
