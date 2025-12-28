/*
 Internal, framework-free tests for src/lib/measurements/conversions.ts
 Run: npx tsx scripts/test-measurement-conversions.ts
*/

import process from 'node:process';
import {
  convert,
  convertWeight,
  convertVolume,
  convertTemperature,
  roundValue,
  formatConvertedValue,
  convertAndFormat,
  isWeightUnit,
  isVolumeUnit,
  isTemperatureUnit,
  getUnitCategory,
  getConvertibleUnits,
  getUnitLabel,
  WEIGHT_UNITS,
  VOLUME_UNITS,
  TEMPERATURE_UNITS,
} from '../src/lib/measurements/conversions';

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

function approxEqual(a: number, b: number, eps = 0.01): boolean {
  return Math.abs(a - b) <= eps;
}

async function run() {
  log('Running measurement conversion tests...\n');

  // ============ Unit Type Checks ============
  await test('isWeightUnit: identifies weight units', () => {
    if (!isWeightUnit('g')) throw new Error('g should be weight');
    if (!isWeightUnit('kg')) throw new Error('kg should be weight');
    if (!isWeightUnit('oz')) throw new Error('oz should be weight');
    if (!isWeightUnit('lb')) throw new Error('lb should be weight');
    if (isWeightUnit('ml')) throw new Error('ml should not be weight');
    if (isWeightUnit('cup')) throw new Error('cup should not be weight');
  });

  await test('isVolumeUnit: identifies volume units', () => {
    if (!isVolumeUnit('ml')) throw new Error('ml should be volume');
    if (!isVolumeUnit('cup')) throw new Error('cup should be volume');
    if (!isVolumeUnit('tsp')) throw new Error('tsp should be volume');
    if (!isVolumeUnit('tbsp')) throw new Error('tbsp should be volume');
    if (isVolumeUnit('g')) throw new Error('g should not be volume');
  });

  await test('isTemperatureUnit: identifies temperature units', () => {
    if (!isTemperatureUnit('c')) throw new Error('c should be temperature');
    if (!isTemperatureUnit('f')) throw new Error('f should be temperature');
    if (isTemperatureUnit('g')) throw new Error('g should not be temperature');
  });

  await test('getUnitCategory: returns correct category', () => {
    if (getUnitCategory('g') !== 'weight') throw new Error('g should be weight');
    if (getUnitCategory('ml') !== 'volume') throw new Error('ml should be volume');
    if (getUnitCategory('c') !== 'temperature') throw new Error('c should be temperature');
    if (getUnitCategory('pinch') !== null) throw new Error('pinch should be null');
    if (getUnitCategory('unknown') !== null) throw new Error('unknown should be null');
  });

  await test('getConvertibleUnits: returns other units in same category', () => {
    const gUnits = getConvertibleUnits('g');
    if (gUnits.includes('g')) throw new Error('should not include source unit');
    if (!gUnits.includes('kg')) throw new Error('should include kg');
    if (!gUnits.includes('oz')) throw new Error('should include oz');
    if (!gUnits.includes('lb')) throw new Error('should include lb');
    if (gUnits.length !== 3) throw new Error('should have 3 units');
  });

  // ============ Weight Conversions ============
  await test('convertWeight: g to kg', () => {
    const result = convertWeight(1000, 'g', 'kg');
    if (!approxEqual(result, 1)) throw new Error(`expected 1, got ${result}`);
  });

  await test('convertWeight: kg to g', () => {
    const result = convertWeight(2, 'kg', 'g');
    if (!approxEqual(result, 2000)) throw new Error(`expected 2000, got ${result}`);
  });

  await test('convertWeight: oz to g', () => {
    const result = convertWeight(1, 'oz', 'g');
    if (!approxEqual(result, 28.35, 0.1)) throw new Error(`expected ~28.35, got ${result}`);
  });

  await test('convertWeight: lb to kg', () => {
    const result = convertWeight(1, 'lb', 'kg');
    if (!approxEqual(result, 0.454, 0.01)) throw new Error(`expected ~0.454, got ${result}`);
  });

  await test('convertWeight: same unit returns same value', () => {
    const result = convertWeight(500, 'g', 'g');
    if (result !== 500) throw new Error(`expected 500, got ${result}`);
  });

  // ============ Volume Conversions ============
  await test('convertVolume: ml to cup', () => {
    const result = convertVolume(236.588, 'ml', 'cup');
    if (!approxEqual(result, 1)) throw new Error(`expected 1, got ${result}`);
  });

  await test('convertVolume: cup to ml', () => {
    const result = convertVolume(1, 'cup', 'ml');
    if (!approxEqual(result, 236.588, 0.1)) throw new Error(`expected ~236.588, got ${result}`);
  });

  await test('convertVolume: tsp to tbsp', () => {
    const result = convertVolume(3, 'tsp', 'tbsp');
    if (!approxEqual(result, 1)) throw new Error(`expected 1, got ${result}`);
  });

  await test('convertVolume: tbsp to ml', () => {
    const result = convertVolume(1, 'tbsp', 'ml');
    if (!approxEqual(result, 14.79, 0.1)) throw new Error(`expected ~14.79, got ${result}`);
  });

  // ============ Temperature Conversions ============
  await test('convertTemperature: C to F (freezing)', () => {
    const result = convertTemperature(0, 'c', 'f');
    if (!approxEqual(result, 32)) throw new Error(`expected 32, got ${result}`);
  });

  await test('convertTemperature: C to F (boiling)', () => {
    const result = convertTemperature(100, 'c', 'f');
    if (!approxEqual(result, 212)) throw new Error(`expected 212, got ${result}`);
  });

  await test('convertTemperature: F to C (freezing)', () => {
    const result = convertTemperature(32, 'f', 'c');
    if (!approxEqual(result, 0)) throw new Error(`expected 0, got ${result}`);
  });

  await test('convertTemperature: F to C (body temp)', () => {
    const result = convertTemperature(98.6, 'f', 'c');
    if (!approxEqual(result, 37, 0.1)) throw new Error(`expected ~37, got ${result}`);
  });

  await test('convertTemperature: same unit returns same value', () => {
    const result = convertTemperature(25, 'c', 'c');
    if (result !== 25) throw new Error(`expected 25, got ${result}`);
  });

  // ============ Generic Convert Function ============
  await test('convert: handles weight conversion', () => {
    const result = convert(500, 'g', 'kg');
    if (result === null) throw new Error('should not be null');
    if (!approxEqual(result, 0.5)) throw new Error(`expected 0.5, got ${result}`);
  });

  await test('convert: handles volume conversion', () => {
    const result = convert(2, 'cup', 'ml');
    if (result === null) throw new Error('should not be null');
    if (!approxEqual(result, 473.18, 0.1)) throw new Error(`expected ~473.18, got ${result}`);
  });

  await test('convert: handles temperature conversion', () => {
    const result = convert(180, 'c', 'f');
    if (result === null) throw new Error('should not be null');
    if (!approxEqual(result, 356)) throw new Error(`expected 356, got ${result}`);
  });

  await test('convert: returns null for incompatible units', () => {
    const result = convert(100, 'g', 'ml');
    if (result !== null) throw new Error('should be null for weight->volume');
  });

  await test('convert: returns null for invalid units', () => {
    const result = convert(100, 'g', 'pinch');
    if (result !== null) throw new Error('should be null for invalid target');
  });

  await test('convert: returns null for non-positive weight/volume', () => {
    const result = convert(0, 'g', 'kg');
    if (result !== null) throw new Error('should be null for zero weight');
    const result2 = convert(-5, 'ml', 'cup');
    if (result2 !== null) throw new Error('should be null for negative volume');
  });

  await test('convert: allows negative temperature', () => {
    const result = convert(-40, 'c', 'f');
    if (result === null) throw new Error('should allow negative temperature');
    if (!approxEqual(result, -40)) throw new Error(`expected -40, got ${result}`);
  });

  // ============ Rounding & Formatting ============
  await test('roundValue: rounds to specified decimals', () => {
    if (roundValue(1.2345, 2) !== 1.23) throw new Error('2 decimals failed');
    if (roundValue(1.2345, 1) !== 1.2) throw new Error('1 decimal failed');
    if (roundValue(1.2345, 0) !== 1) throw new Error('0 decimals failed');
    if (roundValue(1.2345, 3) !== 1.235) throw new Error('3 decimals failed');
  });

  await test('formatConvertedValue: smart formatting', () => {
    if (formatConvertedValue(0) !== '0') throw new Error('zero failed');
    if (formatConvertedValue(0.005) !== '0.005') throw new Error('very small failed');
    if (formatConvertedValue(1.234) !== '1.23') throw new Error('small failed');
    if (formatConvertedValue(50.678) !== '50.7') throw new Error('medium failed');
    if (formatConvertedValue(150.5) !== '151') throw new Error('large failed');
  });

  await test('convertAndFormat: combines conversion and formatting', () => {
    const result = convertAndFormat(1000, 'g', 'kg');
    if (result === null) throw new Error('should not be null');
    if (!approxEqual(result.value, 1)) throw new Error(`expected value 1, got ${result.value}`);
    if (result.formatted !== '1') throw new Error(`expected formatted "1", got "${result.formatted}"`);
  });

  await test('convertAndFormat: returns null for invalid conversion', () => {
    const result = convertAndFormat(100, 'g', 'ml');
    if (result !== null) throw new Error('should be null for invalid conversion');
  });

  // ============ Unit Labels ============
  await test('getUnitLabel: returns human-readable labels', () => {
    if (getUnitLabel('g') !== 'grams') throw new Error('g label wrong');
    if (getUnitLabel('kg') !== 'kilograms') throw new Error('kg label wrong');
    if (getUnitLabel('oz') !== 'ounces') throw new Error('oz label wrong');
    if (getUnitLabel('lb') !== 'pounds') throw new Error('lb label wrong');
    if (getUnitLabel('ml') !== 'milliliters') throw new Error('ml label wrong');
    if (getUnitLabel('cup') !== 'cups') throw new Error('cup label wrong');
    if (getUnitLabel('tsp') !== 'teaspoons') throw new Error('tsp label wrong');
    if (getUnitLabel('tbsp') !== 'tablespoons') throw new Error('tbsp label wrong');
    if (getUnitLabel('c') !== '°C') throw new Error('c label wrong');
    if (getUnitLabel('f') !== '°F') throw new Error('f label wrong');
    if (getUnitLabel('unknown') !== 'unknown') throw new Error('unknown label wrong');
  });

  // ============ Constants ============
  await test('WEIGHT_UNITS: contains expected units', () => {
    if (WEIGHT_UNITS.length !== 4) throw new Error('expected 4 weight units');
    if (!WEIGHT_UNITS.includes('g')) throw new Error('missing g');
    if (!WEIGHT_UNITS.includes('kg')) throw new Error('missing kg');
    if (!WEIGHT_UNITS.includes('oz')) throw new Error('missing oz');
    if (!WEIGHT_UNITS.includes('lb')) throw new Error('missing lb');
  });

  await test('VOLUME_UNITS: contains expected units', () => {
    if (VOLUME_UNITS.length !== 4) throw new Error('expected 4 volume units');
    if (!VOLUME_UNITS.includes('ml')) throw new Error('missing ml');
    if (!VOLUME_UNITS.includes('cup')) throw new Error('missing cup');
    if (!VOLUME_UNITS.includes('tsp')) throw new Error('missing tsp');
    if (!VOLUME_UNITS.includes('tbsp')) throw new Error('missing tbsp');
  });

  await test('TEMPERATURE_UNITS: contains expected units', () => {
    if (TEMPERATURE_UNITS.length !== 2) throw new Error('expected 2 temperature units');
    if (!TEMPERATURE_UNITS.includes('c')) throw new Error('missing c');
    if (!TEMPERATURE_UNITS.includes('f')) throw new Error('missing f');
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
