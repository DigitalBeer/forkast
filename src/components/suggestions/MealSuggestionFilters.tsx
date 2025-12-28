'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MealSuggestionRequest, MEAL_TYPES, DIETARY_TYPES } from '@/types/meal';

interface MealSuggestionFiltersProps {
  onApplyFilters: (filters: MealSuggestionRequest) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function MealSuggestionFilters({ onApplyFilters, onClose, isLoading = false }: MealSuggestionFiltersProps) {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [days, setDays] = useState(7);
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>(['breakfast', 'lunch', 'dinner']);
  const [selectedDietaryTypes, setSelectedDietaryTypes] = useState<string[]>([]);

  const handleMealTypeChange = (mealType: string, checked: boolean) => {
    if (checked) {
      setSelectedMealTypes(prev => [...prev, mealType]);
    } else {
      setSelectedMealTypes(prev => prev.filter(type => type !== mealType));
    }
  };

  const handleDietaryTypeChange = (dietaryType: string, checked: boolean) => {
    if (checked) {
      setSelectedDietaryTypes(prev => [...prev, dietaryType]);
    } else {
      setSelectedDietaryTypes(prev => prev.filter(type => type !== dietaryType));
    }
  };

  const handleApply = () => {
    const filters: MealSuggestionRequest = {
      startDate,
      days,
      filters: {
        mealTypes: selectedMealTypes.length > 0 ? selectedMealTypes : undefined,
        dietaryTypes: selectedDietaryTypes.length > 0 ? selectedDietaryTypes : undefined,
      }
    };
    onApplyFilters(filters);
  };

  const handleReset = () => {
    setStartDate(new Date().toISOString().split('T')[0]);
    setDays(7);
    setSelectedMealTypes(['breakfast', 'lunch', 'dinner']);
    setSelectedDietaryTypes([]);
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Filter Meal Suggestions</DialogTitle>
        <DialogDescription>
          Set your preferences for date range, meal types, and dietary restrictions to get personalized meal suggestions.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Date Range Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Date Range</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="days">Number of Days</Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="30"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Meal Types Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Meal Types</h3>
          <div className="space-y-2">
            {MEAL_TYPES.map((mealType) => (
              <div key={mealType} className="flex items-center space-x-2">
                <Checkbox
                  id={mealType}
                  checked={selectedMealTypes.includes(mealType)}
                  onCheckedChange={(checked) => handleMealTypeChange(mealType, checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor={mealType} className="capitalize">
                  {mealType}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Dietary Types Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Dietary Preferences</h3>
          <div className="space-y-2">
            {DIETARY_TYPES.map((dietaryType) => (
              <div key={dietaryType} className="flex items-center space-x-2">
                <Checkbox
                  id={dietaryType}
                  checked={selectedDietaryTypes.includes(dietaryType)}
                  onCheckedChange={(checked) => handleDietaryTypeChange(dietaryType, checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor={dietaryType} className="capitalize">
                  {dietaryType.replace('-', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleApply} 
            disabled={isLoading || selectedMealTypes.length === 0}
            className="flex-1"
          >
            {isLoading ? 'Applying...' : 'Apply Filters'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
