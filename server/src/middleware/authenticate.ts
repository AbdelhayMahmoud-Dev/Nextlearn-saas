import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { verifyAccessToken } from '../services/token.service';
import { ApiError } from '../utils/ApiError';

/**
 * Verifies the `Authorization: Bearer <token>` access token and attaches the
 * decoded principal to `req.user`. Rejects missing/invalid/expired tokens.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = verifyAccessToken(token);

    // The signed token is the authoritative tenant for authenticated requests.
    // Reject if a tenant was resolved (header/subdomain) OR explicitly requested
    // via header and conflicts with the token — a cross-tenant replay attempt.
    // Checking the raw header makes this independent of middleware ordering.
    const requestedTenant = req.tenantId ?? req.header('x-tenant-id') ?? undefined;
    if (requestedTenant && requestedTenant !== payload.tenantId) {
      throw ApiError.forbidden('Access token does not belong to the requested tenant');
    }

    req.user = {
      id: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      email: payload.email,
    };
    req.tenantId = payload.tenantId;
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) throw ApiError.unauthorized('Access token expired');
    if (err instanceof JsonWebTokenError) throw ApiError.unauthorized('Invalid access token');
    throw err;
  }
}
