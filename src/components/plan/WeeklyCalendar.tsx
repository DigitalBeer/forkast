'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { MealSlot } from './MealSlot';
import { DropConfirmationDialog } from './DropConfirmationDialog';
import type { Meal, MealType } from '@/types/meal';
import { MealTypeIcon } from '@/components/ui/MealTypeIcon';

interface PendingSwap {
  targetDate: string;
  targetMealType: MealType;
  droppedMeal: Meal;
  existingMeal: Meal;
}

interface WeeklyCalendarProps {
  weekStart: string;
  meals: {
    [key: string]: Partial<Record<MealType, Meal>>;
  };
  onMealDrop: (date: string, mealType: MealType, meal: Meal) => void;
  onMealSwap?: (
    sourceDate: string,
    sourceMealType: MealType,
    targetDate: string,
    targetMealType: MealType,
  ) => void;
  onMealReplace?: (
    sourceDate: string,
    sourceMealType: MealType,
    targetDate: string,
    targetMealType: MealType,
    meal: Meal,
  ) => void;
  onRemove: (date: string, mealType: MealType) => void;
  onDuplicate?: (date: string, mealType: MealType, meal: Meal) => void;
  onCooked?: (date: string, mealType: MealType, meal: Meal) => void;
  onSkip?: (date: string, mealType: MealType, meal: Meal) => void;
  onHover: (id: string | null) => void;
  hoveredSlotId: string | null;
}

export function WeeklyCalendar({
  weekStart,
  meals,
  onMealDrop,
  onMealSwap,
  onMealReplace,
  onRemove,
  onDuplicate,
  onCooked,
  onSkip,
  onHover,
  hoveredSlotId,
}: WeeklyCalendarProps) {
  const [pendingSwap, setPendingSwap] = useState<PendingSwap | null>(null);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const dateStr = format(date, 'yyyy-MM-dd');
    days.push({
      date: dateStr,
      dayName: format(date, 'EEEE'),
      dateDisplay: format(date, 'MMM d'),
    });
  }

  const mealTypes: { key: MealType; label: string }[] = [
    { key: 'Breakfast', label: 'Breakfast' },
    { key: 'Lunch', label: 'Lunch' },
    { key: 'Dinner', label: 'Dinner' },
  ];

  const handleDropOccupied = (
    targetDate: string,
    targetMealType: MealType,
    droppedMeal: Meal,
    existingMeal: Meal,
  ) => {
    setPendingSwap({ targetDate, targetMealType, droppedMeal, existingMeal });
  };

  const handleSwap = () => {
    if (!pendingSwap || !onMealSwap) {
      setPendingSwap(null);
      return;
    }

    const { targetDate, targetMealType, droppedMeal } = pendingSwap;

    // Find the source slot by searching for the dropped meal
    let sourceDate: string | null = null;
    let sourceMealType: MealType | null = null;

    for (const [date, dayMeals] of Object.entries(meals)) {
      for (const [mType, meal] of Object.entries(dayMeals)) {
        if (meal && meal.id === droppedMeal.id) {
          sourceDate = date;
          sourceMealType = mType as MealType;
          break;
        }
      }
      if (sourceDate) break;
    }

    if (sourceDate && sourceMealType) {
      // Use the swap callback if provided
      onMealSwap(sourceDate, sourceMealType, targetDate, targetMealType);
    } else {
      // Fallback: just place the dropped meal (this shouldn't happen normally)
      onMealDrop(targetDate, targetMealType, droppedMeal);
    }

    setPendingSwap(null);
  };

  const handleReplace = () => {
    if (!pendingSwap) {
      setPendingSwap(null);
      return;
    }

    const { targetDate, targetMealType, droppedMeal } = pendingSwap;

    // Find and remove the dropped meal from its source slot
    let sourceDate: string | null = null;
    let sourceMealType: MealType | null = null;

    for (const [date, dayMeals] of Object.entries(meals)) {
      for (const [mType, meal] of Object.entries(dayMeals)) {
        if (meal && meal.id === droppedMeal.id) {
          sourceDate = date;
          sourceMealType = mType as MealType;
          break;
        }
      }
      if (sourceDate) break;
    }

    if (sourceDate && sourceMealType && onMealReplace) {
      onMealReplace(
        sourceDate,
        sourceMealType,
        targetDate,
        targetMealType,
        droppedMeal,
      );
    } else {
      // Fallback: preserve previous replace behavior.
      onMealDrop(targetDate, targetMealType, droppedMeal);

      if (
        sourceDate &&
        sourceMealType &&
        (sourceDate !== targetDate || sourceMealType !== targetMealType)
      ) {
        onRemove(sourceDate, sourceMealType);
      }
    }

    setPendingSwap(null);
  };

  const handleCancel = () => {
    setPendingSwap(null);
  };

  return (
    <>
      <div className="bg-card rounded-xl shadow-lg p-4 md:p-6 border border-border">
        <h2 className="text-xl font-serif font-semibold text-foreground mb-4">
          Weekly Calendar
        </h2>

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
          <div className="grid grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 md:gap-3">
            {/* Header row: empty corner + meal type headers */}
            <div className="sticky top-0 left-0 bg-card z-20" />
            {mealTypes.map(({ key, label }) => (
              <div
                key={`header-${key}`}
                className="sticky top-0 bg-card z-10 text-center text-sm font-medium text-foreground pb-2 border-b border-border whitespace-nowrap"
              >
                <span className="inline-flex items-center gap-1.5">
                  <MealTypeIcon type={key} size="sm" />
                  {label}
                </span>
              </div>
            ))}

            {/* Rows: one per day – first column is day label, next columns are meal slots */}
            {days.map(({ date, dayName, dateDisplay }) => (
              <React.Fragment key={date}>
                <div
                  key={`${date}-label`}
                  className="sticky left-0 bg-card z-10 py-2 pr-2 border-r border-border"
                >
                  <div className="text-sm font-medium text-foreground">
                    {dayName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {dateDisplay}
                  </div>
                </div>
                {mealTypes.map(({ key, label }) => (
                  <MealSlot
                    key={`${date}-${key}`}
                    date={date}
                    mealType={key}
                    label={label}
                    meal={meals[date]?.[key]}
                    onDrop={onMealDrop}
                    onDropOccupied={handleDropOccupied}
                    onRemove={onRemove}
                    onDuplicate={onDuplicate}
                    onCooked={onCooked}
                    onSkip={onSkip}
                    isHovered={hoveredSlotId === `${date}-${key}`}
                    onHover={onHover}
                    showLabel={false}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Swap/Replace Confirmation Dialog */}
      <DropConfirmationDialog
        isOpen={pendingSwap !== null}
        sourceMeal={pendingSwap?.droppedMeal ?? null}
        targetMeal={pendingSwap?.existingMeal ?? null}
        sourceSlotInfo={null}
        targetSlotInfo={
          pendingSwap
            ? {
                date: pendingSwap.targetDate,
                mealType: pendingSwap.targetMealType,
              }
            : null
        }
        onSwap={handleSwap}
        onReplace={handleReplace}
        onCancel={handleCancel}
      />
    </>
  );
}
