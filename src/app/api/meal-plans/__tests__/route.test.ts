import { describe, it, expect, vi, beforeEach } from 'vitest';

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

// Mock chains matching the actual route.ts query patterns

function mockTableCheckChain(error: null | { code?: string; message: string }) {
  return {
    select: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [], error }),
    }),
  };
}

function mockOwnershipCheckChain(
  ownedMeals: { id: string }[],
  error: null | { code?: string; message: string },
) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: ownedMeals, error }),
      }),
    }),
  };
}

function mockPlanInsertChain(
  data: unknown,
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

function mockPlannedMealsInsertChain(
  error: null | { code?: string; message: string },
) {
  return {
    insert: vi.fn().mockResolvedValue({ data: null, error }),
  };
}

describe('POST /api/meal-plans — Meal Ownership Validation (AC 1-5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Auth guards ───────────────────────────────────────────────

  it('AC-4: returns 401 for unauthenticated users', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const req = new Request('http://localhost/api/meal-plans', {
      method: 'POST',
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        meals: {},
      }),
    });
    const response = await POST(
      req as unknown as import('next/server').NextRequest,
    );
    const json = await response.json();
    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  // ── AC-5: Empty plan allowed ──────────────────────────────────

  it('AC-5: returns 201 for empty plan (no meals) — edge case', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const mealPlanData = {
      id: 'plan-1',
      start_date: '2024-01-01',
      end_date: '2024-01-07',
    };

    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(mockTableCheckChain(null)); // table check
    fromMock.mockReturnValueOnce(mockPlanInsertChain(mealPlanData, null)); // insert plan
    mockSupabase.from.mockImplementation(fromMock);

    const req = new Request('http://localhost/api/meal-plans', {
      method: 'POST',
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        meals: {},
      }),
    });
    const response = await POST(
      req as unknown as import('next/server').NextRequest,
    );
    expect(response.status).toBe(201);
  });

  // ── AC-1 & AC-4: Valid plan save with owned meals ─────────────

  it('AC-1, AC-4: returns 201 when all meals are owned by the user', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const mealPlanData = {
      id: 'plan-1',
      start_date: '2024-01-01',
      end_date: '2024-01-07',
    };

    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(
      mockOwnershipCheckChain([{ id: 'meal-1' }, { id: 'meal-2' }], null),
    ); // ownership check — both owned
    fromMock.mockReturnValueOnce(mockTableCheckChain(null)); // table check
    fromMock.mockReturnValueOnce(mockPlanInsertChain(mealPlanData, null)); // insert plan
    fromMock.mockReturnValueOnce(mockPlannedMealsInsertChain(null)); // insert planned meals
    mockSupabase.from.mockImplementation(fromMock);

    const req = new Request('http://localhost/api/meal-plans', {
      method: 'POST',
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        meals: {
          '2024-01-01': {
            breakfast: { id: 'meal-1', name: 'Oatmeal' },
            lunch: { id: 'meal-2', name: 'Salad' },
          },
        },
      }),
    });
    const response = await POST(
      req as unknown as import('next/server').NextRequest,
    );
    const json = await response.json();
    expect(response.status).toBe(201);
    expect(json.message).toBe('Meal plan saved successfully');
    expect(json.mealPlanId).toBe('plan-1');
  });

  // ── AC-2 & AC-3: Foreign meal rejected with 403 ───────────────

  it('AC-2, AC-3: returns 403 when one meal is not owned — lists invalid ID', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    // Only meal-1 is owned; foreign-meal is NOT owned
    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(
      mockOwnershipCheckChain([{ id: 'meal-1' }], null),
    ); // ownership check — only meal-1 returned
    fromMock.mockReturnValueOnce(mockTableCheckChain(null)); // table check
    mockSupabase.from.mockImplementation(fromMock);

    const req = new Request('http://localhost/api/meal-plans', {
      method: 'POST',
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        meals: {
          '2024-01-01': {
            breakfast: { id: 'meal-1', name: 'Oatmeal' },
            dinner: { id: 'foreign-meal', name: 'Stolen Recipe' },
          },
        },
      }),
    });
    const response = await POST(
      req as unknown as import('next/server').NextRequest,
    );
    const json = await response.json();
    expect(response.status).toBe(403);
    expect(json.error).toBe('Some meals do not belong to you');
    expect(json.invalidMealIds).toContain('foreign-meal');
  });

  it('AC-2, AC-3: returns 403 when ALL meals are foreign — lists all invalid IDs', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(mockOwnershipCheckChain([], null)); // ownership check — none owned
    fromMock.mockReturnValueOnce(mockTableCheckChain(null)); // table check
    mockSupabase.from.mockImplementation(fromMock);

    const req = new Request('http://localhost/api/meal-plans', {
      method: 'POST',
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        meals: {
          '2024-01-01': {
            breakfast: { id: 'foreign-1', name: 'Stolen' },
            lunch: { id: 'foreign-2', name: 'Stolen' },
          },
        },
      }),
    });
    const response = await POST(
      req as unknown as import('next/server').NextRequest,
    );
    const json = await response.json();
    expect(response.status).toBe(403);
    expect(json.error).toBe('Some meals do not belong to you');
    expect(json.invalidMealIds).toContain('foreign-1');
    expect(json.invalidMealIds).toContain('foreign-2');
    expect(json.invalidMealIds).toHaveLength(2);
  });

  // ── AC-3: No rows inserted on validation failure ──────────────

  it('AC-3: no meal_plans or planned_meals inserts when validation fails', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(mockOwnershipCheckChain([], null)); // ownership check — none owned
    mockSupabase.from.mockImplementation(fromMock);

    const req = new Request('http://localhost/api/meal-plans', {
      method: 'POST',
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        meals: {
          '2024-01-01': {
            breakfast: { id: 'foreign-1', name: 'Stolen' },
          },
        },
      }),
    });
    await POST(req as unknown as import('next/server').NextRequest);

    // Verify insert was NEVER called — only ownership check ran before 403 return
    const fromCalls = mockSupabase.from.mock.calls;
    expect(fromCalls).toHaveLength(1); // meals (ownership) only
    expect(fromCalls[0][0]).toBe('meals');
  });

  // ── Duplicate meal IDs deduplication ──────────────────────────

  it('AC-1: deduplicates meal IDs before validation — same meal in multiple slots', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const mealPlanData = {
      id: 'plan-2',
      start_date: '2024-01-01',
      end_date: '2024-01-07',
    };

    const ownershipMock = mockOwnershipCheckChain([{ id: 'meal-1' }], null);
    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(ownershipMock); // ownership
    fromMock.mockReturnValueOnce(mockTableCheckChain(null)); // table check
    fromMock.mockReturnValueOnce(mockPlanInsertChain(mealPlanData, null)); // insert plan
    fromMock.mockReturnValueOnce(mockPlannedMealsInsertChain(null)); // insert planned meals
    mockSupabase.from.mockImplementation(fromMock);

    // Same meal-1 in breakfast on two different days
    const req = new Request('http://localhost/api/meal-plans', {
      method: 'POST',
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        meals: {
          '2024-01-01': { breakfast: { id: 'meal-1', name: 'Oatmeal' } },
          '2024-01-02': { breakfast: { id: 'meal-1', name: 'Oatmeal' } },
        },
      }),
    });
    const response = await POST(
      req as unknown as import('next/server').NextRequest,
    );
    expect(response.status).toBe(201);

    // Verify .in() was called with a deduplicated array
    const inCall =
      ownershipMock.select.mock.results[0].value.eq.mock.results[0].value.in
        .mock.calls[0][1];
    expect(inCall).toEqual(['meal-1']); // not ['meal-1', 'meal-1']
  });
});
