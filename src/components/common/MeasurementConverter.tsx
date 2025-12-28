"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  convert,
  formatConvertedValue,
  getConvertibleUnits,
  getUnitCategory,
  getUnitLabel,
  WEIGHT_UNITS,
  VOLUME_UNITS,
  TEMPERATURE_UNITS,
} from "@/lib/measurements/conversions";

export type ConversionMode = "ingredient" | "temperature";

export interface MeasurementConverterProps {
  mode: ConversionMode;
  initialValue?: number;
  initialUnit?: string;
  onApply?: (value: number, unit: string) => void;
  onClose?: () => void;
}

export function MeasurementConverter({
  mode,
  initialValue = 1,
  initialUnit = "",
  onApply,
  onClose,
}: MeasurementConverterProps) {
  const [fromValue, setFromValue] = useState<string>(String(initialValue));
  const [fromUnit, setFromUnit] = useState<string>(initialUnit.toLowerCase());
  const [toUnit, setToUnit] = useState<string>("");
  const [result, setResult] = useState<{ value: number; formatted: string } | null>(null);
  const [error, setError] = useState<string>("");

  // Determine available units based on mode and initial unit
  const availableFromUnits = useMemo(() => {
    if (mode === "temperature") return TEMPERATURE_UNITS;
    const category = getUnitCategory(fromUnit);
    if (category === "weight") return WEIGHT_UNITS;
    if (category === "volume") return VOLUME_UNITS;
    return [...WEIGHT_UNITS, ...VOLUME_UNITS];
  }, [mode, fromUnit]);

  const availableToUnits = useMemo(
    () => (fromUnit ? getConvertibleUnits(fromUnit) : []),
    [fromUnit]
  );

  // Set default toUnit when fromUnit changes
  useEffect(() => {
    if (fromUnit && availableToUnits.length > 0 && !availableToUnits.includes(toUnit)) {
      setToUnit(availableToUnits[0]);
    }
  }, [fromUnit, availableToUnits, toUnit]);

  // Perform conversion when inputs change
  useEffect(() => {
    setError("");
    setResult(null);

    const numValue = parseFloat(fromValue);
    if (isNaN(numValue)) {
      return;
    }

    if (!fromUnit || !toUnit) {
      return;
    }

    const converted = convert(numValue, fromUnit, toUnit);
    if (converted === null) {
      setError("Cannot convert between these units");
      return;
    }

    setResult({
      value: converted,
      formatted: formatConvertedValue(converted),
    });
  }, [fromValue, fromUnit, toUnit]);

  const handleApply = () => {
    if (result && onApply) {
      onApply(result.value, toUnit);
    }
  };

  return (
    <div
      className="bg-white border rounded-lg shadow-lg p-4 space-y-4 min-w-[280px]"
      role="dialog"
      aria-label="Measurement converter"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">
          {mode === "temperature" ? "Temperature Converter" : "Unit Converter"}
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Close converter"
          >
            ×
          </button>
        )}
      </div>

      {/* From section */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 block">From</label>
        <div className="flex gap-2">
          <Input
            type="number"
            step="any"
            value={fromValue}
            onChange={(e) => setFromValue(e.target.value)}
            className="w-24"
            aria-label="Value to convert"
            data-testid="converter-from-value"
          />
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="flex-1 border rounded-md px-2 py-2 text-sm bg-background"
            aria-label="From unit"
            data-testid="converter-from-unit"
          >
            <option value="">Select unit</option>
            {availableFromUnits.map((u) => (
              <option key={u} value={u}>
                {u} ({getUnitLabel(u)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* To section */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 block">To</label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={result?.formatted ?? "—"}
            readOnly
            className="w-24 bg-gray-50"
            aria-label="Converted value"
            data-testid="converter-result"
          />
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="flex-1 border rounded-md px-2 py-2 text-sm bg-background"
            aria-label="To unit"
            disabled={availableToUnits.length === 0}
            data-testid="converter-to-unit"
          >
            {availableToUnits.length === 0 ? (
              <option value="">Select from unit first</option>
            ) : (
              availableToUnits.map((u) => (
                <option key={u} value={u}>
                  {u} ({getUnitLabel(u)})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Actions */}
      {onApply && (
        <div className="flex justify-end gap-2 pt-2 border-t">
          {onClose && (
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={!result}
            data-testid="converter-apply"
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
