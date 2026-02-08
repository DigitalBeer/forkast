import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MealHistoryService, type MealHistoryAction } from '../meal-history.service';
import { createClient } from '../../supabase/client';

vi.mock('../../supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('MealHistoryService', () => {
  let mockRpc: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockQueryBuilder: Record<string, any>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRpc = vi.fn();

    // Chainable query builder — every method returns itself, thenable via .then
    mockQueryBuilder = {};
    ['select', 'order', 'range', 'eq', 'in', 'gte', 'lte', 'limit'].forEach(method => {
      mockQueryBuilder[method] = vi.fn().mockReturnValue(mockQueryBuilder);
    });
    // Default thenable resolution (makes `await query` work)
    mockQueryBuilder.then = (resolve: any) =>
      resolve({ data: [], error: null, count: 0 });

    mockFrom = vi.fn().mockReturnValue(mockQueryBuilder);

    vi.mocked(createClient).mockReturnValue({
      rpc: mockRpc,
      from: mockFrom,
    } as any);
  });

  describe('recordMealAction', () => {
    it('should record a meal history action successfully', async () => {
      mockRpc.mockResolvedValueOnce({ error: null });

      const result = await MealHistoryService.recordMealAction('123', 'viewed');

      expect(mockRpc).toHaveBeenCalledWith('record_meal_history', {
        p_meal_id: '123',
        p_action_type: 'viewed',
        p_additional_data: {}
      });
      expect(result).toBeUndefined();
    });

    it('should throw an error for invalid meal ID', async () => {
      await expect(MealHistoryService.recordMealAction('', 'viewed'))
        .rejects
        .toThrow('Invalid meal ID provided');

      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('should throw an error for invalid action type', async () => {
      await expect(MealHistoryService.recordMealAction('123', 'invalid' as MealHistoryAction))
        .rejects
        .toThrow('Invalid action type: invalid');

      expect(mockRpc).not.toHaveBeenCalled();
    });
  });

  describe('recordMealActionWithLoading', () => {
    it('should track loading state correctly', async () => {
      mockRpc.mockResolvedValueOnce({ error: null });

      const operation = MealHistoryService.recordMealActionWithLoading('123', 'viewed');

      // Before execute(), state is idle
      expect(operation.loadingState).toBe('idle');

      await operation.execute();

      expect(operation.loadingState).toBe('success');
      expect(operation.error).toBeNull();
    });

    it('should handle errors and update state', async () => {
      // Use a non-retryable validation error to avoid retry delays
      const operation = MealHistoryService.recordMealActionWithLoading('', 'viewed');

      await expect(operation.execute()).rejects.toThrow('Invalid meal ID provided');

      expect(operation.loadingState).toBe('error');
      expect(operation.error).toBeInstanceOf(Error);
    });
  });

  describe('getUserMealHistory', () => {
    it('should fetch meal history successfully', async () => {
      const mockData = [
        { id: 1, meal_id: '123', action_type: 'viewed', action_date: '2023-01-01T00:00:00Z' },
        { id: 2, meal_id: '123', action_type: 'cooked', action_date: '2023-01-02T00:00:00Z' },
      ];

      mockQueryBuilder.then = (resolve: any) =>
        resolve({ data: mockData, error: null, count: mockData.length });

      const result = await MealHistoryService.getUserMealHistory();

      expect(result.data).toEqual(mockData);
      expect(result.count).toBe(mockData.length);
      expect(mockFrom).toHaveBeenCalledWith('meal_history');
    });

    it('should apply filters when provided', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const actionTypes: MealHistoryAction[] = ['viewed', 'cooked'];

      await MealHistoryService.getUserMealHistory({
        startDate,
        endDate,
        actionTypes,
        limit: 10,
        offset: 20,
      });

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('action_date', startDate.toISOString());
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('action_date', endDate.toISOString());
      expect(mockQueryBuilder.in).toHaveBeenCalledWith('action_type', actionTypes);
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(20, 29);
    });
  });

  describe('getMealHistory', () => {
    it('should fetch history for a specific meal', async () => {
      const mealId = '123';
      const mockData = [
        { id: 1, meal_id: mealId, action_type: 'viewed', action_date: '2023-01-01T00:00:00Z' },
      ];

      mockQueryBuilder.then = (resolve: any) =>
        resolve({ data: mockData, error: null });

      const result = await MealHistoryService.getMealHistory(mealId);

      expect(result).toEqual(mockData);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('meal_id', mealId);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('action_date', { ascending: false });
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });
  });
});
