'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, PaginatedResponse, PaginationMeta } from '@/types';

/* ───────────────────────── Shared shapes ───────────────────────── */

export type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_changed'
  | 'password_reset'
  | 'session_revoked'
  | 'token_reuse'
  | 'suspicious_activity';

/** A device session, as returned by the server (never includes the token hash). */
export interface DeviceSession {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
}

export interface SecurityEventRecord {
  _id: string;
  userId?: string;
  email?: string;
  type: SecurityEventType;
  ip?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogRecord {
  _id: string;
  actorId: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  actor: { _id: string; name: string; email: string } | null;
}

const SESSIONS_KEY = ['device-sessions'] as const;

/* ───────────────────────── Current user: sessions ───────────────────────── */

/** Lists the current user's device sessions (the current device is flagged). */
export function useDeviceSessions() {
  return useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: async (): Promise<DeviceSession[]> =>
      (await apiClient.get<ApiResponse<DeviceSession[]>>('/auth/sessions')).data.data,
  });
}

/** Revokes a single device session by id. */
export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation<void, ApiErrorShape, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/auth/sessions/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}

/** Revokes every other session, keeping the current device signed in. */
export function useRevokeOtherSessions() {
  const qc = useQueryClient();
  return useMutation<void, ApiErrorShape, void>({
    mutationFn: async () => {
      await apiClient.post('/auth/sessions/revoke-all', {});
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}

/* ───────────────────────── Current user: login history ───────────────────────── */

export function useLoginHistory(page: number) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  return useQuery({
    queryKey: ['login-history', page],
    queryFn: async (): Promise<{ items: SecurityEventRecord[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<SecurityEventRecord>>(
        `/auth/login-history?${params.toString()}`,
      );
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

/* ───────────────────────── Admin: audit logs + security events ───────────────────────── */

export function useAuditLogs(filters: { page: number; action?: string }) {
  const params = new URLSearchParams({ page: String(filters.page), limit: '25' });
  if (filters.action) params.set('action', filters.action);
  return useQuery({
    queryKey: ['admin-audit-logs', filters],
    queryFn: async (): Promise<{ items: AuditLogRecord[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<AuditLogRecord>>(
        `/admin/security/audit-logs?${params.toString()}`,
      );
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useSecurityEvents(filters: { page: number; type?: string }) {
  const params = new URLSearchParams({ page: String(filters.page), limit: '25' });
  if (filters.type) params.set('type', filters.type);
  return useQuery({
    queryKey: ['admin-security-events', filters],
    queryFn: async (): Promise<{ items: SecurityEventRecord[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<SecurityEventRecord>>(
        `/admin/security/events?${params.toString()}`,
      );
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}
