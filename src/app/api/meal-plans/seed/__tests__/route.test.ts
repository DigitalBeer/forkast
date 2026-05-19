import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock next/headers before any imports that use it
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ getAll: () => [], set: vi.fn() })),
}));

// Mock @supabase/ssr
const mockSupabase = {
  auth: { getSession: vi.fn() },
  from: vi.fn(),
};
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabase),
}));

// Mock environment
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');

import { POST } from '../route';

// Helper to mock a chain for fetching meals
function mockMealsFetchChain(
  meals: Array<{
    id: number;
    name: string;
    meal_type: string;
    image_url?: string | null;
  }>,
  error: null | { code?: string; message: string },
) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: meals, error }),
        }),
      }),
    }),
  };
}

// Helper to mock meal_plans insert chain
function mockPlanInsertChain(
  data: { id: number; start_date: string; end_date: string } | null,
  error: null | { code?: string; message: string },
) {
  return {
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  };
}

// Helper to mock planned_meals insert chain
function mockPlannedMealsInsertChain(
  error: null | { code?: string; message: string },
) {
  return {
    insert: vi.fn().mockResolvedValue({ data: null, error }),
  };
}

describe('POST /api/meal-plans/seed — Auto-Generate Starter Plan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Set a fixed date for consistent testing: Monday, January 1, 2024
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Auth guard ───────────────────────────────────────────────

  it('returns 401 for unauthenticated users', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  // ── AC: 0 meals → creates empty plan ─────────────────────────

  it('AC: creates empty plan when user has 0 meals', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const planData = {
      id: 101,
      start_date: '2024-01-01',
      end_date: '2024-01-07',
    };

    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(mockMealsFetchChain([], null)); // fetch meals
    fromMock.mockReturnValueOnce(mockPlanInsertChain(planData, null)); // insert plan
    mockSupabase.from.mockImplementation(fromMock);

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.planId).toBe(101);

    // Verify planned_meals insert was NOT called (no meals to insert)
    const fromCalls = mockSupabase.from.mock.calls;
    const plannedMealsCall = fromCalls.find(
      (call: string[]) => call[0] === 'planned_meals',
    );
    expect(plannedMealsCall).toBeUndefined();
  });

  // ── AC: < 7 meals → uses all available meals ─────────────────

  it('AC: creates plan with 3 slots filled when user has 3 meals', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const userMeals = [
      { id: 1, name: 'Oatmeal', meal_type: 'Breakfast', image_url: null },
      { id: 2, name: 'Salad', meal_type: 'Lunch', image_url: null },
      { id: 3, name: 'Pasta', meal_type: 'Dinner', image_url: null },
    ];

    const planData = {
      id: 102,
      start_date: '2024-01-01',
      end_date: '2024-01-07',
    };

    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(mockMealsFetchChain(userMeals, null)); // fetch meals
    fromMock.mockReturnValueOnce(mockPlanInsertChain(planData, null)); // insert plan
    fromMock.mockReturnValueOnce(mockPlannedMealsInsertChain(null)); // insert planned meals
    mockSupabase.from.mockImplementation(fromMock);

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.planId).toBe(102);

    // Verify planned_meals insert was called with correct data
    const plannedMealsInsert = mockPlannedMealsInsertChain(null).insert;
    expect(fromMock).toHaveBeenCalledWith('planned_meals');
  });

  // ── AC: ≥ 7 meals → fills up to 21 slots (7 days × 3 types) ──

  it('AC: creates plan with up to 21 slots when user has 20+ meals', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    // Create 20 meals: 7 breakfast, 7 lunch, 6 dinner
    const userMeals = [
      { id: 1, name: 'Breakfast 1', meal_type: 'Breakfast', image_url: null },
      { id: 2, name: 'Breakfast 2', meal_type: 'Breakfast', image_url: null },
      { id: 3, name: 'Breakfast 3', meal_type: 'Breakfast', image_url: null },
      { id: 4, name: 'Breakfast 4', meal_type: 'Breakfast', image_url: null },
      { id: 5, name: 'Breakfast 5', meal_type: 'Breakfast', image_url: null },
      { id: 6, name: 'Breakfast 6', meal_type: 'Breakfast', image_url: null },
      { id: 7, name: 'Breakfast 7', meal_type: 'Breakfast', image_url: null },
      { id: 8, name: 'Lunch 1', meal_type: 'Lunch', image_url: null },
      { id: 9, name: 'Lunch 2', meal_type: 'Lunch', image_url: null },
      { id: 10, name: 'Lunch 3', meal_type: 'Lunch', image_url: null },
      { id: 11, name: 'Lunch 4', meal_type: 'Lunch', image_url: null },
      { id: 12, name: 'Lunch 5', meal_type: 'Lunch', image_url: null },
      { id: 13, name: 'Lunch 6', meal_type: 'Lunch', image_url: null },
      { id: 14, name: 'Lunch 7', meal_type: 'Lunch', image_url: null },
      { id: 15, name: 'Dinner 1', meal_type: 'Dinner', image_url: null },
      { id: 16, name: 'Dinner 2', meal_type: 'Dinner', image_url: null },
      { id: 17, name: 'Dinner 3', meal_type: 'Dinner', image_url: null },
      { id: 18, name: 'Dinner 4', meal_type: 'Dinner', image_url: null },
      { id: 19, name: 'Dinner 5', meal_type: 'Dinner', image_url: null },
      { id: 20, name: 'Dinner 6', meal_type: 'Dinner', image_url: null },
    ];

    const planData = {
      id: 103,
      start_date: '2024-01-01',
      end_date: '2024-01-07',
    };

    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(mockMealsFetchChain(userMeals, null)); // fetch meals
    fromMock.mockReturnValueOnce(mockPlanInsertChain(planData, null)); // insert plan
    fromMock.mockReturnValueOnce(mockPlannedMealsInsertChain(null)); // insert planned meals
    mockSupabase.from.mockImplementation(fromMock);

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.planId).toBe(103);
  });

  // ── AC: Meal type distribution ───────────────────────────────

  it('AC: selects one of each type (Breakfast, Lunch, Dinner) and fills remaining slots', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    // Only breakfast meals
    const userMeals = [
      { id: 1, name: 'Oatmeal', meal_type: 'Breakfast', image_url: null },
      { id: 2, name: 'Pancakes', meal_type: 'Breakfast', image_url: null },
    ];

    const planData = {
      id: 104,
      start_date: '2024-01-01',
      end_date: '2024-01-07',
    };

    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(mockMealsFetchChain(userMeals, null)); // fetch meals
    fromMock.mockReturnValueOnce(mockPlanInsertChain(planData, null)); // insert plan
    fromMock.mockReturnValueOnce(mockPlannedMealsInsertChain(null)); // insert planned meals
    mockSupabase.from.mockImplementation(fromMock);

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
  });

  // ── Error cases ──────────────────────────────────────────────

  it('returns 500 when meal fetch fails', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(
      mockMealsFetchChain([], { code: 'DB_ERROR', message: 'Database error' }),
    );
    mockSupabase.from.mockImplementation(fromMock);

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to fetch meals');
  });

  it('returns 500 when plan creation fails', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(mockMealsFetchChain([], null)); // fetch meals
    fromMock.mockReturnValueOnce(
      mockPlanInsertChain(null, {
        code: 'DB_ERROR',
        message: 'Failed to insert',
      }),
    );
    mockSupabase.from.mockImplementation(fromMock);

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to create plan');
  });

  it('succeeds even if planned_meals insert fails (best-effort)', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const userMeals = [
      { id: 1, name: 'Oatmeal', meal_type: 'Breakfast', image_url: null },
    ];

    const planData = {
      id: 105,
      start_date: '2024-01-01',
      end_date: '2024-01-07',
    };

    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(mockMealsFetchChain(userMeals, null)); // fetch meals
    fromMock.mockReturnValueOnce(mockPlanInsertChain(planData, null)); // insert plan
    fromMock.mockReturnValueOnce(
      mockPlannedMealsInsertChain({
        code: 'DB_ERROR',
        message: 'Failed to insert planned meals',
      }),
    );
    mockSupabase.from.mockImplementation(fromMock);

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.planId).toBe(105);
  });
});
