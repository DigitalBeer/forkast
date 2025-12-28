import { MealHistoryService, type MealHistoryAction } from '../meal-history.service';
import { createClient } from '../../supabase/client';

// Mock the Supabase client
jest.mock('../../supabase/client', () => ({
  createClient: jest.fn().mockReturnValue({
    rpc: jest.fn(),
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
  }),
}));

describe('MealHistoryService', () => {
  const mockSupabase = createClient();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset loading states before each test
    Object.keys(MealHistoryService).forEach(key => {
      if (key.endsWith('_loadingState')) {
        delete (MealHistoryService as any)[key];
      }
    });
  });

  describe('recordMealAction', () => {
    it('should record a meal history action successfully', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce({ error: null });
      
      const result = await MealHistoryService.recordMealAction(123, 'viewed');
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('record_meal_history', {
        p_meal_id: 123,
        p_action_type: 'viewed',
        p_additional_data: {}
      });
      expect(result).toBeUndefined();
    });

    it('should throw an error for invalid meal ID', async () => {
      await expect(MealHistoryService.recordMealAction(0, 'viewed'))
        .rejects
        .toThrow('Invalid meal ID provided');
      
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('should throw an error for invalid action type', async () => {
      await expect(MealHistoryService.recordMealAction(123, 'invalid' as MealHistoryAction))
        .rejects
        .toThrow('Invalid action type: invalid');
      
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('recordMealActionWithLoading', () => {
    it('should track loading state correctly', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce({ error: null });
      
      const operation = MealHistoryService.recordMealActionWithLoading(123, 'viewed');
      
      // Initial state should be loading
      expect(operation.loadingState).toBe('loading');
      
      // Wait for the operation to complete
      await operation.execute();
      
      // State should be success after completion
      expect(operation.loadingState).toBe('success');
      expect(operation.error).toBeNull();
    });

    it('should handle errors and update state', async () => {
      const error = new Error('Database error');
      (mockSupabase.rpc as jest.Mock).mockRejectedValueOnce(error);
      
      const operation = MealHistoryService.recordMealActionWithLoading(123, 'viewed');
      
      await expect(operation.execute()).rejects.toThrow('Database error');
      
      expect(operation.loadingState).toBe('error');
      expect(operation.error).toBeInstanceOf(Error);
      expect(operation.error?.message).toBe('Database error');
    });
  });

  describe('getUserMealHistory', () => {
    it('should fetch meal history successfully', async () => {
      const mockData = [
        { id: 1, meal_id: 123, action_type: 'viewed', action_date: '2023-01-01T00:00:00Z' },
        { id: 2, meal_id: 123, action_type: 'cooked', action_date: '2023-01-02T00:00:00Z' },
      ];
      
      (mockSupabase.from('').select().order().range() as any).mockResolvedValueOnce({
        data: mockData,
        error: null,
        count: mockData.length,
      });
      
      const result = await MealHistoryService.getUserMealHistory();
      
      expect(result.data).toEqual(mockData);
      expect(result.count).toBe(mockData.length);
      expect(mockSupabase.from).toHaveBeenCalledWith('meal_history');
    });

    it('should apply filters when provided', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const actionTypes: MealHistoryAction[] = ['viewed', 'cooked'];
      
      (mockSupabase.from('').select().order().range() as any).mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      });
      
      await MealHistoryService.getUserMealHistory({
        startDate,
        endDate,
        actionTypes,
        limit: 10,
        offset: 20,
      });
      
      expect(mockSupabase.gte).toHaveBeenCalledWith('action_date', startDate.toISOString());
      expect(mockSupabase.lte).toHaveBeenCalledWith('action_date', endDate.toISOString());
      expect(mockSupabase.in).toHaveBeenCalledWith('action_type', actionTypes);
      expect(mockSupabase.range).toHaveBeenCalledWith(20, 29);
    });
  });

  describe('getMealHistory', () => {
    it('should fetch history for a specific meal', async () => {
      const mealId = 123;
      const mockData = [
        { id: 1, meal_id: mealId, action_type: 'viewed', action_date: '2023-01-01T00:00:00Z' },
      ];
      
      (mockSupabase.from('').select().eq().order().limit() as any).mockResolvedValueOnce({
        data: mockData,
        error: null,
      });
      
      const result = await MealHistoryService.getMealHistory(mealId);
      
      expect(result).toEqual(mockData);
      expect(mockSupabase.eq).toHaveBeenCalledWith('meal_id', mealId);
      expect(mockSupabase.order).toHaveBeenCalledWith('action_date', { ascending: false });
      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
    });
  });
});
