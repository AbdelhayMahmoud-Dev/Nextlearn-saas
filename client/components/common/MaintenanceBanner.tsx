'use client';

import { Settings } from 'lucide-react';
import { useTenantStore } from '@/store/tenantStore';
import { useAuthStore } from '@/store/authStore';

/**
 * Maintenance-mode guard for the student-facing area.
 * - maintenance + student/instructor (or logged-out): full-screen maintenance page.
 * - maintenance + admin/superadmin: a warning banner above normal content.
 * - otherwise: renders children unchanged.
 */
export function MaintenanceBanner({ children }: { children: React.ReactNode }): JSX.Element {
  const config = useTenantStore((s) => s.config);
  const role = useAuthStore((s) => s.user?.role);
  const isPrivileged = role === 'admin' || role === 'superadmin';

  if (!config?.maintenanceMode) return <>{children}</>;

  if (isPrivileged) {
    return (
      <>
        <div className="bg-amber-500/15 px-4 py-2 text-center text-sm font-medium text-amber-600 dark:text-amber-400">
          ⚠️ Maintenance mode is ON — students cannot access the platform. You see it because you&apos;re an admin.
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Settings className="size-8" />
      </span>
      <h1 className="font-heading text-2xl font-bold">
        {config.platformName || 'This platform'} is undergoing maintenance
      </h1>
      <p className="max-w-md text-muted-foreground">
        We&apos;ll be back soon. Thank you for your patience.
      </p>
    </div>
  );
}
