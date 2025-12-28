/*
 Internal, framework-free tests for src/lib/shopping/aggregate.ts
 Run: npm run test:shopping-aggregate
*/

import process from 'node:process';
import {
  parseIngredientsField,
  aggregateIngredients,
  aggregateFromMeals,
  IngredientFormatError,
  categorizeIngredient,
} from '../src/lib/shopping/aggregate';

// Minimal test harness
let total = 0;
let passed = 0;
let failed = 0;

function log(msg: string) {
  console.log(msg);
}

function pass(name: string) {
  passed++;
  log(`✓ ${name}`);
}

function fail(name: string, err: unknown) {
  failed++;
  log(`✗ ${name}`);
  log(`  ${err instanceof Error ? err.message : String(err)}`);
}

async function test(name: string, fn: () => void | Promise<void>) {
  total++;
  try {
    await fn();
    pass(name);
  } catch (e) {
    fail(name, e);
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function approxEqual(a: number, b: number, eps = 1e-9): boolean {
  return Math.abs(a - b) <= eps;
}

async function run() {
  log('Running shopping aggregate internal tests...');

  await test('parseIngredientsField: parses JSON string array', () => {
    const raw = '[{"name":"Onion","quantity":2,"unit":"pcs"}]';
    const out = parseIngredientsField(raw);
    if (!Array.isArray(out) || out.length !== 1) throw new Error('expected one item');
    if (out[0].name !== 'Onion' || out[0].quantity !== 2 || out[0].unit !== 'pcs') {
      throw new Error('parsed ingredient mismatch');
    }
  });

  await test('parseIngredientsField: throws on non-JSON string', () => {
    let threw = false;
    try {
      parseIngredientsField('not json');
    } catch (e) {
      threw = e instanceof IngredientFormatError;
    }
    if (!threw) throw new Error('expected IngredientFormatError');
  });

  await test('parseIngredientsField: supports amount as alias for quantity (string -> number)', () => {
    const value = [{ name: 'Milk', amount: '1.5', unit: 'L' }];
    const out = parseIngredientsField(value as unknown);
    if (!Array.isArray(out) || out.length !== 1) throw new Error('expected one item');
    if (out[0].name !== 'Milk' || out[0].quantity !== 1.5 || out[0].unit !== 'L') {
      throw new Error('amount alias not parsed correctly');
    }
  });

  await test('parseIngredientsField: skips blank names', () => {
    const value = [
      { name: '  ', quantity: 2, unit: 'g' },
      { name: 'Sugar', quantity: 1, unit: 'cup' },
    ];
    const out = parseIngredientsField(value as unknown);
    if (out.length !== 1 || out[0].name !== 'Sugar') throw new Error('blank name not skipped');
  });

  await test('parseIngredientsField: throws on non-array', () => {
    let threw = false;
    try {
      parseIngredientsField({} as unknown);
    } catch (e) {
      threw = e instanceof IngredientFormatError;
    }
    if (!threw) throw new Error('expected IngredientFormatError');
  });

  await test('categorizeIngredient: uses CATEGORY_MAP, defaults to other', () => {
    if (categorizeIngredient('Onion') !== 'produce') throw new Error('expected produce');
    if (categorizeIngredient('unknown-item-xyz') !== 'other') throw new Error('expected other');
  });

  await test('aggregateIngredients: sums by normalized name + unit', () => {
    const out = aggregateIngredients([
      { name: 'Onion', quantity: 1, unit: 'pcs' },
      { name: 'onion', quantity: 2, unit: 'pcs' },
      { name: '  ONION  ', quantity: 0.5, unit: 'pcs' },
    ]);
    if (out.length !== 1) throw new Error('expected one aggregated item');
    const item = out[0];
    if (item.name !== 'onion') throw new Error('expected normalized name onion');
    if (!approxEqual(item.quantity, 3.5)) throw new Error(`expected quantity 3.5, got ${item.quantity}`);
    if (item.unit !== 'pcs') throw new Error('expected unit pcs');
    if (item.category !== 'produce') throw new Error('expected category produce');
  });

  await test('aggregateIngredients: keeps separate items for different units', () => {
    const out = aggregateIngredients([
      { name: 'Sugar', quantity: 1, unit: 'cup' },
      { name: 'sugar', quantity: 100, unit: 'g' },
    ]);
    if (out.length !== 2) throw new Error('expected two items (different units)');
    const names = out.map((i) => `${i.name}:${i.unit}`).sort();
    if (!deepEqual(names, ['sugar:cup', 'sugar:g'])) throw new Error('unexpected unit separation');
  });

  await test('aggregateIngredients: sorts by category then name', () => {
    const out = aggregateIngredients([
      { name: 'Banana', quantity: 1, unit: '' }, // produce
      { name: 'Rice', quantity: 1, unit: 'kg' }, // pantry
      { name: 'Onion', quantity: 1, unit: '' },  // produce
    ]);
    const labels = out.map((i) => `${i.category}:${i.name}`);
    // categories: pantry, produce, seafood, dairy, meat, bakery, other (alphabetical order in code)
    // Our map assigns Banana/Onion -> produce; Rice -> pantry. So pantry comes before produce alphabetically.
    if (!deepEqual(labels, ['pantry:rice', 'produce:banana', 'produce:onion'])) {
      throw new Error(`unexpected sort order: ${labels.join(', ')}`);
    }
  });

  await test('aggregateFromMeals: aggregates mixed input formats', () => {
    const meals = [
      { id: 1, ingredients: [{ name: 'Tomato', quantity: 2, unit: '' }] },
      { id: 2, ingredients: '[{"name":"Tomato","quantity":1,"unit":""}]' },
    ];
    const out = aggregateFromMeals(meals);
    if (out.length !== 1) throw new Error('expected one item');
    const item = out[0];
    if (item.name !== 'tomato') throw new Error('expected name tomato');
    if (!approxEqual(item.quantity, 3)) throw new Error(`expected quantity 3, got ${item.quantity}`);
  });

  await test('aggregateFromMeals: throws IngredientFormatError on invalid ingredients', () => {
    let threw = false;
    try {
      const meals: Array<{ id: number | string; name?: string; ingredients: unknown }> = [
        { id: 'x', ingredients: { bad: 'value' } as unknown },
      ];
      aggregateFromMeals(meals);
    } catch (e) {
      threw = e instanceof IngredientFormatError;
    }
    if (!threw) throw new Error('expected IngredientFormatError');
  });

  // Print summary
  log('');
  log('Summary:');
  log(`  Total: ${total}`);
  log(`  Passed: ${passed}`);
  log(`  Failed: ${failed}`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
