"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ShoppingListItem } from "@/lib/shopping/aggregate";
import { MeasurementConverter } from "@/components/common/MeasurementConverter";
import { getUnitCategory } from "@/lib/measurements/conversions";
import { ShoppingListSection } from "@/components/plan/ShoppingListSection";
import { StaplesManager } from "@/components/plan/StaplesManager";
import { useHaveItState } from "@/hooks/useHaveItState";
import { Printer, X, RefreshCw, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";



const CATEGORIES = [
  "produce",
  "dairy",
  "meat",
  "seafood",
  "bakery",
  "pantry",
  "other",
];

export function ShoppingList(props: {
  onClose?: () => void;
  defaultMealPlanId?: number | string;
}) {
  const { onClose, defaultMealPlanId } = props;
  const [mealPlanId, setMealPlanId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [converterOpen, setConverterOpen] = useState<string | null>(null);
  const [needToBuyExpanded, setNeedToBuyExpanded] = useState(true);
  const [alreadyHaveExpanded, setAlreadyHaveExpanded] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Use the haveIt state hook
  const {
    needToBuyItems,
    alreadyHaveItems,
    toggleHaveIt,
    toggleChecked,
    setStaples,
    resetHaveIt,
    loading: staplesLoading,
    needToBuyCount,
    alreadyHaveCount,
  } = useHaveItState({
    mealPlanId,
    items,
  });



  useEffect(() => {
    if (defaultMealPlanId && !mealPlanId) {
      setMealPlanId(String(defaultMealPlanId));
    }
  }, [defaultMealPlanId, mealPlanId]);

  // Auto-generate shopping list when meal plan ID is set from default
  useEffect(() => {
    if (mealPlanId && items.length === 0 && !loading && !error) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealPlanId]);

  // Accessibility: focus heading on mount and close on Escape
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const generate = async () => {
    setError("");
    const idNum = Number(mealPlanId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      setError("Please enter a valid numeric meal plan ID");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/shopping-list?mealPlanId=${idNum}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || `Request failed: ${res.status}`);
        setItems([]);
        return;
      }
      const data = (await res.json()) as { items: ShoppingListItem[] };
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch shopping list");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const [custom, setCustom] = useState({
    name: "",
    quantity: "1",
    unit: "",
    category: "other",
  });

  const addCustom = () => {
    const name = custom.name.trim();
    if (!name) return;
    const quantity = Number(custom.quantity);
    const unit = custom.unit.trim();
    const category = CATEGORIES.includes(custom.category)
      ? custom.category
      : "other";
    const newItem: ShoppingListItem = {
      name: name.toLowerCase(),
      quantity: Number.isFinite(quantity) ? quantity : 1,
      unit,
      category,
    };
    setItems((prev) => {
      const arr = [...prev, newItem];
      return arr.sort((a, b) =>
        a.category === b.category
          ? a.name.localeCompare(b.name)
          : a.category.localeCompare(b.category)
      );
    });
    setCustom({ name: "", quantity: "1", unit: "", category });
  };

  const handlePrint = () => {
    window.print();
  };

  const canConvert = (unit: string) => getUnitCategory(unit) !== null;

  const handleConvert = (key: string, value: number, unit: string) => {
    setItems((prev) =>
      prev.map((item) =>
        `${item.name.toLowerCase()}|${item.unit.toLowerCase()}` === key
          ? { ...item, quantity: value, unit }
          : item
      )
    );
    setConverterOpen(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-start justify-end z-40"
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose?.();
      }}
    >
      <div
        className="w-full max-w-xl h-full bg-white shadow-xl border-l border-gray-200 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shopping-list-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="shopping-list-title"
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-semibold flex items-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              Shopping List
            </h2>
            <div className="flex items-center gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                data-testid="print-button"
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              {onClose && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  data-testid="close-button"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Summary Bar */}
          {items.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  <strong>{needToBuyCount}</strong> to buy
                </span>
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-green-600" />
                  <strong>{alreadyHaveCount}</strong> have it
                </span>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <StaplesManager onStaplesChange={setStaples} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetHaveIt}
                  title="Reset 'Have it' selections"
                  data-testid="reset-have-it-button"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Generate Form - only show if no default meal plan ID */}
          {!defaultMealPlanId && (
            <div className="flex gap-2 print:hidden">
              <input
                type="number"
                placeholder="Meal Plan ID"
                value={mealPlanId}
                onChange={(e) => setMealPlanId(e.target.value)}
                className="flex-1 rounded border px-3 py-2"
                data-testid="meal-plan-id-input"
              />
              <Button
                disabled={loading}
                onClick={generate}
                data-testid="generate-button"
              >
                {loading ? "Generating..." : "Generate"}
              </Button>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-8">
              {mealPlanId
                ? "No items found for this meal plan."
                : "Enter a meal plan ID and click Generate to create a shopping list."}
            </div>
          )}

          {/* Shopping List Sections */}
          {items.length > 0 && !staplesLoading && (
            <div className="space-y-4">
              {/* Need to Buy Section */}
              <ShoppingListSection
                title="Need to Buy"
                items={needToBuyItems}
                variant="need-to-buy"
                isExpanded={needToBuyExpanded}
                onToggleExpand={() => setNeedToBuyExpanded(!needToBuyExpanded)}
                onToggleChecked={toggleChecked}
                onToggleHaveIt={toggleHaveIt}
                onOpenConverter={(key) =>
                  setConverterOpen(converterOpen === key ? null : key)
                }
                canConvert={canConvert}
              />

              {/* Already Have Section */}
              <ShoppingListSection
                title="Already Have"
                items={alreadyHaveItems}
                variant="already-have"
                isExpanded={alreadyHaveExpanded}
                onToggleExpand={() => setAlreadyHaveExpanded(!alreadyHaveExpanded)}
                onToggleChecked={toggleChecked}
                onToggleHaveIt={toggleHaveIt}
                onOpenConverter={(key) =>
                  setConverterOpen(converterOpen === key ? null : key)
                }
                canConvert={canConvert}
              />
            </div>
          )}

          {/* Converter Modal */}
          {converterOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4 shadow-xl">
                <h3 className="font-semibold mb-4">Convert Measurement</h3>
                {(() => {
                  const item = [...needToBuyItems, ...alreadyHaveItems].find(
                    (i) => i.key === converterOpen
                  );
                  if (!item) return null;
                  return (
                    <MeasurementConverter
                      mode="ingredient"
                      initialValue={item.quantity}
                      initialUnit={item.unit}
                      onApply={(value, unit) =>
                        handleConvert(converterOpen, value, unit)
                      }
                      onClose={() => setConverterOpen(null)}
                    />
                  );
                })()}
              </div>
            </div>
          )}

          {/* Add Custom Item */}
          <div className="border-t pt-4 mt-2 print:hidden">
            <h4 className="font-medium mb-2">Add custom item</h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Name"
                value={custom.name}
                onChange={(e) =>
                  setCustom((c) => ({ ...c, name: e.target.value }))
                }
                className="rounded border px-3 py-2 col-span-2"
                data-testid="custom-item-name"
              />
              <input
                type="number"
                placeholder="Qty"
                value={custom.quantity}
                onChange={(e) =>
                  setCustom((c) => ({ ...c, quantity: e.target.value }))
                }
                className="rounded border px-3 py-2"
                data-testid="custom-item-qty"
              />
              <input
                type="text"
                placeholder="Unit"
                value={custom.unit}
                onChange={(e) =>
                  setCustom((c) => ({ ...c, unit: e.target.value }))
                }
                className="rounded border px-3 py-2"
                data-testid="custom-item-unit"
              />
              <select
                value={custom.category}
                onChange={(e) =>
                  setCustom((c) => ({ ...c, category: e.target.value }))
                }
                className="rounded border px-3 py-2 col-span-2"
                data-testid="custom-item-category"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="col-span-2 flex justify-end">
                <Button onClick={addCustom} data-testid="add-custom-button">
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
