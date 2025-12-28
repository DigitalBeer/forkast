// Note: Test file imports internal classes for testing only
// Production code should use meals.ts as the public API
import { getMealAdapter, LocalStorageAdapter, SupabaseAdapter } from './adapters';
import { createClient } from '@/lib/supabase/client';

// Mocking Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      upsert: jest.fn().mockResolvedValue({ data: [{}], error: null }),
      delete: jest.fn().mockResolvedValue({ data: {}, error: null }),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'http://example.com/image.png' } })),
      })),
    },
  })),
}));

// Mocking localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Storage Adapters', () => {
  const testMeal = {
    name: 'Test Meal',
    description: 'A delicious test meal',
    ingredients: [{ name: 'Test Ingredient', quantity: 1, unit: 'pcs' }],
    instructions: 'Test instructions',
    tags: ['test'],
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('LocalStorageAdapter', () => {
    let adapter: LocalStorageAdapter;

    beforeEach(() => {
      adapter = new LocalStorageAdapter();
    });

    it('should upsert a new meal', async () => {
      const meal = await adapter.upsert(testMeal);
      expect(meal).toBeDefined();
      expect(meal?.name).toBe(testMeal.name);
      const meals = await adapter.getAll();
      expect(meals.length).toBe(1);
    });

    it('should update an existing meal', async () => {
      const meal = await adapter.upsert(testMeal);
      const updatedData = { ...testMeal, name: 'Updated Meal' };
      const updatedMeal = await adapter.upsert(updatedData, meal!.id);
      expect(updatedMeal?.name).toBe('Updated Meal');
      const meals = await adapter.getAll();
      expect(meals.length).toBe(1);
    });

    it('should get a meal by id', async () => {
      const meal = await adapter.upsert(testMeal);
      const foundMeal = await adapter.get(meal!.id);
      expect(foundMeal).toEqual(meal);
    });

    it('should delete a meal by id', async () => {
      const meal = await adapter.upsert(testMeal);
      await adapter.delete(meal!.id);
      const meals = await adapter.getAll();
      expect(meals.length).toBe(0);
    });
  });

    describe('SupabaseAdapter', () => {
    let adapter: SupabaseAdapter;

    beforeEach(() => {
      adapter = new SupabaseAdapter();
    });

    it('should upsert a meal', async () => {
      await adapter.upsert(testMeal);
      const mockSupabase = createClient();
      expect(mockSupabase.from).toHaveBeenCalledWith('meals');
      expect(mockSupabase.from('meals').upsert).toHaveBeenCalled();
    });

    it('should get a meal by id', async () => {
      await adapter.get('123');
      const mockSupabase = createClient();
      expect(mockSupabase.from).toHaveBeenCalledWith('meals');
      expect(mockSupabase.from('meals').select).toHaveBeenCalledWith('*');
    });

    it('should get all meals', async () => {
      await adapter.getAll();
      const mockSupabase = createClient();
      expect(mockSupabase.from).toHaveBeenCalledWith('meals');
      expect(mockSupabase.from('meals').select).toHaveBeenCalledWith('*');
    });

    it('should delete a meal by id', async () => {
      await adapter.delete('123');
      const mockSupabase = createClient();
      expect(mockSupabase.from).toHaveBeenCalledWith('meals');
      expect(mockSupabase.from('meals').delete).toHaveBeenCalled();
    });
  });

  describe('getMealAdapter', () => {
    it('should return LocalStorageAdapter when user is not authenticated', () => {
      const adapter = getMealAdapter(false);
      expect(adapter).toBeInstanceOf(LocalStorageAdapter);
    });

    it('should return SupabaseAdapter when user is authenticated', () => {
      const adapter = getMealAdapter(true);
      expect(adapter).toBeInstanceOf(SupabaseAdapter);
    });
  });
});
