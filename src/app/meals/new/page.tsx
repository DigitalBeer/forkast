"use client";

import Head from "next/head";
import { useRouter } from "next/navigation";
import { MealForm, type MealFormInputs } from "@/components/meals/MealForm";
import { upsertMeal } from "@/lib/data/meals";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";

export default function NewMealPage() {
  const router = useRouter();
  const { canAddMeals, mealCount, mealLimit, loading } = useSubscription();

  async function handleSubmit(data: MealFormInputs) {
    // Check if user can add more meals
    if (!canAddMeals) {
      toast.error("You've reached the free tier limit. Upgrade to Premium for unlimited meals.");
      return;
    }

    console.log("NewMealPage handleSubmit called with data:", data);
    try {
      const result = await upsertMeal(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save meal');
      }

      toast.success("Meal successfully created");
      router.push("/meals");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save meal");
    }
  }

  return (
    <>
      <Head>
        <title>Add Meal | Forkast</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center py-6 px-4">
        <div className="w-full max-w-lg">
          <h1 className="mb-4 text-2xl font-semibold">Add New Meal</h1>
          {loading ? (
            <div className="p-8">Loading...</div>
          ) : !canAddMeals ? (
            <UpgradePrompt mealCount={mealCount} mealLimit={mealLimit} variant="modal" />
          ) : (
            <MealForm onSubmit={handleSubmit} />
          )}
        </div>
      </main>
    </>
  );
}
