import { describe, it, expect } from 'vitest';
import { toDbMealType, fromDbMealType } from '../meal';

describe('toDbMealType', () => {
  it('lowercases each plannable meal type', () => {
    expect(toDbMealType('Breakfast')).toBe('breakfast');
    expect(toDbMealType('Lunch')).toBe('lunch');
    expect(toDbMealType('Dinner')).toBe('dinner');
  });
});

describe('fromDbMealType', () => {
  it('capitalizes each DB meal type', () => {
    expect(fromDbMealType('breakfast')).toBe('Breakfast');
    expect(fromDbMealType('lunch')).toBe('Lunch');
    expect(fromDbMealType('dinner')).toBe('Dinner');
  });

  it('is case-insensitive on input', () => {
    expect(fromDbMealType('BREAKFAST')).toBe('Breakfast');
    expect(fromDbMealType('Lunch')).toBe('Lunch');
  });

  it('falls back to Dinner for unrecognized values', () => {
    expect(fromDbMealType('snack')).toBe('Dinner');
    expect(fromDbMealType('')).toBe('Dinner');
    expect(fromDbMealType('garbage')).toBe('Dinner');
  });

  it('round-trips through toDbMealType', () => {
    for (const type of ['Breakfast', 'Lunch', 'Dinner'] as const) {
      expect(fromDbMealType(toDbMealType(type))).toBe(type);
    }
  });
});
