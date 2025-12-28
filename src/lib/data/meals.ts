import { SupabaseAdapter, LocalStorageAdapter, getMealAdapter } from "./adapters";
import type { StorableMeal } from "./adapters";

// Re-export StorableMeal for public API
export type { StorableMeal };

// Unified upsert function that handles storage logic internally
export async function upsertMeal(data: MealFormInputs, id?: string): Promise<ServiceResponse<StorableMeal>> {
  // Get auth state from the store
  const authState = typeof window !== 'undefined' ? 
    (await import('@/store/auth')).useAuthStore.getState() : 
    { user: null };
  
  const isAuthenticated = !!authState.user;
  const userId = authState.user?.id;
  
  // Prefer server-backed storage in the browser (cookie-based auth may exist even if Zustand isn't hydrated yet).
  if (typeof window !== 'undefined') {
    const supabaseResult = await upsertMealSupabase(data, id, userId);
    if (supabaseResult.success) return supabaseResult;

    // Fallback to local storage only when unauthenticated.
    if (supabaseResult.error === 'Unauthorized') {
      return upsertMealLocal(data, id);
    }

    return supabaseResult;
  }

  // Server-side execution path
  if (isAuthenticated) {
    return upsertMealSupabase(data, id, userId);
  }

  return upsertMealLocal(data, id);
}
import type { MealFormInputs } from "@/components/meals/MealForm";
import type { Meal } from "@/types/meal";
import { mealSchema } from "@/components/meals/MealForm";
import { MealHistoryService } from "./meal-history.service";

// Define response types for better type safety
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const supabaseAdapter = new SupabaseAdapter();
const localAdapter = new LocalStorageAdapter();

export async function upsertMealSupabase(
  data: MealFormInputs,
  id?: string,
  userId?: string
): Promise<ServiceResponse<StorableMeal>> {
  // Input validation using Zod schema
  const validation = mealSchema.safeParse(data);
  if (!validation.success) {
    return { 
      success: false, 
      error: `Invalid meal data: ${validation.error.errors.map(e => e.message).join(', ')}` 
    };
  }
  
  try {
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id }),
      });

      if (response.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        return {
          success: false,
          error: payload?.error || 'Failed to save meal',
        };
      }

      const result = (await response.json()) as StorableMeal;
      return { success: true, data: result };
    }

    const result = await supabaseAdapter.upsert(data, id, userId);
    
    // Record history if this is an update (id exists) and user is authenticated
    if (id && userId) {
      try {
        await MealHistoryService.recordMealAction(
          result.id, 
          'planned',
          { source: 'upsertMealSupabase' }
        );
      } catch (historyError) {
        console.error('Failed to record meal history:', historyError);
        // Don't fail the main operation if history recording fails
      }
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to upsert meal in Supabase:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred while saving meal to Supabase" 
    };
  }
}

export async function upsertMealLocal(
  data: MealFormInputs,
  id?: string
): Promise<ServiceResponse<StorableMeal>> {
  // Input validation using Zod schema
  const validation = mealSchema.safeParse(data);
  if (!validation.success) {
    return { 
      success: false, 
      error: `Invalid meal data: ${validation.error.errors.map(e => e.message).join(', ')}` 
    };
  }
  
  try {
    const result = await localAdapter.upsert(data, id);
    if (!result) {
      return { 
        success: false, 
        error: "Failed to save meal to local storage - storage returned undefined" 
      };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to upsert meal in local storage:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred while saving meal to local storage" 
    };
  }
}

export async function getMeal(
  id: string,
  isAuthenticated: boolean,
  userId?: string
): Promise<ServiceResponse<StorableMeal | undefined>> {
  // Input validation
  if (!id || typeof id !== 'string') {
    return { 
      success: false, 
      error: "Invalid meal ID provided." 
    };
  }

  try {
    const adapter = getMealAdapter(isAuthenticated);
    const result = await adapter.get(id);
    
    // Record view history if user is authenticated and has a userId
    if (result && isAuthenticated && userId) {
      try {
        await MealHistoryService.recordMealAction(
          result.id,
          'viewed',
          { source: 'getMeal' }
        );
      } catch (historyError) {
        console.error('Failed to record meal view history:', historyError);
        // Don't fail the main operation if history recording fails
      }
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get meal:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred while retrieving meal" 
    };
  }
}

