/**
 * Similarity Algorithm Tests
 * Tests for the Jaccard similarity calculation used in user recommendations
 */

/**
 * Calculate Jaccard similarity between two sets
 * Jaccard = |A ∩ B| / |A ∪ B|
 */
function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return intersection.size / union.size;
}

describe('Jaccard Similarity Algorithm', () => {
  describe('calculateJaccardSimilarity', () => {
    it('returns 0 for two empty sets', () => {
      const setA = new Set<string>();
      const setB = new Set<string>();
      
      expect(calculateJaccardSimilarity(setA, setB)).toBe(0);
    });

    it('returns 0 for no overlap', () => {
      const setA = new Set(['Lasagne', 'Spaghetti', 'Tacos']);
      const setB = new Set(['Sushi', 'Ramen', 'Curry']);
      
      expect(calculateJaccardSimilarity(setA, setB)).toBe(0);
    });

    it('returns 1 for identical sets', () => {
      const setA = new Set(['Lasagne', 'Spaghetti', 'Tacos']);
      const setB = new Set(['Lasagne', 'Spaghetti', 'Tacos']);
      
      expect(calculateJaccardSimilarity(setA, setB)).toBe(1);
    });

    it('calculates partial overlap correctly', () => {
      // User A: [Lasagne, Spaghetti, Tacos, Burgers] (4 items)
      // User B: [Lasagne, Spaghetti, Pizza, Curry] (4 items)
      // Intersection: [Lasagne, Spaghetti] = 2 items
      // Union: [Lasagne, Spaghetti, Tacos, Burgers, Pizza, Curry] = 6 items
      // Jaccard = 2/6 = 0.333...
      
      const setA = new Set(['Lasagne', 'Spaghetti', 'Tacos', 'Burgers']);
      const setB = new Set(['Lasagne', 'Spaghetti', 'Pizza', 'Curry']);
      
      const similarity = calculateJaccardSimilarity(setA, setB);
      expect(similarity).toBeCloseTo(2/6, 5);
    });

    it('handles one empty set', () => {
      const setA = new Set(['Lasagne', 'Spaghetti']);
      const setB = new Set<string>();
      
      // Union is just setA, intersection is empty
      expect(calculateJaccardSimilarity(setA, setB)).toBe(0);
    });

    it('handles subset relationship', () => {
      // setB is a subset of setA
      const setA = new Set(['Lasagne', 'Spaghetti', 'Tacos', 'Burgers']);
      const setB = new Set(['Lasagne', 'Spaghetti']);
      
      // Intersection: 2, Union: 4
      // Jaccard = 2/4 = 0.5
      expect(calculateJaccardSimilarity(setA, setB)).toBe(0.5);
    });

    it('is case-sensitive by default', () => {
      const setA = new Set(['lasagne', 'spaghetti']);
      const setB = new Set(['Lasagne', 'Spaghetti']);
      
      // Different case = no overlap
      expect(calculateJaccardSimilarity(setA, setB)).toBe(0);
    });

    it('handles single item sets', () => {
      const setA = new Set(['Lasagne']);
      const setB = new Set(['Lasagne']);
      
      expect(calculateJaccardSimilarity(setA, setB)).toBe(1);
    });

    it('handles large sets efficiently', () => {
      const meals = Array.from({ length: 100 }, (_, i) => `Meal${i}`);
      const setA = new Set(meals.slice(0, 50));
      const setB = new Set(meals.slice(25, 75));
      
      // Overlap: meals 25-49 (25 items)
      // Union: meals 0-74 (75 items)
      // Jaccard = 25/75 = 0.333...
      const similarity = calculateJaccardSimilarity(setA, setB);
      expect(similarity).toBeCloseTo(25/75, 5);
    });
  });
});

describe('Recommendation Scoring', () => {
  describe('meal scoring based on similarity', () => {
    it('ranks meals from more similar users higher', () => {
      // Simulate scoring logic
      const similarUsers = [
        { similarity: 0.8, meals: ['Pizza', 'Curry'] },
        { similarity: 0.3, meals: ['Pizza', 'Sushi'] },
      ];
      
      const mealScores = new Map<string, number>();
      
      for (const user of similarUsers) {
        for (const meal of user.meals) {
          const current = mealScores.get(meal) || 0;
          mealScores.set(meal, current + user.similarity);
        }
      }
      
      // Pizza appears in both: 0.8 + 0.3 = 1.1
      expect(mealScores.get('Pizza')).toBeCloseTo(1.1, 5);
      // Curry only in first user: 0.8
      expect(mealScores.get('Curry')).toBeCloseTo(0.8, 5);
      // Sushi only in second user: 0.3
      expect(mealScores.get('Sushi')).toBeCloseTo(0.3, 5);
    });
  });
});
