import { createClient } from '@/lib/supabase/client';

const MEALS_STORAGE_KEY = 'anonymous_meals';
const MEAL_PLANS_STORAGE_KEY_PREFIX = 'meal_plan_';

interface LocalStorageMeal {
  id: string;
  name: string;
  meal_type: string;
  description?: string;
  tags: string[];
  ingredients?: string;
  instructions?: string;
  image_url?: string;
  dietary_tags?: string[];
  created_at?: string;
}

/**
 * Detects if there is anonymous data in local storage
 */
export function hasAnonymousData(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const meals = localStorage.getItem(MEALS_STORAGE_KEY);
    if (meals && JSON.parse(meals).length > 0) return true;

    // Check for any meal plan drafts
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(MEAL_PLANS_STORAGE_KEY_PREFIX)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for anonymous data:', error);
    return false;
  }
}

/**
 * Migrates anonymous user data from local storage to Supabase
 * Should be called after successful signup/login
 */
export async function migrateAnonymousData(userId: string): Promise<{
  success: boolean;
  migratedMeals: number;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, migratedMeals: 0, error: 'Not in browser environment' };
  }

  try {
    const supabase = createClient();
    let migratedMeals = 0;

    // Migrate meals
    const mealsData = localStorage.getItem(MEALS_STORAGE_KEY);
    if (mealsData) {
      const localMeals: LocalStorageMeal[] = JSON.parse(mealsData);
      
      if (localMeals.length > 0) {
        // Transform local meals to Supabase format
        const mealsToInsert = localMeals.map(meal => ({
          user_id: userId,
          name: meal.name,
          meal_type: meal.meal_type || 'dinner',
          description: meal.description || '',
          tags: meal.tags || [],
          ingredients: meal.ingredients || '',
          instructions: meal.instructions || '',
          image_url: meal.image_url,
          dietary_tags: meal.dietary_tags || [],
        }));

        const { data, error } = await supabase
          .from('meals')
          .insert(mealsToInsert)
          .select();

        if (error) {
          console.error('Error migrating meals:', error);
          return { success: false, migratedMeals: 0, error: error.message };
        }

        migratedMeals = data?.length || 0;
      }
    }

    // Clear local storage after successful migration
    localStorage.removeItem(MEALS_STORAGE_KEY);
    
    // Clear meal plan drafts
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(MEAL_PLANS_STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    return { success: true, migratedMeals };
  } catch (error) {
    console.error('Error during migration:', error);
    return {
      success: false,
      migratedMeals: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets a preview of data that will be migrated
 */
export function getAnonymousDataPreview(): {
  mealCount: number;
  planDrafts: number;
} {
  if (typeof window === 'undefined') {
    return { mealCount: 0, planDrafts: 0 };
  }

  try {
    let mealCount = 0;
    let planDrafts = 0;

    const mealsData = localStorage.getItem(MEALS_STORAGE_KEY);
    if (mealsData) {
      const meals = JSON.parse(mealsData);
      mealCount = Array.isArray(meals) ? meals.length : 0;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(MEAL_PLANS_STORAGE_KEY_PREFIX)) {
        planDrafts++;
      }
    }

    return { mealCount, planDrafts };
  } catch (error) {
    console.error('Error getting preview:', error);
    return { mealCount: 0, planDrafts: 0 };
  }
}
