import { describe, it, expect } from 'vitest';
import {
  categorizeIngredient,
  parseIngredientsField,
  aggregateIngredients,
  aggregateFromMeals,
  IngredientFormatError,
} from '../aggregate';

describe('categorizeIngredient', () => {
  it('categorizes produce items', () => {
    expect(categorizeIngredient('chicken')).toBe('meat');
    expect(categorizeIngredient('salmon')).toBe('seafood');
    expect(categorizeIngredient('milk')).toBe('dairy');
    expect(categorizeIngredient('bread')).toBe('bakery');
    expect(categorizeIngredient('rice')).toBe('pantry');
  });

  it('categorizes via partial match', () => {
    expect(categorizeIngredient('chicken breast')).toBe('meat');
    expect(categorizeIngredient('smoked salmon')).toBe('seafood');
  });

  it('returns "other" for unknown ingredients', () => {
    expect(categorizeIngredient('tofu')).toBe('other');
    expect(categorizeIngredient('tempeh')).toBe('other');
  });

  it('handles case-insensitive lookup', () => {
    expect(categorizeIngredient('Chicken')).toBe('meat');
    expect(categorizeIngredient('SALMON')).toBe('seafood');
  });

  it('strips leading/trailing whitespace and quotes', () => {
    expect(categorizeIngredient('"chicken"')).toBe('meat');
    expect(categorizeIngredient('  rice  ')).toBe('pantry');
  });

  it('categorizes via keyword fallback', () => {
    expect(categorizeIngredient('fresh herbs')).toBe('produce');
    expect(categorizeIngredient('salad mix')).toBe('produce');
  });

  it('categorizes when ingredient is substring of map key', () => {
    expect(categorizeIngredient('thigh')).toBe('meat');
  });
});

