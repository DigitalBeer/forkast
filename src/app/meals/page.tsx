"use client";

import { RecommendedMeals } from '@/components/meals/RecommendedMeals';
import { MealsList } from '@/components/meals/MealsList';
import { PaperPage } from '@/components/layout/PaperPage';

export default function MealsPage() {
  return (
    <PaperPage>
      <div className="max-w-7xl mx-auto">
        <RecommendedMeals />
        <MealsList />
      </div>
    </PaperPage>
  );
}
