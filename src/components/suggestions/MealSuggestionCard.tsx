import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type MealSuggestion } from '@/lib/services/suggestionService';
import { formatDistanceToNow } from 'date-fns';
import { MealTypeIcon } from '@/components/ui/MealTypeIcon';
import { MealImage } from '@/components/meals/MealImage';

interface MealSuggestionCardProps {
  meal: MealSuggestion;
  dietaryPreferences?: string[];
}

export function MealSuggestionCard({ meal, dietaryPreferences = [] }: MealSuggestionCardProps) {
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
          <div className="flex items-center gap-2 flex-1">
            {meal.meal_type && <MealTypeIcon type={meal.meal_type} size="md" />}
            <CardTitle className="flex-1">{meal.name}</CardTitle>
          </div>
          {!meal.last_prepared && (
            <Badge variant="secondary" className="text-xs">New!</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <MealImage
          src={meal.image_url}
          alt={meal.name}
          size="full"
          mealName={meal.name}
          mealType={meal.meal_type}
          className="!h-48 rounded-md"
        />
        <div className="text-xs text-muted-foreground mt-2">
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
