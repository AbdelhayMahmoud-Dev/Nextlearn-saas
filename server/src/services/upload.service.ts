import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi',
]);
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
]);
const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
]);

function ensureCloudinaryConfigured(): void {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw ApiError.internal('Cloudinary is not configured on this server');
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  eager?: string;
  resourceType: 'video' | 'image' | 'raw';
}

export const UploadService = {
  /**
   * Signs a video upload request.
   * The client uploads directly to Cloudinary; this server NEVER sees the bytes.
   * The server-generated HLS eager transformation converts the upload to an
   * adaptive streaming manifest (.m3u8).
   */
  signVideo(
    tenantId: string,
    body: { mimeType: string; fileSize: number; filename: string },
  ): SignedUploadParams {
    ensureCloudinaryConfigured();
    if (!ALLOWED_VIDEO_TYPES.has(body.mimeType)) {
      throw ApiError.badRequest(`Video type "${body.mimeType}" is not allowed`);
    }
    if (body.fileSize > MAX_VIDEO_SIZE) {
      throw ApiError.badRequest('Video exceeds the 2 GB limit');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = `nextlearn/${tenantId}/videos`;
    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
      eager: 'sp_full_hd/m3u8',
      eager_async: 'true',
      resource_type: 'video',
    };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      env.CLOUDINARY_API_SECRET!,
    );
    return {
      signature,
      timestamp,
      cloudName: env.CLOUDINARY_CLOUD_NAME!,
      apiKey: env.CLOUDINARY_API_KEY!,
      folder,
      eager: 'sp_full_hd/m3u8',
      resourceType: 'video',
    };
  },

  /** Signs an image upload request. */
  signImage(
    tenantId: string,
    body: { mimeType: string; fileSize: number; filename: string },
  ): SignedUploadParams {
    ensureCloudinaryConfigured();
    if (!ALLOWED_IMAGE_TYPES.has(body.mimeType)) {
      throw ApiError.badRequest(`Image type "${body.mimeType}" is not allowed`);
    }
    if (body.fileSize > MAX_IMAGE_SIZE) {
      throw ApiError.badRequest('Image exceeds the 10 MB limit');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = `nextlearn/${tenantId}/images`;
    const transformation = 'w_1280,h_720,c_fill,q_auto,f_webp';
    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
      transformation,
    };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      env.CLOUDINARY_API_SECRET!,
    );
    return {
      signature,
      timestamp,
      cloudName: env.CLOUDINARY_CLOUD_NAME!,
      apiKey: env.CLOUDINARY_API_KEY!,
      folder,
      resourceType: 'image',
    };
  },

  /** Signs a document upload request. */
  signDocument(
    tenantId: string,
    body: { mimeType: string; fileSize: number; filename: string },
  ): SignedUploadParams {
    ensureCloudinaryConfigured();
    if (!ALLOWED_DOCUMENT_TYPES.has(body.mimeType)) {
      throw ApiError.badRequest(`Document type "${body.mimeType}" is not allowed`);
    }
    if (body.fileSize > MAX_DOCUMENT_SIZE) {
      throw ApiError.badRequest('Document exceeds the 50 MB limit');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = `nextlearn/${tenantId}/documents`;
    const paramsToSign: Record<string, string | number> = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      env.CLOUDINARY_API_SECRET!,
    );
    return {
      signature,
      timestamp,
      cloudName: env.CLOUDINARY_CLOUD_NAME!,
      apiKey: env.CLOUDINARY_API_KEY!,
      folder,
      resourceType: 'raw',
    };
  },

  /** Deletes a Cloudinary asset by public_id. */
  async deleteAsset(publicId: string, resourceType: 'video' | 'image' | 'raw'): Promise<void> {
    ensureCloudinaryConfigured();
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  },
};
