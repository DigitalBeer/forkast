'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PrintableMealPlan } from '@/components/meal-plans/PrintableMealPlan';
import { ShareModal } from '@/components/plan/ShareModal';
import type { MealPlanData, MealPlanMeal } from '@/types/meal';

export default function PlanViewPage() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { data: mealPlan, isLoading, error, refetch } = useQuery<MealPlanData | null>({
    queryKey: ['latest-meal-plan'],
    queryFn: async () => {
      const response = await fetch('/api/meal-plans');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view your meal plan');
        }
        throw new Error('Failed to load meal plan');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

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
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-6">
            You don&apos;t have an active meal plan yet.
          </p>
          <Link
            href="/planner"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Create a Meal Plan
          </Link>
        </div>
      </div>
    );
  }

  const sortedDates = Object.keys(mealPlan.meals).sort();
  const weekRange = sortedDates.length > 0 
    ? `${format(parseISO(sortedDates[0]), 'MMM d')} - ${format(parseISO(sortedDates[sortedDates.length - 1]), 'MMM d, yyyy')}`
    : '';

  const canPrint = sortedDates.length > 0;

  function handlePrint() {
    if (!canPrint) return;
    window.print();
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Meal Plan</h1>
              <p className="text-gray-600 mt-1">{weekRange}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1 px-4 py-2 bg-white text-gray-800 font-medium rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
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
                View History
              </Link>
              <Link
                href="/planner"
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Plan New Week
              </Link>
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
                    {dayMeals?.lunch && (
                      <MealCard meal={dayMeals.lunch} mealType="Lunch" />
                    )}
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

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {mealPlan && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          mealPlanId={mealPlan.id}
        />
      )}

      <PrintableMealPlan mealPlan={mealPlan} />
    </>
  );
}

function MealCard({ meal, mealType }: { meal: MealPlanMeal; mealType: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3">
        {meal.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={meal.thumbnail} 
            alt={meal.name}
            className="w-16 h-16 rounded-md object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {mealType}
          </p>
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {meal.name}
          </h3>
        </div>
      </div>
    </div>
  );
}
