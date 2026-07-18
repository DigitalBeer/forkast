"use client";

import { RecommendedMealsCard } from '@/components/recommendations/RecommendedMealsCard';
import { MealsList } from '@/components/meals/MealsList';
import { PaperPage } from '@/components/layout/PaperPage';

export default function MealsPage() {
  return (
    <PaperPage>
      <div className="max-w-7xl mx-auto space-y-6">
        <RecommendedMealsCard />
        <MealsList />
      </div>
    </PaperPage>
  );
}
