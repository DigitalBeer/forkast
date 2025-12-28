"use client";

import { RecommendedMeals } from '@/components/meals/RecommendedMeals';
import { MealsList } from '@/components/meals/MealsList';

export default function MealsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecommendedMeals />
        <MealsList />
      </div>
    </div>
  );
}
