import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { ChangePasswordInput, UpdateProfileInput } from '../validations/user.validation';
import { SessionService, SessionContext } from './session.service';
import { SecurityService } from './security.service';

export const UserService = {
  /** Current user's profile (password/tokens are select:false, never returned). */
  async me(tenantId: string, userId: string) {
    const user = await User.findOne({ _id: userId, tenantId }).lean();
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  async updateProfile(tenantId: string, userId: string, input: UpdateProfileInput) {
    const user = await User.findOneAndUpdate(
      { _id: userId, tenantId },
      { $set: input },
      { new: true, runValidators: true },
    ).lean();
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  /** Changes password (verifying the current one) and revokes all sessions. */
  async changePassword(
    tenantId: string,
    userId: string,
    input: ChangePasswordInput,
    context?: SessionContext,
  ): Promise<void> {
    const user = await User.findOne({ _id: userId, tenantId }).select('+password +refreshTokens');
    if (!user) throw ApiError.notFound('User not found');
    const ok = await user.comparePassword(input.currentPassword);
    if (!ok) throw ApiError.badRequest('Current password is incorrect');
    user.password = input.newPassword; // hashed by pre-save hook
    user.refreshTokens = [];
    await user.save();
    await SessionService.clearForUser(userId);
    await SecurityService.record({
      tenantId,
      userId,
      type: 'password_changed',
      ip: context?.ip,
      userAgent: context?.userAgent,
    });
  },

  /** Number of active sessions (stored refresh tokens). */
  async sessionsCount(tenantId: string, userId: string): Promise<number> {
    const user = await User.findOne({ _id: userId, tenantId }).select('+refreshTokens').lean();
    return user?.refreshTokens?.length ?? 0;
  },

  /** Revokes every refresh token + device session — signs out everywhere. */
  async signOutEverywhere(tenantId: string, userId: string): Promise<void> {
    await User.updateOne({ _id: userId, tenantId }, { $set: { refreshTokens: [] } });
    await SessionService.clearForUser(userId);
  },
};
