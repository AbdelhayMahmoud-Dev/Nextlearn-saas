import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { UserRole } from '../models/User.model';

export interface AccessTokenPayload {
  /** User id (JWT `sub`). */
  sub: string;
  tenantId: string;
  role: UserRole;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tenantId: string;
  /** Unique token id, lets us rotate/revoke individual sessions. */
  jti: string;
}

type ExpiresIn = SignOptions['expiresIn'];

/** Signs a short-lived access token carrying identity + tenant + role. */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as ExpiresIn,
  });
}

/** Signs a long-lived refresh token (stored hashed, rotated on every use). */
export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as ExpiresIn,
  });
}

/** Verifies and decodes an access token. Throws on invalid/expired tokens. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

/** Verifies and decodes a refresh token. Throws on invalid/expired tokens. */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

/** Deterministic SHA-256 hash, used to store refresh/verification tokens at rest. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Cryptographically-random hex token for email verification / password reset. */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}
