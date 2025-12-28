import { createClient } from '@/lib/supabase/client';
import { MealSuggestionRequest, MealSuggestionResponse } from '../../types/meal';

export interface MealSuggestion {
  id: string;
  name: string;
  image_url?: string;
  meal_type?: string;
  last_prepared?: string; // ISO date string
  meal?: {
    id: string;
    name: string;
    image_url?: string;
    meal_type?: string;
    last_prepared?: string;
  };
}

/**
 * Fetches meal suggestions from the Supabase Edge Function.
 * @returns {Promise<MealSuggestion[]>} A promise that resolves to an array of meal suggestions.
 */
export async function getMealSuggestions(opts?: { skipCache?: boolean }): Promise<MealSuggestion[]> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('get-meal-suggestions', {
    method: 'POST',
    body: opts?.skipCache ? { skipCache: true } : {},
  });

  if (error) {
    console.error('Error fetching meal suggestions:', error);
    throw new Error('Failed to fetch meal suggestions.');
  }

  return data || [];
}

/**
 * Fetches filtered meal suggestions from the Supabase Edge Function.
 * @param {MealSuggestionRequest} request - The filter parameters
 * @returns {Promise<MealSuggestionResponse[]>} A promise that resolves to an array of filtered meal suggestions.
 */
export async function getFilteredMealSuggestions(
  request: MealSuggestionRequest,
  opts?: { skipCache?: boolean }
): Promise<MealSuggestionResponse[]> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('get-meal-suggestions', {
    method: 'POST',
    body: opts?.skipCache ? { ...request, skipCache: true } : request,
  });

  if (error) {
    console.error('Error fetching filtered meal suggestions:', error);
    throw new Error('Failed to fetch filtered meal suggestions.');
  }

  return data || [];
}
