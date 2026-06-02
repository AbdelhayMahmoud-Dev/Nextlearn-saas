import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser } from '../utils/requestContext';
import { LearnService } from '../services/learn.service';

export const LearnController = {
  course: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const data = await LearnService.getCourseLearn(user.tenantId, user.id, req.params.courseId);
    ApiResponse.success(res, data, 'Course player data');
  }),

  lesson: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const data = await LearnService.getLesson(
      user.tenantId,
      user.id,
      req.params.courseId,
      req.params.lessonId,
    );
    ApiResponse.success(res, data, 'Lesson');
  }),
};
