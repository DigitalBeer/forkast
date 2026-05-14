import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getMealSuggestions, getFilteredMealSuggestions } from '../suggestionService';
import type { MealSuggestionRequest, MealSuggestionResponse } from '../../../types/meal';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    functions: {
      invoke: vi.fn(),
    },
  })),
}));

import { createClient } from '@/lib/supabase/client';

function mockSupabaseClient(invoke: ReturnType<typeof vi.fn>) {
  vi.mocked(createClient).mockReturnValue({
    functions: { invoke },
  } as unknown as SupabaseClient);
}

describe('suggestionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMealSuggestions', () => {
    it('returns suggestions on success', async () => {
      const mockData = [
        { id: '1', name: 'Pasta', meal_type: 'dinner' },
        { id: '2', name: 'Salad', meal_type: 'lunch' },
      ];
      const mockInvoke = vi.fn().mockResolvedValue({ data: mockData, error: null });
      mockSupabaseClient(mockInvoke);

      const result = await getMealSuggestions();
      expect(result).toEqual(mockData);
      expect(mockInvoke).toHaveBeenCalledWith('get-meal-suggestions', {
        method: 'POST',
        body: {},
      });
    });

    it('passes skipCache option', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({ data: [], error: null });
      mockSupabaseClient(mockInvoke);

      await getMealSuggestions({ skipCache: true });
      expect(mockInvoke).toHaveBeenCalledWith('get-meal-suggestions', {
        method: 'POST',
        body: { skipCache: true },
      });
    });

    it('throws on error', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
      mockSupabaseClient(mockInvoke);

      await expect(getMealSuggestions()).rejects.toThrow('Failed to fetch meal suggestions');
    });

    it('returns empty array when data is null', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabaseClient(mockInvoke);

      const result = await getMealSuggestions();
      expect(result).toEqual([]);
    });
  });

  describe('getFilteredMealSuggestions', () => {
    it('sends filter request body', async () => {
      const mockData = [{ id: '1', name: 'Filtered Meal' }];
      const mockInvoke = vi.fn().mockResolvedValue({ data: mockData, error: null });
      mockSupabaseClient(mockInvoke);

      const request = { meal_type: 'dinner' } as unknown as MealSuggestionRequest;
      const result = await getFilteredMealSuggestions(request);
      expect(result).toEqual(mockData);
      expect(mockInvoke).toHaveBeenCalledWith('get-meal-suggestions', {
        method: 'POST',
        body: request,
      });
    });

    it('merges skipCache into request body', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({ data: [], error: null });
      mockSupabaseClient(mockInvoke);

      const request = { meal_type: 'lunch' } as unknown as MealSuggestionRequest;
      await getFilteredMealSuggestions(request, { skipCache: true });
      expect(mockInvoke).toHaveBeenCalledWith('get-meal-suggestions', {
        method: 'POST',
        body: { ...request, skipCache: true },
      });
    });

    it('throws on error', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
      mockSupabaseClient(mockInvoke);

      await expect(
        getFilteredMealSuggestions({} as unknown as MealSuggestionRequest)
      ).rejects.toThrow('Failed to fetch filtered meal suggestions');
    });

    it('returns empty array when data is null', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabaseClient(mockInvoke);

      const result = await getFilteredMealSuggestions({} as unknown as MealSuggestionRequest);
      expect(result).toEqual([]);
    });
  });
});