import { createClient } from '../supabase/client';

export type MealHistoryAction = 'viewed' | 'planned' | 'cooked' | 'skipped';

// Define error types for better error handling
export class MealHistoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRetryable: boolean = true,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'MealHistoryError';
  }
}

export interface MealHistoryRecord {
  id: number;
  user_id: string;
  meal_id: string;
  action_type: MealHistoryAction;
  action_date: string;
  additional_data?: Record<string, unknown>;
}

// Configuration for retry behavior and loading states
const RETRY_CONFIG = {
  MAX_RETRIES: 2,
  INITIAL_DELAY_MS: 1000,
  BACKOFF_FACTOR: 2,
};

// Type for tracking loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Interface for operations that support loading states
interface OperationWithLoading<T> {
  execute: () => Promise<T>;
  loadingState: LoadingState;
  error: Error | null;
  reset: () => void;
}

// Track loading states for different operations
const loadingStates: Record<string, {
  state: LoadingState;
  error: Error | null;
}> = {};

/**
 * Get or create a loading state tracker for an operation
 */
function getLoadingState(operationId: string): {
  state: LoadingState;
  error: Error | null;
} {
  if (!loadingStates[operationId]) {
    loadingStates[operationId] = {
      state: 'idle',
      error: null,
    };
  }
  return loadingStates[operationId];
}

/**
 * Create an operation with loading state tracking
 */
function withLoading<T>(
  operationId: string,
  operation: () => Promise<T>
): OperationWithLoading<T> {
  const loadingState = getLoadingState(operationId);
  
  const execute = async (): Promise<T> => {
    try {
      loadingState.state = 'loading';
      loadingState.error = null;
      
      const result = await operation();
      
      loadingState.state = 'success';
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      loadingState.state = 'error';
      loadingState.error = errorObj;
      throw errorObj;
    }
  };
  
  return {
    execute,
    get loadingState() {
      return loadingState.state;
    },
    get error() {
      return loadingState.error;
    },
    reset: () => {
      loadingState.state = 'idle';
      loadingState.error = null;
    },
  };
}

// Helper function for retryable operations
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = RETRY_CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: unknown;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      attempt++;
      
      // Don't retry if the error is marked as non-retryable
      if (error instanceof MealHistoryError && !error.isRetryable) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delayMs = RETRY_CONFIG.INITIAL_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt - 1);
      
      // Log the retry attempt
      console.warn(
        `[MealHistoryService] Retry ${attempt}/${maxRetries} for ${operationName} after ${delayMs}ms`,
        error
      );
      
      // Wait before retrying
      if (attempt <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // If we get here, all retries failed
  throw new MealHistoryError(
    `Failed to complete ${operationName} after ${maxRetries} retries`,
    'MAX_RETRIES_EXCEEDED',
    false,
    lastError
  );
}

