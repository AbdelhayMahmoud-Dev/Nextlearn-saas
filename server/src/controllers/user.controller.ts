import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser, getRequestContext } from '../utils/requestContext';
import { UserService } from '../services/user.service';
import { ChangePasswordInput, UpdateProfileInput } from '../validations/user.validation';

export const UserController = {
  me: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    ApiResponse.success(res, await UserService.me(user.tenantId, user.id), 'Current user');
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const updated = await UserService.updateProfile(user.tenantId, user.id, req.body as UpdateProfileInput);
    ApiResponse.success(res, updated, 'Profile updated');
  }),

  changePassword: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    await UserService.changePassword(
      user.tenantId,
      user.id,
      req.body as ChangePasswordInput,
      getRequestContext(req),
    );
    ApiResponse.success(res, null, 'Password changed — please sign in again');
  }),

  sessions: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const count = await UserService.sessionsCount(user.tenantId, user.id);
    ApiResponse.success(res, { count }, 'Active sessions');
  }),

  signOutEverywhere: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    await UserService.signOutEverywhere(user.tenantId, user.id);
    ApiResponse.success(res, null, 'Signed out on all devices');
  }),
};
