import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser } from '../utils/requestContext';
import { UploadService } from '../services/upload.service';

interface UploadBody {
  mimeType: string;
  fileSize: number;
  filename: string;
}

export const UploadController = {
  signVideo: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const params = UploadService.signVideo(user.tenantId, req.body as UploadBody);
    ApiResponse.success(res, params, 'Upload signature generated');
  }),

  signImage: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const params = UploadService.signImage(user.tenantId, req.body as UploadBody);
    ApiResponse.success(res, params, 'Upload signature generated');
  }),

  signDocument: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const params = UploadService.signDocument(user.tenantId, req.body as UploadBody);
    ApiResponse.success(res, params, 'Upload signature generated');
  }),

  deleteAsset: asyncHandler(async (req, res) => {
    const { publicId, resourceType } = req.body as {
      publicId: string;
      resourceType: 'video' | 'image' | 'raw';
    };
    await UploadService.deleteAsset(publicId, resourceType ?? 'image');
    ApiResponse.success(res, null, 'Asset deleted');
  }),
};
