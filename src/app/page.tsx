'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, startOfWeek, addWeeks } from 'date-fns';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  TrendingUp,
  Utensils,
  Newspaper,
  Share2,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ShareModal } from '@/components/plan/ShareModal';
import { RecommendedMealsCard } from '@/components/recommendations/RecommendedMealsCard';
import { LandingPage } from '@/components/landing/LandingPage';
import { MealImage } from '@/components/meals/MealImage';
import { useAuthStore } from '@/store/auth';
import { PaperPage } from '@/components/layout/PaperPage';
import type { MealPlanData, MealPlanMeal } from '@/types/meal';

interface MealPlanSummary {
  id: number;
  startDate: string;
  endDate: string;
  mealCount: number;
}

const MINUTES_PER_MEAL_PLANNING = 15;

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuthStore();

  // Show landing page for unauthenticated users
  if (!authLoading && !user) {
    return <LandingPage />;
  }

  // Show loading while auth state is initializing
  if (authLoading) {
    return (
      <PaperPage>
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner />
        </div>
      </PaperPage>
    );
  }

  // Authenticated dashboard - extracted to keep hook count stable
  return <AuthenticatedDashboard />;
}

function AuthenticatedDashboard() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const {
    data: mealPlan,
    isLoading: planLoading,
    error: planError,
    refetch,
  } = useQuery<MealPlanData | null>({
    queryKey: ['latest-meal-plan'],
    queryFn: async () => {
      const response = await fetch('/api/meal-plans');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view your meal plan');
        }
        throw new Error('Failed to load meal plan');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: upcomingPlans } = useQuery<MealPlanSummary[]>({
    queryKey: ['upcoming-plans'],
    queryFn: async () => {
      const response = await fetch('/api/meal-plans/history?limit=10');
      if (!response.ok) return [];
      const data = await response.json();
      return data.plans || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: userMeals } = useQuery<MealPlanMeal[]>({
    queryKey: ['user-meals-with-images'],
    queryFn: async () => {
      const response = await fetch('/api/meals?limit=10');
      if (!response.ok) return [];
      const data = await response.json();
      return (data.meals || []).filter(
        (m: MealPlanMeal) => m.image_url || m.thumbnail,
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  if (planLoading) {
    return (
      <PaperPage>
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner />
        </div>
      </PaperPage>
    );
  }

  if (planError) {
    return (
      <PaperPage>
        <div className="flex items-center justify-center py-32">
          <ErrorMessage
            message={
              planError instanceof Error
                ? planError.message
                : 'Failed to load dashboard'
            }
            onRetry={() => refetch()}
          />
        </div>
      </PaperPage>
    );
  }

  // Calculate stats
  const totalMealsPlanned =
    upcomingPlans?.reduce((sum, p) => sum + (p.mealCount || 0), 0) || 0;
  const timeSavedMinutes = totalMealsPlanned * MINUTES_PER_MEAL_PLANNING;
  const timeSavedHours = Math.round((timeSavedMinutes / 60) * 10) / 10;

  // Get next 4 weeks
  const today = new Date();
  const next4Weeks = Array.from({ length: 4 }, (_, i) => {
    const weekStart = startOfWeek(addWeeks(today, i), { weekStartsOn: 1 });
    const weekEnd = addWeeks(weekStart, 1);
    weekEnd.setDate(weekEnd.getDate() - 1);
    return {
      start: format(weekStart, 'yyyy-MM-dd'),
      end: format(weekEnd, 'yyyy-MM-dd'),
      label: format(weekStart, 'MMM d') + ' - ' + format(weekEnd, 'MMM d'),
      hasPlans:
        upcomingPlans?.some(
          p => p.startDate === format(weekStart, 'yyyy-MM-dd'),
        ) || false,
    };
  });

  // Empty state
  if (!mealPlan) {
    return (
      <PaperPage>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-hand font-bold text-forkast-ink mb-8">
            Dashboard
          </h1>

          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Utensils className="w-16 h-16 text-cookbook-warm-gray/40 mx-auto mb-4" />
              <p className="text-xl font-serif text-muted-foreground mb-6">
                Aww, you have no plans, why not make one?
              </p>
              <Link
                href="/planner"
                className="px-4 py-2 bg-primary text-primary-foreground font-serif font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                Plan New Week
              </Link>
            </div>
          </div>
        </div>
      </PaperPage>
    );
  }

  // Calculate current plan stats
  const sortedDates = Object.keys(mealPlan.meals).sort();
  const weekRange =
    sortedDates.length > 0
      ? `${format(parseISO(sortedDates[0]), 'MMM d')} - ${format(parseISO(sortedDates[sortedDates.length - 1]), 'MMM d, yyyy')}`
      : '';

  let currentPlanMealCount = 0;
  sortedDates.forEach(date => {
    const dayMeals = mealPlan.meals[date];
    if (dayMeals?.breakfast) currentPlanMealCount++;
    if (dayMeals?.lunch) currentPlanMealCount++;
    if (dayMeals?.dinner) currentPlanMealCount++;
  });

  const sampleMeals: string[] = [];
  for (const date of sortedDates) {
    const dayMeals = mealPlan.meals[date];
    if (dayMeals?.breakfast) sampleMeals.push(dayMeals.breakfast.name);
    if (dayMeals?.lunch) sampleMeals.push(dayMeals.lunch.name);
    if (dayMeals?.dinner) sampleMeals.push(dayMeals.dinner.name);
    if (sampleMeals.length >= 3) break;
  }

  return (
    <PaperPage>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-hand font-bold text-forkast-ink">
            Dashboard
          </h1>
          <Link
            href="/planner"
            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            Plan New Week
          </Link>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Active Plan Card */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cookbook-terracotta/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-cookbook-terracotta" />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-semibold text-foreground">
                    Current Plan
                  </h2>
                  <p className="text-sm text-muted-foreground">{weekRange}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <Link
                  href="/plan"
                  className="text-sm text-cookbook-terracotta hover:text-cookbook-terracotta/80 font-medium"
                >
                  View Full Plan →
                </Link>
                <Link
                  href={`/meal-plans/${mealPlan.id}`}
                  className="text-sm text-cookbook-terracotta hover:text-cookbook-terracotta/80 font-medium"
                >
                  Shopping List & Duplicate
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-bold text-foreground">
                {currentPlanMealCount}
              </span>
              <span className="text-muted-foreground">meals planned</span>
            </div>

            {sampleMeals.length > 0 && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Preview:</span>{' '}
                {sampleMeals.join(', ')}
              </p>
            )}
          </div>

          {/* Stats Card */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cookbook-sage/10 rounded-lg">
                <Clock className="w-5 h-5 text-cookbook-sage" />
              </div>
              <h2 className="text-lg font-serif font-semibold text-foreground">
                Time Saved
              </h2>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-cookbook-sage">
                {timeSavedHours}
              </span>
              <span className="text-muted-foreground">hours</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Based on {totalMealsPlanned} meals planned
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              (~{MINUTES_PER_MEAL_PLANNING} min saved per meal)
            </p>
          </div>

          {/* Next 4 Weeks Card */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-meal-dinner/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-meal-dinner" />
              </div>
              <h2 className="text-lg font-serif font-semibold text-foreground">
                Upcoming Weeks
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {next4Weeks.map((week, i) => (
                <div
                  key={week.start}
                  className={`p-3 rounded-lg border ${
                    week.hasPlans
                      ? 'bg-cookbook-sage/5 border-cookbook-sage/30'
                      : 'bg-muted/50 border-border'
                  }`}
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {i === 0
                      ? 'This Week'
                      : i === 1
                        ? 'Next Week'
                        : `Week ${i + 1}`}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {week.label}
                  </p>
                  <p
                    className={`text-xs mt-1 ${week.hasPlans ? 'text-cookbook-sage' : 'text-muted-foreground/60'}`}
                  >
                    {week.hasPlans ? '✓ Planned' : 'No plan'}
                  </p>
                  {!week.hasPlans && (
                    <Link
                      href={`/planner?start=${week.start}`}
                      className="text-xs text-cookbook-terracotta hover:underline mt-1 inline-block"
                    >
                      Plan now
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Meal Photos Carousel */}
          {userMeals && userMeals.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 lg:col-span-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-meal-breakfast/10 rounded-lg">
                  <Utensils className="w-5 h-5 text-meal-breakfast" />
                </div>
                <h2 className="text-lg font-serif font-semibold text-foreground">
                  Your Meals
                </h2>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2">
                {userMeals.slice(0, 8).map(meal => (
                  <div key={meal.id} className="flex-shrink-0 w-32">
                    <MealImage
                      src={meal.image_url || meal.thumbnail}
                      alt={meal.name}
                      size="thumbnail"
                      mealName={meal.name}
                    />
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {meal.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Meals Widget */}
          <RecommendedMealsCard />

          {/* Placeholder: News & Tips */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cookbook-warm-gray/10 rounded-lg">
                  <Newspaper className="w-5 h-5 text-cookbook-warm-gray" />
                </div>
                <h2 className="text-lg font-serif font-semibold text-foreground">
                  Tips & News
                </h2>
              </div>
              <span className="text-xs bg-cookbook-warm-gray/10 text-cookbook-warm-gray px-2 py-1 rounded-full font-medium">
                Coming Soon
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Cooking tips, seasonal recipes, and updates from the Forkast
              community.
            </p>
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
      </div>
    </PaperPage>
  );
}
