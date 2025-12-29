"use client";

import React from "react";
import { ChevronDown, ChevronUp, Check, ShoppingCart, Package } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { ShoppingListItem } from "@/lib/shopping/aggregate";

interface ShoppingListItemExtended extends ShoppingListItem {
    key: string;
    isChecked: boolean;
    haveIt: boolean;
    isStaple: boolean;
}

interface ShoppingListSectionProps {
    title: string;
    items: ShoppingListItemExtended[];
    variant: "need-to-buy" | "already-have";
    isExpanded: boolean;
    onToggleExpand: () => void;
    onToggleChecked: (key: string) => void;
    onToggleHaveIt: (key: string) => void;
    onOpenConverter?: (key: string) => void;
    canConvert?: (unit: string) => boolean;
    className?: string;
}

/**
 * ShoppingListSection displays a collapsible section of shopping list items.
 * Supports two variants:
 * - "need-to-buy": Items user needs to purchase (primary list)
 * - "already-have": Items user already has (staples or manually marked)
 */
export function ShoppingListSection({
    title,
    items,
    variant,
    isExpanded,
    onToggleExpand,
    onToggleChecked,
    onToggleHaveIt,
    onOpenConverter,
    canConvert,
    className = "",
}: ShoppingListSectionProps) {
    const itemCount = items.length;
    const checkedCount = items.filter((item) => item.isChecked).length;

    const Icon = variant === "need-to-buy" ? ShoppingCart : Package;
    const bgColor = variant === "need-to-buy" ? "bg-blue-50" : "bg-green-50";
    const borderColor = variant === "need-to-buy" ? "border-blue-200" : "border-green-200";
    const iconColor = variant === "need-to-buy" ? "text-blue-600" : "text-green-600";
    const badgeColor = variant === "need-to-buy" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800";

    return (
        <div className={`rounded-lg border ${borderColor} overflow-hidden ${className}`}>
            {/* Section Header */}
            <button
                type="button"
                onClick={onToggleExpand}
                className={`w-full flex items-center justify-between px-4 py-3 ${bgColor} hover:opacity-90 transition-opacity`}
                aria-expanded={isExpanded}
                data-testid={`section-header-${variant}`}
            >
                <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                    <span className="font-semibold">{title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
                        {variant === "need-to-buy" ? itemCount : itemCount}
                        {variant === "need-to-buy" && checkedCount > 0 && (
                            <span className="ml-1 text-gray-500">({checkedCount} done)</span>
                        )}
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
            </button>

            {/* Section Content */}
            {isExpanded && (
                <div className="bg-white divide-y divide-gray-100">
                    {items.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                            {variant === "need-to-buy"
                                ? "All items marked as 'Have it' or no items in list."
                                : "No items marked as 'Have it' yet."}
                        </div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.key}
                                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${item.isChecked ? "bg-gray-50" : "hover:bg-gray-50"
                                    }`}
                                data-testid={`shopping-item-${item.key}`}
                            >
                                {/* Purchased Checkbox (only for need-to-buy) */}
                                {variant === "need-to-buy" && (
                                    <Checkbox
                                        id={`checked-${item.key}`}
                                        checked={item.isChecked}
                                        onCheckedChange={() => onToggleChecked(item.key)}
                                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                        data-testid={`checkbox-purchased-${item.key}`}
                                    />
                                )}

                                {/* Item Details */}
                                <div className="flex-1 min-w-0">
                                    <span
                                        className={`block ${item.isChecked ? "line-through text-gray-400" : "text-gray-900"
                                            }`}
                                    >
                                        <span className="font-medium capitalize">{item.name}</span>
                                        <span className="text-gray-500 ml-2">
                                            {item.quantity}
                                            {item.unit ? ` ${item.unit}` : ""}
                                        </span>
                                    </span>
                                    {item.isStaple && (
                                        <span className="text-xs text-green-600">Pantry staple</span>
                                    )}
                                </div>

                                {/* Have It Toggle */}
                                <button
                                    type="button"
                                    onClick={() => onToggleHaveIt(item.key)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${item.haveIt
                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                    data-testid={`toggle-have-it-${item.key}`}
                                >
                                    {item.haveIt ? (
                                        <>
                                            <Check className="inline h-3 w-3 mr-1" />
                                            Have it
                                        </>
                                    ) : (
                                        "Have it?"
                                    )}
                                </button>

                                {/* Convert Button (optional) */}
                                {onOpenConverter && canConvert && canConvert(item.unit) && (
                                    <button
                                        type="button"
                                        onClick={() => onOpenConverter(item.key)}
                                        className="text-xs text-blue-600 hover:underline print:hidden"
                                        data-testid={`convert-${item.key}`}
                                    >
                                        Convert
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default ShoppingListSection;
