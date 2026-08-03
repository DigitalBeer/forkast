import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({ get: vi.fn(() => 'test-signature') })),
}));

const { constructEventMock, mockSupabaseAdmin } = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  mockSupabaseAdmin: { from: vi.fn() },
}));

vi.mock('@/lib/stripe', () => ({
  stripe: { webhooks: { constructEvent: constructEventMock } },
  STRIPE_WEBHOOK_SECRET: 'whsec_test',
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseAdmin),
}));

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('EDGE_SERVICE_ROLE_KEY', 'test-service-key');

import { POST } from '../route';

function mockDedupeChain(error: null | { code?: string; message: string }) {
  return {
    insert: vi.fn().mockResolvedValue({ error }),
  };
}

function mockProfilesUpdateChain() {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  };
}

function mockFromByTable(chains: Record<string, unknown>, fallback: unknown) {
  return (table: string) => chains[table] ?? fallback;
}

function makeRequest(): Request {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body: JSON.stringify({ id: 'evt_test' }),
  });
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when no stripe-signature header is present', async () => {
    const { headers } = await import('next/headers');
    vi.mocked(headers).mockReturnValue({
      get: vi.fn(() => null),
    } as unknown as ReturnType<typeof headers>);

    const response = await POST(makeRequest() as unknown as import('next/server').NextRequest);
    expect(response.status).toBe(400);
  });

  it('returns 400 when signature verification fails', async () => {
    const { headers } = await import('next/headers');
    vi.mocked(headers).mockReturnValue({
      get: vi.fn(() => 'bad-signature'),
    } as unknown as ReturnType<typeof headers>);
    constructEventMock.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    const response = await POST(makeRequest() as unknown as import('next/server').NextRequest);
    expect(response.status).toBe(400);
  });

  it('processes a new event and records it for deduplication', async () => {
    const { headers } = await import('next/headers');
    vi.mocked(headers).mockReturnValue({
      get: vi.fn(() => 'good-signature'),
    } as unknown as ReturnType<typeof headers>);

    constructEventMock.mockReturnValue({
      id: 'evt_new',
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { supabase_user_id: 'user-1' },
          customer: 'cus_1',
        },
      },
    });

    const dedupeChain = mockDedupeChain(null);
    const profilesChain = mockProfilesUpdateChain();
    mockSupabaseAdmin.from.mockImplementation(
      mockFromByTable({ stripe_webhook_events: dedupeChain, profiles: profilesChain }, dedupeChain),
    );

    const response = await POST(makeRequest() as unknown as import('next/server').NextRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ received: true });
    expect(dedupeChain.insert).toHaveBeenCalledWith({
      id: 'evt_new',
      type: 'checkout.session.completed',
    });
    expect(profilesChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_status: 'premium' }),
    );
  });

  it('short-circuits and does not reprocess a duplicate event', async () => {
    const { headers } = await import('next/headers');
    vi.mocked(headers).mockReturnValue({
      get: vi.fn(() => 'good-signature'),
    } as unknown as ReturnType<typeof headers>);

    constructEventMock.mockReturnValue({
      id: 'evt_duplicate',
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { supabase_user_id: 'user-1' },
          customer: 'cus_1',
        },
      },
    });

    const dedupeChain = mockDedupeChain({ code: '23505', message: 'duplicate key' });
    const profilesChain = mockProfilesUpdateChain();
    mockSupabaseAdmin.from.mockImplementation(
      mockFromByTable({ stripe_webhook_events: dedupeChain, profiles: profilesChain }, dedupeChain),
    );

    const response = await POST(makeRequest() as unknown as import('next/server').NextRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ received: true, duplicate: true });
    // The event was never processed -- profiles must not have been touched.
    expect(profilesChain.update).not.toHaveBeenCalled();
  });

  it('fails open and still processes the event when the dedupe write hits an unrelated error', async () => {
    const { headers } = await import('next/headers');
    vi.mocked(headers).mockReturnValue({
      get: vi.fn(() => 'good-signature'),
    } as unknown as ReturnType<typeof headers>);

    constructEventMock.mockReturnValue({
      id: 'evt_infra_error',
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { supabase_user_id: 'user-1' },
          customer: 'cus_1',
        },
      },
    });

    const dedupeChain = mockDedupeChain({ message: 'connection reset' });
    const profilesChain = mockProfilesUpdateChain();
    mockSupabaseAdmin.from.mockImplementation(
      mockFromByTable({ stripe_webhook_events: dedupeChain, profiles: profilesChain }, dedupeChain),
    );

    const response = await POST(makeRequest() as unknown as import('next/server').NextRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ received: true });
    expect(profilesChain.update).toHaveBeenCalled();
  });
});
