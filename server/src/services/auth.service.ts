import { Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../models/User.model';
import { Tenant } from '../models/Tenant.model';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { EmailService } from './email.service';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
  RefreshTokenPayload,
} from './token.service';
import { RegisterInput, LoginInput } from '../validations/auth.validation';
import { SessionService, SessionContext } from './session.service';
import { SecurityService } from './security.service';

const MAX_ACTIVE_SESSIONS = 5;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL_MS = 60 * 60 * 1000; // 1h

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  tenantId: string;
  avatar?: string;
}

/** Projects a user document down to the fields safe to return to clients. */
function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    tenantId: user.tenantId.toString(),
    avatar: user.avatar,
  };
}

/**
 * Issues a fresh access/refresh pair, persists the hashed refresh token
 * (capped to the most recent N sessions), and saves the user.
 */
async function issueTokens(
  user: UserDocument,
  context?: SessionContext,
  replaceHash?: string,
): Promise<AuthTokens> {
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    tenantId: user.tenantId.toString(),
    role: user.role,
    email: user.email,
  });

  const jti = generateRandomToken(16);
  const refreshToken = signRefreshToken({
    sub: user._id.toString(),
    tenantId: user.tenantId.toString(),
    jti,
  });
  const refreshTokenHash = hashToken(refreshToken);

  user.refreshTokens = [...(user.refreshTokens ?? []), refreshTokenHash].slice(-MAX_ACTIVE_SESSIONS);
  await user.save();

  // Track the device session (create on login, rotate in place on refresh).
  await SessionService.record({
    tenantId: user.tenantId.toString(),
    userId: user._id.toString(),
    jti,
    refreshTokenHash,
    replaceHash,
    context,
  });

  return { accessToken, refreshToken };
}

export const AuthService = {
  /** Registers a user within a tenant and emails a verification link. */
  async register(tenantId: string, input: RegisterInput): Promise<{ user: PublicUser }> {
    const tenant = await Tenant.findOne({ _id: tenantId, isActive: true }).select('_id').lean();
    if (!tenant) throw ApiError.badRequest('Invalid or inactive tenant');

    const existing = await User.findOne({ tenantId, email: input.email }).select('_id').lean();
    if (existing) throw ApiError.conflict('An account with this email already exists');

    const verificationToken = generateRandomToken();
    const user = await User.create({
      tenantId: new Types.ObjectId(tenantId),
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role ?? 'student',
      verificationToken: hashToken(verificationToken),
      verificationTokenExpires: new Date(Date.now() + VERIFICATION_TTL_MS),
    });

    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await EmailService.sendVerificationEmail(user.email, user.name, verifyUrl, tenantId);

    return { user: toPublicUser(user) };
  },

  /** Authenticates credentials and returns the public user + token pair. */
  async login(
    tenantId: string,
    input: LoginInput,
    context?: SessionContext,
  ): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const user = await User.findOne({ tenantId, email: input.email }).select(
      '+password +refreshTokens',
    );
    // Same response whether the email is unknown or the password is wrong.
    if (!user || !(await user.comparePassword(input.password))) {
      await SecurityService.record({
        tenantId,
        userId: user?._id.toString(),
        email: input.email,
        type: 'login_failed',
        ip: context?.ip,
        userAgent: context?.userAgent,
      });
      throw ApiError.unauthorized('Invalid email or password');
    }
    if (!user.isActive) {
      await SecurityService.record({
        tenantId,
        userId: user._id.toString(),
        email: user.email,
        type: 'login_failed',
        ip: context?.ip,
        userAgent: context?.userAgent,
        metadata: { reason: 'account_deactivated' },
      });
      throw ApiError.forbidden('This account has been deactivated');
    }

    user.lastLogin = new Date();
    const tokens = await issueTokens(user, context);
    await SecurityService.record({
      tenantId,
      userId: user._id.toString(),
      email: user.email,
      type: 'login_success',
      ip: context?.ip,
      userAgent: context?.userAgent,
    });
    return { user: toPublicUser(user), tokens };
  },

  /** Rotates a refresh token: validates, revokes the old, issues a new pair. */
  async refresh(rawToken: string, context?: SessionContext): Promise<AuthTokens> {
    let payload: RefreshTokenPayload;
    try {
      payload = verifyRefreshToken(rawToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await User.findById(payload.sub).select('+refreshTokens');
    if (!user) throw ApiError.unauthorized('Invalid refresh token');

    const hashed = hashToken(rawToken);
    if (!user.refreshTokens?.includes(hashed)) {
      // Token not recognized → possible reuse/theft. Revoke every session.
      user.refreshTokens = [];
      await user.save();
      await SessionService.clearForUser(user._id.toString());
      await SecurityService.record({
        tenantId: user.tenantId.toString(),
        userId: user._id.toString(),
        type: 'token_reuse',
        ip: context?.ip,
        userAgent: context?.userAgent,
      });
      throw ApiError.unauthorized('Refresh token has been revoked');
    }

    user.refreshTokens = user.refreshTokens.filter((token) => token !== hashed);
    return issueTokens(user, context, hashed);
  },

  /** Revokes the presented refresh token (best-effort; never throws). */
  async logout(rawToken: string | undefined, context?: SessionContext): Promise<void> {
    if (!rawToken) return;
    try {
      const payload = verifyRefreshToken(rawToken);
      const user = await User.findById(payload.sub).select('+refreshTokens');
      if (user) {
        const hashed = hashToken(rawToken);
        user.refreshTokens = (user.refreshTokens ?? []).filter((token) => token !== hashed);
        await user.save();
        await SessionService.revokeByHash(hashed);
        await SecurityService.record({
          tenantId: user.tenantId.toString(),
          userId: user._id.toString(),
          type: 'logout',
          ip: context?.ip,
          userAgent: context?.userAgent,
        });
      }
    } catch {
      // An invalid token on logout is a no-op.
    }
  },

  /** Marks a user verified from a valid, unexpired verification token. */
  async verifyEmail(rawToken: string): Promise<void> {
    const user = await User.findOne({
      verificationToken: hashToken(rawToken),
      verificationTokenExpires: { $gt: new Date() },
    }).select('+verificationToken +verificationTokenExpires');
    if (!user) throw ApiError.badRequest('Invalid or expired verification token');

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    await EmailService.sendWelcomeEmail(user.email, user.name, user.tenantId.toString());
  },

  /** Starts a password reset. Always resolves the same way to avoid enumeration. */
  async forgotPassword(tenantId: string, email: string): Promise<void> {
    const user = await User.findOne({ tenantId, email });
    if (!user) return;

    const resetToken = generateRandomToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await EmailService.sendPasswordResetEmail(user.email, user.name, resetUrl);
  },

  /** Completes a password reset and revokes all existing sessions. */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const user = await User.findOne({
      passwordResetToken: hashToken(rawToken),
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +refreshTokens');
    if (!user) throw ApiError.badRequest('Invalid or expired reset token');

    user.password = newPassword; // hashed by the pre-save hook
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // force re-login everywhere after a password change
    await user.save();

    await SessionService.clearForUser(user._id.toString());
    await SecurityService.record({
      tenantId: user.tenantId.toString(),
      userId: user._id.toString(),
      type: 'password_reset',
    });
  },
};
