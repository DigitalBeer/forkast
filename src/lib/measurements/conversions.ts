/**
 * Measurement Conversion Utilities
 * Pure functions for converting between weight, volume, and temperature units.
 */

// Unit type definitions
export type WeightUnit = 'g' | 'kg' | 'oz' | 'lb';
export type VolumeUnit = 'ml' | 'cup' | 'tsp' | 'tbsp';
export type TemperatureUnit = 'c' | 'f';
export type MeasurementUnit = WeightUnit | VolumeUnit | TemperatureUnit;

// Conversion factors to base units (grams for weight, ml for volume)
const WEIGHT_TO_GRAMS: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  ml: 1,
  cup: 236.588,
  tsp: 4.92892,
  tbsp: 14.7868,
};

// Unit categories for validation
export const WEIGHT_UNITS: WeightUnit[] = ['g', 'kg', 'oz', 'lb'];
export const VOLUME_UNITS: VolumeUnit[] = ['ml', 'cup', 'tsp', 'tbsp'];
export const TEMPERATURE_UNITS: TemperatureUnit[] = ['c', 'f'];

/**
 * Check if a unit is a weight unit
 */
export function isWeightUnit(unit: string): unit is WeightUnit {
  return WEIGHT_UNITS.includes(unit.toLowerCase() as WeightUnit);
}

/**
 * Check if a unit is a volume unit
 */
export function isVolumeUnit(unit: string): unit is VolumeUnit {
  return VOLUME_UNITS.includes(unit.toLowerCase() as VolumeUnit);
}

/**
 * Check if a unit is a temperature unit
 */
export function isTemperatureUnit(unit: string): unit is TemperatureUnit {
  return TEMPERATURE_UNITS.includes(unit.toLowerCase() as TemperatureUnit);
}

/**
 * Get the category of a unit
 */
export function getUnitCategory(unit: string): 'weight' | 'volume' | 'temperature' | null {
  const lowerUnit = unit.toLowerCase();
  if (isWeightUnit(lowerUnit)) return 'weight';
  if (isVolumeUnit(lowerUnit)) return 'volume';
  if (isTemperatureUnit(lowerUnit)) return 'temperature';
  return null;
}

/**
 * Get available target units for conversion based on source unit
 */
export function getConvertibleUnits(sourceUnit: string): string[] {
  const category = getUnitCategory(sourceUnit);
  if (category === 'weight') return WEIGHT_UNITS.filter(u => u !== sourceUnit.toLowerCase());
  if (category === 'volume') return VOLUME_UNITS.filter(u => u !== sourceUnit.toLowerCase());
  if (category === 'temperature') return TEMPERATURE_UNITS.filter(u => u !== sourceUnit.toLowerCase());
  return [];
}

/**
 * Convert between weight units
 */
export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  const grams = value * WEIGHT_TO_GRAMS[from];
  return grams / WEIGHT_TO_GRAMS[to];
}

/**
 * Convert between volume units
 */
export function convertVolume(value: number, from: VolumeUnit, to: VolumeUnit): number {
  if (from === to) return value;
  const ml = value * VOLUME_TO_ML[from];
  return ml / VOLUME_TO_ML[to];
}

/**
 * Convert between temperature units
 */
export function convertTemperature(value: number, from: TemperatureUnit, to: TemperatureUnit): number {
  if (from === to) return value;
  if (from === 'c' && to === 'f') {
    return (value * 9) / 5 + 32;
  }
  // f to c
  return ((value - 32) * 5) / 9;
}

/**
 * Generic conversion function that handles all unit types
 * Returns null if units are incompatible or invalid
 */
export function convert(value: number, from: string, to: string): number | null {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  // Validate same category
  const fromCategory = getUnitCategory(fromLower);
  const toCategory = getUnitCategory(toLower);

  if (!fromCategory || !toCategory || fromCategory !== toCategory) {
    return null;
  }

  // Validate positive value for weight/volume
  if ((fromCategory === 'weight' || fromCategory === 'volume') && value <= 0) {
    return null;
  }

  switch (fromCategory) {
    case 'weight':
      return convertWeight(value, fromLower as WeightUnit, toLower as WeightUnit);
    case 'volume':
      return convertVolume(value, fromLower as VolumeUnit, toLower as VolumeUnit);
    case 'temperature':
      return convertTemperature(value, fromLower as TemperatureUnit, toLower as TemperatureUnit);
  }
}

/**
 * Round a number to a specified number of decimal places
 * Default is 2 decimal places
 */
export function roundValue(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Format a converted value for display
 * Uses smart rounding: more decimals for small values, fewer for large
 */
export function formatConvertedValue(value: number): string {
  if (value === 0) return '0';

  const absValue = Math.abs(value);

  // For very small values, show more precision
  if (absValue < 0.01) {
    return roundValue(value, 4).toString();
  }
  // For small values, show 2 decimals
  if (absValue < 10) {
    return roundValue(value, 2).toString();
  }
  // For medium values, show 1 decimal
  if (absValue < 100) {
    return roundValue(value, 1).toString();
  }
  // For large values, round to whole number
  return Math.round(value).toString();
}

/**
 * Convert and format in one step
 * Returns null if conversion is not possible
 */
export function convertAndFormat(
  value: number,
  from: string,
  to: string
): { value: number; formatted: string } | null {
  const converted = convert(value, from, to);
  if (converted === null) return null;

  return {
    value: converted,
    formatted: formatConvertedValue(converted),
  };
}

/**
 * Get display label for a unit
 */
export function getUnitLabel(unit: string): string {
  const labels: Record<string, string> = {
    g: 'grams',
    kg: 'kilograms',
    oz: 'ounces',
    lb: 'pounds',
    ml: 'milliliters',
    cup: 'cups',
    tsp: 'teaspoons',
    tbsp: 'tablespoons',
    c: '°C',
    f: '°F',
  };
  return labels[unit.toLowerCase()] || unit;
}
