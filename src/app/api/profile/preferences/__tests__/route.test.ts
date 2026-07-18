import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from '../route';

// Mock next/headers (required by Supabase SSR)
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ getAll: () => [], set: vi.fn() })),
}));

const mockSupabase = {
  auth: { getSession: vi.fn() },
  from: vi.fn(),
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabase),
}));

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');

const SESSION_USER = { id: 'user-abc' };

const mockSession = (user: typeof SESSION_USER | null) => {
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: user ? { user } : null },
    error: null,
  });
};

const mockFromChain = (data: unknown, error: unknown = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    upsert: vi.fn().mockResolvedValue({ error }),
  };
  mockSupabase.from.mockReturnValue(chain);
  return chain;
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
describe('GET /api/profile/preferences', () => {
  it('returns 401 when no session', async () => {
    mockSession(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns preference fields for authenticated user', async () => {
    mockSession(SESSION_USER);
    mockFromChain({
      dietary_preferences: ['vegan', 'keto'],
      disliked_ingredients: ['mushrooms'],
      meal_type_preferences: { breakfast: ['continental'] },
      onboarding_completed: true,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.dietaryPreferences).toEqual(['vegan', 'keto']);
    expect(json.dislikedIngredients).toEqual(['mushrooms']);
    expect(json.mealTypePreferences).toEqual({ breakfast: ['continental'] });
    expect(json.onboardingCompleted).toBe(true);
  });

  it('returns empty defaults when profile row has no preferences', async () => {
    mockSession(SESSION_USER);
    mockFromChain({
      dietary_preferences: null,
      disliked_ingredients: null,
      meal_type_preferences: null,
      onboarding_completed: null,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.dietaryPreferences).toEqual([]);
    expect(json.dislikedIngredients).toEqual([]);
    expect(json.mealTypePreferences).toEqual({});
    expect(json.onboardingCompleted).toBe(false);
  });

  it('returns 500 when Supabase query fails', async () => {
    mockSession(SESSION_USER);
    mockFromChain(null, { message: 'DB error' });

    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Failed to fetch preferences');
  });
});

// ---------------------------------------------------------------------------
// PUT
// ---------------------------------------------------------------------------
describe('PUT /api/profile/preferences', () => {
  const makeRequest = (body: unknown) =>
    new Request('http://localhost/api/profile/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('returns 401 when no session', async () => {
    mockSession(null);
    const req = makeRequest({ dietaryPreferences: [] });
    const res = await PUT(req as never);
    expect(res.status).toBe(401);
  });

  it('saves preferences and returns 200', async () => {
    mockSession(SESSION_USER);
    const chain = mockFromChain(null, null);

    const body = {
      dietaryPreferences: ['vegan'],
      dislikedIngredients: ['peanuts'],
      mealTypePreferences: { dinner: ['italian'] },
      onboardingCompleted: true,
    };
    const req = makeRequest(body);
    const res = await PUT(req as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SESSION_USER.id,
        dietary_preferences: ['vegan'],
        disliked_ingredients: ['peanuts'],
        meal_type_preferences: { dinner: ['italian'] },
        onboarding_completed: true,
      })
    );
  });

  it('applies defaults for missing fields', async () => {
    mockSession(SESSION_USER);
    const chain = mockFromChain(null, null);

    const req = makeRequest({});
    const res = await PUT(req as never);

    expect(res.status).toBe(200);
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        dietary_preferences: [],
        disliked_ingredients: [],
        meal_type_preferences: {},
        onboarding_completed: false,
      })
    );
  });

  it('returns 500 when upsert fails', async () => {
    mockSession(SESSION_USER);
    const chain = {
      upsert: vi.fn().mockResolvedValue({ error: { message: 'constraint violation' } }),
    };
    mockSupabase.from.mockReturnValue(chain);

    const req = makeRequest({ dietaryPreferences: ['vegan'] });
    const res = await PUT(req as never);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Failed to update preferences');
  });
});
