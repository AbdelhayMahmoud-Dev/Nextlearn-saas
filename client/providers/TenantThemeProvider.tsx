'use client';

import { useEffect } from 'react';
import { useTenantStore } from '@/store/tenantStore';
import { useTenantConfig } from '@/hooks/useTenantConfig';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

/**
 * Applies the active tenant's branding as CSS custom properties on :root at
 * runtime. Fetches the config (via useTenantConfig) and re-applies whenever the
 * branding changes. Falls back to the default theme when no config is loaded.
 */
export function TenantThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {
  useTenantConfig();
  const branding = useTenantStore((s) => s.config?.branding);

  useEffect(() => {
    if (!branding) return;
    const root = document.documentElement;
    if (branding.primaryColor) {
      root.style.setProperty('--brand-primary', branding.primaryColor);
      const rgb = hexToRgb(branding.primaryColor);
      if (rgb) root.style.setProperty('--brand-primary-rgb', `${rgb.r} ${rgb.g} ${rgb.b}`);
    }
    if (branding.accentColor) root.style.setProperty('--brand-accent', branding.accentColor);
    if (branding.logo) root.style.setProperty('--brand-logo', `url('${branding.logo}')`);
  }, [branding]);

  return <>{children}</>;
}
