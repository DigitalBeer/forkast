"use client";

import Head from "next/head";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { getMeal } from "@/lib/data/meals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

import type { Meal, Ingredient } from "@/types/meal";

export default function MealDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to normalize ingredients
  const normalizeIngredients = (ingredients: Ingredient[] | string | undefined): Ingredient[] => {
    if (!ingredients) return [];
    
    if (typeof ingredients === 'string') {
      try {
        return JSON.parse(ingredients);
      } catch {
        return [];
      }
    }
    
    if (Array.isArray(ingredients)) {
      return ingredients;
    }
    
    return [];
  };

  // Fetch meal data
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

  if (loading) return <p className="p-4 text-sm text-muted-foreground">Loading...</p>;
  if (error) return <p className="p-4 text-sm text-destructive">{error}</p>;
  if (!meal) return <p className="p-4 text-sm">Meal not found.</p>;

  return (
    <>
      <Head>
        <title>{meal.name} | Forkast</title>
      </Head>
      <main className="flex min-h-screen flex-col">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Link href={`/meals/${meal.id}/edit`}>
                <Button>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Meal
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Meal Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                {meal.image_url && (
                  <div className="relative w-full md:w-64 h-48 md:h-64">
                    <Image
                      src={meal.image_url}
                      alt={meal.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
                
                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{meal.name}</h1>
                  
                  {meal.meal_type && (
                    <Badge variant="secondary" className="mb-4">
                      {meal.meal_type}
                    </Badge>
                  )}
                  
                  {meal.last_prepared && (
                    <p className="text-sm text-gray-500 mb-4">
                      Last made {formatDistanceToNow(new Date(meal.last_prepared), { addSuffix: true })}
                    </p>
                  )}
                  
                  {meal.description && (
                    <p className="text-gray-700 mb-4">{meal.description}</p>
                  )}
                  
                  {meal.sourceUrl && (
                    <a
                      href={meal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Recipe Source
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {meal.tags && meal.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {meal.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients */}
            {(() => {
              const normalizedIngredients = normalizeIngredients(meal.ingredients);
              return normalizedIngredients.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold mb-3">Ingredients</h2>
                  <div className="space-y-2">
                    {normalizedIngredients.map((ingredient, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="font-medium">{ingredient.name}</span>
                        <span className="text-gray-500">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Instructions */}
            {meal.instructions && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-3">Instructions</h2>
                <div className="whitespace-pre-wrap text-gray-700">
                  {meal.instructions}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
