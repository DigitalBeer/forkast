import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resizeImage } from '@/lib/image/process-image';

function createImageFile(
  _width: number,
  _height: number,
  type = 'image/jpeg',
): File {
  const blob = new Blob(['x'.repeat(1024)], { type });
  return new File([blob], `test-image.jpg`, { type });
}

describe('resizeImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL.createObjectURL and revokeObjectURL
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    // Mock canvas context
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    // Mock canvas toBlob — default to success
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (cb: BlobCallback) => {
        cb(new Blob(['img'], { type: 'image/webp' }));
      },
    );

    // Mock canvas width/height
    vi.spyOn(HTMLCanvasElement.prototype, 'width', 'get').mockReturnValue(800);
    vi.spyOn(HTMLCanvasElement.prototype, 'height', 'get').mockReturnValue(600);
    vi.spyOn(HTMLCanvasElement.prototype, 'width', 'set').mockImplementation(
      vi.fn(),
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'height', 'set').mockImplementation(
      vi.fn(),
    );
  });

  it('returns image as-is when dimensions are under max (1200x900)', async () => {
    // Mock window.Image to fire onload immediately with small dimensions
    const MockImage = vi.fn().mockImplementation(function (
      this: HTMLImageElement,
    ) {
      Object.defineProperty(this, 'width', { value: 800, writable: true });
      Object.defineProperty(this, 'height', { value: 600, writable: true });
      Object.defineProperty(this, 'naturalWidth', {
        value: 800,
        writable: true,
      });
      Object.defineProperty(this, 'naturalHeight', {
        value: 600,
        writable: true,
      });
      // Fire onload asynchronously
      setTimeout(() => {
        if (this.onload) this.onload(new Event('load'));
      }, 0);
      return this;
    }) as unknown as typeof window.Image;

    vi.stubGlobal('Image', MockImage);

    const file = createImageFile(800, 600);
    const result = await resizeImage(file, 1200, 900);

    // Should return the original file unchanged (same name, same type)
    expect(result).toBe(file);
  });

  it('preserves original file when no resize is needed', async () => {
    const MockImage = vi.fn().mockImplementation(function (
      this: HTMLImageElement,
    ) {
      Object.defineProperty(this, 'width', { value: 100, writable: true });
      Object.defineProperty(this, 'height', { value: 100, writable: true });
      setTimeout(() => {
        if (this.onload) this.onload(new Event('load'));
      }, 0);
      return this;
    }) as unknown as typeof window.Image;

    vi.stubGlobal('Image', MockImage);

    const file = createImageFile(100, 100);
    const result = await resizeImage(file);

    expect(result).toBe(file);
  });

  it('returns original file unchanged when dimensions are below max (small images not resized)', async () => {
    // For small images, the original file is returned as-is — no resize means no WebP conversion
    const MockImage = vi.fn().mockImplementation(function (
      this: HTMLImageElement,
    ) {
      Object.defineProperty(this, 'width', { value: 100, writable: true });
      Object.defineProperty(this, 'height', { value: 100, writable: true });
      setTimeout(() => {
        if (this.onload) this.onload(new Event('load'));
      }, 0);
      return this;
    }) as unknown as typeof window.Image;

    vi.stubGlobal('Image', MockImage);

    const file = createImageFile(100, 100);
    const result = await resizeImage(file);
    expect(result).toBe(file);
  });

  it('resizes image when dimensions exceed max', async () => {
    const MockImage = vi.fn().mockImplementation(function (
      this: HTMLImageElement,
    ) {
      Object.defineProperty(this, 'width', { value: 2400, writable: true });
      Object.defineProperty(this, 'height', { value: 1800, writable: true });
      setTimeout(() => {
        if (this.onload) this.onload(new Event('load'));
      }, 0);
      return this;
    }) as unknown as typeof window.Image;

    vi.stubGlobal('Image', MockImage);

    const file = createImageFile(2400, 1800);
    const result = await resizeImage(file, 1200, 900);

    // The result should be a different file (resized and converted to WebP)
    expect(result).not.toBe(file);
    expect(result.name).toMatch(/\.webp$/);
    expect(result.type).toBe('image/webp');
  });

  it('rejects with error when canvas context is unavailable', async () => {
    // Override getContext to return null
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const MockImage = vi.fn().mockImplementation(function (
      this: HTMLImageElement,
    ) {
      Object.defineProperty(this, 'width', { value: 2400, writable: true });
      Object.defineProperty(this, 'height', { value: 1800, writable: true });
      setTimeout(() => {
        if (this.onload) this.onload(new Event('load'));
      }, 0);
      return this;
    }) as unknown as typeof window.Image;

    vi.stubGlobal('Image', MockImage);

    const file = createImageFile(2400, 1800);
    await expect(resizeImage(file, 1200, 900)).rejects.toThrow(
      'Canvas 2D context unavailable',
    );
  });

  it('rejects with error when toBlob produces null', async () => {
    // Override toBlob to call callback with null
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (cb: BlobCallback) => {
        cb(null as unknown as Blob);
      },
    );

    const MockImage = vi.fn().mockImplementation(function (
      this: HTMLImageElement,
    ) {
      Object.defineProperty(this, 'width', { value: 2400, writable: true });
      Object.defineProperty(this, 'height', { value: 1800, writable: true });
      setTimeout(() => {
        if (this.onload) this.onload(new Event('load'));
      }, 0);
      return this;
    }) as unknown as typeof window.Image;

    vi.stubGlobal('Image', MockImage);

    const file = createImageFile(2400, 1800);
    await expect(resizeImage(file, 1200, 900)).rejects.toThrow(
      'Failed to encode resized image',
    );
  });

  it('rejects when image fails to load', async () => {
    const MockImage = vi.fn().mockImplementation(function (
      this: HTMLImageElement,
    ) {
      // Fire onerror instead of onload
      setTimeout(() => {
        if (this.onerror) this.onerror(new Event('error'));
      }, 0);
      return this;
    }) as unknown as typeof window.Image;

    vi.stubGlobal('Image', MockImage);

    const file = createImageFile(800, 600);
    await expect(resizeImage(file)).rejects.toThrow(
      'Failed to load image for resizing',
    );
  });
});
