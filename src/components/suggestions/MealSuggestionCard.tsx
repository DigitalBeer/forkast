import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type MealSuggestion } from '@/lib/services/suggestionService';
import { formatDistanceToNow } from 'date-fns';

interface MealSuggestionCardProps {
  meal: MealSuggestion;
  dietaryPreferences?: string[];
}

export function MealSuggestionCard({ meal, dietaryPreferences = [] }: MealSuggestionCardProps) {
  // Create a simple placeholder image using data URI
  const placeholderImage = 'data:image/svg+xml;base64,' + btoa(`
    <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
        ${meal.name}
      </text>
    </svg>
  `);

  // Determine which dietary preferences this meal satisfies
  const mealDietaryTags = dietaryPreferences.filter(pref => {
    // Simple logic - in a real app, this would come from meal data
    const mealName = meal.name.toLowerCase();
    if (pref === 'vegetarian' && (mealName.includes('tofu') || mealName.includes('vegetable') || mealName.includes('salad'))) {
      return true;
    }
    if (pref === 'vegan' && mealName.includes('tofu')) {
      return true;
    }
    if (pref === 'gluten-free' && (mealName.includes('rice') || mealName.includes('salad'))) {
      return true;
    }
    return false;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="flex-1">{meal.name}</CardTitle>
          {!meal.last_prepared && (
            <Badge variant="secondary" className="text-xs">New!</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-48 rounded-md overflow-hidden">
          <Image
            src={meal.image_url || placeholderImage}
            alt={meal.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="text-xs text-gray-600 mt-2">
          {meal.last_prepared
            ? `Last prepared ${formatDistanceToNow(new Date(meal.last_prepared), { addSuffix: true })}`
            : 'Never prepared'}
        </div>
        {mealDietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {mealDietaryTags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
