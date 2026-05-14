import { describe, it, expect } from 'vitest';
import {
  isWeightUnit,
  isVolumeUnit,
  isTemperatureUnit,
  getUnitCategory,
  getConvertibleUnits,
  convertWeight,
  convertVolume,
  convertTemperature,
  convert,
  roundValue,
  formatConvertedValue,
  convertAndFormat,
  getUnitLabel,
  WEIGHT_UNITS,
  VOLUME_UNITS,
  TEMPERATURE_UNITS,
} from '../conversions';

describe('type guards', () => {
  it('isWeightUnit identifies weight units', () => {
    expect(isWeightUnit('g')).toBe(true);
    expect(isWeightUnit('kg')).toBe(true);
    expect(isWeightUnit('oz')).toBe(true);
    expect(isWeightUnit('lb')).toBe(true);
    expect(isWeightUnit('cup')).toBe(false);
  });

  it('isVolumeUnit identifies volume units', () => {
    expect(isVolumeUnit('ml')).toBe(true);
    expect(isVolumeUnit('cup')).toBe(true);
    expect(isVolumeUnit('tsp')).toBe(true);
    expect(isVolumeUnit('tbsp')).toBe(true);
    expect(isVolumeUnit('g')).toBe(false);
  });

  it('isTemperatureUnit identifies temperature units', () => {
    expect(isTemperatureUnit('c')).toBe(true);
    expect(isTemperatureUnit('f')).toBe(true);
    expect(isTemperatureUnit('g')).toBe(false);
  });

  it('type guards are case-insensitive', () => {
    expect(isWeightUnit('KG')).toBe(true);
    expect(isVolumeUnit('Cup')).toBe(true);
    expect(isTemperatureUnit('F')).toBe(true);
  });
});

describe('getUnitCategory', () => {
  it('returns correct categories', () => {
    expect(getUnitCategory('g')).toBe('weight');
    expect(getUnitCategory('ml')).toBe('volume');
    expect(getUnitCategory('c')).toBe('temperature');
  });

  it('returns null for unknown units', () => {
    expect(getUnitCategory('xyz')).toBeNull();
  });
});

describe('getConvertibleUnits', () => {
  it('returns other units in the same category', () => {
    const weightTargets = getConvertibleUnits('g');
    expect(weightTargets).toEqual(expect.arrayContaining(['kg', 'oz', 'lb']));
    expect(weightTargets).not.toContain('g');

    const volumeTargets = getConvertibleUnits('ml');
    expect(volumeTargets).toEqual(expect.arrayContaining(['cup', 'tsp', 'tbsp']));
    expect(volumeTargets).not.toContain('ml');

    const tempTargets = getConvertibleUnits('c');
    expect(tempTargets).toEqual(['f']);
  });

  it('returns empty array for unknown units', () => {
    expect(getConvertibleUnits('xyz')).toEqual([]);
  });
});

describe('convertWeight', () => {
  it('converts g to kg', () => {
    expect(convertWeight(1000, 'g', 'kg')).toBeCloseTo(1, 2);
  });

  it('converts lb to oz', () => {
    expect(convertWeight(1, 'lb', 'oz')).toBeCloseTo(16, 1);
  });

  it('returns same value when units match', () => {
    expect(convertWeight(5, 'g', 'g')).toBe(5);
  });

  it('converts kg to lb', () => {
    expect(convertWeight(1, 'kg', 'lb')).toBeCloseTo(2.20462, 2);
  });
});

describe('convertVolume', () => {
  it('converts cups to ml', () => {
    expect(convertVolume(1, 'cup', 'ml')).toBeCloseTo(236.588, 0);
  });

  it('converts tbsp to tsp', () => {
    expect(convertVolume(1, 'tbsp', 'tsp')).toBeCloseTo(3, 0);
  });

  it('returns same value when units match', () => {
    expect(convertVolume(100, 'ml', 'ml')).toBe(100);
  });
});

