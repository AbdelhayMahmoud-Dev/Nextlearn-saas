import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser, getTenantId } from '../utils/requestContext';
import { ReviewService } from '../services/review.service';
import { CreateReviewInput } from '../validations/review.validation';

export const ReviewController = {
  featured: asyncHandler(async (req, res) => {
    const items = await ReviewService.featured(getTenantId(req));
    ApiResponse.success(res, items, 'Featured reviews');
  }),

  forCourse: asyncHandler(async (req, res) => {
    const { items, meta } = await ReviewService.forCourse(
      getTenantId(req),
      req.params.courseId,
      req.query,
    );
    ApiResponse.success(res, items, 'Course reviews', 200, meta);
  }),

  create: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const review = await ReviewService.create(user.tenantId, user.id, req.body as CreateReviewInput);
    ApiResponse.created(res, review, 'Review submitted');
  }),
};
