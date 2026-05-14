import { describe, it, expect } from 'vitest';
import { getStoragePathFromUrl } from '../useImageUpload';

describe('getStoragePathFromUrl', () => {
  const baseUrl =
    'https://abc.supabase.co/storage/v1/object/public/meal-images/';

  it('extracts correct path from valid Supabase URL', () => {
    const url = `${baseUrl}user-id-123/abc-def.webp`;
    expect(getStoragePathFromUrl(url)).toBe('user-id-123/abc-def.webp');
  });

  it('returns correct path for PNG image', () => {
    const url = `${baseUrl}user-id-123/some-image.png`;
    expect(getStoragePathFromUrl(url)).toBe('user-id-123/some-image.png');
  });

  it('returns null when URL has no /meal-images/ marker', () => {
    expect(getStoragePathFromUrl('https://example.com/some/path')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getStoragePathFromUrl('')).toBeNull();
  });

  it('returns null for URL containing path traversal (..)', () => {
    const url = `${baseUrl}../etc/passwd`;
    expect(getStoragePathFromUrl(url)).toBeNull();
  });

  it('returns null for URL with .. embedded in path', () => {
    const url = `${baseUrl}user-id/../other-user/image.webp`;
    expect(getStoragePathFromUrl(url)).toBeNull();
  });

  it('returns null for path starting with / (absolute path)', () => {
    const url = `${baseUrl}/etc/passwd`;
    expect(getStoragePathFromUrl(url)).toBeNull();
  });

  it('strips query parameters from extracted path', () => {
    const url = `${baseUrl}user-id-123/abc.webp?token=xyz`;
    // Query params are not part of the storage path
    expect(getStoragePathFromUrl(url)).toBe('user-id-123/abc.webp');
  });

  it('returns null when marker is at end of URL with no path after', () => {
    const url = `${baseUrl}`.slice(0, -1); // remove trailing slash
    const urlWithMarkerOnly =
      'https://abc.supabase.co/storage/v1/object/public/meal-images';
    expect(getStoragePathFromUrl(urlWithMarkerOnly)).toBeNull();
  });

  it('returns null for trailing slash after marker (empty path)', () => {
    const url = `${baseUrl}`;
    // trailing slash yields empty path
    expect(getStoragePathFromUrl(url)).toBeNull();
  });
});
