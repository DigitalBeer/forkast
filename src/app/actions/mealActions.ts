"use server";

import { duplicateMeal as duplicateMealInDb } from "@/lib/data/meals";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath as nextRevalidatePath } from "next/cache";
import type { StorableMeal } from "@/lib/data/meals";

// Define response types for better type safety
export interface DeleteMealResponse {
  success: boolean;
  error?: string;
  mealId?: string;
}

export interface DuplicateMealResponse {
  success: boolean;
  error?: string;
  meal?: StorableMeal;
}

export async function deleteMealAction(
  mealId: string, 
  dependencies: { revalidatePath: (path: string) => void } = { revalidatePath: nextRevalidatePath }
): Promise<DeleteMealResponse> {
  // Input validation
  if (!mealId || typeof mealId !== 'string') {
    return { 
      success: false, 
      error: "Invalid meal ID provided." 
    };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const numericIdRegex = /^\d+$/;
  if (!uuidRegex.test(mealId) && !numericIdRegex.test(mealId)) {
    return { 
      success: false, 
      error: "Invalid meal ID format." 
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  try {
    if (!isAuthenticated || !session?.user) {
      return {
        success: false,
        error: "Unauthorized",
        mealId: mealId,
      };
    }

    const normalizedId = numericIdRegex.test(mealId) ? Number(mealId) : mealId;

    const { data: deletedRows, error: deleteError } = await supabase
      .from("meals")
      .delete()
      .eq("id", normalizedId)
      .eq("user_id", session.user.id)
      .select("id");

    if (deleteError) {
      throw deleteError;
    }

    if (!deletedRows || deletedRows.length === 0) {
      return {
        success: false,
        error: "You don't have permission to delete this meal (or it no longer exists).",
        mealId: mealId,
      };
    }

    dependencies.revalidatePath("/meals");
    return {
      success: true,
      mealId: mealId,
    };
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
      error: errorMessage,
      mealId: mealId
    };
  }
}

export async function duplicateMealAction(
  mealId: string,
  dependencies: { revalidatePath: (path: string) => void } = { revalidatePath: nextRevalidatePath }
): Promise<DuplicateMealResponse> {
  // Input validation
  if (!mealId || typeof mealId !== 'string') {
    return { 
      success: false, 
      error: "Invalid meal ID provided." 
    };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const numericIdRegex = /^\d+$/;
  if (!uuidRegex.test(mealId) && !numericIdRegex.test(mealId)) {
    return { 
      success: false, 
      error: "Invalid meal ID format." 
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;
  const userId = session?.user?.id;

  try {
    const result = await duplicateMealInDb(mealId, isAuthenticated, userId);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    dependencies.revalidatePath("/meals");
    return { 
      success: true,
      meal: result.data
    };
  } catch (error) {
    console.error("Failed to duplicate meal:", error);
    
    let errorMessage = "Failed to duplicate the meal. Please try again.";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
}

