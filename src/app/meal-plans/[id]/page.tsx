'use client';

import { useParams } from 'next/navigation';
import { MealPlanDetail } from '@/components/meal-plans/MealPlanDetail';

export default function MealPlanDetailPage() {
  const params = useParams<{ id: string }>();
  return <MealPlanDetail mealPlanId={params.id} />;
}
