'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';

const SocketCtx = createContext<Socket | null>(null);

/**
 * Manages the Socket.io connection for the authenticated user: connects on
 * login (joins the user + tenant rooms), disconnects on logout. Incoming
 * `notification` / `live_session_started` events invalidate the relevant
 * queries so the UI (bell badge, live-session lists) updates in real time.
 */
export function SocketProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const userId = useAuthStore((s) => s.user?.id);
  const tenantId = useTenantStore((s) => s.tenantId);
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [, setReady] = useState(0);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!url || !userId || !tenantId) return;

    const socket = io(url, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
    });

    socket.on('connect', () => {
      socket.emit('join', { userId, tenantId });
    });
    socket.on('notification', () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    });
    socket.on('live_session_started', () => {
      // live-session lists flip from "upcoming" to "live now"; the matching
      // notification event (above) refreshes the bell.
      void qc.invalidateQueries({ queryKey: ['live-sessions'] });
    });

    socketRef.current = socket;
    setReady((n) => n + 1); // expose the connected socket via context

    return () => {
      socket.emit('leave', { userId, tenantId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, tenantId, qc]);

  return <SocketCtx.Provider value={socketRef.current}>{children}</SocketCtx.Provider>;
}

/** Returns the Socket.io instance (null before authentication). */
export function useSocket(): Socket | null {
  return useContext(SocketCtx);
}
