import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Stub environment variables before importing the route handler
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '1.0.0-test');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');

import { GET } from '../route';

describe('/api/health endpoint', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '1.0.0-test');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
  });

  afterEach(() => {
    // Reset env vars to avoid leakage between tests
    vi.unstubAllEnvs();
  });

  it('returns 200 status code when all checks pass', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('returns JSON with status ok when healthy', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  it('includes version in response body', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.version).toBeDefined();
    expect(typeof data.version).toBe('string');
    expect(data.version).toBe('1.0.0-test');
  });

  it('includes timestamp in response body', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.timestamp).toBeDefined();
  });

  it('returns application/json content type', async () => {
    const response = await GET();
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('returns degraded status with 503 when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.checks.supabase_service_role).toBe(false);
  });

  it('returns degraded status with 503 when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.checks.supabase_url).toBe(false);
  });

  it('falls back to default version when NEXT_PUBLIC_APP_VERSION is not set', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '');
    const response = await GET();
    const data = await response.json();
    expect(data.version).toBe('0.1.0');
  });

  it('includes all checks in the response', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.checks).toBeDefined();
    expect(typeof data.checks).toBe('object');
    expect(data.checks.supabase_url).toBe(true);
    expect(data.checks.supabase_service_role).toBe(true);
  });
});
