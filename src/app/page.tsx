'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, startOfWeek, addWeeks } from 'date-fns';
import Link from 'next/link';
import { Calendar, Clock, TrendingUp, Utensils, Newspaper, Share2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ShareModal } from '@/components/plan/ShareModal';
import { RecommendedMealsCard } from '@/components/recommendations/RecommendedMealsCard';

interface Meal {
  id: string;
  name: string;
  type: string;
  thumbnail?: string;
  image_url?: string;
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

interface MealPlanSummary {
  id: number;
  startDate: string;
  endDate: string;
  mealCount: number;
}

const MINUTES_PER_MEAL_PLANNING = 15;

export default function DashboardPage() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { data: mealPlan, isLoading: planLoading, error: planError, refetch } = useQuery<MealPlan | null>({
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

  const { data: userMeals } = useQuery<Meal[]>({
    queryKey: ['user-meals-with-images'],
    queryFn: async () => {
      const response = await fetch('/api/meals?limit=10');
      if (!response.ok) return [];
      const data = await response.json();
      return (data.meals || []).filter((m: Meal) => m.image_url || m.thumbnail);
    },
    staleTime: 5 * 60 * 1000,
  });

  if (planLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (planError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage
          message={planError instanceof Error ? planError.message : 'Failed to load dashboard'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Calculate stats
  const totalMealsPlanned = upcomingPlans?.reduce((sum, p) => sum + (p.mealCount || 0), 0) || 0;
  const timeSavedMinutes = totalMealsPlanned * MINUTES_PER_MEAL_PLANNING;
  const timeSavedHours = Math.round(timeSavedMinutes / 60 * 10) / 10;

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
      hasPlans: upcomingPlans?.some(p => p.startDate === format(weekStart, 'yyyy-MM-dd')) || false,
    };
  });

  // Empty state
  if (!mealPlan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-6">
                Aww, you have no plans, why not make one?
              </p>
              <Link
                href="/planner"
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Plan New Week
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate current plan stats
  const sortedDates = Object.keys(mealPlan.meals).sort();
  const weekRange = sortedDates.length > 0
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Link
            href="/planner"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Plan New Week
          </Link>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Active Plan Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                  <p className="text-sm text-gray-500">{weekRange}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <Link
                  href="/plan"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Full Plan →
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-bold text-gray-900">{currentPlanMealCount}</span>
              <span className="text-gray-500">meals planned</span>
            </div>

            {sampleMeals.length > 0 && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Preview:</span> {sampleMeals.join(', ')}
              </p>
            )}
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Time Saved</h2>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-green-600">{timeSavedHours}</span>
              <span className="text-gray-500">hours</span>
            </div>

            <p className="text-sm text-gray-500">
              Based on {totalMealsPlanned} meals planned
            </p>
            <p className="text-xs text-gray-400 mt-1">
              (~{MINUTES_PER_MEAL_PLANNING} min saved per meal)
            </p>
          </div>

          {/* Next 4 Weeks Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Weeks</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {next4Weeks.map((week, i) => (
                <div
                  key={week.start}
                  className={`p-3 rounded-lg border ${week.hasPlans
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  <p className="text-xs text-gray-500 mb-1">
                    {i === 0 ? 'This Week' : i === 1 ? 'Next Week' : `Week ${i + 1}`}
                  </p>
                  <p className="text-sm font-medium text-gray-900">{week.label}</p>
                  <p className={`text-xs mt-1 ${week.hasPlans ? 'text-green-600' : 'text-gray-400'}`}>
                    {week.hasPlans ? '✓ Planned' : 'No plan'}
                  </p>
                  {!week.hasPlans && (
                    <Link
                      href={`/planner?start=${week.start}`}
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Utensils className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Your Meals</h2>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2">
                {userMeals.slice(0, 8).map((meal) => (
                  <div key={meal.id} className="flex-shrink-0 w-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={meal.image_url || meal.thumbnail}
                      alt={meal.name}
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                    <p className="text-xs text-gray-600 mt-1 truncate">{meal.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Meals Widget */}
          <RecommendedMealsCard />

          {/* Placeholder: News & Tips */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Newspaper className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Tips & News</h2>
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                Coming Soon
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Cooking tips, seasonal recipes, and updates from the BMAD community.
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
    </div>
  );
}

