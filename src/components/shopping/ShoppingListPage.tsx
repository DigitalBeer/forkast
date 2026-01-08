'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, Settings2, Eye, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShoppingListTable } from './ShoppingListTable';
import { MealGroupedView } from './MealGroupedView';
import { PrintableShoppingList } from './PrintableShoppingList';
import { StaplesManager } from '@/components/plan/StaplesManager';
import { useHaveItState } from '@/hooks/useHaveItState';
import type { ShoppingListItem } from '@/lib/shopping/aggregate';

interface MealPlanDetails {
    id: string;
    startDate: string;
    endDate: string;
    meals: Record<string, Record<string, { id: string; name: string; ingredients?: unknown[] }>>;
}

interface ShoppingListPageProps {
    mealPlanId: string;
}

type ViewMode = 'by-item' | 'by-meal';

export function ShoppingListPage({ mealPlanId }: ShoppingListPageProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [mealPlan, setMealPlan] = useState<MealPlanDetails | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('by-item');

    const {
        needToBuyItems,
        alreadyHaveItems,
        toggleHaveIt,
        toggleChecked,
        setStaples,
        needToBuyCount,
        alreadyHaveCount,
    } = useHaveItState({
        mealPlanId,
        items,
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch meal plan details
                const planRes = await fetch(`/api/meal-plans/${mealPlanId}`);
                if (!planRes.ok) {
                    throw new Error('Failed to load meal plan');
                }
                const planData = await planRes.json();
                setMealPlan(planData);

                // Fetch shopping list items
                const listRes = await fetch(`/api/shopping-list?mealPlanId=${mealPlanId}`);
                if (!listRes.ok) {
                    const body = await listRes.json().catch(() => null);
                    throw new Error(body?.error || 'Failed to load shopping list');
                }
                const listData = await listRes.json();
                setItems(listData.items || []);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [mealPlanId]);

    const handlePrint = () => {
        window.print();
    };

    const formatDateRange = () => {
        if (!mealPlan) return '';
        const start = new Date(mealPlan.startDate);
        const end = new Date(mealPlan.endDate);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Loading shopping list...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Link href={`/meal-plans/${mealPlanId}`}>
                        <Button variant="outline">Back to Meal Plan</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 print:bg-white">
            {/* Screen Content - Hidden when printing */}
            <div className="no-print">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link
                                    href={`/meal-plans/${mealPlanId}`}
                                    className="text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">Shopping List</h1>
                                    <p className="text-sm text-gray-500">{formatDateRange()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <StaplesManager onStaplesChange={setStaples} />
                                <Button variant="outline" onClick={handlePrint}>
                                    <Printer className="w-4 h-4 mr-2" />
                                    Print
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <span className="text-sm">
                                    <span className="font-semibold text-blue-600">{needToBuyCount}</span>
                                    <span className="text-gray-600 ml-1">to buy</span>
                                </span>
                                <span className="text-sm">
                                    <span className="font-semibold text-green-600">{alreadyHaveCount}</span>
                                    <span className="text-gray-600 ml-1">have it</span>
                                </span>
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('by-item')}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'by-item'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <List className="w-4 h-4" />
                                    By Item
                                </button>
                                <button
                                    onClick={() => setViewMode('by-meal')}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'by-meal'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Eye className="w-4 h-4" />
                                    By Meal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {viewMode === 'by-item' ? (
                        <ShoppingListTable
                            needToBuyItems={needToBuyItems}
                            alreadyHaveItems={alreadyHaveItems}
                            onToggleHaveIt={toggleHaveIt}
                            onToggleChecked={toggleChecked}
                        />
                    ) : (
                        <MealGroupedView
                            mealPlan={mealPlan}
                            items={items}
                            onToggleHaveIt={toggleHaveIt}
                            onToggleChecked={toggleChecked}
                        />
                    )}
                </div>
            </div>

            {/* Print-Only Content */}
            <PrintableShoppingList
                mealPlan={mealPlan}
                needToBuyItems={needToBuyItems}
                alreadyHaveItems={alreadyHaveItems}
            />

            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
        </div>
    );
}
