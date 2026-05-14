'use client';

import React, { useEffect, useCallback } from 'react';
import { ArrowLeftRight, Replace } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Meal, MealType } from '@/types/meal';

interface SlotInfo {
  date: string;
  mealType: MealType;
}

interface DropConfirmationDialogProps {
  isOpen: boolean;
  sourceMeal: Meal | null;
  targetMeal: Meal | null;
  targetSlotInfo: SlotInfo | null;
  sourceSlotInfo: SlotInfo | null;
  onSwap: () => void;
  onReplace: () => void;
  onCancel: () => void;
}

export function DropConfirmationDialog({
  isOpen,
  sourceMeal,
  targetMeal,
  onSwap,
  onReplace,
  onCancel,
}: DropConfirmationDialogProps) {
  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        onSwap();
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        onReplace();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    },
    [isOpen, onSwap, onReplace, onCancel],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!sourceMeal || !targetMeal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onCancel()}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="drop-confirmation-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-amber-600" />
            Swap or Replace Meal?
          </DialogTitle>
          <DialogDescription>
            Choose how to handle the meal slot conflict.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source meal info */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-2 h-full bg-blue-500 rounded" />
            <div>
              <p className="text-xs text-blue-600 font-medium">Moving</p>
              <p className="font-semibold text-gray-900">{sourceMeal.name}</p>
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex justify-center">
            <div className="text-gray-400">↓</div>
          </div>

          {/* Target meal info */}
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="w-2 h-full bg-amber-500 rounded" />
            <div>
              <p className="text-xs text-amber-600 font-medium">
                Slot occupied by
              </p>
              <p className="font-semibold text-gray-900">{targetMeal.name}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onSwap}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            data-testid="swap-button"
            aria-label="Swap meals"
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Swap
            <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-blue-700 rounded">
              S
            </kbd>
          </Button>
          <Button
            onClick={onReplace}
            variant="outline"
            className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
            data-testid="replace-button"
            aria-label="Replace meal"
          >
            <Replace className="h-4 w-4 mr-2" />
            Replace
            <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 rounded">
              R
            </kbd>
          </Button>
          <Button
            onClick={onCancel}
            variant="ghost"
            className="flex-1"
            data-testid="cancel-button"
            aria-label="Cancel"
          >
            Cancel
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-gray-500 text-center mt-2">
          Press <kbd className="px-1 bg-gray-100 rounded">S</kbd> to swap,{' '}
          <kbd className="px-1 bg-gray-100 rounded">R</kbd> to replace,{' '}
          <kbd className="px-1 bg-gray-100 rounded">Esc</kbd> to cancel
        </p>
      </DialogContent>
    </Dialog>
  );
}
