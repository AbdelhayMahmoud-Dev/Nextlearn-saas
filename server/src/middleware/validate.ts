import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { ApiError } from '../utils/ApiError';
import { formatZodError } from '../utils/zodError';

/**
 * Validates `{ body, query, params }` against a Zod object schema. On success,
 * the (coerced) body is written back to `req.body`. On failure, responds 400
 * with a field-keyed error map.
 */
export const validate =
  (schema: AnyZodObject) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      next(ApiError.badRequest('Validation failed', formatZodError(result.error)));
      return;
    }

    const data = result.data as { body?: unknown };
    if (data.body !== undefined) req.body = data.body;
    next();
  };
