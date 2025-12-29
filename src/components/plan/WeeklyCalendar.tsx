'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { MealSlot } from './MealSlot';
import { DropConfirmationDialog } from './DropConfirmationDialog';
import type { Meal, MealType } from '@/types/meal';

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
    targetMealType: MealType
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
  onRemove,
  onDuplicate,
  onCooked,
  onSkip,
  onHover,
  hoveredSlotId
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

  const mealTypes: { key: MealType; label: string; icon: string }[] = [
    { key: 'Breakfast', label: 'Breakfast', icon: '🌅' },
    { key: 'Lunch', label: 'Lunch', icon: '☀️' },
    { key: 'Dinner', label: 'Dinner', icon: '🌙' },
  ];

  const handleDropOccupied = (
    targetDate: string,
    targetMealType: MealType,
    droppedMeal: Meal,
    existingMeal: Meal
  ) => {
    setPendingSwap({ targetDate, targetMealType, droppedMeal, existingMeal });
  };

  const handleSwap = () => {
    if (!pendingSwap || !onMealSwap) {
      setPendingSwap(null);
      return;
    }

    // Find where the dropped meal came from
    // The swap means: put dropped meal in target, put existing meal in source
    // For now, we'll do the swap directly via onMealDrop calls
    const { targetDate, targetMealType, droppedMeal, existingMeal: _existingMeal } = pendingSwap;

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

    // Simply place the dropped meal, overwriting the existing one
    onMealDrop(targetDate, targetMealType, droppedMeal);

    // Find and remove the dropped meal from its source slot
    for (const [date, dayMeals] of Object.entries(meals)) {
      for (const [mType, meal] of Object.entries(dayMeals)) {
        if (meal && meal.id === droppedMeal.id) {
          // Only remove from source if it's a different slot
          if (date !== targetDate || mType !== targetMealType) {
            onRemove(date, mType as MealType);
          }
          break;
        }
      }
    }

    setPendingSwap(null);
  };

  const handleCancel = () => {
    setPendingSwap(null);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Calendar</h2>

        <div className="h-[800px] overflow-y-auto">
          <div className="grid grid-cols-[8rem_1fr_1fr_1fr] md:grid-cols-[10rem_1fr_1fr_1fr] gap-2 md:gap-3">
            {/* Header row: empty corner + meal type headers */}
            <div className="sticky top-0 left-0 bg-white z-20" />
            {mealTypes.map(({ key, label, icon }) => (
              <div key={`header-${key}`} className="sticky top-0 bg-white z-10 text-center text-sm font-medium text-gray-900 pb-2 border-b whitespace-nowrap">
                <span className="mr-1">{icon}</span>
                {label}
              </div>
            ))}

            {/* Rows: one per day – first column is day label, next columns are meal slots */}
            {days.map(({ date, dayName, dateDisplay }) => (
              <React.Fragment key={date}>
                <div key={`${date}-label`} className="sticky left-0 bg-white z-10 py-2 pr-2 border-r">
                  <div className="text-sm font-medium text-gray-900">{dayName}</div>
                  <div className="text-xs text-gray-500">{dateDisplay}</div>
                </div>
                {mealTypes.map(({ key, label, icon }) => (
                  <MealSlot
                    key={`${date}-${key}`}
                    date={date}
                    mealType={key}
                    label={label}
                    icon={icon}
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
        targetSlotInfo={pendingSwap ? { date: pendingSwap.targetDate, mealType: pendingSwap.targetMealType } : null}
        onSwap={handleSwap}
        onReplace={handleReplace}
        onCancel={handleCancel}
      />
    </>
  );
}

