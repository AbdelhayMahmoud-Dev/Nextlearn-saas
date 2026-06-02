import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser } from '../utils/requestContext';
import { ProgressService } from '../services/progress.service';
import { MarkProgressInput } from '../validations/progress.validation';

export const ProgressController = {
  mark: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const result = await ProgressService.mark(user.tenantId, user.id, req.body as MarkProgressInput);
    ApiResponse.success(res, result, 'Progress saved');
  }),

  byCourse: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const items = await ProgressService.getByCourse(user.tenantId, user.id, req.params.courseId);
    ApiResponse.success(res, items, 'Course progress');
  }),
};