describe('convertTemperature', () => {
  it('converts C to F', () => {
    expect(convertTemperature(0, 'c', 'f')).toBe(32);
    expect(convertTemperature(100, 'c', 'f')).toBe(212);
  });

  it('converts F to C', () => {
    expect(convertTemperature(32, 'f', 'c')).toBeCloseTo(0, 2);
    expect(convertTemperature(212, 'f', 'c')).toBeCloseTo(100, 2);
  });

  it('returns same value when units match', () => {
    expect(convertTemperature(25, 'c', 'c')).toBe(25);
  });
});

describe('convert (generic)', () => {
  it('dispatches weight conversions', () => {
    expect(convert(1000, 'g', 'kg')).toBeCloseTo(1, 2);
  });

  it('dispatches volume conversions', () => {
    expect(convert(1, 'cup', 'ml')).toBeCloseTo(236.588, 0);
  });

  it('dispatches temperature conversions', () => {
    expect(convert(0, 'c', 'f')).toBe(32);
  });

  it('returns null for incompatible categories', () => {
    expect(convert(1, 'g', 'ml')).toBeNull();
  });

  it('returns null for unknown units', () => {
    expect(convert(1, 'xyz', 'abc')).toBeNull();
  });

  it('returns null for non-positive weight/volume values', () => {
    expect(convert(0, 'g', 'kg')).toBeNull();
    expect(convert(-5, 'ml', 'cup')).toBeNull();
  });

  it('allows non-positive temperature values', () => {
    expect(convert(-40, 'c', 'f')).toBeCloseTo(-40, 2);
  });
});

describe('roundValue', () => {
  it('rounds to 2 decimal places by default', () => {
    expect(roundValue(1.2345)).toBe(1.23);
  });

  it('rounds to specified decimal places', () => {
    expect(roundValue(1.2345, 3)).toBe(1.235);
    expect(roundValue(1.2345, 0)).toBe(1);
  });
});

describe('formatConvertedValue', () => {
  it('formats 0 as "0"', () => {
    expect(formatConvertedValue(0)).toBe('0');
  });

  it('shows 4 decimals for very small values', () => {
    expect(formatConvertedValue(0.001)).toBe('0.001');
  });

  it('shows 2 decimals for small values', () => {
    expect(formatConvertedValue(5.678)).toBe('5.68');
  });

  it('shows 1 decimal for medium values', () => {
    expect(formatConvertedValue(50.5)).toBe('50.5');
  });

  it('rounds large values to whole numbers', () => {
    expect(formatConvertedValue(250.7)).toBe('251');
  });
});

describe('convertAndFormat', () => {
  it('converts and formats in one step', () => {
    const result = convertAndFormat(1, 'kg', 'g');
    expect(result).not.toBeNull();
    expect(result!.value).toBe(1000);
    expect(result!.formatted).toBe('1000');
  });

  it('returns null for invalid conversion', () => {
    expect(convertAndFormat(1, 'g', 'ml')).toBeNull();
  });
});

describe('getUnitLabel', () => {
  it('returns human-readable labels', () => {
    expect(getUnitLabel('g')).toBe('grams');
    expect(getUnitLabel('kg')).toBe('kilograms');
    expect(getUnitLabel('cup')).toBe('cups');
    expect(getUnitLabel('c')).toBe('°C');
    expect(getUnitLabel('f')).toBe('°F');
  });

  it('returns the unit string for unknown units', () => {
    expect(getUnitLabel('xyz')).toBe('xyz');
  });
});

describe('unit arrays', () => {
  it('WEIGHT_UNITS has 4 entries', () => {
    expect(WEIGHT_UNITS).toHaveLength(4);
  });

  it('VOLUME_UNITS has 4 entries', () => {
    expect(VOLUME_UNITS).toHaveLength(4);
  });

  it('TEMPERATURE_UNITS has 2 entries', () => {
    expect(TEMPERATURE_UNITS).toHaveLength(2);
  });
});