'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Video, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCloudinaryUpload, type UploadResult } from '@/hooks/useCloudinaryUpload';
import { Button } from '@/components/ui/button';

interface Props {
  onComplete?: (result: UploadResult) => void;
}

/**
 * Drag-and-drop video uploader.
 * Uses server-signed Cloudinary direct upload with XHR progress tracking.
 */
export function VideoUploader({ onComplete }: Props): JSX.Element {
  const { status, progress, result, error, upload, reset } = useCloudinaryUpload('video');

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
    accept: { 'video/mp4': [], 'video/webm': [], 'video/quicktime': [], 'video/x-msvideo': [] },
    maxFiles: 1,
    disabled: status === 'uploading' || status === 'signing',
  });

  if (status === 'idle') {
    return (
      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          isDragActive
            ? 'border-brand-primary bg-brand-primary/5'
            : 'border-muted-foreground/30 hover:border-brand-primary/50',
        )}
      >
        <input {...getInputProps()} aria-label="Upload video" />
        <Video className="mx-auto mb-3 size-10 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">{isDragActive ? 'Drop it here…' : 'Drop video here or click to browse'}</p>
        <p className="mt-1 text-sm text-muted-foreground">MP4, WebM, MOV · Max 2 GB</p>
      </div>
    );
  }

  if (status === 'signing') {
    return (
      <div className="flex items-center gap-3 rounded-xl border p-4">
        <Loader2 className="size-5 animate-spin text-brand-primary" />
        <span className="text-sm">Preparing secure upload…</span>
      </div>
    );
  }

  if (status === 'uploading') {
    return (
      <div className="space-y-2 rounded-xl border p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Uploading… {progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-brand-primary transition-all"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="flex items-center gap-3 rounded-xl border p-4 text-sm">
        <Loader2 className="size-5 animate-spin text-brand-primary" />
        <div>
          <p className="font-medium">Upload complete — generating adaptive stream…</p>
          <p className="text-muted-foreground">This usually takes 1–3 minutes for HD videos.</p>
        </div>
      </div>
    );
  }

  if (status === 'complete' && result) {
    return (
      <div className="space-y-2 rounded-xl border p-4">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="size-5" aria-hidden="true" />
          <span className="font-medium">Upload complete</span>
          {result.duration && (
            <span className="ml-auto text-sm text-muted-foreground">
              Duration: {Math.floor(result.duration / 60)}m {Math.round(result.duration % 60)}s
            </span>
          )}
        </div>
        {result.hlsUrl && (
          <p className="truncate text-xs text-muted-foreground">HLS: {result.hlsUrl}</p>
        )}
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="size-3.5 mr-1.5" /> Replace video
        </Button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-2 rounded-xl border border-destructive/40 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="size-5" aria-hidden="true" />
          <span className="font-medium">Upload failed</span>
        </div>
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          Try Again
        </Button>
      </div>
    );
  }

  return <></>;
}
