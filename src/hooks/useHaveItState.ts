"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/auth";
import {
  DEFAULT_STAPLES,
  isStapleIngredient,
  type Staple,
} from "@/lib/data/default-staples";
import type { ShoppingListItem } from "@/lib/shopping/aggregate";

const STAPLES_LOCAL_STORAGE_KEY = "user_staples";
const HAVE_IT_LOCAL_STORAGE_KEY = "shopping_have_it";

export interface ShoppingListItemExtended extends ShoppingListItem {
  key: string;
  isChecked: boolean;
  haveIt: boolean;
  isStaple: boolean;
}

interface UseHaveItStateOptions {
  mealPlanId: string | number;
  items: ShoppingListItem[];
}

interface UseHaveItStateReturn {
  /** Extended items with haveIt and isStaple flags */
  extendedItems: ShoppingListItemExtended[];
  /** Items to buy (haveIt = false) */
  needToBuyItems: ShoppingListItemExtended[];
  /** Items user already has (haveIt = true) */
  alreadyHaveItems: ShoppingListItemExtended[];
  /** User's staples list */
  staples: Staple[];
  /** Toggle the "Have it" state for an item */
  toggleHaveIt: (key: string) => void;
  /** Toggle the purchased/checked state for an item */
  toggleChecked: (key: string) => void;
  /** Update staples list */
  setStaples: (staples: Staple[]) => void;
  /** Reset all "Have it" state */
  resetHaveIt: () => void;
  /** Loading state */
  loading: boolean;
  /** Count of items to buy */
  needToBuyCount: number;
  /** Count of items user has */
  alreadyHaveCount: number;
}

/**
 * Hook for managing "Have it" state in shopping lists.
 * Integrates with staples and persists state to LocalStorage.
 */
export function useHaveItState({
  mealPlanId,
  items,
}: UseHaveItStateOptions): UseHaveItStateReturn {
  const { user } = useAuthStore();
  const [staples, setStaplesState] = useState<Staple[]>([]);
  const [haveItItems, setHaveItItems] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Generate item key
  const getItemKey = useCallback((item: ShoppingListItem) => {
    return `${item.name.toLowerCase()}|${item.unit.toLowerCase()}`;
  }, []);

  // Load staples on mount
  useEffect(() => {
    const loadStaples = async () => {
      try {
        if (user) {
          // Load from API for authenticated users
          const response = await fetch("/api/staples");
          if (response.ok) {
            const data = await response.json();
            if (data.staples && data.staples.length > 0) {
              setStaplesState(data.staples);
            } else {
              setStaplesState([...DEFAULT_STAPLES]);
            }
          } else {
            setStaplesState([...DEFAULT_STAPLES]);
          }
        } else {
          // Load from LocalStorage for anonymous users
          const stored = localStorage.getItem(STAPLES_LOCAL_STORAGE_KEY);
          if (stored) {
            setStaplesState(JSON.parse(stored));
          } else {
            setStaplesState([...DEFAULT_STAPLES]);
          }
        }
      } catch (error) {
        console.error("Error loading staples:", error);
        setStaplesState([...DEFAULT_STAPLES]);
      } finally {
        setLoading(false);
      }
    };

    loadStaples();
  }, [user]);

  // Load persisted haveIt and checked state when items change
  useEffect(() => {
    if (!mealPlanId || items.length === 0) return;

    try {
      // Load haveIt state
      const haveItKey = `${HAVE_IT_LOCAL_STORAGE_KEY}_${mealPlanId}`;
      const storedHaveIt = localStorage.getItem(haveItKey);
      if (storedHaveIt) {
        const parsed = JSON.parse(storedHaveIt) as string[];
        setHaveItItems(new Set(parsed));
      }

      // Load checked state (existing functionality)
      const checkedKey = `shopping_checked_${mealPlanId}`;
      const storedChecked = localStorage.getItem(checkedKey);
      if (storedChecked) {
        const parsed = JSON.parse(storedChecked);
        // Handle both old format (array) and new format (object with version)
        if (Array.isArray(parsed)) {
          setCheckedItems(new Set(parsed));
        } else if (parsed.checkedItems) {
          setCheckedItems(new Set(parsed.checkedItems));
        }
      }
    } catch (error) {
      console.error("Error loading persisted state:", error);
    }
  }, [mealPlanId, items]);

  // Persist haveIt state when it changes
  useEffect(() => {
    if (!mealPlanId || typeof window === "undefined") return;

    try {
      const haveItKey = `${HAVE_IT_LOCAL_STORAGE_KEY}_${mealPlanId}`;
      localStorage.setItem(haveItKey, JSON.stringify(Array.from(haveItItems)));
    } catch (error) {
      console.error("Error persisting haveIt state:", error);
    }
  }, [haveItItems, mealPlanId]);

  // Create extended items with computed properties
  const extendedItems = useMemo((): ShoppingListItemExtended[] => {
    return items.map((item) => {
      const key = getItemKey(item);
      const isStaple = isStapleIngredient(item.name, staples);
      const haveIt = haveItItems.has(key) || isStaple;
      const isChecked = checkedItems.has(key);

      return {
        ...item,
        key,
        isChecked,
        haveIt,
        isStaple,
      };
    });
  }, [items, staples, haveItItems, checkedItems, getItemKey]);

  // Split items into need-to-buy and already-have
  const { needToBuyItems, alreadyHaveItems } = useMemo(() => {
    const needToBuy: ShoppingListItemExtended[] = [];
    const alreadyHave: ShoppingListItemExtended[] = [];

    for (const item of extendedItems) {
      if (item.haveIt) {
        alreadyHave.push(item);
      } else {
        needToBuy.push(item);
      }
    }

    return { needToBuyItems: needToBuy, alreadyHaveItems: alreadyHave };
  }, [extendedItems]);

  // Toggle haveIt state
  const toggleHaveIt = useCallback((key: string) => {
    setHaveItItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Toggle checked state
  const toggleChecked = useCallback(
    (key: string) => {
      setCheckedItems((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }

        // Persist to localStorage
        if (typeof window !== "undefined" && mealPlanId) {
          const checkedKey = `shopping_checked_${mealPlanId}`;
          localStorage.setItem(checkedKey, JSON.stringify(Array.from(next)));
        }

        return next;
      });
    },
    [mealPlanId]
  );

  // Update staples
  const setStaples = useCallback((newStaples: Staple[]) => {
    setStaplesState(newStaples);
  }, []);

  // Reset haveIt state
  const resetHaveIt = useCallback(() => {
    setHaveItItems(new Set());
    if (typeof window !== "undefined" && mealPlanId) {
      const haveItKey = `${HAVE_IT_LOCAL_STORAGE_KEY}_${mealPlanId}`;
      localStorage.removeItem(haveItKey);
    }
  }, [mealPlanId]);

  return {
    extendedItems,
    needToBuyItems,
    alreadyHaveItems,
    staples,
    toggleHaveIt,
    toggleChecked,
    setStaples,
    resetHaveIt,
    loading,
    needToBuyCount: needToBuyItems.length,
    alreadyHaveCount: alreadyHaveItems.length,
  };
}

export default useHaveItState;
