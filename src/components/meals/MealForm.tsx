"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray, FieldErrors } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TagAutocomplete } from "@/components/ui/TagAutocomplete";
import { useTags } from "@/hooks/useTags";
import { useAuthStore } from "@/store/auth";
import { useHydration } from "@/hooks/useHydration";
import { MeasurementConverter } from "@/components/common/MeasurementConverter";
import { getUnitCategory } from "@/lib/measurements/conversions";
import { useSubscription } from "@/hooks/useSubscription";
import { RecipeImportModal } from "./RecipeImportModal";
import { Crown, Link as LinkIcon } from "lucide-react";
import type { ScrapedRecipe } from "@/lib/scraping/types";

// Validation schema
// Helper function to validate URLs more flexibly
const isValidUrl = (value: string) => {
  if (!value) return true; // Empty is valid (optional field)
  try {
    // Add https:// if no protocol is specified
    const url = value.includes('://') ? value : `https://${value}`;
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const mealSchema = z.object({
  name: z.string().min(1, "Name is required"),
  meal_type: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack']).optional()
  ),
  description: z.string().optional(),
  sourceUrl: z.string()
    .refine(value => !value || isValidUrl(value), {
      message: "Please enter a valid URL (e.g., example.com or http://example.com)",
    })
    .transform(value => {
      if (!value) return '';
      // Add https:// if no protocol is specified
      return value.includes('://') ? value : `https://${value}`;
    })
    .optional(),
  tags: z.string().array().optional(),
  ingredients: z
    .object({
      name: z.string().optional().default(""),
      quantity: z.preprocess(
        (value) => {
          if (value === "" || value === null || value === undefined) return undefined;
          if (typeof value === 'number' && Number.isNaN(value)) return undefined;
          return value;
        },
        z.coerce.number().positive("Qty must be >0").optional()
      ),
      unit: z.string().optional().default(""),
    })
    .superRefine((ingredient, ctx) => {
      const hasAny =
        (ingredient.name ?? "").trim().length > 0 ||
        (ingredient.quantity !== undefined && Number.isFinite(ingredient.quantity)) ||
        (ingredient.unit ?? "").trim().length > 0;

      if (!hasAny) return;

      if (!(ingredient.name ?? "").trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Ingredient required' });
      }

      if (ingredient.quantity === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['quantity'], message: 'Qty must be >0' });
      }

      if (!(ingredient.unit ?? "").trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['unit'], message: 'Unit is required' });
      }
    })
    .array()
    .optional()
    .default([]),
  image: z.any().optional(),
  instructions: z.string().optional(),
});

export type MealFormInputs = z.infer<typeof mealSchema>;

export interface MealFormProps {
  defaultValues?: MealFormInputs;
  onSubmit: (data: MealFormInputs) => Promise<void> | void;
  submitLabel?: string;
  className?: string;
}

