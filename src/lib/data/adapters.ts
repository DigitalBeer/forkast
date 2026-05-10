import { createClient } from "@/lib/supabase/client";
import type { MealFormInputs } from "@/components/meals/MealForm";
import type { Meal } from "@/types/meal";
import { MEAL_TYPES } from "@/types/meal";
import { z } from "zod";

// Define schema for LocalStorage format to ensure type safety
const localStorageMealSchema = z.object({
  id: z.string(),
  name: z.string(),
  meal_type: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack']).optional(),
  description: z.string().optional(),
  sourceUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  ingredients: z.string().optional(),
  instructions: z.string().optional(),
  image_url: z.string().optional(),
  last_prepared: z.string().optional(),
  usage_count: z.number().optional()
});

const LOCAL_KEY = "bmad_meals";

// --- Base Adapter --- //

export type StorableMeal = MealFormInputs & { id: string };

export interface StorageAdapter {
  upsert(item: MealFormInputs, id?: string, userId?: string): Promise<StorableMeal | undefined>;
  get(id: string): Promise<StorableMeal | undefined>;
  getAll(): Promise<Meal[]>;
  delete(id: string): Promise<void>;
}

// --- Supabase Adapter --- //

class SupabaseAdapter implements StorageAdapter {
  async upsert(data: MealFormInputs, id?: string, userId?: string) {
    const supabase = createClient();

    // Prefer an already-uploaded URL (set by the /api/upload/meal-image endpoint)
    let imageUrl: string | undefined = (data as { image_url?: string }).image_url || undefined;

    // Fallback: upload a raw File when image_url is not set (e.g. server-side path)
    if (!imageUrl) {
      const maybeImage = (data as { image?: unknown }).image;
      if (maybeImage instanceof File && userId) {
        const file = maybeImage;
        const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';
        const filename = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("meal-images").upload(filename, file, {
          upsert: false,
          contentType: file.type,
        });
        if (uploadError && uploadError.message !== "The resource already exists") throw uploadError;
        const { data: publicUrl } = supabase.storage.from("meal-images").getPublicUrl(filename);
        imageUrl = publicUrl.publicUrl;
      }
    }

    const payload = {
      id,
      user_id: userId,
      name: data.name,
      meal_type: (data as { meal_type?: string }).meal_type,
      description: data.description,
      tags: data.tags ?? [],
      ingredients: data.ingredients,
      instructions: data.instructions,
      image_url: imageUrl,
    };
    const { data: meal, error } = await supabase.from("meals").upsert(payload).select().single();
    if (error) throw error;
    return meal as StorableMeal;
  }

  async get(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase.from("meals").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as StorableMeal | undefined;
  }

  async getAll(): Promise<Meal[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from("meals").select("*");
    if (error) throw error;
    // The data from supabase is the full Meal object, so we can cast it directly.
    return data as Meal[];
  }

  async delete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) throw error;
  }
}

// --- Local Storage Adapter --- //

class LocalStorageAdapter implements StorageAdapter {
  private readLocal(): StorableMeal[] {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    } catch {
      return [];
    }
  }

  private writeLocal(meals: StorableMeal[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(meals));
  }

  async upsert(data: MealFormInputs, id?: string, _userId?: string) {
    const meals = this.readLocal();
    if (id) {
      const idx = meals.findIndex((m) => m.id === id);
      if (idx >= 0) {
        meals[idx] = { ...meals[idx], ...data } as StorableMeal;
      }
    } else {
      const newId = crypto.randomUUID();
      meals.push({ ...data, id: newId });
      id = newId;
    }
    this.writeLocal(meals);
    return meals.find((m) => m.id === id);
  }

  async get(id: string) {
    const meals = this.readLocal();
    return meals.find((m) => m.id === id);
  }

  async getAll(): Promise<Meal[]> {
    const storableMeals = this.readLocal();
    // Validate and map LocalStorageMeal to Meal using Zod schema
    return storableMeals
      .map(sm => {
        const validation = localStorageMealSchema.safeParse(sm);
        if (!validation.success) {
          console.warn('Invalid meal data in localStorage:', sm, validation.error);
          return null;
        }
        const validated = validation.data;
        return {
          ...validated,
          // Ensure required Meal fields exist with proper defaults
          meal_type: validated.meal_type ?? MEAL_TYPES[0],
          description: validated.description ?? "",
          tags: validated.tags ?? [],
          ingredients: validated.ingredients ? this.parseIngredients(validated.ingredients) : [],
          instructions: validated.instructions ?? "",
          sourceUrl: validated.sourceUrl ?? "",
        } as Meal;
      })
      .filter((meal): meal is Meal => meal !== null);
  }

  private parseIngredients(ingredientsStr: string): Meal['ingredients'] {
    try {
      // Simple parsing of ingredients string to array
      if (!ingredientsStr || ingredientsStr.trim() === '') return [];
      // This is a basic parser - you might want to enhance it based on your format
      return ingredientsStr.split(',').map(ing => {
        const parts = ing.trim().split(' ');
        if (parts.length >= 2) {
          const quantity = parseFloat(parts[0]);
          const unit = parts[1];
          const name = parts.slice(2).join(' ');
          return {
            name: name || ing.trim(),
            quantity: isNaN(quantity) ? 1 : quantity,
            unit: unit || 'unit'
          };
        }
        return {
          name: ing.trim(),
          quantity: 1,
          unit: 'unit'
        };
      });
    } catch {
      return [];
    }
  }

  async delete(id: string) {
    let meals = this.readLocal();
    meals = meals.filter((m) => m.id !== id);
    this.writeLocal(meals);
  }
}

// --- Factory --- //

function getMealAdapter(isAuthenticated: boolean): StorageAdapter {
  if (isAuthenticated) {
    return new SupabaseAdapter();
  }
  return new LocalStorageAdapter();
}

// Internal exports for meals.ts only - not for public API
/** @internal */
export { SupabaseAdapter, LocalStorageAdapter, getMealAdapter };
