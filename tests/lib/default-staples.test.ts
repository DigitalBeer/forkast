/**
 * @jest-environment jsdom
 */
import {
  DEFAULT_STAPLES,
  isStapleIngredient,
  getStapleNamesSet,
  groupStaplesByCategory,
  STAPLE_CATEGORIES,
  type Staple,
} from "@/lib/data/default-staples";

describe("default-staples", () => {
  describe("DEFAULT_STAPLES", () => {
    it("should have default staples defined", () => {
      expect(DEFAULT_STAPLES).toBeDefined();
      expect(DEFAULT_STAPLES.length).toBeGreaterThan(0);
    });

    it("should have staples with required properties", () => {
      DEFAULT_STAPLES.forEach((staple) => {
        expect(staple).toHaveProperty("id");
        expect(staple).toHaveProperty("name");
        expect(staple).toHaveProperty("category");
        expect(typeof staple.id).toBe("string");
        expect(typeof staple.name).toBe("string");
        expect(STAPLE_CATEGORIES).toContain(staple.category);
      });
    });

    it("should include common pantry items", () => {
      const stapleNames = DEFAULT_STAPLES.map((s) => s.name.toLowerCase());
      expect(stapleNames).toContain("salt");
      expect(stapleNames).toContain("black pepper");
      expect(stapleNames).toContain("olive oil");
      expect(stapleNames).toContain("sugar");
      expect(stapleNames).toContain("flour");
    });

    it("should have unique IDs", () => {
      const ids = DEFAULT_STAPLES.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("isStapleIngredient", () => {
    it("should match exact staple names (case-insensitive)", () => {
      expect(isStapleIngredient("salt", DEFAULT_STAPLES)).toBe(true);
      expect(isStapleIngredient("Salt", DEFAULT_STAPLES)).toBe(true);
      expect(isStapleIngredient("SALT", DEFAULT_STAPLES)).toBe(true);
    });

    it("should match when ingredient contains staple name", () => {
      expect(isStapleIngredient("sea salt", DEFAULT_STAPLES)).toBe(true);
      expect(isStapleIngredient("kosher salt", DEFAULT_STAPLES)).toBe(true);
      expect(isStapleIngredient("extra virgin olive oil", DEFAULT_STAPLES)).toBe(true);
    });

    it("should return false for non-staple ingredients", () => {
      expect(isStapleIngredient("chicken breast", DEFAULT_STAPLES)).toBe(false);
      expect(isStapleIngredient("broccoli", DEFAULT_STAPLES)).toBe(false);
      expect(isStapleIngredient("salmon fillet", DEFAULT_STAPLES)).toBe(false);
    });

    it("should handle whitespace", () => {
      expect(isStapleIngredient("  salt  ", DEFAULT_STAPLES)).toBe(true);
      expect(isStapleIngredient("black pepper ", DEFAULT_STAPLES)).toBe(true);
    });

    it("should work with empty staples array", () => {
      expect(isStapleIngredient("salt", [])).toBe(false);
    });
  });

  describe("getStapleNamesSet", () => {
    it("should return a Set of lowercase staple names", () => {
      const nameSet = getStapleNamesSet(DEFAULT_STAPLES);
      expect(nameSet).toBeInstanceOf(Set);
      expect(nameSet.has("salt")).toBe(true);
      expect(nameSet.has("Salt")).toBe(false); // Should be lowercase
    });

    it("should handle empty array", () => {
      const nameSet = getStapleNamesSet([]);
      expect(nameSet.size).toBe(0);
    });
  });

  describe("groupStaplesByCategory", () => {
    it("should group staples by their category", () => {
      const grouped = groupStaplesByCategory(DEFAULT_STAPLES);
      expect(grouped).toHaveProperty("spices");
      expect(grouped).toHaveProperty("oils");
      expect(grouped).toHaveProperty("grains");
      expect(grouped).toHaveProperty("dairy");
      expect(grouped).toHaveProperty("condiments");
      expect(grouped).toHaveProperty("other");
    });

    it("should place salt in spices category", () => {
      const grouped = groupStaplesByCategory(DEFAULT_STAPLES);
      const spices = grouped.spices || [];
      const saltStaple = spices.find((s: Staple) => s.name === "salt");
      expect(saltStaple).toBeDefined();
    });

    it("should place olive oil in oils category", () => {
      const grouped = groupStaplesByCategory(DEFAULT_STAPLES);
      const oils = grouped.oils || [];
      const oliveOil = oils.find((s: Staple) => s.name === "olive oil");
      expect(oliveOil).toBeDefined();
    });

    it("should handle empty array", () => {
      const grouped = groupStaplesByCategory([]);
      expect(Object.keys(grouped).length).toBe(0);
    });
  });

  describe("STAPLE_CATEGORIES", () => {
    it("should have all expected categories", () => {
      expect(STAPLE_CATEGORIES).toContain("spices");
      expect(STAPLE_CATEGORIES).toContain("oils");
      expect(STAPLE_CATEGORIES).toContain("grains");
      expect(STAPLE_CATEGORIES).toContain("dairy");
      expect(STAPLE_CATEGORIES).toContain("condiments");
      expect(STAPLE_CATEGORIES).toContain("other");
    });
  });
});
