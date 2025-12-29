'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ShoppingListItem } from '@/lib/shopping/aggregate';

interface ExtendedItem extends ShoppingListItem {
    checked: boolean;
    haveIt: boolean;
}

interface ShoppingListTableProps {
    needToBuyItems: ExtendedItem[];
    alreadyHaveItems: ExtendedItem[];
    onToggleHaveIt: (name: string) => void;
    onToggleChecked: (name: string) => void;
}

const CATEGORY_ORDER = ['produce', 'dairy', 'meat', 'seafood', 'bakery', 'pantry', 'other'];

const CATEGORY_LABELS: Record<string, string> = {
    produce: '🥬 Produce',
    dairy: '🧀 Dairy',
    meat: '🥩 Meat',
    seafood: '🐟 Seafood',
    bakery: '🍞 Bakery',
    pantry: '🥫 Pantry',
    other: '📦 Other',
};

export function ShoppingListTable({
    needToBuyItems,
    alreadyHaveItems,
    onToggleHaveIt,
    onToggleChecked,
}: ShoppingListTableProps) {
    const [haveItExpanded, setHaveItExpanded] = useState(false);

    // Group items by category
    const groupByCategory = (items: ExtendedItem[]) => {
        const groups: Record<string, ExtendedItem[]> = {};
        items.forEach((item) => {
            const cat = item.category || 'other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        return groups;
    };

    const formatQuantity = (quantity: number) => {
        if (quantity === Math.floor(quantity)) {
            return quantity.toString();
        }
        return quantity.toFixed(2).replace(/\.?0+$/, '');
    };

    const renderTable = (items: ExtendedItem[], showHaveIt: boolean) => {
        const groups = groupByCategory(items);
        const sortedCategories = CATEGORY_ORDER.filter((cat) => groups[cat]?.length > 0);

        if (items.length === 0) {
            return (
                <p className="text-gray-500 text-sm py-4">No items in this section.</p>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 text-left">
                            <th className="py-2 px-3 w-10"></th>
                            <th className="py-2 px-3 font-medium text-gray-700">Item</th>
                            <th className="py-2 px-3 font-medium text-gray-700 text-right w-20">Qty</th>
                            <th className="py-2 px-3 font-medium text-gray-700 w-24">Unit</th>
                            {showHaveIt && (
                                <th className="py-2 px-3 font-medium text-gray-700 text-center w-24">Have it?</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCategories.map((category) => (
                            <React.Fragment key={category}>
                                {/* Category Header */}
                                <tr className="bg-gray-50">
                                    <td colSpan={showHaveIt ? 5 : 4} className="py-2 px-3 font-medium text-gray-600">
                                        {CATEGORY_LABELS[category] || category}
                                    </td>
                                </tr>
                                {/* Items in Category */}
                                {groups[category].map((item) => (
                                    <tr
                                        key={item.name}
                                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${item.checked ? 'opacity-50 line-through' : ''
                                            }`}
                                    >
                                        <td className="py-2 px-3">
                                            <button
                                                onClick={() => onToggleChecked(item.name)}
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${item.checked
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                            >
                                                {item.checked && <Check className="w-3 h-3" />}
                                            </button>
                                        </td>
                                        <td className="py-2 px-3 text-gray-900">{item.name}</td>
                                        <td className="py-2 px-3 text-right text-gray-700 font-mono">
                                            {formatQuantity(item.quantity)}
                                        </td>
                                        <td className="py-2 px-3 text-gray-500">{item.unit || '-'}</td>
                                        {showHaveIt && (
                                            <td className="py-2 px-3 text-center">
                                                <button
                                                    onClick={() => onToggleHaveIt(item.name)}
                                                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-700 transition-colors"
                                                >
                                                    Have it?
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Need to Buy Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                    <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                        🛒 Need to Buy
                        <span className="text-sm font-normal text-blue-700">({needToBuyItems.length})</span>
                    </h2>
                </div>
                <div className="p-4">{renderTable(needToBuyItems, true)}</div>
            </div>

            {/* Already Have Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                    onClick={() => setHaveItExpanded(!haveItExpanded)}
                    className="w-full px-4 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between"
                >
                    <h2 className="font-semibold text-green-900 flex items-center gap-2">
                        ✓ Already Have
                        <span className="text-sm font-normal text-green-700">({alreadyHaveItems.length})</span>
                    </h2>
                    {haveItExpanded ? (
                        <ChevronUp className="w-5 h-5 text-green-600" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-green-600" />
                    )}
                </button>
                {haveItExpanded && <div className="p-4">{renderTable(alreadyHaveItems, false)}</div>}
            </div>

            {/* Print Section */}
            <div className="hidden print:block">
                <h2 className="font-bold text-lg mb-2">Shopping List</h2>
                {renderTable([...needToBuyItems, ...alreadyHaveItems], false)}
            </div>
        </div>
    );
}
