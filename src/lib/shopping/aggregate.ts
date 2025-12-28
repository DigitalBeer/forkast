import type { Ingredient } from "@/types/meal";

export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export class IngredientFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngredientFormatError";
  }
}

// Simple categorization map; extend as needed
const CATEGORY_MAP: Record<string, string> = {
  apple: "produce",
  banana: "produce",
  onion: "produce",
  garlic: "produce",
  tomato: "produce",
  lettuce: "produce",
  carrot: "produce",
  pepper: "produce",
  spinach: "produce",
  potato: "produce",
  cilantro: "produce",
  lime: "produce",
  lemon: "produce",
  milk: "dairy",
  cheese: "dairy",
  butter: "dairy",
  yogurt: "dairy",
  cream: "dairy",
  chicken: "meat",
  beef: "meat",
  pork: "meat",
  bacon: "meat",
  turkey: "meat",
  sausage: "meat",
  ham: "meat",
  salmon: "seafood",
  shrimp: "seafood",
  tuna: "seafood",
  bread: "bakery",
  tortilla: "bakery",
  bun: "bakery",
  rice: "pantry",
  pasta: "pantry",
  flour: "pantry",
  sugar: "pantry",
  salt: "pantry",
  oil: "pantry",
  vinegar: "pantry",
  spices: "pantry",
  beans: "pantry",
  "tomato sauce": "pantry",
};

export function categorizeIngredient(name: string): string {
  const key = name.toLowerCase().trim();
  return CATEGORY_MAP[key] ?? "other";
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

// Accepts several shapes:
// - string (JSON stringified array)
// - Ingredient[]
// - Array<{ name: string; quantity?: number; amount?: number; unit?: string }>
export function parseIngredientsField(raw: unknown): Ingredient[] {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch (_e) {
      throw new IngredientFormatError("ingredients field is a non-JSON string");
    }
  }

  if (!Array.isArray(value)) {
    throw new IngredientFormatError("ingredients field is not an array");
  }

  const parsed: Ingredient[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      throw new IngredientFormatError("ingredient item is not an object");
    }
    const obj = item as Record<string, unknown>;
    const name = typeof obj.name === "string" ? obj.name : "";
    const quantityRaw = (obj.quantity ?? obj.amount) as unknown;
    const unit = typeof obj.unit === "string" ? obj.unit : "";

    if (!name.trim()) {
      // skip blank names rather than throwing
      continue;
    }

    let quantity = 1;
    if (typeof quantityRaw === "number" && Number.isFinite(quantityRaw)) {
      quantity = quantityRaw;
    } else if (typeof quantityRaw === "string" && quantityRaw.trim()) {
      const n = Number(quantityRaw);
      if (Number.isFinite(n)) quantity = n;
    }

    parsed.push({ name, quantity, unit });
  }

  return parsed;
}

export function aggregateIngredients(ingredients: Ingredient[]): ShoppingListItem[] {
  const map = new Map<string, ShoppingListItem>();

  for (const ing of ingredients) {
    const name = normalizeName(ing.name);
    const unit = (ing.unit || "").trim();
    const key = `${name}|${unit}`;
    const qty = typeof ing.quantity === "number" && Number.isFinite(ing.quantity) ? ing.quantity : 1;

    if (!map.has(key)) {
      map.set(key, {
        name,
        quantity: qty,
        unit,
        category: categorizeIngredient(name),
      });
    } else {
      const curr = map.get(key)!;
      curr.quantity += qty;
    }
  }

  // sort by category then name
  return Array.from(map.values()).sort((a, b) => {
    if (a.category === b.category) return a.name.localeCompare(b.name);
    return a.category.localeCompare(b.category);
  });
}

export function aggregateFromMeals(meals: Array<{ id: number | string; name?: string; ingredients: unknown }>): ShoppingListItem[] {
  const all: Ingredient[] = [];
  for (const meal of meals) {
    const ings = parseIngredientsField(meal.ingredients);
    all.push(...ings);
  }
  return aggregateIngredients(all);
}
