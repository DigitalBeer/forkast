"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { type Meal } from "@/types/meal";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, Copy } from "lucide-react";

interface MealCardProps {
  meal: Meal;
  className?: string;
  onEdit?: (meal: Meal) => void;
  onDelete?: (meal: Meal) => void;
  onAddToPlan?: (meal: Meal) => void;
  onDuplicate?: (meal: Meal) => void;
}

export function MealCard({ meal, className, onEdit, onDelete, onAddToPlan, onDuplicate }: MealCardProps) {
  return (
    <Card data-testid="meal-card" className={cn("relative group", className)}>
      {meal.image_url && (
        <div className="relative h-40 w-full overflow-hidden rounded-t-md">
          <Image
            src={meal.image_url}
            alt={meal.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base font-semibold">
          <span>{meal.name}</span>
          <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit?.(meal)}
              aria-label="Edit meal"
            >
              <Pencil className="h-4 w-4" />
            </Button>
        </CardTitle>
        {meal.meal_type && (
          <div className="text-xs font-medium text-primary mt-1">
            {meal.meal_type}
          </div>
        )}
        {meal.tags?.length ? (
          <CardDescription className="text-xs text-muted-foreground">
            {meal.tags.join(", ")}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {meal.last_prepared ? (
          <p>Last prepared: {new Date(meal.last_prepared).toLocaleDateString()}</p>
        ) : (
          <p>Never prepared yet</p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 pt-0">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onAddToPlan?.(meal)}
        >
          <Plus className="mr-1 h-4 w-4" /> Add to Plan
        </Button>
        {onDuplicate && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDuplicate(meal)}
            aria-label="Duplicate meal"
            title="Duplicate meal"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete?.(meal)}
          aria-label="Delete meal"
          data-testid="delete-meal-btn"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardFooter>
    </Card>
  );
}
