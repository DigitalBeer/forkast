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

// Expanded categorization map with more ingredients
const CATEGORY_MAP: Record<string, string> = {
  // Produce
  apple: "produce", banana: "produce", onion: "produce", garlic: "produce",
  tomato: "produce", lettuce: "produce", carrot: "produce", pepper: "produce",
  spinach: "produce", potato: "produce", cilantro: "produce", lime: "produce",
  lemon: "produce", avocado: "produce", cucumber: "produce", broccoli: "produce",
  mushroom: "produce", celery: "produce", ginger: "produce", parsley: "produce",
  basil: "produce", mint: "produce", kale: "produce", cabbage: "produce",
  zucchini: "produce", squash: "produce", butternut: "produce", pumpkin: "produce",
  asparagus: "produce", beetroot: "produce", aubergine: "produce", eggplant: "produce",
  courgette: "produce", sweetcorn: "produce", corn: "produce", peas: "produce",
  beans: "produce", "green beans": "produce", "runner beans": "produce",
  leek: "produce", shallot: "produce", "spring onion": "produce", scallion: "produce",
  radish: "produce", turnip: "produce", swede: "produce", parsnip: "produce",
  orange: "produce", grapefruit: "produce", melon: "produce", watermelon: "produce",
  strawberry: "produce", raspberry: "produce", blueberry: "produce", berry: "produce",
  grape: "produce", pear: "produce", peach: "produce", mango: "produce",
  pineapple: "produce", coconut: "produce", kiwi: "produce", plum: "produce",
  cherry: "produce", fig: "produce", date: "produce", pomegranate: "produce",
  
  // Dairy
  milk: "dairy", cheese: "dairy", butter: "dairy", yogurt: "dairy", cream: "dairy",
  egg: "dairy", eggs: "dairy", cheddar: "dairy", mozzarella: "dairy", parmesan: "dairy",
  feta: "dairy", gouda: "dairy", brie: "dairy", "cream cheese": "dairy",
  "sour cream": "dairy", "greek yogurt": "dairy", mascarpone: "dairy",
  ricotta: "dairy", halloumi: "dairy", "cottage cheese": "dairy",
  "double cream": "dairy", "single cream": "dairy", "whipping cream": "dairy",
  
  // Meat
  chicken: "meat", beef: "meat", pork: "meat", bacon: "meat", turkey: "meat",
  sausage: "meat", ham: "meat", lamb: "meat", duck: "meat", venison: "meat",
  steak: "meat", mince: "meat", "ground beef": "meat", "ground turkey": "meat",
  prosciutto: "meat", salami: "meat", chorizo: "meat", pancetta: "meat",
  "chicken breast": "meat", "chicken thigh": "meat", "pork chop": "meat",
  "beef strip": "meat", "lamb chop": "meat", meatball: "meat",
  
  // Seafood
  salmon: "seafood", shrimp: "seafood", tuna: "seafood", cod: "seafood",
  prawn: "seafood", crab: "seafood", lobster: "seafood", mussel: "seafood",
  clam: "seafood", oyster: "seafood", squid: "seafood", calamari: "seafood",
  anchovy: "seafood", mackerel: "seafood", sardine: "seafood", haddock: "seafood",
  trout: "seafood", bass: "seafood", halibut: "seafood", fish: "seafood",
  "white fish": "seafood", "smoked salmon": "seafood",
  
  // Bakery
  bread: "bakery", tortilla: "bakery", bun: "bakery", roll: "bakery",
  bagel: "bakery", croissant: "bakery", muffin: "bakery", pastry: "bakery",
  pita: "bakery", naan: "bakery", flatbread: "bakery", ciabatta: "bakery",
  baguette: "bakery", sourdough: "bakery", brioche: "bakery",
  "pizza dough": "bakery", wrap: "bakery",
  
  // Pantry
  rice: "pantry", pasta: "pantry", flour: "pantry", sugar: "pantry",
  salt: "pantry", oil: "pantry", vinegar: "pantry", spices: "pantry",
  "tomato sauce": "pantry", "olive oil": "pantry", "vegetable oil": "pantry",
  spaghetti: "pantry", noodle: "pantry", penne: "pantry", linguine: "pantry",
  orzo: "pantry", couscous: "pantry", quinoa: "pantry", bulgur: "pantry",
  oat: "pantry", oats: "pantry", cereal: "pantry", granola: "pantry",
  "baked beans": "pantry", "kidney beans": "pantry", chickpea: "pantry",
  lentil: "pantry", stock: "pantry", broth: "pantry", bouillon: "pantry",
  "tomato paste": "pantry", "tomato puree": "pantry", "passata": "pantry",
  "canned tomato": "pantry", "chopped tomato": "pantry",
  honey: "pantry", maple: "pantry", syrup: "pantry", jam: "pantry",
  peanut: "pantry", almond: "pantry", walnut: "pantry", cashew: "pantry",
  "nut butter": "pantry", "peanut butter": "pantry",
  soy: "pantry", "soy sauce": "pantry", sauce: "pantry", ketchup: "pantry",
  mustard: "pantry", mayonnaise: "pantry", mayo: "pantry",
  curry: "pantry", "curry paste": "pantry", "curry powder": "pantry",
  paprika: "pantry", cumin: "pantry", coriander: "pantry", turmeric: "pantry",
  oregano: "pantry", thyme: "pantry", rosemary: "pantry", sage: "pantry",
  cayenne: "pantry", chili: "pantry", "chilli flakes": "pantry",
  "black pepper": "pantry", pepper: "pantry", cinnamon: "pantry",
  nutmeg: "pantry", vanilla: "pantry", "baking powder": "pantry",
  "baking soda": "pantry", yeast: "pantry", cocoa: "pantry", chocolate: "pantry",
};

