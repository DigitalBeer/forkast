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

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');

import { GET } from '../route';

function createRequest(url: string) {
  return { url, method: 'GET' } as unknown as import('next/server').NextRequest;
}

describe('GET /api/shopping-list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when mealPlanId is missing', async () => {
    const req = createRequest('http://localhost/api/shopping-list');
    const response = await GET(req);
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toBe('mealPlanId is required');
  });

  it('returns 400 when mealPlanId is not a positive number', async () => {
    const req = createRequest('http://localhost/api/shopping-list?mealPlanId=-1');
    const response = await GET(req);
    expect(response.status).toBe(400);
  });

  it('returns 401 for unauthenticated users', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const req = createRequest('http://localhost/api/shopping-list?mealPlanId=1');
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it('returns 404 when meal plan not found', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'not found' },
          }),
        }),
      }),
    });

    const req = createRequest('http://localhost/api/shopping-list?mealPlanId=999');
    const response = await GET(req);
    expect(response.status).toBe(404);
  });

  it('returns 403 when meal plan belongs to another user', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 1, user_id: 'user-2', start_date: '2024-01-01', end_date: '2024-01-07' },
            error: null,
          }),
        }),
      }),
    });

    const req = createRequest('http://localhost/api/shopping-list?mealPlanId=1');
    const response = await GET(req);
    expect(response.status).toBe(403);
  });

  it('returns aggregated shopping list for valid request', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const planData = { id: 1, user_id: 'user-1', start_date: '2024-01-01', end_date: '2024-01-07' };
    const plannedMeals = [{ meal_id: 10 }, { meal_id: 20 }];
    const meals = [
      { id: 10, name: 'Pasta', ingredients: JSON.stringify([{ name: 'pasta', quantity: 1, unit: 'lb' }]), user_id: 'user-1' },
      { id: 20, name: 'Salad', ingredients: JSON.stringify([{ name: 'lettuce', quantity: 1, unit: '' }]), user_id: 'user-1' },
    ];

    // First call: meal_plans, Second call: planned_meals, Third call: meals
    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // meal_plans query
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: planData, error: null }),
            }),
          }),
        };
      }
      if (callCount === 2) {
        // planned_meals query
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: plannedMeals, error: null }),
          }),
        };
      }
      // meals query
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: meals, error: null }),
          }),
        }),
      };
    });

    const req = createRequest('http://localhost/api/shopping-list?mealPlanId=1');
    const response = await GET(req);
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.planId).toBe(1);
    expect(json.items).toBeDefined();
    expect(json.items.length).toBeGreaterThan(0);
  });
});