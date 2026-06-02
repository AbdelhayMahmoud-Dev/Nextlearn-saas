'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export type ComponentStatus = 'ok' | 'degraded' | 'down' | 'disabled';

export interface ComponentHealth {
  status: ComponentStatus;
  detail: string;
}

export interface JobStatus {
  name: string;
  schedule: string;
  description: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  lastRunAt: string | null;
  lastDurationMs: number | null;
  lastError: string | null;
  runCount: number;
  failureCount: number;
}

export interface OpsStatus {
  overall: ComponentStatus;
  generatedAt: string;
  server: {
    uptimeSeconds: number;
    nodeVersion: string;
    environment: string;
    memory: { rssMb: number; heapUsedMb: number; heapTotalMb: number };
  };
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    email: ComponentHealth;
    stripe: ComponentHealth;
    ai: ComponentHealth;
  };
  jobs: JobStatus[];
}

/** Polls the operational status every 15s. */
export function useOpsStatus() {
  return useQuery({
    queryKey: ['ops-status'],
    queryFn: async (): Promise<OpsStatus> =>
      (await apiClient.get<ApiResponse<OpsStatus>>('/superadmin/ops')).data.data,
    refetchInterval: 15000,
  });
}