export async function getAllMeals(isAuthenticated: boolean): Promise<ServiceResponse<Meal[]>> {
  try {
    if (isAuthenticated && typeof window !== 'undefined') {
      const response = await fetch('/api/meals');
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        return { success: false, error: payload?.error || 'Failed to load meals' };
      }

      const result = (await response.json()) as Meal[];
      return { success: true, data: result };
    }

    const adapter = getMealAdapter(isAuthenticated);
    const result = await adapter.getAll();
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get all meals:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred while retrieving meals" 
    };
  }
}

export async function deleteMeal(id: string, isAuthenticated: boolean): Promise<ServiceResponse<void>> {
  // Basic validation
  if (!id || typeof id !== 'string') {
    return { 
      success: false, 
      error: "Invalid meal ID provided." 
    };
  }
  try {
    const adapter = getMealAdapter(isAuthenticated);
    await adapter.delete(id);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete meal:", error);
    
    // More detailed error handling
    let errorMessage = "Failed to delete the meal. Please try again.";
    
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes("constraint")) {
        errorMessage = "Cannot delete meal due to existing dependencies.";
      } else if (error.message.includes("permission")) {
        errorMessage = "You don't have permission to delete this meal.";
      }
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
}

export async function duplicateMeal(
  id: string,
  isAuthenticated: boolean,
  userId?: string
): Promise<ServiceResponse<StorableMeal>> {
  // Input validation
  if (!id || typeof id !== 'string') {
    return { 
      success: false, 
      error: "Invalid meal ID provided." 
    };
  }

  try {
    console.log('[duplicateMeal] Starting duplication for meal:', id, 'isAuthenticated:', isAuthenticated);
    
    // Try to get the original meal from the appropriate adapter
    const adapter = getMealAdapter(isAuthenticated);
    console.log('[duplicateMeal] Got adapter:', adapter.constructor.name);
    
    let originalMeal = await adapter.get(id);
    console.log('[duplicateMeal] Original meal from primary adapter:', originalMeal ? originalMeal.name : 'NOT FOUND');
    
    // If authenticated but not found in Supabase, try localStorage
    if (!originalMeal && isAuthenticated) {
      console.log('[duplicateMeal] Trying localStorage fallback...');
      const localAdapter = new LocalStorageAdapter();
      originalMeal = await localAdapter.get(id);
      console.log('[duplicateMeal] Original meal from localStorage:', originalMeal ? originalMeal.name : 'NOT FOUND');
    }
    
    if (!originalMeal) {
      return { 
        success: false, 
        error: "Meal not found in either Supabase or localStorage." 
      };
    }

    // Create a copy with modified name
    const mealData: MealFormInputs = {
      name: `${originalMeal.name} (Copy)`,
      meal_type: originalMeal.meal_type,
      description: originalMeal.description || '',
      sourceUrl: originalMeal.sourceUrl || '',
      ingredients: originalMeal.ingredients || '',
      instructions: originalMeal.instructions || '',
      tags: originalMeal.tags || []
    };

    console.log('[duplicateMeal] Meal data prepared:', mealData.name);

    // Validate the meal data
    const validation = mealSchema.safeParse(mealData);
    if (!validation.success) {
      console.error('[duplicateMeal] Validation failed:', validation.error);
      return { 
        success: false, 
        error: `Invalid meal data: ${validation.error.errors.map(e => e.message).join(', ')}` 
      };
    }

    console.log('[duplicateMeal] Validation passed, creating duplicate...');

    // Create the duplicate
    const result = await adapter.upsert(mealData, undefined, userId);
    
    console.log('[duplicateMeal] Duplicate created successfully:', result?.id);
    return { success: true, data: result };
  } catch (error) {
    console.error("[duplicateMeal] ERROR:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred while duplicating meal" 
    };
  }
}
