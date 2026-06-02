import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { getAuthUser } from '../utils/requestContext';
import { PaymentService } from '../services/payment.service';
import type { CheckoutBody, SubscribeBody } from '../validations/payment.validation';

export const PaymentController = {
  checkout: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId, couponCode, referralCode } = req.body as CheckoutBody;
    const result = await PaymentService.createCheckoutSession(
      user.tenantId,
      user.id,
      courseId,
      couponCode,
      referralCode,
    );
    ApiResponse.success(res, result, 'Checkout session created');
  }),

  subscribe: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { plan } = req.body as SubscribeBody;
    const result = await PaymentService.createSubscriptionSession(user.tenantId, user.id, plan);
    ApiResponse.success(res, result, 'Subscription checkout created');
  }),

  portal: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const result = await PaymentService.createBillingPortalSession(user.tenantId, user.id);
    ApiResponse.success(res, result, 'Billing portal session created');
  }),

  history: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { items, meta } = await PaymentService.getPaymentHistory(user.tenantId, user.id, req.query);
    ApiResponse.success(res, items, 'Payment history', 200, meta);
  }),

  subscription: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const subscription = await PaymentService.getSubscription(user.tenantId, user.id);
    ApiResponse.success(res, subscription, 'Subscription');
  }),

  verifySession: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const sessionId = req.query.sessionId;
    if (typeof sessionId !== 'string' || !sessionId) {
      throw ApiError.badRequest('sessionId is required');
    }
    const result = await PaymentService.verifySession(user.tenantId, user.id, sessionId);
    ApiResponse.success(res, result, 'Session verified');
  }),
};
