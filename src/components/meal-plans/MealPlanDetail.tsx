'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PrintableMealPlan } from '@/components/meal-plans/PrintableMealPlan';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';

interface Meal {
  id: string;
  name: string;
  type: string;
  thumbnail?: string;
}

interface MealPlan {
  id: string;
  startDate: string;
  endDate: string;
  meals: {
    [date: string]: {
      breakfast?: Meal;
      lunch?: Meal;
      dinner?: Meal;
    };
  };
}

export function MealPlanDetail({ mealPlanId }: { mealPlanId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: mealPlan, isLoading, error, refetch } = useQuery<MealPlan>({
    queryKey: ['meal-plan-detail', mealPlanId],
    queryFn: async () => {
      const response = await fetch(`/api/meal-plans/${mealPlanId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Meal plan not found');
        }
        if (response.status === 401) {
          throw new Error('Please log in to view this meal plan');
        }
        throw new Error('Failed to load meal plan');
      }
      return (await response.json()) as MealPlan;
    },
    staleTime: 60 * 1000,
  });

  const sortedDates = useMemo(() => {
    return Object.keys(mealPlan?.meals || {}).sort();
  }, [mealPlan?.meals]);

  const weekRange = useMemo(() => {
    if (!mealPlan) return '';
    return `${format(parseISO(mealPlan.startDate), 'MMM d')} - ${format(parseISO(mealPlan.endDate), 'MMM d, yyyy')}`;
  }, [mealPlan]);

  const canPrint = sortedDates.length > 0;

  function handlePrint() {
    if (!canPrint) return;
    window.print();
  }

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/meal-plans/${mealPlanId}`, { method: 'DELETE' });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to delete this meal plan');
        }
        if (response.status === 404) {
          throw new Error('Meal plan not found');
        }
        throw new Error('Failed to delete meal plan');
      }

      toast.success('Meal plan deleted');
      queryClient.invalidateQueries({ queryKey: ['meal-plan-history'] });
      queryClient.invalidateQueries({ queryKey: ['latest-meal-plan'] });
      router.push('/meal-plans/history');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete meal plan');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  }

  async function handleDuplicate() {
    if (isDuplicating) return;

    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/meal-plans/${mealPlanId}/duplicate`, { method: 'POST' });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to duplicate this meal plan');
        }
        throw new Error('Failed to duplicate meal plan');
      }

      const payload = (await response.json()) as { mealPlanId: string };
      toast.success('Meal plan duplicated');
      router.push(`/meal-plans/${payload.mealPlanId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate meal plan');
    } finally {
      setIsDuplicating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load meal plan'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message="Meal plan not found" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meal Plan</h1>
              <p className="text-gray-600 mt-1">{weekRange}</p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/meal-plans/${mealPlanId}/shopping-list`}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                data-testid="shopping-list-button"
              >
                Shopping List
              </Link>
              <button
                type="button"
                onClick={handlePrint}
                disabled={!canPrint}
                className="px-4 py-2 bg-white text-gray-800 font-medium rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="print-meal-plan"
              >
                Print
              </button>
              <Link
                href="/meal-plans/history"
                className="px-4 py-2 bg-white text-gray-800 font-medium rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Back to History
              </Link>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                disabled={isDeleting}
                className="px-4 py-2 bg-white text-red-700 font-medium rounded-md border border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="delete-meal-plan"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isDuplicating}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                data-testid="duplicate-meal-plan"
              >
                {isDuplicating ? 'Duplicating...' : 'Duplicate'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {sortedDates.map((date) => {
              const dayMeals = mealPlan.meals[date];
              const hasMeals = dayMeals?.breakfast || dayMeals?.lunch || dayMeals?.dinner;
              if (!hasMeals) return null;

              return (
                <div key={date} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {format(parseISO(date), 'EEEE, MMMM d')}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dayMeals?.breakfast && (
                      <MealCard meal={dayMeals.breakfast} mealType="Breakfast" />
                    )}
                    {dayMeals?.lunch && <MealCard meal={dayMeals.lunch} mealType="Lunch" />}
                    {dayMeals?.dinner && (
                      <MealCard meal={dayMeals.dinner} mealType="Dinner" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {sortedDates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No meals planned for this week.</p>
            </div>
          )}
        </div>
      </div>

      <PrintableMealPlan mealPlan={mealPlan} />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete meal plan"
        description="This will permanently delete this saved meal plan. This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

    </>
  );
}

function MealCard({ meal, mealType }: { meal: Meal; mealType: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {mealType}
          </p>
          <h3 className="text-base font-semibold text-gray-900 truncate">{meal.name}</h3>
        </div>
      </div>
    </div>
  );
}
