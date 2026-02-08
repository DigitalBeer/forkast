"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/store/auth";
import { type Meal } from "@/types/meal";
import { getAllMeals, deleteMeal } from "@/lib/data/meals";

export function useMeals() {
  const { user } = useAuthStore();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllMeals(!!user);
      if (result.success && result.data) {
        setMeals(result.data);
      } else {
        throw new Error(result.error || 'Failed to load meals');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load meals";
      console.error("useMeals: fetch failed.", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const handleDeleteMeal = async (id: string) => {
    try {
      const result = await deleteMeal(id, !!user);
      if (result.success) {
        setMeals((prev) => prev.filter((m) => m.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete meal');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete meal";
      setError(message);
    }
  };

  function addMealToPlan(_meal: Meal) {
    // Integration placeholder – will be implemented in plan context
  }

  return {
    meals,
    setMeals,
    addMealToPlan,
    deleteMeal: handleDeleteMeal,
    loading,
    error,
    refetch: fetchMeals,
  };
}
