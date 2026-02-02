'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { Sparkles, X, Plus, RefreshCw, AlertCircle } from 'lucide-react';

interface UserRecommendation {
    id: string;
    name: string;
    imageUrl?: string;
    reason: string;
    score: number;
    sourceUserCount: number;
}

export function RecommendedMealsCard() {
    const queryClient = useQueryClient();
    const [dismissingId, setDismissingId] = useState<string | null>(null);
    const [addingId, setAddingId] = useState<string | null>(null);

    const { data: recommendations, isLoading, error, refetch, isFetching } = useQuery<UserRecommendation[]>({
        queryKey: ['user-recommendations'],
        queryFn: async () => {
            const response = await fetch('/api/recommendations?limit=5');
            if (!response.ok) throw new Error('Failed to fetch recommendations');
            return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });


    // AC #8: Periodic refresh (every 30 mins)
    // FIX: Use useCallback to avoid refetch dependency issues
    const periodicRefresh = useCallback(() => {
        if (document.visibilityState === 'visible') {
            refetch();
        }
    }, [refetch]);

    useEffect(() => {
        const interval = setInterval(periodicRefresh, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [periodicRefresh]);

    const dismissMutation = useMutation({
        mutationFn: async (mealName: string) => {
            const response = await fetch('/api/recommendations/dismiss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mealName }),
            });
            if (!response.ok) throw new Error('Failed to dismiss');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-recommendations'] });
        },
    });

    const addMutation = useMutation({
        mutationFn: async (recommendation: UserRecommendation) => {
            const response = await fetch('/api/recommendations/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: recommendation.name,
                    imageUrl: recommendation.imageUrl,
                }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to add meal');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-recommendations'] });
            queryClient.invalidateQueries({ queryKey: ['user-meals'] });
        },
    });

    const handleDismiss = async (recommendation: UserRecommendation) => {
        setDismissingId(recommendation.id);
        try {
            await dismissMutation.mutateAsync(recommendation.name);
        } finally {
            setDismissingId(null);
        }
    };

    const handleAdd = async (recommendation: UserRecommendation) => {
        setAddingId(recommendation.id);
        try {
            await addMutation.mutateAsync(recommendation);
        } finally {
            setAddingId(null);
        }
    };

    // Safer placeholder image using CSS/div instead of btoa()
    const Placeholder = ({ name }: { name: string }) => (
        <div className="w-full h-full bg-yellow-100 flex items-center justify-center p-4 text-center">
            <span className="text-yellow-800 text-[10px] font-medium leading-tight">
                {name}
            </span>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                        <Sparkles className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Recommended Meals</h2>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    title="Refresh recommendations"
                >
                    <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-shrink-0 w-40 animate-pulse">
                            <div className="w-40 h-28 bg-gray-200 rounded-lg" />
                            <div className="h-4 bg-gray-200 rounded mt-2 w-3/4" />
                            <div className="h-3 bg-gray-100 rounded mt-1 w-full" />
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 py-4">
                    <AlertCircle className="w-4 h-4" />
                    <span>Failed to load recommendations</span>
                    <button onClick={() => refetch()} className="underline ml-2">Retry</button>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && (!recommendations || recommendations.length === 0) && (
                <p className="text-sm text-gray-500 py-4">
                    No recommendations yet. Add more meals to your repertoire, and we&apos;ll find suggestions from similar users!
                </p>
            )}

            {/* Recommendations List */}
            {!isLoading && !error && recommendations && recommendations.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {recommendations.map((rec) => (
                        <div key={rec.id} className="flex-shrink-0 w-40 group relative">
                            {/* Image */}
                            <div className="relative w-40 h-28 rounded-lg overflow-hidden bg-yellow-50">
                                {rec.imageUrl ? (
                                    <Image
                                        src={rec.imageUrl}
                                        alt={rec.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <Placeholder name={rec.name} />
                                )}

                                {/* Dismiss Button */}
                                <button
                                    onClick={() => handleDismiss(rec)}
                                    disabled={dismissingId === rec.id}
                                    className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Not interested"
                                >
                                    <X className={`w-3 h-3 text-gray-600 ${dismissingId === rec.id ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {/* Name */}
                            <p className="text-sm font-medium text-gray-900 mt-2 truncate">{rec.name}</p>

                            {/* Reason */}
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{rec.reason}</p>

                            {/* Add Button */}
                            <button
                                onClick={() => handleAdd(rec)}
                                disabled={addingId === rec.id}
                                className="mt-2 w-full flex items-center justify-center gap-1 text-xs py-1.5 px-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md transition-colors disabled:opacity-50"
                            >
                                {addingId === rec.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Plus className="w-3 h-3" />
                                )}
                                Add to My Meals
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
