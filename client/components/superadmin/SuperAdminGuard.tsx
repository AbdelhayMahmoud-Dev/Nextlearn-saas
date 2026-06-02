'use client';

import { ShieldX } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

/**
 * In-page SuperAdmin role guard (defense-in-depth alongside middleware).
 * Renders children while the role is still unknown to avoid a flash.
 */
export function SuperAdminGuard({ children }: { children: React.ReactNode }): JSX.Element {
  const role = useAuthStore((s) => s.user?.role);
  if (role && role !== 'superadmin') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm rounded-xl border bg-card p-8 text-center">
          <ShieldX className="mx-auto size-10 text-destructive" />
          <h2 className="mt-4 font-heading text-xl font-bold">Access denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is restricted to platform super-administrators.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
