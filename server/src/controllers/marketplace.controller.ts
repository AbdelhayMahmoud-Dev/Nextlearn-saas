import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getTenantId } from '../utils/requestContext';
import { MarketplaceService } from '../services/marketplace.service';

/** Public marketplace reads are cacheable at the edge/CDN for a short window. */
function publicCache(res: Response, seconds = 60): void {
  res.setHeader('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=300`);
}

export const MarketplaceController = {
  stats: asyncHandler(async (req, res) => {
    publicCache(res, 300);
    ApiResponse.success(res, await MarketplaceService.stats(getTenantId(req)), 'Marketplace stats');
  }),

  featured: asyncHandler(async (req, res) => {
    publicCache(res);
    ApiResponse.success(res, await MarketplaceService.featured(getTenantId(req)), 'Featured courses');
  }),

  trending: asyncHandler(async (req, res) => {
    publicCache(res);
    ApiResponse.success(res, await MarketplaceService.trending(getTenantId(req)), 'Trending courses');
  }),

  topRated: asyncHandler(async (req, res) => {
    publicCache(res);
    ApiResponse.success(res, await MarketplaceService.topRated(getTenantId(req)), 'Top-rated courses');
  }),

  categories: asyncHandler(async (req, res) => {
    publicCache(res, 300);
    ApiResponse.success(res, await MarketplaceService.categories(getTenantId(req)), 'Categories');
  }),

  instructors: asyncHandler(async (req, res) => {
    const { items, meta } = await MarketplaceService.instructors(getTenantId(req), {
      page: req.query.page,
      limit: req.query.limit,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    });
    ApiResponse.success(res, items, 'Instructors', 200, meta);
  }),

  instructorProfile: asyncHandler(async (req, res) => {
    const data = await MarketplaceService.instructorProfile(getTenantId(req), req.params.id);
    ApiResponse.success(res, data, 'Instructor profile');
  }),
};
