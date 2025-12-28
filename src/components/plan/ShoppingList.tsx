"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ShoppingListItem } from "@/lib/shopping/aggregate";
import { MeasurementConverter } from "@/components/common/MeasurementConverter";
import { getUnitCategory } from "@/lib/measurements/conversions";

type ItemKey = string; // `${name}|${unit}`
type ShoppingListState = {
  version: string; // hash of meal plan items
  checkedItems: string[];
};

const CATEGORIES = [
  "produce",
  "dairy",
  "meat",
  "seafood",
  "bakery",
  "pantry",
  "other",
];

export function ShoppingList(props: { onClose?: () => void; defaultMealPlanId?: number | string }) {
  const { onClose, defaultMealPlanId } = props;
  const [mealPlanId, setMealPlanId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [checked, setChecked] = useState<Set<ItemKey>>(new Set());
  const headingRef = useRef<HTMLHeadingElement>(null);

  const groups = useMemo(() => {
    const map = new Map<string, ShoppingListItem[]>();
    for (const it of items) {
      const arr = map.get(it.category) || [];
      arr.push(it);
      map.set(it.category, arr);
    }
    // keep defined order
    return CATEGORIES.map((c) => ({
      category: c,
      items: map.get(c) || [],
    })).filter((g) => g.items.length > 0);
  }, [items]);

  useEffect(() => {
    if (defaultMealPlanId && !mealPlanId) {
      setMealPlanId(String(defaultMealPlanId));
    }
  }, [defaultMealPlanId, mealPlanId]);

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
      // Load persisted checked state for this plan if available
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(`shopping_checked_${idNum}`) : null;
        if (raw) {
          const state = JSON.parse(raw) as ShoppingListState;
          const currentVersion = generateVersionHash(data.items || []);
          
          // Clear state if meal plan has changed
          if (state.version === currentVersion) {
            setChecked(new Set(state.checkedItems));
          } else {
            setChecked(new Set());
            // Clear stale state
            if (typeof window !== "undefined") {
              localStorage.removeItem(`shopping_checked_${idNum}`);
            }
          }
        } else {
          setChecked(new Set());
        }
      } catch {
        setChecked(new Set());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch shopping list");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key: ItemKey) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      
      // Persist the updated state with current version
      if (typeof window !== "undefined" && mealPlanId) {
        const idNum = typeof mealPlanId === "string" ? parseInt(mealPlanId, 10) : mealPlanId;
        if (!Number.isNaN(idNum)) {
          const currentVersion = generateVersionHash(items);
          const state: ShoppingListState = {
            version: currentVersion,
            checkedItems: Array.from(next)
          };
          localStorage.setItem(`shopping_checked_${idNum}`, JSON.stringify(state));
        }
      }
      
      return next;
    });
  };

  // Generate a hash of the meal plan items to detect changes
  const generateVersionHash = (planItems: ShoppingListItem[]): string => {
    // Create a normalized string representation of all items
    const normalized = planItems
      .map(item => `${item.name.toLowerCase().trim()}|${item.unit.toLowerCase().trim()}|${item.quantity}`)
      .sort() // Sort to ensure consistent ordering
      .join('||');
    
    // Simple hash function (could use crypto.subtle.digest for better security, but this is sufficient for versioning)
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  };

  const [custom, setCustom] = useState({ name: "", quantity: "1", unit: "", category: "other" });
  const [converterOpen, setConverterOpen] = useState<string | null>(null);

  const addCustom = () => {
    const name = custom.name.trim();
    if (!name) return;
    const quantity = Number(custom.quantity);
    const unit = custom.unit.trim();
    const category = CATEGORIES.includes(custom.category) ? custom.category : "other";
    const newItem: ShoppingListItem = { name: name.toLowerCase(), quantity: Number.isFinite(quantity) ? quantity : 1, unit, category };
    setItems((prev) => {
      const arr = [...prev, newItem];
      // naive sort: category then name
      return arr.sort((a, b) => (a.category === b.category ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category)));
    });
    setCustom({ name: "", quantity: "1", unit: "", category });
  };

  // Persist checked state per mealPlanId
  useEffect(() => {
    if (!mealPlanId) return;
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`shopping_checked_${mealPlanId}`, JSON.stringify(Array.from(checked)));
    } catch {
      // ignore quota or serialization errors
    }
  }, [checked, mealPlanId]);

  const handlePrint = () => {
    window.print();
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
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 id="shopping-list-title" ref={headingRef} tabIndex={-1} className="text-xl font-semibold">Shopping List</h2>
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={handlePrint} className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50">Print</button>
            {onClose && (
              <button onClick={onClose} className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50">Close</button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2 print:hidden">
            <input
              type="number"
              placeholder="Meal Plan ID"
              value={mealPlanId}
              onChange={(e) => setMealPlanId(e.target.value)}
              className="flex-1 rounded border px-3 py-2"
            />
            <button
              disabled={loading}
              onClick={generate}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >{loading ? "Generating..." : "Generate"}</button>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && items.length === 0 && (
            <div className="text-sm text-gray-500">
              {mealPlanId ? "No items found for this meal plan." : "Enter a meal plan ID and click Generate to create a shopping list."}
            </div>
          )}

          {groups.length > 0 && (
            <div className="space-y-6 print:space-y-2">
              {groups.map((g) => (
                <div key={g.category}>
                  <h3 className="text-lg font-semibold capitalize mb-2 print:mb-1">{g.category}</h3>
                  <ul className="space-y-1">
                    {g.items.map((it) => {
                      const key = `${it.name}|${it.unit}`;
                      const isChecked = checked.has(key);
                      const canConvert = getUnitCategory(it.unit) !== null;
                      return (
                        <li key={key} className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggle(key)}
                              className="h-4 w-4"
                            />
                            <span className={isChecked ? "line-through text-gray-400 flex-1" : "flex-1"}>
                              {it.name} — {it.quantity}{it.unit ? ` ${it.unit}` : ""}
                            </span>
                            {canConvert && (
                              <button
                                type="button"
                                onClick={() => setConverterOpen(converterOpen === key ? null : key)}
                                className="text-xs text-blue-600 hover:underline print:hidden"
                                data-testid={`convert-shopping-item-${it.name}`}
                              >
                                Convert
                              </button>
                            )}
                          </div>
                          {converterOpen === key && (
                            <div className="ml-7 print:hidden">
                              <MeasurementConverter
                                mode="ingredient"
                                initialValue={it.quantity}
                                initialUnit={it.unit}
                                onApply={(value, unit) => {
                                  setItems((prev) =>
                                    prev.map((item) =>
                                      `${item.name}|${item.unit}` === key
                                        ? { ...item, quantity: value, unit }
                                        : item
                                    )
                                  );
                                  setConverterOpen(null);
                                }}
                                onClose={() => setConverterOpen(null)}
                              />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4 mt-2 print:hidden">
            <h4 className="font-medium mb-2">Add custom item</h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Name"
                value={custom.name}
                onChange={(e) => setCustom((c) => ({ ...c, name: e.target.value }))}
                className="rounded border px-3 py-2 col-span-2"
              />
              <input
                type="number"
                placeholder="Qty"
                value={custom.quantity}
                onChange={(e) => setCustom((c) => ({ ...c, quantity: e.target.value }))}
                className="rounded border px-3 py-2"
              />
              <input
                type="text"
                placeholder="Unit"
                value={custom.unit}
                onChange={(e) => setCustom((c) => ({ ...c, unit: e.target.value }))}
                className="rounded border px-3 py-2"
              />
              <select
                value={custom.category}
                onChange={(e) => setCustom((c) => ({ ...c, category: e.target.value }))}
                className="rounded border px-3 py-2 col-span-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="col-span-2 flex justify-end">
                <button onClick={addCustom} className="px-4 py-2 rounded bg-gray-800 text-white">Add</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
