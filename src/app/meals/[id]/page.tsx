'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { getMeal } from '@/lib/data/meals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { MealImage } from '@/components/meals/MealImage';
import { formatDistanceToNow } from 'date-fns';
import { useImageUpload } from '@/hooks/useImageUpload';
import { toast } from 'sonner';

import type { Meal, Ingredient } from '@/types/meal';

export default function MealDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removeImageLoading, setRemoveImageLoading] = useState(false);

  // Helper function to normalize ingredients
  const normalizeIngredients = (
    ingredients: Ingredient[] | string | undefined,
  ): Ingredient[] => {
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
        setError(err instanceof Error ? err.message : 'Failed to load meal');
      } finally {
        setLoading(false);
      }
    }
    fetchMeal();
  }, [params?.id, user]);

  const { deleteImage } = useImageUpload();

  const handleRemoveImage = async () => {
    if (!meal?.image_url) return;
    setRemoveImageLoading(true);
    try {
      // Step 1: Delete from storage — only proceed if successful
      const deleted = await deleteImage(meal.image_url);
      if (!deleted) {
        toast.error('Failed to remove image from storage. Please try again.');
        setRemoveImageLoading(false);
        return;
      }

      // Step 2: Update meal record to clear image_url
      // Only send image_url — name omitted to avoid stale-overwrite race
      const updateRes = await fetch('/api/meals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: meal.id, image_url: null }),
      });

      if (!updateRes.ok) {
        const payload = (await updateRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? 'Failed to update meal');
      }

      // Step 3: Update local state
      setMeal(prev => (prev ? { ...prev, image_url: undefined } : null));
      toast.success('Image removed');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to remove image';
      toast.error(message);
    } finally {
      setRemoveImageLoading(false);
    }
  };

  if (loading)
    return <p className="p-4 text-sm text-muted-foreground">Loading...</p>;
  if (error) return <p className="p-4 text-sm text-destructive">{error}</p>;
  if (!meal) return <p className="p-4 text-sm">Meal not found.</p>;

  return (
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
                <div className="flex flex-col items-center gap-2">
                  <MealImage
                    src={meal.image_url}
                    alt={meal.name}
                    size="full"
                    className="w-full md:w-64 h-48 md:h-64"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={removeImageLoading}
                    className="text-destructive hover:text-destructive"
                  >
                    {removeImageLoading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-1" />
                    )}
                    Remove Image
                  </Button>
                </div>
              )}

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {meal.name}
                </h1>

                {meal.meal_type && (
                  <Badge variant="secondary" className="mb-4">
                    {meal.meal_type}
                  </Badge>
                )}

                {meal.last_prepared && (
                  <p className="text-sm text-gray-500 mb-4">
                    Last made{' '}
                    {formatDistanceToNow(new Date(meal.last_prepared), {
                      addSuffix: true,
                    })}
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
                {meal.tags.map(tag => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients */}
          {(() => {
            const normalizedIngredients = normalizeIngredients(
              meal.ingredients,
            );
            return (
              normalizedIngredients.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold mb-3">Ingredients</h2>
                  <div className="space-y-2">
                    {normalizedIngredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b last:border-0"
                      >
                        <span className="font-medium">{ingredient.name}</span>
                        <span className="text-gray-500">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
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
  );
}
