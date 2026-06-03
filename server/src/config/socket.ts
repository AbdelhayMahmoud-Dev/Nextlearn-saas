import type { Server as HttpServer } from 'http';
import { Server as SocketServer, type Socket } from 'socket.io';
import { env } from './env';
import { logger } from '../utils/logger';

let io: SocketServer | null = null;

/**
 * Initialises Socket.io on the given HTTP server. Call once at startup
 * (from server.ts, after the HTTP server is created).
 */
export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: env.CLIENT_URL, methods: ['GET', 'POST'], credentials: true },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    logger.debug({ socketId: socket.id }, 'Socket connected');

    // After auth the client joins its user room (targeted notifications) and its
    // tenant room (broadcast events like live-session start).
    socket.on('join', ({ userId, tenantId }: { userId: string; tenantId: string }) => {
      void socket.join(`user:${userId}`);
      void socket.join(`tenant:${tenantId}`);
      logger.debug({ userId, tenantId }, 'Socket joined rooms');
    });

    socket.on('leave', ({ userId, tenantId }: { userId: string; tenantId: string }) => {
      void socket.leave(`user:${userId}`);
      void socket.leave(`tenant:${tenantId}`);
    });

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Socket disconnected');
    });
  });

  logger.info('Socket.io initialised');
  return io;
}

/** Returns the Socket.io server instance. Throws if not yet initialised. */
export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialised — call initSocket() first');
  return io;
}

/**
 * Closes Socket.io during graceful shutdown: forcibly disconnects every client
 * and closes the engine plus the underlying HTTP server. Resolves once the HTTP
 * server has fully stopped accepting connections.
 *
 * This is critical for clean shutdown — without it, persistent WebSocket
 * connections keep `http.Server.close()` from ever completing, the process is
 * force-killed after the timeout, and the dying instance can still hold the
 * port while a redeploy boots → `EADDRINUSE`.
 */
export function closeSocket(): Promise<void> {
  return new Promise((resolve) => {
    if (!io) {
      resolve();
      return;
    }
    io.disconnectSockets(true); // drop all clients immediately
    io.close(() => {
      io = null;
      resolve();
    });
  });
}

/**
 * Emits an event to a specific user's room. Fire-and-forget: degrades silently
 * if Socket.io is not initialised (e.g. seed scripts).
 */
export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/** Emits an event to every socket in a tenant's room. Fire-and-forget. */
export function emitToTenant(tenantId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`tenant:${tenantId}`).emit(event, data);
}
