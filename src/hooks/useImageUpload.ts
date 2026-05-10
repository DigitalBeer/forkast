'use client';

import { useState, useCallback } from 'react';
import { validateImageFile } from '@/lib/image/image-validation';
import { resizeImage } from '@/lib/image/process-image';

export interface ImageUploadState {
  uploading: boolean;
  error: string | null;
}

export function useImageUpload() {
  const [state, setState] = useState<ImageUploadState>({ uploading: false, error: null });

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
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Upload failed');
      }

      const { url } = (await response.json()) as { url: string };
      setState({ uploading: false, error: null });
      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload image';
      setState({ uploading: false, error: message });
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return { ...state, upload, clearError };
}
