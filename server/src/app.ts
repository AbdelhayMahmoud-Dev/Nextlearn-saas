import { createServer, type Server as HttpServer } from 'http';
import express, { Express } from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { initSocket } from './config/socket';
import { applyEarlySecurity, applyInputSanitizers } from './middleware/security';
import { requestLogger } from './middleware/requestLogger';
import { globalLimiter } from './middleware/rateLimiter';
import { notFound, errorHandler } from './middleware/errorHandler';
import v1Routes from './routes/v1';
import { WebhookController } from './controllers/webhook.controller';

/**
 * Builds the Express application with the full middleware stack wired in the
 * correct order: logging → headers/CORS → body parsing → cookies → input
 * sanitization → rate limiting → routes → 404 → centralized error handler.
 *
 * Order matters: input sanitizers run AFTER body parsing so they can actually
 * see `req.body`.
 */
export function createApp(): Express {
  const app = express();

  // Behind a proxy/load balancer (Railway/Render/Vercel) — trust the first hop
  // so client IPs (rate limiting) and `secure` cookies work correctly.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(requestLogger);
  // gzip/deflate JSON + text responses (skips already-compressed assets).
  app.use(compression());
  applyEarlySecurity(app); // helmet + CORS (no body needed)

  // Stripe webhook MUST receive the raw body for signature verification, so it
  // is mounted BEFORE the global JSON body parser (and before input sanitizers).
  app.post(
    '/api/v1/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    WebhookController.handleStripe,
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  applyInputSanitizers(app); // mongo-sanitize + hpp + xss (need parsed body)
  app.use(globalLimiter);

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'NextLearn API',
      data: { version: 'v1', health: '/api/v1/health' },
    });
  });

  app.use('/api/v1', v1Routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

/**
 * Wraps the Express app in a Node HTTP server and attaches Socket.io to it.
 * The HTTP server (not the bare Express app) must be what listens, so WebSocket
 * upgrade requests reach Socket.io. Called by the bootstrap in server.ts.
 */
export function createHttpServer(app: Express): HttpServer {
  const httpServer = createServer(app);
  initSocket(httpServer);
  return httpServer;
}
