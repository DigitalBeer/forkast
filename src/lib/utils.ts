import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Meal ids are `string` at the TypeScript boundary but come from two
// storage backends with incompatible native id types: Supabase's `meals`
// table uses a bigint identity column, while localStorage-backed meals use
// crypto.randomUUID(). These helpers are the single place that tells the
// two apart, instead of each call site re-deriving the same regex.
const MEAL_ID_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MEAL_ID_NUMERIC_REGEX = /^\d+$/;

export function isValidMealId(id: string): boolean {
  return MEAL_ID_UUID_REGEX.test(id) || MEAL_ID_NUMERIC_REGEX.test(id);
}

export function toDbMealId(id: string): string | number {
  return MEAL_ID_NUMERIC_REGEX.test(id) ? Number(id) : id;
}
