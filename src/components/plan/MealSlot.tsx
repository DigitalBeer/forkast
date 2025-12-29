'use client';

import { useDrop } from 'react-dnd';
import { useRef } from 'react';
import type { Meal, MealType } from '@/types/meal';
import { MealCard } from './MealCard';

interface MealSlotProps {
  date: string;
  mealType: MealType;
  label: string;
  icon: string;
  meal?: Meal;
  onDrop: (date: string, mealType: MealType, meal: Meal) => void;
  onDropOccupied?: (
    targetDate: string,
    targetMealType: MealType,
    droppedMeal: Meal,
    existingMeal: Meal
  ) => void;
  onRemove: (date: string, mealType: MealType) => void;
  onDuplicate?: (date: string, mealType: MealType, meal: Meal) => void;
  onCooked?: (date: string, mealType: MealType, meal: Meal) => void;
  onSkip?: (date: string, mealType: MealType, meal: Meal) => void;
  onHover: (id: string | null) => void;
  isHovered: boolean;
  showLabel?: boolean;
}

export function MealSlot({
  date,
  mealType,
  label,
  icon,
  meal,
  onDrop,
  onDropOccupied,
  onRemove,
  onDuplicate,
  onCooked,
  onSkip,
  isHovered,
  onHover,
  showLabel = true,
}: MealSlotProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'meal',
    drop: (item: Meal) => {
      // If slot is occupied, call the occupied handler instead
      if (meal && onDropOccupied) {
        // Don't swap with itself
        if (meal.id !== item.id) {
          onDropOccupied(date, mealType, item, meal);
        }
      } else {
        onDrop(date, mealType, item);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [meal, date, mealType, onDrop, onDropOccupied]);

  // Use a stable React ref and let react-dnd decorate it to avoid TS ref type issues
  const containerRef = useRef<HTMLDivElement | null>(null);
  drop(containerRef);

  const handleMouseEnter = () => {
    onHover(`${date}-${mealType}`);
  };

  const handleMouseLeave = () => {
    onHover(null);
  };

  const isActive = isOver && canDrop;

  // Determine background color based on state
  let backgroundClass = 'bg-gray-50 border-gray-200';

  if (isActive) {
    if (meal) {
      // Dropping on occupied slot - show amber for swap hint
      backgroundClass = 'bg-amber-100 border-amber-400';
    } else {
      // Dropping on empty slot - show green
      backgroundClass = 'bg-green-100 border-green-300';
    }
  } else if (isHovered && !meal) {
    backgroundClass = 'bg-blue-50 border-blue-300';
  }

  return (
    <div
      ref={containerRef}
      className={'min-h-[80px] border-2 border-dashed rounded-lg p-2 transition-all duration-200 overflow-hidden ' + backgroundClass}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid={`meal-slot-${date}-${mealType}`}
    >
      {showLabel && (
        <div className="text-xs font-medium text-gray-600 mb-1 truncate">
          <span className="mr-1">{icon}</span>
          {label}
        </div>
      )}

      {meal ? (
        <>
          {isActive && (
            <div className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
              <span>⇄</span> Swap available
            </div>
          )}
          <MealCard
            meal={meal}
            onRemove={() => onRemove(date, mealType)}
            onDuplicate={onDuplicate ? () => onDuplicate(date, mealType, meal) : undefined}
            onCooked={onCooked ? () => onCooked(date, mealType, meal) : undefined}
            onSkip={onSkip ? () => onSkip(date, mealType, meal) : undefined}
            compact
          />
        </>
      ) : (
        <div className="text-xs text-gray-400 text-center py-4">
          Drop meal here
        </div>
      )}
    </div>
  );
}

