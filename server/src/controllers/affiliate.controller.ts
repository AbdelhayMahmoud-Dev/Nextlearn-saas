import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser, getRequestContext, getTenantId } from '../utils/requestContext';
import { AffiliateService } from '../services/affiliate.service';
import type { PayoutEmailInput, TrackInput } from '../validations/affiliate.validation';

export const AffiliateController = {
  /** Public: records a referral click and validates the code. */
  track: asyncHandler(async (req, res) => {
    const { code, courseId } = req.body as TrackInput;
    const result = await AffiliateService.trackClick(
      getTenantId(req),
      code,
      courseId,
      getRequestContext(req),
    );
    ApiResponse.success(res, result, 'Referral tracked');
  }),

  // ── Affiliate (authenticated) ──────────────────────────────────────────────
  dashboard: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    ApiResponse.success(res, await AffiliateService.dashboard(user.tenantId, user.id), 'Affiliate dashboard');
  }),

  updatePayoutEmail: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { email } = req.body as PayoutEmailInput;
    const result = await AffiliateService.updatePayoutEmail(user.tenantId, user.id, email);
    ApiResponse.success(res, result, 'Payout email updated');
  }),

  commissions: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { items, meta } = await AffiliateService.listMyCommissions(user.tenantId, user.id, req.query);
    ApiResponse.success(res, items, 'Commissions', 200, meta);
  }),

  payouts: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { items, meta } = await AffiliateService.listMyPayouts(user.tenantId, user.id, req.query);
    ApiResponse.success(res, items, 'Payouts', 200, meta);
  }),

  requestPayout: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const result = await AffiliateService.requestPayout(user.tenantId, user.id);
    ApiResponse.created(res, result, 'Payout requested');
  }),
};
