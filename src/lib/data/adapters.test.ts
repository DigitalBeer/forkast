// Note: Test file imports internal classes for testing only
// Production code should use meals.ts as the public API
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getMealAdapter,
  LocalStorageAdapter,
  SupabaseAdapter,
} from './adapters';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
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
    ingredients: '1 pcs Test Ingredient',
    instructions: 'Test instructions',
    tags: ['test'],
  };

  let mockQueryBuilder: Record<string, unknown>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockStorageFrom: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Chainable query builder — every method returns itself, thenable by default
    mockQueryBuilder = {};
    ['select', 'upsert', 'delete', 'eq', 'single', 'maybeSingle'].forEach(
      method => {
        mockQueryBuilder[method] = vi.fn().mockReturnValue(mockQueryBuilder);
      },
    );
    // Default thenable resolution
    mockQueryBuilder.then = (
      resolve: (value: { data: unknown[]; error: unknown }) => void,
    ) => resolve({ data: [], error: null });

    mockFrom = vi.fn().mockReturnValue(mockQueryBuilder);
    mockStorageFrom = vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: 'http://example.com/image.png' },
      })),
    });

    vi.mocked(createClient).mockReturnValue({
      from: mockFrom,
      storage: { from: mockStorageFrom },
    } as ReturnType<typeof createClient>);
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
      mockQueryBuilder.then = (
        resolve: (value: { data: unknown; error: unknown }) => void,
      ) => resolve({ data: { id: '1', ...testMeal }, error: null });

      await adapter.upsert(testMeal);

      expect(mockFrom).toHaveBeenCalledWith('meals');
      expect(mockQueryBuilder.upsert).toHaveBeenCalled();
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });

    it('should get a meal by id', async () => {
      mockQueryBuilder.then = (
        resolve: (value: {
          data: { id: string; name: string };
          error: unknown;
        }) => void,
      ) => resolve({ data: { id: '123', name: 'Test' }, error: null });

      await adapter.get('123');

      expect(mockFrom).toHaveBeenCalledWith('meals');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', '123');
      expect(mockQueryBuilder.maybeSingle).toHaveBeenCalled();
    });

    it('should get all meals', async () => {
      mockQueryBuilder.then = (
        resolve: (value: { data: unknown[]; error: unknown }) => void,
      ) => resolve({ data: [], error: null });

      await adapter.getAll();

      expect(mockFrom).toHaveBeenCalledWith('meals');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
    });

    it('should delete a meal by id', async () => {
      mockQueryBuilder.then = (resolve: (value: { error: unknown }) => void) =>
        resolve({ error: null });

      await adapter.delete('123');

      expect(mockFrom).toHaveBeenCalledWith('meals');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', '123');
    });
  });

  describe('SupabaseAdapter — image upload', () => {
    let adapter: SupabaseAdapter;

    beforeEach(() => {
      adapter = new SupabaseAdapter();
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn().mockReturnValue('mock-uuid'),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should handle image upload during upsert', async () => {
      const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
      const mealWithImage = { ...testMeal, image: file };

      mockQueryBuilder.then = (
        resolve: (value: { data: { id: string }; error: unknown }) => void,
      ) => resolve({ data: { id: '1' }, error: null });

      await adapter.upsert(mealWithImage, undefined, 'user-1');

      expect(mockStorageFrom).toHaveBeenCalledWith('meal-images');
      expect(mockStorageFrom().upload).toHaveBeenCalledWith(
        'user-1/mock-uuid.jpg',
        file,
        {
          upsert: false,
          contentType: 'image/jpeg',
        },
      );
    });

    it('should throw on upload error', async () => {
      const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
      const mealWithImage = { ...testMeal, image: file };

      mockStorageFrom().upload = vi.fn().mockResolvedValue({
        error: { message: 'Upload failed' },
      });

      await expect(
        adapter.upsert(mealWithImage, undefined, 'user-1'),
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('LocalStorageAdapter — edge cases', () => {
    let adapter: LocalStorageAdapter;

    beforeEach(() => {
      adapter = new LocalStorageAdapter();
    });

    it('should handle corrupt localStorage gracefully', async () => {
      localStorage.setItem('bmad_meals', 'not-valid-json');
      const meals = await adapter.getAll();
      expect(meals).toEqual([]);
    });

    it('should filter out invalid meal data via Zod schema', async () => {
      adapter.upsert(testMeal);
      // Manually corrupt one meal's data
      const raw = JSON.parse(localStorage.getItem('bmad_meals')!);
      raw[0].name = 123; // Makes Zod validation fail
      localStorage.setItem('bmad_meals', JSON.stringify(raw));

      const meals = await adapter.getAll();
      // The invalid meal should be filtered out
      expect(meals).toHaveLength(0);
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
