'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { MealTypeIcon } from '@/components/ui/MealTypeIcon';
import { MealImage } from '@/components/meals/MealImage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PrintableMealPlan } from '@/components/meal-plans/PrintableMealPlan';
import { ShareModal } from '@/components/plan/ShareModal';
import { PaperPage } from '@/components/layout/PaperPage';
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
      <PaperPage>
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner />
        </div>
      </PaperPage>
    );
  }

  if (error) {
    return (
      <PaperPage>
        <div className="flex items-center justify-center py-32">
          <ErrorMessage
            message={error instanceof Error ? error.message : 'Failed to load meal plan'}
            onRetry={() => refetch()}
          />
        </div>
      </PaperPage>
    );
  }

  if (!mealPlan) {
    return (
      <PaperPage>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <p className="text-xl font-serif text-muted-foreground mb-6">
              You don&apos;t have an active meal plan yet.
            </p>
            <Link
              href="/planner"
              className="px-4 py-2 bg-primary text-primary-foreground font-serif font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              Create a Meal Plan
            </Link>
          </div>
        </div>
      </PaperPage>
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
      <PaperPage className="print:hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-hand font-bold text-forkast-ink">Your Meal Plan</h1>
              <p className="font-serif text-muted-foreground mt-1">{weekRange}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1 px-4 py-2 font-serif text-forkast-ink rounded wobble transition-colors hover:bg-muted"
                style={{ border: '1.3px solid var(--forkast-ink)' }}
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={!canPrint}
                className="px-4 py-2 font-serif text-forkast-ink rounded wobble transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ border: '1.3px solid var(--forkast-ink)' }}
                data-testid="print-meal-plan"
              >
                Print
              </button>
              <Link
                href={`/meal-plans/${mealPlan.id}`}
                className="px-4 py-2 font-serif text-forkast-paper rounded wobble transition-opacity hover:opacity-90"
                style={{ background: 'var(--forkast-ink)' }}
              >
                Full Plan
              </Link>
              <Link
                href="/meal-plans/history"
                className="px-4 py-2 font-serif text-forkast-ink rounded wobble transition-colors hover:bg-muted"
                style={{ border: '1.3px solid var(--forkast-ink)' }}
              >
                View History
              </Link>
              <Link
                href="/planner"
                className="px-4 py-2 font-serif text-forkast-paper rounded wobble transition-opacity hover:opacity-90"
                style={{ background: 'var(--forkast-ink)' }}
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
                <div key={date} className="rounded wobble p-5" style={{ background: 'rgba(168,50,50,0.04)', border: '1.4px solid var(--forkast-rule)' }}>
                  <h2 className="text-xl font-hand font-bold text-forkast-ink mb-4">
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
              <p className="text-muted-foreground">No meals planned for this week.</p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-cookbook-terracotta hover:text-cookbook-terracotta/80 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </PaperPage>

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
    <div className="rounded p-4 wobble transition-colors" style={{ border: '1px solid var(--forkast-rule)' }}>
      <div className="flex items-start gap-3">
        <MealImage
          src={meal.thumbnail}
          alt={meal.name}
          size="thumbnail"
          mealName={meal.name}
          mealType={mealType}
          className="!w-16 !h-16 rounded-md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <MealTypeIcon type={mealType} size="sm" />
            <p className="text-xs font-serif text-forkast-forest uppercase tracking-widest">
              {mealType}
            </p>
          </div>
          <h3 className="text-base font-hand font-bold text-forkast-ink truncate">
            {meal.name}
          </h3>
        </div>
      </div>
    </div>
  );
}