export function MealForm({ defaultValues, onSubmit, submitLabel = "Save Meal", className }: MealFormProps) {
  const { control, register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useForm<MealFormInputs>({
    reValidateMode: 'onChange',
    resolver: zodResolver(mealSchema),
    defaultValues: defaultValues ?? {
      name: "",
      description: "",
      tags: [],
      sourceUrl: "",
      ingredients: [{ name: "", quantity: undefined, unit: "" }],
      instructions: "",
    },
  });

  // Log when the component unmounts for debugging test pollution
  useEffect(() => {
    return () => {
      console.log('MealForm unmounted');
    };
  }, []);

  const {
    fields: ingredientFields,
    append: addIngredient,
    remove: removeIngredient,
  } = useFieldArray({ control, name: "ingredients" });

  useEffect(() => {
    if (ingredientFields.length === 0) {
      addIngredient({ name: "", quantity: undefined, unit: "" });
    }
  }, [ingredientFields.length, addIngredient]);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [converterOpen, setConverterOpen] = useState<number | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const { user } = useAuthStore();
  const { tags: availableTags, createTag } = useTags();
  const hydrated = useHydration();
  const { isPremium, loading: subscriptionLoading } = useSubscription();

  const handleTagsChange = (tags: string[]) => {
    setValue("tags", tags, { shouldValidate: true });
  };

  const handleCreateTag = async (tagName: string) => {
    if (!hydrated || !user) return null;
    const newTag = await createTag(tagName);
    // Adapt the returned object to match the expected type
    if (newTag) {
      return { id: newTag.id, name: newTag.name };
    }
    return null;
  };

  const submit = async (data: MealFormInputs) => {
    console.log("MealForm submit handler called.");
    const cleaned = {
      ...data,
      ingredients: (data.ingredients ?? []).filter(i => i.name.trim()),
    } as MealFormInputs;
    console.log("Cleaned data to be submitted:", cleaned);
    await onSubmit(cleaned);
  }

  const onFormError = (errors: FieldErrors) => {
    console.error("Form validation errors:", errors);
  };

  const handleRecipeImport = (recipe: ScrapedRecipe) => {
    // Check if there's already content in the ingredients or instructions
    const currentIngredients = watch("ingredients") || [];
    const hasExistingData = (currentIngredients.some(ing => ing.name.trim().length > 0)) ||
      (watch("instructions")?.trim().length || 0) > 0 ||
      (watch("name")?.trim().length || 0) > 0;

    if (hasExistingData) {
      if (!window.confirm('Importing this recipe will replace your current form data. Are you sure you want to proceed?')) {
        return;
      }
    }

    // Populate form with scraped data
    setValue("name", recipe.name, { shouldValidate: true });
    setValue("sourceUrl", recipe.sourceUrl, { shouldValidate: true });
    setValue("instructions", recipe.instructions, { shouldValidate: true });

    // Convert ingredients to form format
    const importedIngredients = recipe.ingredients.map(ing => ({
      name: ing,
      quantity: undefined,
      unit: "",
    }));

    // Replace existing ingredients with imported ones
    if (importedIngredients.length > 0) {
      // Clear current ingredients and add new ones
      while (ingredientFields.length > 0) {
        removeIngredient(0);
      }
      importedIngredients.forEach(ing => addIngredient(ing));
    }
  };

  return (
    <form onSubmit={handleSubmit(submit, onFormError)} className={cn("space-y-6", className)} noValidate aria-label="Meal information form" aria-busy={isSubmitting} data-testid="meal-form">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="name">
          Meal Name<span className="text-destructive" aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </label>
        <Input
          id="name"
          placeholder="Tacos"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          disabled={isSubmitting}
          {...register("name", { required: true })}
          required
        />
        {errors.name && (
          <p id="name-error" className="text-xs text-destructive mt-1" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Import from URL - Premium Feature */}
      <div className="relative">
        {!subscriptionLoading && (
          isPremium ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              className="w-full sm:w-auto"
              data-testid="import-from-url-button"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Import from URL
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled
                className="w-full sm:w-auto opacity-70"
                data-testid="import-from-url-button-disabled"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Import from URL
              </Button>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Crown className="w-4 h-4 text-yellow-600" />
                <span>Premium feature -</span>
                <Link href="/pricing" className="text-primary hover:underline">
                  Upgrade
                </Link>
              </div>
            </div>
          )
        )}
      </div>

      <RecipeImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleRecipeImport}
      />

      {/* Source URL */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="sourceUrl">
          Source URL
        </label>
        <Input
          id="sourceUrl"
          type="text"
          placeholder="example.com/recipe"
          {...register("sourceUrl")}
          onBlur={(e) => {
            // Auto-format the URL when the field loses focus
            const value = e.target.value.trim();
            if (value && !value.match(/^https?:\/\//)) {
              setValue('sourceUrl', `https://${value}`, { shouldValidate: true });
            }
          }}
        />
        {errors.sourceUrl && (
          <p className="text-xs text-destructive mt-1" role="alert">{errors.sourceUrl.message}</p>
        )}
      </div>

      {/* Meal Type */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="meal_type">
          Meal Type
        </label>
        <select
          id="meal_type"
          className="w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          {...register("meal_type")}
        >
          <option value="">Select meal type...</option>
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Dinner">Dinner</option>
          <option value="Snack">Snack</option>
        </select>
        {errors.meal_type && <p className="text-xs text-destructive mt-1" role="alert">{errors.meal_type.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className="w-full h-20 rounded-md border border-input px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="A quick description"
          {...register("description")}
        />
        {errors.description && <p className="text-xs text-destructive mt-1" role="alert">{errors.description.message}</p>}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="tags">
          Tags
        </label>
        <TagAutocomplete
          value={watch("tags") || []}
          onChange={handleTagsChange}
          suggestions={availableTags.map(tag => tag.name)}
          onCreateTag={handleCreateTag}
          placeholder="Add tags..."
          disabled={isSubmitting}
        />
      </div>




      {/* Ingredients */}
      <fieldset className="space-y-2" disabled={isSubmitting}>
        <legend className="block text-sm font-medium mb-1">Ingredients</legend>
        <div className="space-y-3">
          {ingredientFields.map((field, index) => (
            <div key={field.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <div className="flex-1 w-full space-y-1">
                <label htmlFor={`ingredient-${index + 1}-name`} className="sr-only">
                  Ingredient {index + 1} name
                </label>
                <Input
                  id={`ingredient-${index + 1}-name`} data-testid={`ingredient-${index + 1}-name`}
                  placeholder="e.g., Flour"
                  aria-invalid={!!errors.ingredients?.[index]?.name}
                  aria-describedby={errors.ingredients?.[index]?.name ? `ingredient-${index + 1}-error` : undefined}
                  {...register(`ingredients.${index}.name` as const)}
                  className="w-full"
                />
                {errors.ingredients?.[index]?.name && (
                  <p id={`ingredient-${index + 1}-error`} className="text-xs text-destructive mt-1" role="alert">
                    {errors.ingredients[index]?.name?.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <div className="w-24">
                  <label htmlFor={`ingredient-${index + 1}-quantity`} className="sr-only">
                    Quantity
                  </label>
                  <Input
                    id={`ingredient-${index + 1}-quantity`} data-testid={`ingredient-${index + 1}-quantity`}
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Qty"
                    aria-label={`Quantity for ingredient ${index + 1}`}
                    {...register(`ingredients.${index}.quantity`)}
                    className="w-full"
                  />
                </div>

                <div className="w-20">
                  <label htmlFor={`ingredient-${index + 1}-unit`} className="sr-only">
                    Unit
                  </label>
                  <select
                    id={`ingredient-${index + 1}-unit`} data-testid={`ingredient-${index + 1}-unit`}
                    className="w-full border rounded-md px-2 py-2 text-sm h-10 bg-background"
                    aria-label={`Unit for ingredient ${index + 1}`}
                    {...register(`ingredients.${index}.unit` as const)}
                  >
                    <option value="">-</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                    <option value="ml">ml</option>
                    <option value="cup">cup</option>
                    <option value="tsp">tsp</option>
                    <option value="tbsp">tbsp</option>
                    <option value="pinch">pinch</option>
                  </select>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 px-2 shrink-0 text-xs"
                  aria-label={`Convert units for ingredient ${index + 1}`}
                  data-testid={`convert-ingredient-${index + 1}`}
                  onClick={() => setConverterOpen(converterOpen === index ? null : index)}
                  disabled={!getUnitCategory(watch(`ingredients.${index}.unit`) || "")}
                >
                  Convert
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  aria-label={`Remove ingredient ${index + 1}`}
                  onClick={() => removeIngredient(index)}
                >
                  <span aria-hidden="true">✕</span>
                </Button>
              </div>
              {converterOpen === index && (
                <div className="w-full mt-2 print:hidden">
                  <MeasurementConverter
                    mode="ingredient"
                    initialValue={watch(`ingredients.${index}.quantity`) || 1}
                    initialUnit={watch(`ingredients.${index}.unit`) || ""}
                    onApply={(value, unit) => {
                      setValue(`ingredients.${index}.quantity`, value, { shouldValidate: true });
                      setValue(`ingredients.${index}.unit`, unit, { shouldValidate: true });
                      setConverterOpen(null);
                    }}
                    onClose={() => setConverterOpen(null)}
                  />
                </div>
              )}
            </div>
          ))}

          <Button
            type="button"
            data-testid="add-ingredient"
            variant="secondary"
            size="sm"
            onClick={() => {
              const newIndex = ingredientFields.length + 1;
              addIngredient({ name: "", quantity: undefined, unit: "" });
              // Focus the new input after it's rendered
              setTimeout(() => {
                const newInput = document.getElementById(`ingredient-${newIndex}-name`);
                if (newInput) newInput.focus();
              }, 0);
            }}
            className="mt-2"
          >
            + Add Ingredient
          </Button>
        </div>
        {errors.ingredients && (
          <p className="text-xs text-destructive mt-1" role="alert">
            {errors.ingredients.message}
          </p>
        )}
      </fieldset>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="instructions">
          Cooking Instructions
        </label>
        <textarea
          id="instructions"
          className="w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Step-by-step instructions..."
          {...register("instructions")}
        />
        {errors.instructions && <p className="text-xs text-destructive mt-1">{errors.instructions.message}</p>}
      </div>

      {/* Submit Button */}

      {/* Image Upload */}
      <div className="space-y-2">
        <div>
          <label htmlFor="image" className="block text-sm font-medium mb-1">
            Meal Image
          </label>
          <div
            className={cn(
              "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              "hover:border-primary/50 cursor-pointer",
              imagePreview ? "border-transparent" : "border-input"
            )}
            onClick={() => document.getElementById('image')?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('image')?.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Click to upload an image or drag and drop"
          >
            <input
              id="image"
              type="file"
              accept="image/*"
              className="hidden"
              ref={imageInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Validate file type
                  if (!file.type.startsWith('image/')) {
                    alert('Please select an image file (JPEG, PNG, etc.)');
                    return;
                  }
                  // Validate file size (max 5MB)
                  if (file.size > 5 * 1024 * 1024) {
                    alert('Image must be less than 5MB');
                    return;
                  }

                  setValue("image", file);
                  const reader = new FileReader();
                  reader.onloadend = () => setImagePreview(reader.result as string);
                  reader.readAsDataURL(file);
                } else {
                  setImagePreview(null);
                  setValue("image", null);
                }
              }}
              disabled={isSubmitting}
              aria-describedby="image-upload-help"
            />

            {imagePreview ? (
              <div className="relative w-full max-w-md h-48 mx-auto">
                <Image
                  src={imagePreview}
                  alt="Preview of uploaded meal"
                  fill
                  className="object-contain rounded-md border p-1"
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-10 w-10 mb-2"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  <p className="text-sm font-medium">
                    <span className="text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    SVG, PNG, JPG or GIF (max. 5MB)
                  </p>
                </div>
              </>
            )}
          </div>

          <p id="image-upload-help" className="text-xs text-muted-foreground mt-1">
            {imagePreview
              ? 'Image will be uploaded with your recipe.'
              : 'A photo helps others visualize your recipe.'}
          </p>
        </div>

        {imagePreview && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setImagePreview(null);
                setValue("image", null);
                if (imageInputRef.current) {
                  imageInputRef.current.value = "";
                }
              }}
              className="mt-2"
              disabled={isSubmitting}
            >
              Remove Image
            </Button>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="submit"
          data-testid="save-meal"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
          aria-busy={isSubmitting}
          aria-live="polite"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (window.confirm('Are you sure you want to clear the form?')) {
              reset();
              setImagePreview(null);
              if (imageInputRef.current) {
                imageInputRef.current.value = '';
              }
            }
          }}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Clear Form
        </Button>
      </div>
    </form>
  );
}
