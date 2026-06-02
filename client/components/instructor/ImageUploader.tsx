'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { ImageIcon, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCloudinaryUpload, type UploadResult } from '@/hooks/useCloudinaryUpload';
import { Button } from '@/components/ui/button';

interface Props {
  onComplete?: (result: UploadResult) => void;
  /** Aspect ratio class, e.g. "aspect-video" or "aspect-square". */
  aspectClass?: string;
}

/** Drag-and-drop image uploader with Cloudinary signed upload. */
export function ImageUploader({ onComplete, aspectClass = 'aspect-video' }: Props): JSX.Element {
  const { status, progress, result, error, upload, reset } = useCloudinaryUpload('image');

  const onDrop = useCallback(
    (files: File[]): void => {
      const file = files[0];
      if (!file) return;
      void upload(file).then((r) => { if (r) onComplete?.(r); });
    },
    [upload, onComplete],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [] },
    maxFiles: 1,
    disabled: status === 'uploading' || status === 'signing',
  });

  if (status === 'complete' && result?.url) {
    return (
      <div className="space-y-2">
        <div className={cn('relative w-full overflow-hidden rounded-xl', aspectClass)}>
          <Image src={result.url} alt="Uploaded thumbnail" fill className="object-cover" sizes="640px" />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="size-3.5 mr-1.5" /> Replace image
        </Button>
      </div>
    );
  }

  if (status === 'uploading') {
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-xl border bg-muted', aspectClass)}>
        <Loader2 className="size-6 animate-spin text-brand-primary" />
        <p className="mt-2 text-sm">{progress}%</p>
        <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-muted-foreground/20">
          <div className="h-full bg-brand-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-2 rounded-xl border border-destructive/40 p-4 text-center">
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error ?? 'Upload failed'}</p>
        <Button type="button" variant="outline" size="sm" onClick={reset}>Try Again</Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors',
        aspectClass,
        isDragActive ? 'border-brand-primary bg-brand-primary/5' : 'border-muted-foreground/30 hover:border-brand-primary/50',
      )}
    >
      <input {...getInputProps()} aria-label="Upload image" />
      <ImageIcon className="mb-2 size-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">{isDragActive ? 'Drop it here…' : 'Drop image or click to browse'}</p>
      <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP · Max 10 MB</p>
    </div>
  );
}
