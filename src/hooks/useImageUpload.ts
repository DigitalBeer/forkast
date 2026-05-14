'use client';

import { useState, useCallback } from 'react';
import { validateImageFile } from '@/lib/image/image-validation';
import { resizeImage } from '@/lib/image/process-image';

/**
 * Extracts the storage path from a Supabase public URL.
 * URL format: https://{project}.supabase.co/storage/v1/object/public/meal-images/{path}
 * Returns null if the URL is malformed or contains path traversal sequences.
 */
export function getStoragePathFromUrl(publicUrl: string): string | null {
  const marker = '/meal-images/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  let path = publicUrl.slice(idx + marker.length);
  // Strip query params — they are not part of the storage path
  const qs = path.indexOf('?');
  if (qs !== -1) path = path.slice(0, qs);
  // Guard empty path
  if (!path) return null;
  // Path traversal protection
  if (path.includes('..')) return null;
  if (path.startsWith('/')) return null;
  return path;
}

export interface ImageUploadState {
  uploading: boolean;
  error: string | null;
}

export function useImageUpload() {
  const [state, setState] = useState<ImageUploadState>({
    uploading: false,
    error: null,
  });

  const upload = useCallback(async (file: File): Promise<string | null> => {
    setState({ uploading: true, error: null });

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setState({ uploading: false, error: validation.error ?? 'Invalid file' });
      return null;
    }

    try {
      const processed = await resizeImage(file);

      const formData = new FormData();
      formData.append('file', processed);

      const response = await fetch('/api/upload/meal-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? 'Upload failed');
      }

      const { url } = (await response.json()) as { url: string };
      setState({ uploading: false, error: null });
      return url;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to upload image';
      setState({ uploading: false, error: message });
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const deleteImage = useCallback(async (url: string): Promise<boolean> => {
    const path = getStoragePathFromUrl(url);
    if (!path) {
      console.warn('Could not extract storage path from URL:', url);
      return false;
    }

    try {
      const response = await fetch('/api/upload/meal-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        console.warn(
          'Delete image failed:',
          payload?.error ?? response.statusText,
        );
        return false;
      }

      return true;
    } catch (err) {
      console.warn('Delete image request failed:', err);
      return false;
    }
  }, []);

  return { ...state, upload, deleteImage, clearError };
}
