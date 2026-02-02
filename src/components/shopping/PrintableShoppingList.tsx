'use client';

import React from 'react';
import type { ShoppingListItem } from '@/lib/shopping/aggregate';

interface MealPlanDetails {
    id: string;
    startDate: string;
    endDate: string;
    meals: Record<string, Record<string, { id: string; name: string }>>;
}

interface ExtendedItem extends ShoppingListItem {
    isChecked: boolean;
    haveIt: boolean;
}

interface PrintableShoppingListProps {
    mealPlan: MealPlanDetails | null;
    needToBuyItems: ExtendedItem[];
    alreadyHaveItems: ExtendedItem[];
}

const CATEGORY_ORDER = ['produce', 'dairy', 'meat', 'seafood', 'bakery', 'pantry', 'other'];

const CATEGORY_LABELS: Record<string, string> = {
    produce: 'PRODUCE',
    dairy: 'DAIRY',
    meat: 'MEAT',
    seafood: 'SEAFOOD',
    bakery: 'BAKERY',
    pantry: 'PANTRY',
    other: 'OTHER',
};

export function PrintableShoppingList({
    mealPlan,
    needToBuyItems,
    alreadyHaveItems,
}: PrintableShoppingListProps) {
    if (!mealPlan) return null;

    const formatDateRange = () => {
        const start = new Date(mealPlan.startDate);
        const end = new Date(mealPlan.endDate);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
    };

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

    const allItems = [...needToBuyItems, ...alreadyHaveItems];
    const itemsByCategory = groupByCategory(allItems);
    const sortedCategories = CATEGORY_ORDER.filter((cat) => itemsByCategory[cat]?.length > 0);

    // Get all meals grouped by meal type
    const mealsByType: Record<string, Array<{ day: string; name: string }>> = {
        Breakfast: [],
        Lunch: [],
        Dinner: [],
    };

    const sortedDates = Object.keys(mealPlan.meals).sort();

    sortedDates.forEach((date) => {
        const dayMeals = mealPlan.meals[date];
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

        ['Breakfast', 'Lunch', 'Dinner'].forEach((mealType) => {
            const mealKey = mealType.toLowerCase() as keyof typeof dayMeals;
            const meal = dayMeals[mealKey] || dayMeals[mealType];
            if (meal) {
                mealsByType[mealType].push({
                    day: dayName,
                    name: meal.name,
                });
            }
        });
    });

    const formatQuantity = (quantity: number) => {
        if (quantity === Math.floor(quantity)) {
            return quantity.toString();
        }
        return quantity.toFixed(2).replace(/\.?0+$/, '');
    };

    return (
        <div className="print-only">
            <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.25in;
          }
          
          html, body {
            margin: 0;
            padding: 0;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            height: auto;
          }

          .print-only {
            display: block !important;
            margin: 0;
            padding: 0;
            height: auto;
            overflow: visible;
          }

          .no-print {
            display: none !important;
          }

          .column-container {
            column-count: 3;
            column-gap: 20px;
            column-fill: balance;
          }

          .category-section {
            margin-bottom: 10px;
          }

          .category-section h3 {
            break-after: avoid-column;
            -webkit-column-break-after: avoid;
          }

          .meal-item {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-header {
            margin-top: 0;
            padding-top: 0;
          }
          
          .print-header h1 {
            margin-top: 0;
            padding-top: 0;
          }
        }

        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>

            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '9pt', margin: 0, padding: 0 }}>
                {/* Header */}
                <header style={{ marginBottom: '12px' }} className="print-header">
                    <h1 style={{ margin: 0, fontSize: '16pt', fontWeight: 'bold' }}>{formatDateRange()}</h1>
                </header>

                {/* Multi-column container */}
                <div className="column-container">
                    {/* Meal Plan Section */}
                    <div style={{ borderBottom: '1px solid #333', paddingBottom: '8px' }} className="category-section">
                        <h2 style={{ margin: '0 0 6px 0', fontSize: '10pt', fontWeight: 'bold' }}>
                            This Week&apos;s Meals
                        </h2>

                        {Object.entries(mealsByType).map(([mealType, meals]) => (
                            meals.length > 0 && (
                                <div key={mealType} style={{ marginBottom: '6px' }}>
                                    <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '2px' }}>
                                        {mealType}
                                    </div>
                                    {meals.map((meal, idx) => (
                                        <div key={idx} style={{ fontSize: '8pt', marginLeft: '8px', lineHeight: '1.3' }} className="meal-item">
                                            <span style={{ fontWeight: 'bold', marginRight: '4px' }}>{meal.day}:</span>
                                            <span>{meal.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )
                        ))}
                    </div>

                    {/* Shopping list categories */}
                    {sortedCategories.map((category) => (
                        <div key={category} className="category-section">
                            <h3 style={{ margin: '0 0 3px 0', fontSize: '10pt', fontWeight: 'bold', borderBottom: '1px solid #000' }}>
                                {CATEGORY_LABELS[category]}
                            </h3>
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                {itemsByCategory[category].map((item, idx) => (
                                    <li key={idx} style={{ marginBottom: '1px', fontSize: '8pt', lineHeight: '1.4' }} className="meal-item">
                                        <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '1px solid #333', marginRight: '4px', verticalAlign: 'middle' }} />
                                        <span style={{ fontWeight: 'bold' }}>{formatQuantity(item.quantity)}</span>
                                        {item.unit && <span> {item.unit}</span>}
                                        <span> {item.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ marginTop: '12px', paddingTop: '6px', borderTop: '1px solid #ccc', fontSize: '7pt', color: '#666', pageBreakInside: 'avoid' }}>
                    <p style={{ margin: 0 }}>Shopping List | Total items: {allItems.length}</p>
                </div>
            </div>
        </div>
    );
}
