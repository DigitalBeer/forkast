'use client';

import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Users, ChefHat } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface SharedMeal {
  id: number;
  name: string;
  description: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  dietaryTags: string[] | null;
  ingredients?: unknown;
  instructions?: string | null;
}

interface SharedMealPlan {
  id: number;
  weekStartDate: string;
  weekEndDate: string;
  createdAt: string;
  sharedAt: string;
  includeDetails: boolean;
}

interface SharedPlanData {
  mealPlan: SharedMealPlan;
  meals: Record<string, Record<string, SharedMeal>>;
}

export default function SharedMealPlanPage({ params }: { params: { token: string } }) {
  const { data, isLoading, error } = useQuery<SharedPlanData>({
    queryKey: ['shared-meal-plan', params.token],
    queryFn: async () => {
      const response = await fetch(`/api/shared/${params.token}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('This shared meal plan was not found or has been removed.');
        }
        if (response.status === 410) {
          throw new Error('This shared meal plan has expired.');
        }
        throw new Error('Failed to load shared meal plan.');
      }
      return response.json();
    },
    retry: false,
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
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto" />
          </div>
          <ErrorMessage 
            message={error instanceof Error ? error.message : 'Failed to load shared meal plan'} 
          />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { mealPlan, meals } = data;
  
  // Get sorted dates for the week
  const sortedDates = Object.keys(meals).sort();
  const weekRange = sortedDates.length > 0 
    ? `${format(parseISO(sortedDates[0]), 'MMM d')} - ${format(parseISO(sortedDates[sortedDates.length - 1]), 'MMM d, yyyy')}`
    : '';

  // Calculate total meals
  let totalMeals = 0;
  sortedDates.forEach(date => {
    const dayMeals = meals[date];
    if (dayMeals?.breakfast) totalMeals++;
    if (dayMeals?.lunch) totalMeals++;
    if (dayMeals?.dinner) totalMeals++;
  });

  const formatTime = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderMealCard = (meal: SharedMeal, mealType: string) => (
    <div key={`${meal.id}-${mealType}`} className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900">{meal.name}</h4>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
          {mealType}
        </span>
      </div>
      
      {meal.description && (
        <p className="text-sm text-gray-600 mb-3">{meal.description}</p>
      )}
      
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        {meal.prepTime && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Prep: {formatTime(meal.prepTime)}</span>
          </div>
        )}
        {meal.cookTime && (
          <div className="flex items-center gap-1">
            <ChefHat className="w-3 h-3" />
            <span>Cook: {formatTime(meal.cookTime)}</span>
          </div>
        )}
        {meal.servings && (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{meal.servings} servings</span>
          </div>
        )}
      </div>

      {meal.dietaryTags && meal.dietaryTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {meal.dietaryTags.map((tag) => (
            <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {mealPlan.includeDetails && (
        <div className="border-t pt-3 mt-3">
          {meal.ingredients && (
            <div className="mb-3">
              <h5 className="text-sm font-medium text-gray-900 mb-1">Ingredients</h5>
              <div className="text-sm text-gray-600">
                {typeof meal.ingredients === 'string' 
                  ? meal.ingredients 
                  : JSON.stringify(meal.ingredients)
                }
              </div>
            </div>
          )}
          {meal.instructions && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-1">Instructions</h5>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{meal.instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Shared Meal Plan</h1>
          </div>
          <p className="text-gray-600">{weekRange}</p>
          <p className="text-sm text-gray-500 mt-1">
            {totalMeals} meals planned • Shared {format(parseISO(mealPlan.sharedAt), 'MMM d, yyyy')}
          </p>
        </div>

        {/* Meal Plan Grid */}
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dayMeals = meals[date];
            const dayName = format(parseISO(date), 'EEEE');
            const dayDate = format(parseISO(date), 'MMM d');
            
            return (
              <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{dayName}</h3>
                    <p className="text-sm text-gray-500">{dayDate}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dayMeals?.breakfast && renderMealCard(dayMeals.breakfast, 'breakfast')}
                  {dayMeals?.lunch && renderMealCard(dayMeals.lunch, 'lunch')}
                  {dayMeals?.dinner && renderMealCard(dayMeals.dinner, 'dinner')}
                  
                  {/* Empty state for missing meals */}
                  {!dayMeals?.breakfast && (
                    <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
                      <p className="text-sm text-gray-400">No breakfast planned</p>
                    </div>
                  )}
                  {!dayMeals?.lunch && (
                    <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
                      <p className="text-sm text-gray-400">No lunch planned</p>
                    </div>
                  )}
                  {!dayMeals?.dinner && (
                    <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
                      <p className="text-sm text-gray-400">No dinner planned</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            This meal plan was shared from{' '}
            <span className="font-medium text-gray-700">BMAD Meal Planner</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Create your own meal plans at bmad-meal-planner.com
          </p>
        </div>
      </div>
    </div>
  );
}
