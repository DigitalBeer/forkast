export interface UserPreferences {
  dietaryPreferences: string[];
  dislikedIngredients: string[];
  mealTypePreferences: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
  };
}

export const DIETARY_OPTIONS = [
  { id: 'vegan', label: 'Vegan', icon: '🌱', description: 'No animal products' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥗', description: 'No meat or fish' },
  { id: 'keto', label: 'Keto', icon: '🥑', description: 'Low carb, high fat' },
  { id: 'paleo', label: 'Paleo', icon: '🦕', description: 'Whole foods, no grains' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾', description: 'No gluten products' },
  { id: 'dairy-free', label: 'Dairy-Free', icon: '🥛', description: 'No dairy products' },
] as const;

export const MEAL_TYPE_OPTIONS = {
  breakfast: [
    { id: 'continental', label: 'Continental' },
    { id: 'full-english', label: 'Full English' },
    { id: 'smoothie-bowl', label: 'Smoothie Bowl' },
    { id: 'overnight-oats', label: 'Overnight Oats' },
    { id: 'eggs-toast', label: 'Eggs & Toast' },
  ],
  lunch: [
    { id: 'salad', label: 'Salad' },
    { id: 'sandwich', label: 'Sandwich' },
    { id: 'soup', label: 'Soup' },
    { id: 'wrap', label: 'Wrap' },
    { id: 'grain-bowl', label: 'Grain Bowl' },
  ],
  dinner: [
    { id: 'italian', label: 'Italian' },
    { id: 'asian', label: 'Asian' },
    { id: 'mexican', label: 'Mexican' },
    { id: 'mediterranean', label: 'Mediterranean' },
    { id: 'indian', label: 'Indian' },
    { id: 'american-bbq', label: 'American BBQ' },
    { id: 'thai', label: 'Thai' },
  ],
} as const;
