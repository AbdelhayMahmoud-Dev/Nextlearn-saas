import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express handler so rejected promises are forwarded to the
 * centralized error handler — removes try/catch boilerplate from controllers.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
