import { type Recommendation } from '@/lib/recommendations/engine';

export const RecommendationService = {
  async getRecommendations(limit: number = 5): Promise<Recommendation[]> {
    try {
      const response = await fetch(`/api/recommendations?limit=${limit}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch recommendations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in RecommendationService:', error);
      // Re-throw the error to be handled by the calling component
      throw error;
    }
  },
};
