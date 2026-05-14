export const COMMON_INGREDIENTS = [
  // Allergens
  'peanuts',
  'tree nuts',
  'shellfish',
  'fish',
  'soy',
  'eggs',
  'sesame',
  // Strong flavors
  'cilantro',
  'blue cheese',
  'olives',
  'anchovies',
  'capers',
  'marmite',
  // Textures
  'mushrooms',
  'okra',
  'tofu',
  'eggplant',
  'brussels sprouts',
  'liver',
  // Heat / spices
  'spicy peppers',
  'wasabi',
  'horseradish',
  'jalapenos',
  'chilli',
] as const;

export const INGREDIENT_CATEGORIES: Record<string, string[]> = {
  Allergens: ['peanuts', 'tree nuts', 'shellfish', 'fish', 'soy', 'eggs', 'sesame'],
  'Strong Flavors': ['cilantro', 'blue cheese', 'olives', 'anchovies', 'capers', 'marmite'],
  Textures: ['mushrooms', 'okra', 'tofu', 'eggplant', 'brussels sprouts', 'liver'],
  'Heat & Spices': ['spicy peppers', 'wasabi', 'horseradish', 'jalapenos', 'chilli'],
};
