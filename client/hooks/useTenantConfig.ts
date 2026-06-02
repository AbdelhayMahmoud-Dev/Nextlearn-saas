'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useTenantStore } from '@/store/tenantStore';
import type { ApiResponse, TenantConfig } from '@/types';

/**
 * Fetches the public tenant config once and mirrors it into the tenant store.
 * Respects the server's `Cache-Control: max-age=60`. Failures degrade silently
 * (default branding stays in effect) so a config outage never breaks the app.
 */
export function useTenantConfig(): void {
  const setConfig = useTenantStore((s) => s.setConfig);

  const { data } = useQuery({
    queryKey: ['tenant-config'],
    queryFn: async (): Promise<TenantConfig | null> => {
      try {
        return (await apiClient.get<ApiResponse<TenantConfig>>('/tenant/config')).data.data;
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (data) setConfig(data);
  }, [data, setConfig]);
}
