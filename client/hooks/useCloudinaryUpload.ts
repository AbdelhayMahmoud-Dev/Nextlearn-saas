'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface UploadResult {
  url: string;
  hlsUrl?: string;
  duration?: number;
  publicId: string;
  width?: number;
  height?: number;
}

export type UploadStatus = 'idle' | 'signing' | 'uploading' | 'processing' | 'complete' | 'error';

interface SignedParams {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  eager?: string;
  resourceType: 'video' | 'image' | 'raw';
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  duration?: number;
  width?: number;
  height?: number;
  eager?: { secure_url: string }[];
}

/**
 * Cloudinary direct-upload hook.
 * Flow: server signs params → client uploads directly to Cloudinary via XHR
 * (XHR is used instead of fetch because it supports upload progress events).
 * CLOUDINARY_API_SECRET never leaves the server.
 */
export function useCloudinaryUpload(type: 'video' | 'image' | 'document') {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setStatus('signing');
      setProgress(0);
      setError(null);
      setResult(null);

      try {
        // 1. Get server-signed params
        const signEndpoint =
          type === 'video' ? '/upload/sign-video'
          : type === 'image' ? '/upload/sign-image'
          : '/upload/sign-document';

        const { data: signRes } = await apiClient.post<ApiResponse<SignedParams>>(signEndpoint, {
          mimeType: file.type,
          fileSize: file.size,
          filename: file.name,
        });
        const signed = signRes.data;

        // 2. Build FormData for direct Cloudinary upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signed.signature);
        formData.append('timestamp', String(signed.timestamp));
        formData.append('api_key', signed.apiKey);
        formData.append('folder', signed.folder);
        if (signed.eager) {
          formData.append('eager', signed.eager);
          formData.append('eager_async', 'true');
        }

        setStatus('uploading');

        // 3. Upload via XHR to track progress
        const uploadResult = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e: ProgressEvent): void => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = (): void => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResponse);
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          };
          xhr.onerror = (): void => reject(new Error('Network error during upload'));
          xhr.open(
            'POST',
            `https://api.cloudinary.com/v1_1/${signed.cloudName}/${signed.resourceType}/upload`,
          );
          xhr.send(formData);
        });

        // 4. HLS stream may still be processing (Cloudinary eager is async)
        const isVideo = signed.resourceType === 'video';
        if (isVideo && signed.eager) setStatus('processing');

        const uploadedResult: UploadResult = {
          url: uploadResult.secure_url,
          hlsUrl: uploadResult.eager?.[0]?.secure_url,
          duration: uploadResult.duration,
          publicId: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
        };

        if (!isVideo || !signed.eager) setStatus('complete');
        setResult(uploadedResult);
        return uploadedResult;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setError(msg);
        setStatus('error');
        return null;
      }
    },
    [type],
  );

  const reset = useCallback((): void => {
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return { status, progress, result, error, upload, reset };
}
