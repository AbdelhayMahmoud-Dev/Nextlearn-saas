import { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';
import pinoHttp from 'pino-http';
import { logger } from '../utils/logger';

type RequestContext = IncomingMessage & {
  tenantId?: string;
  user?: { id?: string };
};

/**
 * HTTP request/response logger (pino-http). Assigns/propagates an `x-request-id`
 * and tags each log line with the resolved tenant and user when available.
 */
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const incoming = req.headers['x-request-id'];
    const id = (Array.isArray(incoming) ? incoming[0] : incoming) ?? randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customProps: (req) => {
    const ctx = req as RequestContext;
    return { tenantId: ctx.tenantId, userId: ctx.user?.id };
  },
});
