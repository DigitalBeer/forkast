'use client';

import { useParams } from 'next/navigation';
import { MealPlanDetail } from '@/components/meal-plans/MealPlanDetail';
import { PaperPage } from '@/components/layout/PaperPage';

export default function MealPlanDetailPage() {
  const params = useParams<{ id: string }>();
  return <PaperPage><MealPlanDetail mealPlanId={params.id} /></PaperPage>;
}