// Keywords for fallback categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  produce: ["fresh", "salad", "leaf", "vegetable", "fruit", "herb"],
  dairy: ["milk", "cheese", "cream", "yogurt", "egg"],
  meat: ["chicken", "beef", "pork", "lamb", "steak", "mince", "sausage", "bacon", "ham"],
  seafood: ["fish", "salmon", "shrimp", "prawn", "tuna", "cod", "seafood"],
  bakery: ["bread", "roll", "bun", "dough", "pastry", "tortilla"],
  pantry: ["sauce", "paste", "oil", "stock", "rice", "pasta", "flour", "sugar", "spice", "dried", "canned", "tin"],
};

export function categorizeIngredient(name: string): string {
  const key = name.toLowerCase().trim().replace(/^["'\s]+/, ""); // Remove leading quotes and spaces
  
  // Exact match
  if (CATEGORY_MAP[key]) {
    return CATEGORY_MAP[key];
  }
  
  // Partial match - check if any key is contained in the name
  for (const [ingredient, category] of Object.entries(CATEGORY_MAP)) {
    if (key.includes(ingredient) || ingredient.includes(key)) {
      return category;
    }
  }
  
  // Keyword-based fallback
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (key.includes(keyword)) {
        return category;
      }
    }
  }
  
  return "other";
}

