import pino from 'pino';
import { env } from '../config/env';

/**
 * Application-wide structured logger (pino).
 *
 * - Pretty-prints in development, JSON in production.
 * - Redacts sensitive fields so passwords/tokens/cookies never hit the logs.
 */
export const logger = pino({
  level: env.isProd ? 'info' : 'debug',
  ...(env.isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.refreshToken',
      '*.refreshTokens',
      '*.accessToken',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
});
