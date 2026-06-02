import { Response } from 'express';

type Meta = Record<string, unknown>;

/**
 * Helpers that emit the project's canonical success envelope:
 * `{ success, message, data?, meta? }`. Error responses are produced by
 * `errorHandler` so the shape stays consistent across the whole API.
 */
export const ApiResponse = {
  success<T>(res: Response, data: T, message = 'Success', statusCode = 200, meta?: Meta): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(meta ? { meta } : {}),
    });
  },

  created<T>(res: Response, data: T, message = 'Created'): Response {
    return ApiResponse.success(res, data, message, 201);
  },

  noContent(res: Response): Response {
    return res.status(204).send();
  },
};
