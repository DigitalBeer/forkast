import { describe, expect, it } from 'vitest';
import { createUndoSnapshot } from '../undo-stack';
import type { Meal, MealType } from '../../../types/meal';

type MealPlan = Record<string, Partial<Record<MealType, Meal>>>;

const chicken: Meal = { id: 'meal-1', name: 'Chicken Tacos', tags: [] };
const pasta: Meal = { id: 'meal-2', name: 'Pasta Bake', tags: [] };
const curry: Meal = { id: 'meal-3', name: 'Veg Curry', tags: [] };

const createInitialPlan = (): MealPlan => ({
  '2026-05-18': { Dinner: chicken },
  '2026-05-19': { Dinner: pasta },
});

describe('createUndoSnapshot', () => {
  it('captures a detached snapshot before mutation', () => {
    const plan = createInitialPlan();
    const snapshot = createUndoSnapshot(plan);

    plan['2026-05-18'].Dinner = curry;

    expect(snapshot['2026-05-18'].Dinner?.name).toBe('Chicken Tacos');
  });
});
