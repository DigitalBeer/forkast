import { differenceInDays, parseISO } from 'date-fns';
import type { User } from '@supabase/supabase-js';
import type { Meal } from '@/types/meal';

interface MealHistory {
  meal_id: string;
  last_eaten: string;
}

export interface Recommendation {
  meal: Meal;
  score: number;
}

const MEAL_TYPE_VARIETY_SCORE = 1.5;
const RECENCY_SCORE_WEIGHT = 2;

/**
 * Generates meal recommendations based on user history and meal variety.
 * @param _user The authenticated user (for future personalization).
 * @param allMeals The list of all available meals.
 * @param userHistory The user's meal history.
 * @param options Options for recommendation generation, like limit.
 * @returns {Recommendation[]} A sorted list of recommended meals.
 */
export function getRecommendations(
  _user: User, // Marked as unused for now
  allMeals: Meal[],
  userHistory: MealHistory[],
  options: { limit: number }
): Recommendation[] {
  const historyMap = new Map(userHistory.map(h => [h.meal_id, new Date(h.last_eaten)]));

  const recommendations = allMeals.map(meal => {
    let score = 100;
    const lastEaten = historyMap.get(meal.id);

    // Score based on recency
    if (lastEaten) {
      const daysSinceLastEaten = differenceInDays(new Date(), lastEaten);
      // Lower score for recently eaten meals
      score -= Math.max(0, (30 - daysSinceLastEaten) * RECENCY_SCORE_WEIGHT);
    }

    // Score based on last prepared date from the meal itself (if history is missing)
    if (!lastEaten && meal.last_prepared) {
        const daysSinceLastPrepared = differenceInDays(new Date(), parseISO(meal.last_prepared));
        score -= Math.max(0, (30 - daysSinceLastPrepared) * RECENCY_SCORE_WEIGHT);
    }

    // Add bonus for variety (this is a simple placeholder for a real variety engine)
    if (meal.meal_type === 'Lunch' || meal.meal_type === 'Dinner') {
        score += MEAL_TYPE_VARIETY_SCORE;
    }

    return {
      meal,
      score: Math.max(0, score), // Ensure score doesn't go below zero
    };
  });

  // Sort recommendations from highest to lowest score
  const sortedRecommendations = recommendations.sort((a, b) => b.score - a.score);

  // Apply the limit
  return sortedRecommendations.slice(0, options.limit);
}
