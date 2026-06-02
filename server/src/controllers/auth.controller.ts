import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { getAuthUser, getRequestContext, getTenantId } from '../utils/requestContext';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { SecurityService } from '../services/security.service';
import { hashToken } from '../services/token.service';
import { env } from '../config/env';
import { parseDurationMs } from '../utils/duration';

const REFRESH_COOKIE = 'nl_refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

/** Sets the rotating refresh token as an httpOnly, scoped cookie. */
function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'strict' : 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES_IN),
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
}

function readRefreshCookie(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  return cookies?.[REFRESH_COOKIE];
}

export const AuthController = {
  register: asyncHandler(async (req, res) => {
    const { user } = await AuthService.register(getTenantId(req), req.body);
    ApiResponse.created(res, { user }, 'Registration successful — please verify your email');
  }),

  login: asyncHandler(async (req, res) => {
    const { user, tokens } = await AuthService.login(getTenantId(req), req.body, getRequestContext(req));
    setRefreshCookie(res, tokens.refreshToken);
    // refreshToken is also returned in the body so server-side consumers (the
    // NextAuth Credentials provider) can persist it; browsers use the httpOnly cookie.
    ApiResponse.success(
      res,
      { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      'Login successful',
    );
  }),

  refresh: asyncHandler(async (req, res) => {
    // Accept the refresh token from the httpOnly cookie (browser) or the request
    // body (server-to-server callers such as NextAuth that can't send the cookie).
    const body = req.body as { refreshToken?: string } | undefined;
    const token = readRefreshCookie(req) ?? body?.refreshToken;
    if (!token) throw ApiError.unauthorized('No refresh token provided');
    const tokens = await AuthService.refresh(token, getRequestContext(req));
    setRefreshCookie(res, tokens.refreshToken);
    ApiResponse.success(
      res,
      { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      'Token refreshed',
    );
  }),

  logout: asyncHandler(async (req, res) => {
    await AuthService.logout(readRefreshCookie(req), getRequestContext(req));
    clearRefreshCookie(res);
    ApiResponse.success(res, null, 'Logged out');
  }),

  /** Lists the current user's device sessions (marks the one making the request). */
  listSessions: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const raw = readRefreshCookie(req);
    const currentHash = raw ? hashToken(raw) : undefined;
    const sessions = await SessionService.listForUser(user.tenantId, user.id, currentHash);
    ApiResponse.success(res, sessions, 'Active sessions');
  }),

  /** Revokes a single device session by id. */
  revokeSession: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    await SessionService.revoke(user.tenantId, user.id, req.params.id, getRequestContext(req));
    ApiResponse.success(res, null, 'Session revoked');
  }),

  /** Revokes every other session, keeping the current device signed in. */
  revokeAllSessions: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const raw = readRefreshCookie(req);
    const currentHash = raw ? hashToken(raw) : undefined;
    await SessionService.revokeAll(user.tenantId, user.id, currentHash);
    ApiResponse.success(res, null, 'Other sessions revoked');
  }),

  /** The current user's login + security history. */
  loginHistory: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { items, meta } = await SecurityService.loginHistory(user.tenantId, user.id, req.query);
    ApiResponse.success(res, items, 'Login history', 200, meta);
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    await AuthService.verifyEmail(req.body.token);
    ApiResponse.success(res, null, 'Email verified successfully');
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    await AuthService.forgotPassword(getTenantId(req), req.body.email);
    ApiResponse.success(res, null, 'If an account exists for that email, a reset link has been sent');
  }),

  resetPassword: asyncHandler(async (req, res) => {
    await AuthService.resetPassword(req.body.token, req.body.password);
    ApiResponse.success(res, null, 'Password reset successful — please log in');
  }),

  me: asyncHandler(async (req, res) => {
    ApiResponse.success(res, { user: req.user }, 'Current user');
  }),
};
