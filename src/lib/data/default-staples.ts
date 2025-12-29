/**
 * Default staple ingredients that users commonly have in their pantry.
 * Users can customize this list in their profile settings.
 */
export interface Staple {
  id: string;
  name: string;
  category: 'spices' | 'oils' | 'grains' | 'dairy' | 'condiments' | 'other';
}

export const DEFAULT_STAPLES: Staple[] = [
  // Spices & Seasonings
  { id: 'salt', name: 'salt', category: 'spices' },
  { id: 'black-pepper', name: 'black pepper', category: 'spices' },
  { id: 'garlic-powder', name: 'garlic powder', category: 'spices' },
  { id: 'onion-powder', name: 'onion powder', category: 'spices' },
  { id: 'paprika', name: 'paprika', category: 'spices' },
  { id: 'dried-oregano', name: 'dried oregano', category: 'spices' },
  { id: 'dried-basil', name: 'dried basil', category: 'spices' },
  { id: 'cumin', name: 'cumin', category: 'spices' },
  { id: 'chili-powder', name: 'chili powder', category: 'spices' },
  { id: 'cinnamon', name: 'cinnamon', category: 'spices' },
  
  // Oils & Fats
  { id: 'olive-oil', name: 'olive oil', category: 'oils' },
  { id: 'vegetable-oil', name: 'vegetable oil', category: 'oils' },
  { id: 'cooking-spray', name: 'cooking spray', category: 'oils' },
  
  // Grains & Baking
  { id: 'flour', name: 'flour', category: 'grains' },
  { id: 'sugar', name: 'sugar', category: 'grains' },
  { id: 'brown-sugar', name: 'brown sugar', category: 'grains' },
  { id: 'rice', name: 'rice', category: 'grains' },
  { id: 'pasta', name: 'pasta', category: 'grains' },
  { id: 'baking-powder', name: 'baking powder', category: 'grains' },
  { id: 'baking-soda', name: 'baking soda', category: 'grains' },
  
  // Dairy (common staples)
  { id: 'butter', name: 'butter', category: 'dairy' },
  { id: 'eggs', name: 'eggs', category: 'dairy' },
  { id: 'milk', name: 'milk', category: 'dairy' },
  
  // Condiments
  { id: 'soy-sauce', name: 'soy sauce', category: 'condiments' },
  { id: 'vinegar', name: 'vinegar', category: 'condiments' },
  { id: 'ketchup', name: 'ketchup', category: 'condiments' },
  { id: 'mustard', name: 'mustard', category: 'condiments' },
  
  // Other
  { id: 'water', name: 'water', category: 'other' },
  { id: 'chicken-broth', name: 'chicken broth', category: 'other' },
  { id: 'beef-broth', name: 'beef broth', category: 'other' },
];

/**
 * Get staple names as a lowercase set for quick lookup
 */
export function getStapleNamesSet(staples: Staple[]): Set<string> {
  return new Set(staples.map(s => s.name.toLowerCase()));
}

/**
 * Check if an ingredient name matches a staple (case-insensitive)
 */
export function isStapleIngredient(ingredientName: string, staples: Staple[]): boolean {
  const normalizedName = ingredientName.toLowerCase().trim();
  return staples.some(staple => {
    const stapleName = staple.name.toLowerCase();
    // Exact match or ingredient contains the staple name
    return normalizedName === stapleName || 
           normalizedName.includes(stapleName) ||
           stapleName.includes(normalizedName);
  });
}

/**
 * Group staples by category
 */
export function groupStaplesByCategory(staples: Staple[]): Record<string, Staple[]> {
  return staples.reduce((acc, staple) => {
    const category = staple.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(staple);
    return acc;
  }, {} as Record<string, Staple[]>);
}

export const STAPLE_CATEGORIES = ['spices', 'oils', 'grains', 'dairy', 'condiments', 'other'] as const;
export type StapleCategory = typeof STAPLE_CATEGORIES[number];
