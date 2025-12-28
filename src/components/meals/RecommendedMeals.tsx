"use client";

import { useEffect, useState } from 'react';
import { RecommendationService } from '@/lib/data/recommendation.service';
import { type Recommendation } from '@/lib/recommendations/engine';
import { MealCard } from './MealCard';
import { useMeals } from '@/hooks/useMeals';

export const RecommendedMeals = () => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addMealToPlan, deleteMeal } = useMeals();

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setLoading(true);
                const data = await RecommendationService.getRecommendations(5);
                setRecommendations(data);
            } catch (err) {
                setError('Failed to load recommendations.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    if (loading) {
        return <p className="p-4 text-sm text-muted-foreground">Loading recommendations...</p>;
    }

    if (error) {
        return <p className="p-4 text-sm text-destructive">{error}</p>;
    }

    if (!recommendations.length) {
        return null; // Don't show the section if there are no recommendations
    }

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Recommended For You</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {recommendations.map(({ meal }) => (
                    <MealCard 
                        key={meal.id} 
                        meal={meal} 
                        onAddToPlan={() => addMealToPlan(meal)} 
                        onDelete={() => deleteMeal(meal.id)} 
                    />
                ))}
            </div>
        </div>
    );
};
