import { describe, it, expect } from 'vitest';
import { validateImageFile } from '@/lib/image/image-validation';

function createMockFile(
  type: string,
  size: number,
  name = 'test.jpg',
): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

describe('validateImageFile', () => {
  it('accepts valid JPEG', () => {
    const result = validateImageFile(createMockFile('image/jpeg', 1024));
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts valid PNG', () => {
    const result = validateImageFile(createMockFile('image/png', 1024));
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts valid WebP', () => {
    const result = validateImageFile(createMockFile('image/webp', 1024));
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects invalid MIME type (image/gif)', () => {
    const result = validateImageFile(createMockFile('image/gif', 1024));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Only JPEG, PNG, and WebP images are supported.');
  });

  it('rejects file exceeding 5MB', () => {
    const result = validateImageFile(
      createMockFile('image/jpeg', 5 * 1024 * 1024 + 1),
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Image must be less than 5MB.');
  });

  it('accepts file exactly at 5MB', () => {
    const result = validateImageFile(
      createMockFile('image/jpeg', 5 * 1024 * 1024),
    );
    expect(result.valid).toBe(true);
  });
});
