import { create } from 'zustand';
import type { ITenantBranding, TenantConfig } from '@/types';

interface TenantState {
  tenantId: string | null;
  branding: ITenantBranding | null;
  /** Public tenant config (branding, features, maintenance) from /tenant/config. */
  config: TenantConfig | null;
  setTenant: (tenantId: string | null, branding?: ITenantBranding | null) => void;
  setConfig: (config: TenantConfig) => void;
}

/**
 * Holds the active tenant id (sent as `x-tenant-id` on every API request), its
 * branding, and the public white-label config. Hydrated from the session and
 * from GET /tenant/config; the id is mirrored here so the axios interceptor can
 * attach it synchronously.
 */
export const useTenantStore = create<TenantState>((set) => ({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID ?? null,
  branding: null,
  config: null,
  setTenant: (tenantId, branding = null) => set({ tenantId, branding }),
  setConfig: (config) => set({ config, branding: config.branding }),
}));
