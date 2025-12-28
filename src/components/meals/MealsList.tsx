"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { MealCard } from "@/components/meals/MealCard";
import { useMeals } from "@/hooks/useMeals";
import { type Meal } from "@/types/meal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter as nextUseRouter } from "next/navigation";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { toast } from "sonner";
import { deleteMealAction, duplicateMealAction } from "@/app/actions/mealActions";

function sortMeals(meals: Meal[], sort: string): Meal[] {
  switch (sort) {
    case "created-desc":
      return [...meals].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    case "created-asc":
      return [...meals].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    case "name-asc":
      return [...meals].sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return [...meals].sort((a, b) => b.name.localeCompare(a.name));
    case "last-new":
      return [...meals].sort((a, b) =>
        (b.last_prepared ?? "").localeCompare(a.last_prepared ?? "")
      );
    case "last-old":
      return [...meals].sort((a, b) =>
        (a.last_prepared ?? "").localeCompare(b.last_prepared ?? "")
      );
    case "most-used":
      return [...meals].sort((a, b) => (b.usage_count ?? 0) - (a.usage_count ?? 0));
    default:
      return meals;
  }
}

const PAGE_SIZE = 20;

export function MealsList() {
  const { meals, setMeals: setOptimisticMeals, addMealToPlan, loading, error } = useMeals();
  const router = nextUseRouter();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<string>("created-desc");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("");
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null);

  const filteredMeals = useMemo(() => {
    let list = [...meals];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        (m.description?.toLowerCase().includes(q) ?? false) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (mealTypeFilter) {
      list = list.filter((m) => m.meal_type === mealTypeFilter);
    }
    if (tagFilter) {
      list = list.filter((m) => m.tags.includes(tagFilter));
    }
    list = sortMeals(list, sort);
    return list;
  }, [meals, query, sort, tagFilter, mealTypeFilter]);

  const totalPages = useMemo(() => Math.ceil(filteredMeals.length / PAGE_SIZE), [filteredMeals]);

  const visibleMeals = useMemo(
    () => filteredMeals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredMeals, page]
  );

  useEffect(() => {
    setPage(1);
  }, [query, sort, tagFilter, mealTypeFilter]);

  const handleDeleteConfirm = async () => {
    if (!mealToDelete) return;

    const originalMeals = [...meals];
    const mealId = mealToDelete.id;

    setOptimisticMeals(currentMeals => currentMeals.filter(m => m.id !== mealId));
    setMealToDelete(null);

    const result = await deleteMealAction(mealId);

    if (result.success) {
      toast.success(`Meal "${mealToDelete.name}" deleted successfully.`);
      // No need to call the hook's deleteMeal since the action handles it
    } else {
      toast.error(`Failed to delete meal: ${result.error}`);
      setOptimisticMeals(originalMeals);
    }
  };

  const handleDuplicate = async (meal: Meal) => {
    console.log('Duplicating meal:', meal.id, meal.name);
    
    // Create duplicate locally with new ID
    const duplicatedMeal: Meal = {
      ...meal,
      id: crypto.randomUUID(),
      name: `${meal.name} (Copy)`,
      last_prepared: undefined,
      usage_count: 0
    };

    // Optimistically add to UI
    setOptimisticMeals(currentMeals => [...currentMeals, duplicatedMeal]);
    toast.success(`Meal "${meal.name}" duplicated successfully.`);

    // If authenticated, also save to Supabase in background
    try {
      await duplicateMealAction(meal.id);
    } catch (error) {
      console.warn('Background sync to Supabase failed:', error);
      // Don't show error to user since local duplication succeeded
    }
  };

  if (loading) return <div>Loading meals...</div>;
  if (error) return <div className="text-red-500">Error loading meals: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">My Meals</h1>
        <Link href="/meals/new">
          <Button>Add New Meal</Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search meals..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
          data-testid="meals-search"
        />
        <select
          value={mealTypeFilter}
          onChange={(e) => setMealTypeFilter(e.target.value)}
          className="border p-2 rounded-md max-w-sm"
        >
          <option value="">All Meal Types</option>
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Dinner">Dinner</option>
          <option value="Snack">Snack</option>
        </select>
        <Input
          placeholder="Filter by tag..."
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border p-2 rounded-md"
        >
          <option value="created-desc">Newest Added</option>
          <option value="created-asc">Oldest Added</option>
          <option value="name-asc">Sort by Name (A-Z)</option>
          <option value="name-desc">Sort by Name (Z-A)</option>
          <option value="last-new">Last Prepared (Newest)</option>
          <option value="last-old">Last Prepared (Oldest)</option>
          <option value="most-used">Most Used</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visibleMeals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onDelete={() => setMealToDelete(meal)}
            onEdit={() => router.push(`/meals/${meal.id}/edit`)}
            onAddToPlan={() => addMealToPlan(meal)}
            onDuplicate={() => handleDuplicate(meal)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            data-testid="prev-page"
          >
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            data-testid="next-page"
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!mealToDelete}
        onClose={() => setMealToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        description={`Are you sure you want to delete the meal "${mealToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
