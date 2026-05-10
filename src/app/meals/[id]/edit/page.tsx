"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { MealForm, type MealFormInputs } from "@/components/meals/MealForm";
import { getMeal, upsertMeal } from "@/lib/data/meals";
import { toast } from "sonner";

import type { Meal } from "@/types/meal";

type IngredientFormValue = {
  name: string;
  quantity: number;
  unit: string;
};

function normalizeIngredients(value: unknown): IngredientFormValue[] {
  if (!value) return [];

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return normalizeIngredients(parsed);
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const obj = item as Record<string, unknown>;
        const name = typeof obj.name === 'string' ? obj.name : '';
        const unit = typeof obj.unit === 'string' ? obj.unit : '';
        const rawQty = obj.quantity;
        const qtyNumber =
          typeof rawQty === 'number'
            ? rawQty
            : typeof rawQty === 'string'
              ? Number.parseFloat(rawQty)
              : NaN;
        const quantity = Number.isFinite(qtyNumber) && qtyNumber > 0 ? qtyNumber : 1;

        if (!name || !unit) return null;
        return { name, quantity, unit } satisfies IngredientFormValue;
      })
      .filter((x): x is IngredientFormValue => x !== null);
  }

  return [];
}

export default function EditMealPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing meal
  useEffect(() => {
    async function fetchMeal() {
      if (!params?.id) return;
      setLoading(true);
      try {
        const response = await getMeal(params.id, !!user);
        if (response.success && response.data) {
          setMeal(response.data as Meal);
        } else {
          throw new Error(response.error || 'Failed to fetch meal data');
        }
      } catch (err: unknown) {  
        setError(err instanceof Error ? err.message : "Failed to load meal");
      } finally {
        setLoading(false);
      }
    }
    fetchMeal();
  }, [params?.id, user]);

  async function handleSubmit(data: MealFormInputs) {
    if (!params?.id) return;
    try {
      const result = await upsertMeal(data, params.id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save meal');
      }
      toast.success("Meal successfully updated");
      router.push("/meals");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save meal");
    }
  }

  if (loading) return <p className="p-4 text-sm text-muted-foreground">Loading...</p>;
  if (error) return <p className="p-4 text-sm text-destructive">{error}</p>;
  if (!meal) return <p className="p-4 text-sm">Meal not found.</p>;

  const defaults: MealFormInputs = {
    name: meal.name,
    meal_type: meal.meal_type,
    description: meal.description ?? "",
    tags: meal.tags ?? [],
    ingredients: normalizeIngredients(meal.ingredients),
    instructions: meal.instructions ?? "",
    image_url: meal.image_url ?? "",
  };

  return (
    <main className="flex min-h-screen flex-col items-center py-6 px-4">
        <div className="w-full max-w-lg">
          <h1 className="mb-4 text-2xl font-semibold">Edit Meal</h1>
          <MealForm defaultValues={defaults} onSubmit={handleSubmit} />
        </div>
    </main>
  );
}