describe('parseIngredientsField', () => {
  it('returns empty array for null/undefined', () => {
    expect(parseIngredientsField(null)).toEqual([]);
    expect(parseIngredientsField(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseIngredientsField('')).toEqual([]);
    expect(parseIngredientsField('   ')).toEqual([]);
  });

  it('parses JSON string of ingredient objects', () => {
    const json = JSON.stringify([
      { name: 'chicken', quantity: 2, unit: 'lb' },
      { name: 'rice', quantity: 1, unit: 'cup' },
    ]);
    const result = parseIngredientsField(json);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('chicken');
    expect(result[0].quantity).toBe(2);
    expect(result[0].unit).toBe('lb');
  });

  it('parses Ingredient[] directly', () => {
    const ingredients = [
      { name: 'onion', quantity: 1, unit: '' },
    ];
    const result = parseIngredientsField(ingredients);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('onion');
  });

  it('uses amount as fallback for quantity', () => {
    const result = parseIngredientsField([{ name: 'butter', amount: 2, unit: 'tbsp' }]);
    expect(result[0].quantity).toBe(2);
  });

  it('defaults quantity to 1 when not provided', () => {
    const result = parseIngredientsField([{ name: 'salt', unit: 'tsp' }]);
    expect(result[0].quantity).toBe(1);
  });

  it('skips invalid plain text (non-JSON) strings', () => {
    const result = parseIngredientsField('2 eggs, butter, salt');
    expect(result).toEqual([]);
  });

  it('throws IngredientFormatError for non-array JSON', () => {
    expect(() => parseIngredientsField('{"key": "value"}')).toThrow(IngredientFormatError);
  });

  it('skips items with blank names', () => {
    const result = parseIngredientsField([{ name: '', quantity: 1 }, { name: 'rice', quantity: 1 }]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('rice');
  });

  it('skips non-object items in array', () => {
    const result = parseIngredientsField([null, 'bad', { name: 'egg', quantity: 2 }]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('egg');
  });

  it('parses quantity from name like "2 eggs"', () => {
    const result = parseIngredientsField([{ name: '2 eggs' }]);
    expect(result[0].name).toBe('eggs');
    expect(result[0].quantity).toBe(2);
  });

  it('parses unit from name like "1/2 cup flour"', () => {
    const result = parseIngredientsField([{ name: '1/2 cup flour' }]);
    expect(result[0].name).toBe('flour');
    expect(result[0].quantity).toBe(0.5);
    expect(result[0].unit).toBe('cup');
  });

  it('parses multiplier pattern "2 x 300g chicken breasts"', () => {
    const result = parseIngredientsField([{ name: '2 x 300g chicken breasts' }]);
    expect(result[0].name).toBe('chicken breasts');
    expect(result[0].quantity).toBe(2);
    expect(result[0].unit).toBe('300g');
  });

  it('parses unit-first pattern "300g chicken"', () => {
    const result = parseIngredientsField([{ name: '300g chicken' }]);
    expect(result[0].name).toBe('chicken');
    expect(result[0].quantity).toBe(1);
    expect(result[0].unit).toBe('300g');
  });

  it('parses decimal unit pattern "1.5 cups flour"', () => {
    const result = parseIngredientsField([{ name: '1.5 cups flour' }]);
    expect(result[0].name).toBe('flour');
    expect(result[0].quantity).toBe(1.5);
    expect(result[0].unit).toBe('cups');
  });

  it('handles string quantity values', () => {
    const result = parseIngredientsField([{ name: 'chicken', quantity: '2', unit: 'lb' }]);
    expect(result[0].quantity).toBe(2);
    expect(result[0].unit).toBe('lb');
  });

  it('handles invalid string quantity values', () => {
    const result = parseIngredientsField([{ name: 'chicken', quantity: 'abc', unit: 'lb' }]);
    expect(result[0].quantity).toBe(1);
    expect(result[0].unit).toBe('lb');
  });
});

describe('aggregateIngredients', () => {
  it('aggregates same name+unit combinations', () => {
    const ingredients = [
      { name: 'chicken', quantity: 2, unit: 'lb' },
      { name: 'chicken', quantity: 1, unit: 'lb' },
    ];
    const result = aggregateIngredients(ingredients);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(3);
    expect(result[0].name).toBe('chicken');
  });

  it('keeps different units separate', () => {
    const ingredients = [
      { name: 'flour', quantity: 2, unit: 'cup' },
      { name: 'flour', quantity: 100, unit: 'g' },
    ];
    const result = aggregateIngredients(ingredients);
    expect(result).toHaveLength(2);
  });

  it('sorts by category then name', () => {
    const ingredients = [
      { name: 'chicken', quantity: 1, unit: '' },
      { name: 'onion', quantity: 1, unit: '' },
      { name: 'milk', quantity: 1, unit: '' },
    ];
    const result = aggregateIngredients(ingredients);
    const categories = result.map(i => i.category);
    // dairy < meat < produce alphabetically
    expect(categories).toEqual(['dairy', 'meat', 'produce']);
  });

  it('defaults quantity to 1 for non-finite values', () => {
    const ingredients = [
      { name: 'salt', quantity: NaN, unit: '' },
    ];
    const result = aggregateIngredients(ingredients);
    expect(result[0].quantity).toBe(1);
  });

  it('assigns category to each item', () => {
    const ingredients = [
      { name: 'chicken', quantity: 1, unit: '' },
    ];
    const result = aggregateIngredients(ingredients);
    expect(result[0].category).toBe('meat');
  });
});

describe('aggregateFromMeals', () => {
  it('aggregates ingredients from multiple meals', () => {
    const meals = [
      { id: 1, ingredients: JSON.stringify([{ name: 'chicken', quantity: 2, unit: 'lb' }]) },
      { id: 2, ingredients: JSON.stringify([{ name: 'chicken', quantity: 1, unit: 'lb' }, { name: 'rice', quantity: 2, unit: 'cup' }]) },
    ];
    const result = aggregateFromMeals(meals);
    expect(result).toHaveLength(2);
    const chicken = result.find(i => i.name === 'chicken');
    expect(chicken?.quantity).toBe(3);
  });

  it('handles meals with null ingredients', () => {
    const meals = [
      { id: 1, ingredients: null },
      { id: 2, ingredients: JSON.stringify([{ name: 'rice', quantity: 1, unit: 'cup' }]) },
    ];
    const result = aggregateFromMeals(meals);
    expect(result).toHaveLength(1);
  });
});