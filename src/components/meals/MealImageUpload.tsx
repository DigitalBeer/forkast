'use client';

import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useImageUpload } from '@/hooks/useImageUpload';

export interface MealImageUploadProps {
  currentImageUrl?: string;
  onImageUrlChange: (url: string | null) => void;
  disabled?: boolean;
}

export function MealImageUpload({
  currentImageUrl,
  onImageUrlChange,
  disabled,
}: MealImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null);
  const [isDragging, setIsDragging] = useState(false);
  const { upload, uploading, error, clearError } = useImageUpload();

  const handleFile = useCallback(
    async (file: File) => {
      clearError();

      // upload() runs validation internally and sets error state on failure
      // Show local preview immediately while uploading
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      const url = await upload(file);
      if (url) {
        setPreview(url);
        onImageUrlChange(url);
      } else {
        // Revert preview on failure
        setPreview(currentImageUrl ?? null);
      }
    },
    [upload, onImageUrlChange, currentImageUrl, clearError],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onImageUrlChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isInteractive = !disabled && !uploading;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors',
          isDragging && 'border-primary bg-primary/5',
          !preview && !isDragging && 'border-input hover:border-primary/50 cursor-pointer p-6 text-center',
          preview && !uploading && 'border-transparent cursor-pointer',
          uploading && 'border-input p-6 text-center',
          !isInteractive && 'opacity-60 pointer-events-none',
        )}
        onClick={() => isInteractive && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && isInteractive) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (isInteractive) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={preview ? 'Click to replace meal image' : 'Click to upload meal image'}
        data-testid="meal-image-upload"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
          disabled={!isInteractive}
          aria-label="Image file input"
          data-testid="meal-image-input"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
            <svg
              className="animate-spin h-8 w-8"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-sm">Uploading…</p>
          </div>
        ) : preview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={preview}
            alt="Meal image preview"
            className="w-full h-48 object-cover rounded-lg"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <p className="text-sm font-medium">
              <span className="text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs">JPEG, PNG or WebP · max 5MB</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {preview && !uploading && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            Replace Image
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}
