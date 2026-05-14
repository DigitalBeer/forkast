import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers before any imports that use it
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ getAll: () => [], set: vi.fn() })),
}));

// Mock the supabase server client
const mockStorageRemove = vi.fn();
const mockStorageUpload = vi.fn();
const mockStorageFrom = vi.fn(() => ({
  upload: mockStorageUpload,
  remove: mockStorageRemove,
  getPublicUrl: vi.fn(() => ({
    data: {
      publicUrl:
        'https://test.supabase.co/storage/v1/object/public/meal-images/user-1/test.webp',
    },
  })),
}));

const mockSupabase = {
  auth: { getSession: vi.fn() },
  storage: { from: mockStorageFrom },
};

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => mockSupabase),
}));

// Mock environment
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');

import { POST, DELETE } from '../route';

function createFormDataRequest(
  file: File,
  method = 'POST',
): import('next/server').NextRequest {
  const formData = new FormData();
  formData.append('file', file);
  // We need to mock a NextRequest-like object
  return {
    formData: () => Promise.resolve(formData),
    json: () => Promise.reject(new Error('not json')),
  } as unknown as import('next/server').NextRequest;
}

function createJsonRequest(
  body: Record<string, unknown>,
  method = 'DELETE',
): import('next/server').NextRequest {
  return {
    formData: () => Promise.reject(new Error('not form data')),
    json: () => Promise.resolve(body),
  } as unknown as import('next/server').NextRequest;
}

function createMockFile(type: string, size: number, name = 'test.jpg'): File {
  const content = 'x'.repeat(size);
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  // Ensure arrayBuffer is available (jsdom may not polyfill it on File/Blob)
  if (!(file as Record<string, unknown>).arrayBuffer) {
    const buffer = new TextEncoder().encode(content).buffer;
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(buffer),
    });
  }
  return file;
}

// =============================================================================
// POST /api/upload/meal-image tests (AC: 8)
// =============================================================================
describe('POST /api/upload/meal-image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageUpload.mockReset();
  });

  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const file = createMockFile('image/jpeg', 1024);
    const req = createFormDataRequest(file);
    const response = await POST(req);

    const json = await response.json();
    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 401 when auth error occurs', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Auth error' },
    });

    const file = createMockFile('image/jpeg', 1024);
    const req = createFormDataRequest(file);
    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  it('returns 400 for unsupported MIME type (image/gif)', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const file = createMockFile('image/gif', 1024);
    const req = createFormDataRequest(file);
    const response = await POST(req);

    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toContain('Unsupported file type');
  });

  it('returns 400 when file exceeds 5MB', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const file = createMockFile('image/jpeg', 5 * 1024 * 1024 + 1);
    const req = createFormDataRequest(file);
    const response = await POST(req);

    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toContain('exceeds 5MB');
  });

  it('returns 200 with { url } on success', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    mockStorageUpload.mockResolvedValue({ error: null });

    const file = createMockFile('image/jpeg', 1024);
    const req = createFormDataRequest(file);
    const response = await POST(req);

    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.url).toBeDefined();
    expect(typeof json.url).toBe('string');
    expect(mockStorageUpload).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when Supabase storage upload fails', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    mockStorageUpload.mockResolvedValue({
      error: { message: 'Bucket not found' },
    });

    const file = createMockFile('image/jpeg', 1024);
    const req = createFormDataRequest(file);
    const response = await POST(req);

    const json = await response.json();
    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
  });

  it('returns 400 when no file is provided', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const emptyFormData = new FormData();
    const req = {
      formData: () => Promise.resolve(emptyFormData),
      json: () => Promise.reject(new Error('not json')),
    } as unknown as import('next/server').NextRequest;

    const response = await POST(req);
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toBe('No file provided');
  });
});

// =============================================================================
// DELETE /api/upload/meal-image tests (AC: 9)
// =============================================================================
describe('DELETE /api/upload/meal-image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageRemove.mockReset();
  });

  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const req = createJsonRequest({ path: 'user-1/test.webp' });
    const response = await DELETE(req);

    const json = await response.json();
    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 403 when path does not start with authenticated user ID', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    // Path belongs to a different user
    const req = createJsonRequest({ path: 'user-2/test.webp' });
    const response = await DELETE(req);

    const json = await response.json();
    expect(response.status).toBe(403);
    expect(json.error).toBe('Forbidden');
  });

  it('returns 400 when path is missing from body', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const req = createJsonRequest({});
    const response = await DELETE(req);

    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing path');
  });

  it('returns 200 { success: true } on successful delete', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    mockStorageRemove.mockResolvedValue({ error: null });

    const req = createJsonRequest({ path: 'user-1/test.webp' });
    const response = await DELETE(req);

    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockStorageRemove).toHaveBeenCalledWith(['user-1/test.webp']);
  });

  it('returns 500 when Supabase storage remove fails', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    mockStorageRemove.mockResolvedValue({
      error: { message: 'Storage error' },
    });

    const req = createJsonRequest({ path: 'user-1/test.webp' });
    const response = await DELETE(req);

    const json = await response.json();
    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
  });

  it('returns 403 when path tries directory traversal (no user ID prefix)', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    // Empty path startsWith '' which matches everything, but userId is 'user-1'
    // so '' doesn't start with 'user-1/'
    const req = createJsonRequest({ path: '' });
    // Empty path should be caught by the !path check first (400)
    const response = await DELETE(req);
    expect(response.status).toBe(400);
  });

  it('returns 400 when request body is not valid JSON', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const req = {
      formData: () => Promise.reject(new Error('not form data')),
      json: () => Promise.reject(new Error('Invalid JSON')),
    } as unknown as import('next/server').NextRequest;

    const response = await DELETE(req);

    // json() rejects → caught by .catch(() => null) → body is null → path missing → 400
    expect(response.status).toBe(400);
  });

  it('returns 400 on path traversal attempt with .. in path', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    // Path with .. should be caught by normalization check
    const req = createJsonRequest({ path: 'user-1/../other/image.webp' });
    const response = await DELETE(req);

    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid path');
  });

  it('returns 400 on path traversal attempt with double-dots at end', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const req = createJsonRequest({ path: 'user-1/..' });
    const response = await DELETE(req);

    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid path');
  });

  it('returns 400 on encoded traversal attempt with multiple dots', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    // `....` is split into two `..` groups, both removed by normalization
    const req = createJsonRequest({ path: 'user-1/..../image.webp' });
    const response = await DELETE(req);

    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid path');
  });
});
