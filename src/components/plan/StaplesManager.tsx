"use client";

import React, { useState, useEffect } from "react";
import { Check, Plus, Trash2, RotateCcw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DEFAULT_STAPLES,
    STAPLE_CATEGORIES,
    groupStaplesByCategory,
    type Staple,
    type StapleCategory,
} from "@/lib/data/default-staples";
import { useAuthStore } from "@/store/auth";

const STAPLES_LOCAL_STORAGE_KEY = "user_staples";

interface StaplesManagerProps {
    onStaplesChange?: (staples: Staple[]) => void;
    className?: string;
}

/**
 * StaplesManager component allows users to manage their pantry staples.
 * - Authenticated users: staples are saved to the database
 * - Anonymous users: staples are saved to LocalStorage
 */
export function StaplesManager({ onStaplesChange, className }: StaplesManagerProps) {
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [staples, setStaples] = useState<Staple[]>([]);
    const [newStapleName, setNewStapleName] = useState("");
    const [newStapleCategory, setNewStapleCategory] = useState<StapleCategory>("other");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load staples on mount
    useEffect(() => {
        loadStaples();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadStaples = async () => {
        setLoading(true);
        setError(null);
        try {
            if (user) {
                // Load from API for authenticated users
                const response = await fetch("/api/staples");
                if (response.ok) {
                    const data = await response.json();
                    setStaples(data.staples || []);
                } else if (response.status === 404) {
                    // No staples yet, use defaults
                    setStaples([...DEFAULT_STAPLES]);
                } else {
                    throw new Error("Failed to load staples");
                }
            } else {
                // Load from LocalStorage for anonymous users
                const stored = localStorage.getItem(STAPLES_LOCAL_STORAGE_KEY);
                if (stored) {
                    setStaples(JSON.parse(stored));
                } else {
                    // Initialize with defaults
                    setStaples([...DEFAULT_STAPLES]);
                }
            }
        } catch (err) {
            console.error("Error loading staples:", err);
            setError("Failed to load staples. Using defaults.");
            setStaples([...DEFAULT_STAPLES]);
        } finally {
            setLoading(false);
        }
    };

    const saveStaples = async (newStaples: Staple[]) => {
        try {
            if (user) {
                // Save to API for authenticated users
                const response = await fetch("/api/staples", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ staples: newStaples }),
                });
                if (!response.ok) {
                    throw new Error("Failed to save staples");
                }
            } else {
                // Save to LocalStorage for anonymous users
                localStorage.setItem(STAPLES_LOCAL_STORAGE_KEY, JSON.stringify(newStaples));
            }
            setStaples(newStaples);
            onStaplesChange?.(newStaples);
        } catch (err) {
            console.error("Error saving staples:", err);
            setError("Failed to save staples");
        }
    };

    const addStaple = () => {
        const name = newStapleName.trim().toLowerCase();
        if (!name) return;

        // Check for duplicates
        if (staples.some((s) => s.name.toLowerCase() === name)) {
            setError("This staple already exists");
            return;
        }

        const newStaple: Staple = {
            id: `custom-${Date.now()}`,
            name,
            category: newStapleCategory,
        };

        const newStaples = [...staples, newStaple].sort((a, b) =>
            a.name.localeCompare(b.name)
        );
        saveStaples(newStaples);
        setNewStapleName("");
        setError(null);
    };

    const removeStaple = (id: string) => {
        const newStaples = staples.filter((s) => s.id !== id);
        saveStaples(newStaples);
    };

    const toggleStaple = (id: string) => {
        const existingStaple = staples.find((s) => s.id === id);
        if (existingStaple) {
            // Remove it
            removeStaple(id);
        } else {
            // Add it from defaults
            const defaultStaple = DEFAULT_STAPLES.find((s) => s.id === id);
            if (defaultStaple) {
                const newStaples = [...staples, defaultStaple].sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
                saveStaples(newStaples);
            }
        }
    };

    const resetToDefaults = () => {
        saveStaples([...DEFAULT_STAPLES]);
        setError(null);
    };

    const groupedStaples = groupStaplesByCategory(staples);
    const groupedDefaults = groupStaplesByCategory(DEFAULT_STAPLES);

    const categoryLabels: Record<StapleCategory, string> = {
        spices: "Spices & Seasonings",
        oils: "Oils & Fats",
        grains: "Grains & Baking",
        dairy: "Dairy",
        condiments: "Condiments",
        other: "Other",
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={className}
                    data-testid="manage-staples-button"
                >
                    <Settings2 className="h-4 w-4 mr-2" />
                    Manage Staples
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5" />
                        Manage Pantry Staples
                    </DialogTitle>
                    <DialogDescription>
                        Select ingredients you always have. These will be automatically marked
                        as &quot;Already Have&quot; in your shopping list.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Add Custom Staple */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-medium mb-3">Add Custom Staple</h4>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Ingredient name"
                                    value={newStapleName}
                                    onChange={(e) => setNewStapleName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addStaple()}
                                    className="flex-1"
                                    data-testid="new-staple-input"
                                />
                                <select
                                    value={newStapleCategory}
                                    onChange={(e) =>
                                        setNewStapleCategory(e.target.value as StapleCategory)
                                    }
                                    className="rounded border px-3 py-2 bg-white"
                                    data-testid="new-staple-category"
                                >
                                    {STAPLE_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {categoryLabels[cat]}
                                        </option>
                                    ))}
                                </select>
                                <Button onClick={addStaple} data-testid="add-staple-button">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Staples by Category */}
                        <div className="space-y-4">
                            {STAPLE_CATEGORIES.map((category) => {
                                const categoryStaples = groupedStaples[category] || [];
                                const defaultCategoryStaples = groupedDefaults[category] || [];
                                const allInCategory = [
                                    ...categoryStaples,
                                    ...defaultCategoryStaples.filter(
                                        (d) => !categoryStaples.some((s) => s.id === d.id)
                                    ),
                                ].sort((a, b) => a.name.localeCompare(b.name));

                                if (allInCategory.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                                            {categoryLabels[category]}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {allInCategory.map((staple) => {
                                                const isSelected = staples.some((s) => s.id === staple.id);
                                                const isCustom = staple.id.startsWith("custom-");

                                                return (
                                                    <div
                                                        key={staple.id}
                                                        className={`
                              flex items-center gap-1 px-3 py-1.5 rounded-full text-sm
                              border cursor-pointer transition-colors
                              ${isSelected
                                                                ? "bg-green-100 border-green-300 text-green-800"
                                                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                                            }
                            `}
                                                        onClick={() => toggleStaple(staple.id)}
                                                        data-testid={`staple-${staple.id}`}
                                                    >
                                                        {isSelected ? (
                                                            <Check className="h-3 w-3" />
                                                        ) : (
                                                            <Plus className="h-3 w-3" />
                                                        )}
                                                        <span className="capitalize">{staple.name}</span>
                                                        {isCustom && isSelected && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeStaple(staple.id);
                                                                }}
                                                                className="ml-1 text-red-500 hover:text-red-700"
                                                                data-testid={`remove-staple-${staple.id}`}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-4 border-t">
                            <Button variant="outline" size="sm" onClick={resetToDefaults}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset to Defaults
                            </Button>
                            <div className="text-sm text-gray-500">
                                {staples.length} staples selected
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default StaplesManager;
