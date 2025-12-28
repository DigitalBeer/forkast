'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Filter } from 'lucide-react';
import { MealSuggestionFilters } from './MealSuggestionFilters';
import { MealSuggestionRequest } from '@/types/meal';

interface SuggestMealButtonProps {
  onGetSuggestions: (filters?: MealSuggestionRequest) => void;
  isLoading: boolean;
  activeFilters?: MealSuggestionRequest;
  suggestionsCount: number;
}

export function SuggestMealButton({ onGetSuggestions, isLoading, activeFilters, suggestionsCount }: SuggestMealButtonProps) {
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  const handleApplyFilters = (filters: MealSuggestionRequest) => {
    onGetSuggestions(filters);
    setIsFilterDialogOpen(false);
  };

    const handleQuickSuggestion = () => {
    if (suggestionsCount === 0) {
      setIsFilterDialogOpen(true);
    } else {
      onGetSuggestions(activeFilters);
    }
  };

  const hasActiveFilters = activeFilters && (
    activeFilters.filters?.mealTypes?.length || 
    activeFilters.filters?.dietaryTypes?.length ||
    activeFilters.days !== 7
  );

  return (
    <div className="flex gap-2 items-center">
      <Button onClick={handleQuickSuggestion} disabled={isLoading}>
        {isLoading ? 'Getting Suggestions...' : 'Suggest Meals'}
      </Button>
      
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" disabled={isLoading}>
            <Filter className="h-4 w-4" />
            {hasActiveFilters && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 h-2 w-2 p-0" />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <MealSuggestionFilters
            onApplyFilters={handleApplyFilters}
            onClose={() => setIsFilterDialogOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {hasActiveFilters && (
        <div className="flex gap-1">
          {activeFilters.filters?.dietaryTypes?.map(diet => (
            <Badge key={diet} variant="secondary" className="text-xs">
              {diet}
            </Badge>
          ))}
          {activeFilters.days !== 7 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilters.days} days
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
