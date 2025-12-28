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
      onDrop(date, mealType, item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

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
  const backgroundClass = isActive 
    ? 'bg-green-100 border-green-300' 
    : isHovered && !meal
    ? 'bg-blue-50 border-blue-300'
    : 'bg-gray-50 border-gray-200';

  return (
    <div
      ref={containerRef}
      className={'min-h-[80px] border-2 border-dashed rounded-lg p-2 transition-all duration-200 overflow-hidden ' + backgroundClass}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showLabel && (
        <div className="text-xs font-medium text-gray-600 mb-1 truncate">
          <span className="mr-1">{icon}</span>
          {label}
        </div>
      )}
      
      {meal ? (
        <MealCard
          meal={meal}
          onRemove={() => onRemove(date, mealType)}
          onDuplicate={onDuplicate ? () => onDuplicate(date, mealType, meal) : undefined}
          onCooked={onCooked ? () => onCooked(date, mealType, meal) : undefined}
          onSkip={onSkip ? () => onSkip(date, mealType, meal) : undefined}
          compact
        />
      ) : (
        <div className="text-xs text-gray-400 text-center py-4">
          Drop meal here
        </div>
      )}
    </div>
  );
}