export const MealHistoryService = {
  /**
   * Record a meal history event with loading state tracking
   * @throws {MealHistoryError} If the operation fails after retries
   */
  recordMealActionWithLoading(
    mealId: string,
    actionType: MealHistoryAction,
    additionalData: Record<string, unknown> = {}
  ): OperationWithLoading<void> {
    const operationId = `recordMealAction-${mealId}-${actionType}`;
    
    return withLoading(operationId, async () => {
      return this._recordMealAction(mealId, actionType, additionalData);
    });
  },
  
  /**
   * Internal method to record a meal history event
   * @private
   */
  async _recordMealAction(
    mealId: string,
    actionType: MealHistoryAction,
    additionalData: Record<string, unknown> = {}
  ): Promise<void> {
    return withRetry(async () => {
      const supabase = createClient();
      
      // Input validation
      if (!mealId || typeof mealId !== 'string') {
        throw new MealHistoryError(
          'Invalid meal ID provided',
          'INVALID_MEAL_ID',
          false // Don't retry invalid input
        );
      }

      if (!['viewed', 'planned', 'cooked', 'skipped'].includes(actionType)) {
        throw new MealHistoryError(
          `Invalid action type: ${actionType}`,
          'INVALID_ACTION_TYPE',
          false // Don't retry invalid input
        );
      }

      try {
        const { error } = await supabase.rpc('record_meal_history', {
          p_meal_id: mealId,
          p_action_type: actionType,
          p_additional_data: additionalData || {}
        });

        if (error) {
          // Check for specific error conditions
          if (error.code === '23503') { // Foreign key violation
            throw new MealHistoryError(
              `Meal with ID ${mealId} does not exist`,
              'MEAL_NOT_FOUND',
              false // Don't retry if the meal doesn't exist
            );
          }
          
          throw new MealHistoryError(
            `Failed to record meal history: ${error.message}`,
            'RECORD_HISTORY_FAILED',
            true, // Retry on database errors
            error
          );
        }
        
        return; // Success
      } catch (error) {
        // Re-throw our custom errors, wrap others
        if (error instanceof MealHistoryError) {
          throw error;
        }
        
        throw new MealHistoryError(
          `Unexpected error recording meal history: ${error instanceof Error ? error.message : String(error)}`,
          'UNEXPECTED_ERROR',
          true, // Retry on unexpected errors
          error
        );
      }
    }, `recordMealAction(mealId: ${mealId}, actionType: ${actionType})`);
  },
  
  /**
   * Record a meal history event (legacy method without loading state)
   * @deprecated Use recordMealActionWithLoading for better loading state support
   */
  async recordMealAction(
    mealId: string,
    actionType: MealHistoryAction,
    additionalData: Record<string, unknown> = {}
  ): Promise<void> {
    return this._recordMealAction(mealId, actionType, additionalData);
  },

  /**
   * Get meal history for the current user with loading state tracking
   */
  getUserMealHistoryWithLoading({
    limit = 50,
    offset = 0,
    actionTypes,
    startDate,
    endDate,
  }: {
    limit?: number;
    offset?: number;
    actionTypes?: MealHistoryAction[];
    startDate?: Date;
    endDate?: Date;
  } = {}): OperationWithLoading<{ data: MealHistoryRecord[]; count: number | null }> {
    const operationId = `getUserMealHistory-${limit}-${offset}-${actionTypes?.join(',')}-${startDate?.toISOString()}-${endDate?.toISOString()}`;
    
    return withLoading(operationId, () => 
      this._getUserMealHistory({ limit, offset, actionTypes, startDate, endDate })
    );
  },
  
  /**
   * Internal method to get meal history for the current user
   * @private
   */
  async _getUserMealHistory({
    limit = 50,
    offset = 0,
    actionTypes,
    startDate,
    endDate,
  }: {
    limit?: number;
    offset?: number;
    actionTypes?: MealHistoryAction[];
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{ data: MealHistoryRecord[]; count: number | null }> {
    const supabase = createClient();
    
    let query = supabase
      .from('meal_history')
      .select('*', { count: 'exact' })
      .order('action_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (actionTypes && actionTypes.length > 0) {
      query = query.in('action_type', actionTypes);
    }

    if (startDate) {
      query = query.gte('action_date', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('action_date', endDate.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching meal history:', error);
      throw new MealHistoryError(
        `Failed to fetch meal history: ${error.message}`,
        'FETCH_HISTORY_FAILED',
        true, // Retry on database errors
        error
      );
    }

    return {
      data: (data || []) as MealHistoryRecord[],
      count,
    };
  },
  
  /**
   * Get meal history for the current user (legacy method without loading state)
   * @deprecated Use getUserMealHistoryWithLoading for better loading state support
   */
  async getUserMealHistory({
    limit = 50,
    offset = 0,
    actionTypes,
    startDate,
    endDate,
  }: {
    limit?: number;
    offset?: number;
    actionTypes?: MealHistoryAction[];
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{ data: MealHistoryRecord[]; count: number | null }> {
    return this._getUserMealHistory({ limit, offset, actionTypes, startDate, endDate });
  },

  /**
   * Get recent meal history for a specific meal
   */
  async getMealHistory(
    mealId: string,
    limit: number = 10
  ): Promise<MealHistoryRecord[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('meal_history')
      .select('*')
      .eq('meal_id', mealId)
      .order('action_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`Error fetching history for meal ${mealId}:`, error);
      return [];
    }

    return (data || []) as MealHistoryRecord[];
  },
};

export default MealHistoryService;
