import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser } from '../utils/requestContext';
import { CertificateService } from '../services/certificate.service';
import { GenerateCertificateInput } from '../validations/certificate.validation';

export const CertificateController = {
  generate: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId } = req.body as GenerateCertificateInput;
    const certificate = await CertificateService.generate(user.tenantId, user.id, courseId);
    ApiResponse.created(res, certificate, 'Certificate issued');
  }),

  my: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const items = await CertificateService.listMy(user.tenantId, user.id);
    ApiResponse.success(res, items, 'My certificates');
  }),

  // Public — no auth.
  verify: asyncHandler(async (req, res) => {
    const result = await CertificateService.verify(req.params.number);
    ApiResponse.success(res, result, 'Certificate verification');
  }),
};
