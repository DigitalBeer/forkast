'use client';

import { type MealSuggestion } from '@/lib/services/suggestionService';
import { type MealSuggestionResponse, type MealSuggestionRequest } from '@/types/meal';
import { MealSuggestionCard } from './MealSuggestionCard';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

interface MealSuggestionListProps {
  suggestions: MealSuggestion[] | MealSuggestionResponse[];
  isLoading: boolean;
  error: string | null;
  activeFilters?: MealSuggestionRequest;
  isFiltered?: boolean;
}

function isFilteredSuggestion(suggestion: MealSuggestion | MealSuggestionResponse): suggestion is MealSuggestionResponse {
  return 'date' in suggestion && 'mealType' in suggestion;
}

export function MealSuggestionList({ suggestions, isLoading, error, activeFilters, isFiltered = false }: MealSuggestionListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading suggestions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded-lg border border-red-200">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {isFiltered ? (
          <div>
            <p className="mb-2">No meals match your current filters.</p>
            <p className="text-sm">Try adjusting your dietary preferences or meal types.</p>
          </div>
        ) : (
          <p>There is insufficient data to generate meal suggestions. Please add more meals to your history.</p>
        )}
      </div>
    );
  }

  // Group filtered suggestions by date
  const groupedSuggestions = isFiltered && suggestions.every(isFilteredSuggestion)
    ? suggestions.reduce((groups, suggestion) => {
        const date = suggestion.date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(suggestion);
        return groups;
      }, {} as Record<string, MealSuggestionResponse[]>)
    : null;

  return (
    <div className="space-y-6">
      {/* Filter Summary */}
      {isFiltered && activeFilters && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Showing {activeFilters.days || 7} days starting {activeFilters.startDate || 'today'}
            </span>
          </div>
          {activeFilters.filters?.dietaryTypes && activeFilters.filters.dietaryTypes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-blue-700">Dietary preferences:</span>
              {activeFilters.filters.dietaryTypes.map(diet => (
                <Badge key={diet} variant="secondary" className="text-xs">
                  {diet}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions Display */}
      {groupedSuggestions ? (
        // Filtered view grouped by date
        <div className="space-y-6">
          {Object.entries(groupedSuggestions)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dateSuggestions]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <h3 className="font-medium text-gray-900">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dateSuggestions.map((suggestion, index) => (
                    <div key={`${suggestion.date}-${suggestion.mealType}-${index}`} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <Badge variant="outline" className="text-xs capitalize">
                          {suggestion.mealType}
                        </Badge>
                      </div>
                      <MealSuggestionCard 
                        meal={suggestion.meal} 
                        dietaryPreferences={activeFilters?.filters?.dietaryTypes || []}
                      />
                      {suggestion.reason && (
                        <p className="text-xs text-gray-600 italic">{suggestion.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      ) : (
        // Standard view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map((meal, index) => (
            <MealSuggestionCard 
              key={isFilteredSuggestion(meal) ? `${meal.date}-${meal.mealType}-${index}` : meal.id} 
              meal={isFilteredSuggestion(meal) ? meal.meal : meal}
              dietaryPreferences={activeFilters?.filters?.dietaryTypes || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
