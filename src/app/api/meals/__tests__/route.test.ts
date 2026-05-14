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

import { GET, POST, PATCH } from '../route';

function mockSelectChain(
  data: unknown,
  error: null | { code?: string; message: string },
) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  };
}

function mockUpsertChain(
  data: unknown,
  error: null | { code?: string; message: string },
) {
  return {
    upsert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  };
}

describe('GET /api/meals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated users', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const response = await GET();
    const json = await response.json();
    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns meals for authenticated users', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const mealsData = [
      {
        id: 1,
        name: 'Pasta',
        dietary_tags: ['vegan'],
        source_url: 'https://example.com',
      },
    ];
    mockSupabase.from.mockReturnValue(mockSelectChain(mealsData, null));

    const response = await GET();
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0].name).toBe('Pasta');
    expect(json[0].tags).toEqual(['vegan']);
    expect(json[0].sourceUrl).toBe('https://example.com');
  });

  it('returns 500 on database error', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi
            .fn()
            .mockResolvedValue({ data: null, error: { message: 'db error' } }),
        }),
      }),
    });

    const response = await GET();
    expect(response.status).toBe(500);
  });
});

describe('POST /api/meals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated users', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const req = new Request('http://localhost/api/meals', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Meal' }),
    });
    // Cast to NextRequest-like
    const response = await POST(
      req as unknown as import('next/server').NextRequest,
    );
    expect(response.status).toBe(401);
  });

  it('returns 400 when name is empty', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const req = new Request('http://localhost/api/meals', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    });
    const response = await POST(
      req as unknown as import('next/server').NextRequest,
    );
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toBe('Name is required');
  });

  it('creates a meal successfully', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const returnedMeal = {
      id: 42,
      name: 'Test Meal',
      dietary_tags: ['vegan'],
      source_url: null,
    };
    mockSupabase.from.mockReturnValue(mockUpsertChain(returnedMeal, null));

    const req = new Request('http://localhost/api/meals', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Meal', tags: ['vegan'] }),
    });
    const response = await POST(
      req as unknown as import('next/server').NextRequest,
    );
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.name).toBe('Test Meal');
    expect(json.id).toBe('42');
    expect(json.tags).toEqual(['vegan']);
  });

  it('returns 500 on upsert error', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    mockSupabase.from.mockReturnValue(
      mockUpsertChain(null, { code: '23505', message: 'duplicate key' }),
    );

    const req = new Request('http://localhost/api/meals', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Meal' }),
    });
    const response = await POST(
      req as unknown as import('next/server').NextRequest,
    );
    expect(response.status).toBe(500);
  });
});

function mockUpdateChain(data: unknown, error: null | { message: string }) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data, error }),
          }),
        }),
      }),
    }),
  };
}

describe('PATCH /api/meals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated users', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const req = new Request('http://localhost/api/meals', {
      method: 'PATCH',
      body: JSON.stringify({ id: '42', image_url: null }),
    });
    const response = await PATCH(
      req as unknown as import('next/server').NextRequest,
    );
    const json = await response.json();
    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 when meal id is missing', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const req = new Request('http://localhost/api/meals', {
      method: 'PATCH',
      body: JSON.stringify({ image_url: null }),
    });
    const response = await PATCH(
      req as unknown as import('next/server').NextRequest,
    );
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toBe('Meal ID is required');
  });

  it('updates image_url to null successfully', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const updatedMeal = {
      id: 42,
      name: 'Pasta',
      image_url: null,
      dietary_tags: [],
      source_url: null,
    };
    mockSupabase.from.mockReturnValue(mockUpdateChain(updatedMeal, null));

    const req = new Request('http://localhost/api/meals', {
      method: 'PATCH',
      body: JSON.stringify({ id: '42', image_url: null }),
    });
    const response = await PATCH(
      req as unknown as import('next/server').NextRequest,
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.image_url).toBeNull();
    expect(json.id).toBe('42');
  });

  it('returns 500 on database update error', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    mockSupabase.from.mockReturnValue(
      mockUpdateChain(null, { message: 'update failed' }),
    );

    const req = new Request('http://localhost/api/meals', {
      method: 'PATCH',
      body: JSON.stringify({ id: '42', image_url: null }),
    });
    const response = await PATCH(
      req as unknown as import('next/server').NextRequest,
    );
    expect(response.status).toBe(500);
  });

  it('omits name from body to avoid stale-overwrite race', async () => {
    // Verify that the PATCH handler does not require name
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const updatedMeal = {
      id: 42,
      name: 'Pasta',
      image_url: null,
      dietary_tags: [],
      source_url: null,
    };
    const mockFrom = mockUpdateChain(updatedMeal, null);
    mockSupabase.from.mockReturnValue(mockFrom);

    const req = new Request('http://localhost/api/meals', {
      method: 'PATCH',
      // Only id and image_url — no name
      body: JSON.stringify({ id: '42', image_url: null }),
    });
    const response = await PATCH(
      req as unknown as import('next/server').NextRequest,
    );
    expect(response.status).toBe(200);

    // Verify update was called with only image_url (no name)
    const updateCalls = mockFrom.update.mock.calls;
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0][0]).toEqual({ image_url: null });
  });
});
