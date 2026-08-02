export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Meal {
  id: string;
  name: string;
  meal_type?: MealType;
  description?: string;
  image_url?: string;
  sourceUrl?: string;
  tags: string[];
  ingredients?: Ingredient[] | string; // Allow both array and string formats
  instructions?: string;
  created_at?: string;
  last_prepared?: string; // ISO date string
  usage_count?: number;
}

// Meal shape returned by the meal-plans API (uses `type`/`thumbnail` instead of `meal_type`/`image_url`)
export interface MealPlanMeal {
  id: string;
  name: string;
  type: string;
  thumbnail?: string;
  image_url?: string;
}

export interface MealPlanData {
  id: string;
  startDate: string;
  endDate: string;
  meals: {
    [date: string]: {
      breakfast?: MealPlanMeal;
      lunch?: MealPlanMeal;
      dinner?: MealPlanMeal;
    };
  };
}

// Filter types for meal suggestions
export interface MealSuggestionFilters {
  mealTypes?: string[];  // e.g., ["breakfast", "lunch", "dinner"]
  dietaryTypes?: string[]; // e.g., ["vegetarian", "gluten-free"]
}

export interface MealSuggestionRequest {
  startDate?: string;  // ISO date string
  days?: number;       // Number of days to plan for
  filters?: MealSuggestionFilters;
}

export interface MealSuggestionResponse {
  date: string;       // ISO date string
  mealType: string;   // e.g., "breakfast", "lunch", "dinner"
  meal: Meal;         // The suggested meal object
  reason?: string;    // Optional explanation for the suggestion
}

// Common meal types and dietary restrictions
export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
export const DIETARY_TYPES = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo'] as const;

export type MealType = typeof MEAL_TYPES[number];
export type DietaryType = typeof DIETARY_TYPES[number];

// Meal types that can occupy a meal-plan slot. `planned_meals.meal_type` has
// a DB CHECK constraint of only 'breakfast' | 'lunch' | 'dinner' (no snack) —
// see REMEDIATION-PLAN.md C4. These are the single conversion point between
// the app's capitalized MealType and the DB's lowercase stored value.
export type PlannableMealType = Exclude<MealType, 'Snack'>;

export function toDbMealType(type: PlannableMealType): 'breakfast' | 'lunch' | 'dinner' {
  return type.toLowerCase() as 'breakfast' | 'lunch' | 'dinner';
}

export function fromDbMealType(type: string): PlannableMealType {
  switch (type.toLowerCase()) {
    case 'breakfast':
      return 'Breakfast';
    case 'lunch':
      return 'Lunch';
    default:
      return 'Dinner';
  }
}