function normalizeName(name: string): string {
  // Remove leading/trailing quotes, whitespace, and normalize internal spaces
  return name
    .replace(/^["'\s]+|["'\s]+$/g, "") // Strip leading/trailing quotes and spaces
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Parse quantity and unit from ingredient name string like "2 x 300g chicken breasts"
// Returns { cleanName, quantity, unit } 
function parseQuantityFromName(rawName: string): { cleanName: string; quantity: number; unit: string } {
  let name = rawName.replace(/^["'\s]+|["'\s]+$/g, "").trim(); // Clean quotes
  let quantity = 1;
  let unit = "";

  // Pattern: "2 x 300g chicken breasts" -> qty=2, unit="300g", name="chicken breasts"
  const multiplierPattern = /^(\d+)\s*x\s*(\d+[a-z]*)\s+(.+)$/i;
  const multiplierMatch = name.match(multiplierPattern);
  if (multiplierMatch) {
    quantity = parseInt(multiplierMatch[1], 10);
    unit = multiplierMatch[2];
    name = multiplierMatch[3];
    return { cleanName: name, quantity, unit };
  }

  // Pattern: "300g chicken" -> qty=1, unit="300g", name="chicken"
  const unitFirstPattern = /^(\d+[a-z]+)\s+(.+)$/i;
  const unitFirstMatch = name.match(unitFirstPattern);
  if (unitFirstMatch) {
    unit = unitFirstMatch[1];
    name = unitFirstMatch[2];
    return { cleanName: name, quantity, unit };
  }

  // Pattern: "2 eggs" or "3 bananas" -> qty=2/3, unit="", name="eggs"/"bananas"
  const numberFirstPattern = /^(\d+)\s+(.+)$/;
  const numberFirstMatch = name.match(numberFirstPattern);
  if (numberFirstMatch) {
    quantity = parseInt(numberFirstMatch[1], 10);
    name = numberFirstMatch[2];
    return { cleanName: name, quantity, unit };
  }

  // Pattern: "1/2 cup flour" or "1 tbsp oil" -> qty=0.5/1, unit="cup"/"tbsp", name="flour"/"oil"
  const fractionUnitPattern = /^([\d\/\.]+)\s+(cup|cups|tbsp|tsp|oz|ml|g|kg|lb|lbs|tablespoon|teaspoon)\s+(.+)$/i;
  const fractionMatch = name.match(fractionUnitPattern);
  if (fractionMatch) {
    const qtyStr = fractionMatch[1];
    if (qtyStr.includes("/")) {
      const [num, denom] = qtyStr.split("/").map(Number);
      quantity = num / denom;
    } else {
      quantity = parseFloat(qtyStr);
    }
    unit = fractionMatch[2];
    name = fractionMatch[3];
    return { cleanName: name, quantity, unit };
  }

  return { cleanName: name, quantity, unit };
}

// Accepts several shapes:
// - string (JSON stringified array)
// - Ingredient[]
// - Array<{ name: string; quantity?: number; amount?: number; unit?: string }>
// - null/undefined (returns empty array)
export function parseIngredientsField(raw: unknown): Ingredient[] {
  // Handle null/undefined gracefully
  if (raw === null || raw === undefined) {
    return [];
  }

  let value: unknown = raw;
  if (typeof raw === "string") {
    // Handle empty strings
    if (raw.trim() === "") {
      return [];
    }
    try {
      value = JSON.parse(raw);
    } catch (_e) {
      // If it's not valid JSON, it's likely plain text ingredients (e.g., "2 eggs, butter, salt")
      // Skip these meals rather than throwing an error
      console.warn('Skipping plain text ingredients:', raw.substring(0, 50));
      return [];
    }
  }

  if (!Array.isArray(value)) {
    throw new IngredientFormatError("ingredients field is not an array");
  }

  const parsed: Ingredient[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      // Skip invalid items instead of throwing
      console.warn('Skipping invalid ingredient item:', item);
      continue;
    }
    const obj = item as Record<string, unknown>;
    const rawName = typeof obj.name === "string" ? obj.name : "";
    const quantityRaw = (obj.quantity ?? obj.amount) as unknown;
    const unitRaw = typeof obj.unit === "string" ? obj.unit : "";

    if (!rawName.trim()) {
      // skip blank names rather than throwing
      continue;
    }

    // Try to extract quantity/unit from name if not already provided
    const { cleanName, quantity: parsedQty, unit: parsedUnit } = parseQuantityFromName(rawName);
    
    // Use provided values if available, otherwise use parsed values
    let quantity = 1;
    if (typeof quantityRaw === "number" && Number.isFinite(quantityRaw) && quantityRaw > 0) {
      quantity = quantityRaw;
    } else if (typeof quantityRaw === "string" && quantityRaw.trim()) {
      const n = Number(quantityRaw);
      if (Number.isFinite(n) && n > 0) quantity = n;
    } else {
      quantity = parsedQty; // Use parsed quantity from name
    }

    const unit = unitRaw || parsedUnit; // Use provided unit or parsed unit
    const name = cleanName.replace(/^["'\s]+|["'\s]+$/g, ""); // Final cleanup of name

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
