import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Error as MongooseError } from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { formatZodError } from '../utils/zodError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/** Catch-all for unmatched routes — forwards a 404 to the error handler. */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

function isMongoDuplicateError(err: unknown): err is { code: number; keyValue?: Record<string, unknown> } {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

/**
 * Centralized error handler. Translates known error types (ApiError, Zod,
 * Mongoose validation/cast, Mongo duplicate key) into the canonical
 * `{ success:false, message, error? }` envelope with the right status code.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction, // 4-arg signature required for Express to treat this as an error handler
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;
  let isOperational = false;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
    isOperational = err.isOperational;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = formatZodError(err);
    isOperational = true;
  } else if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message]),
    );
    isOperational = true;
  } else if (err instanceof MongooseError.CastError) {
    statusCode = 400;
    message = `Invalid value for "${err.path}"`;
    isOperational = true;
  } else if (isMongoDuplicateError(err)) {
    statusCode = 409;
    message = 'A record with that value already exists';
    details = err.keyValue;
    isOperational = true;
  }

  // Never leak internal error details for unexpected (non-operational) failures
  // in production. They are still fully logged below and surfaced in dev.
  if (!isOperational) {
    message = env.isProd ? 'Internal server error' : err instanceof Error ? err.message : message;
  }

  const logPayload = { err, statusCode, method: req.method, path: req.originalUrl };
  if (statusCode >= 500) logger.error(logPayload, 'Unhandled request error');
  else logger.warn(logPayload, 'Request error');

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { error: details } : {}),
    ...(env.isProd ? {} : { stack: err instanceof Error ? err.stack : undefined }),
  });
}
