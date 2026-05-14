'use client';

import Link from 'next/link';
import { useDrag } from 'react-dnd';
import { formatDistanceToNow } from 'date-fns';
import { Eye } from 'lucide-react';
import type { Meal } from '@/types/meal';
import { MealTypeIcon } from '@/components/ui/MealTypeIcon';
import { MealImage } from '@/components/meals/MealImage';

interface MealCardProps {
  meal: Meal;
  onRemove?: () => void;
  onDuplicate?: () => void;
  onCooked?: () => void;
  onSkip?: () => void;
  compact?: boolean;
}

export function MealCard({ meal, onRemove, onDuplicate, onCooked, onSkip, compact = false }: MealCardProps) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'meal',
      item: meal,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (_item, monitor) => {
        if (!monitor.didDrop()) {
          onRemove?.();
        }
      },
    }),
    [meal, onRemove],
  );

  const lastPreparedText = meal.last_prepared 
    ? `Last made ${formatDistanceToNow(new Date(meal.last_prepared), { addSuffix: true })}`
    : 'Never made';

  const finalClassName = `
    bg-card rounded-lg shadow-sm border border-border cursor-move transition-all duration-200
    ${isDragging ? 'opacity-50' : 'opacity-100'}
    ${compact ? 'p-2' : 'p-3'}
  `;

  return (
    <div
      ref={(node: HTMLDivElement | null) => {
        if (node) {
          drag(node);
        }
      }}
      className={finalClassName}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {meal.meal_type && (
              <MealTypeIcon type={meal.meal_type} size={compact ? 'sm' : 'md'} />
            )}
            <h4 className={`font-medium text-foreground ${
              compact ? 'text-sm' : 'text-base'
            }`}>
              {meal.name}
            </h4>
          </div>
          
          <MealImage
            src={meal.image_url}
            alt={meal.name}
            size="thumbnail"
            mealName={meal.name}
            mealType={meal.meal_type}
            className="!h-16 mt-2 rounded"
          />
          
          <div className={`text-xs text-gray-500 mt-1 ${
            compact ? 'hidden' : 'block'
          }`}>
            {lastPreparedText}
          </div>
        </div>
        
        <div className="flex flex-col space-y-1 ml-2">
          {/* Action buttons row */}
          <div className="flex space-x-1">
            {onRemove && (
              <button
                onClick={onRemove}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Remove meal"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1 10V9a1 1 0 00-1-1h-4a1 1 0 00-1 1v8m-6 0l-1-4-4 4"
                  />
                </svg>
              </button>
            )}
            {onDuplicate && (
              <button
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="Duplicate meal"
                onClick={onDuplicate}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            )}
          </div>
          
          {/* Cooked and Skip buttons row */}
          {(onCooked || onSkip) && (
            <div className="flex space-x-1">
              {onCooked && (
                <button
                  onClick={onCooked}
                  className="text-gray-400 hover:text-green-600 transition-colors"
                  title="Mark as cooked"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              )}
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="text-gray-400 hover:text-orange-600 transition-colors"
                  title="Skip meal"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* View meal button */}
          <Link 
            href={`/meals/${meal.id}`}
            className="text-blue-500 hover:text-blue-700 transition-colors"
            title="View meal details"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
