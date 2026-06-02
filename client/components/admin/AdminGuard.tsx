'use client';

import { ShieldX } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

/**
 * In-page admin role guard. Middleware already blocks non-admins at the edge;
 * this shows a friendly "Access denied" card as defense-in-depth. While the role
 * is still unknown (auth hydrating) it renders children to avoid a flash.
 */
export function AdminGuard({ children }: { children: React.ReactNode }): JSX.Element {
  const role = useAuthStore((s) => s.user?.role);

  if (role && role !== 'admin' && role !== 'superadmin') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-sm rounded-xl border bg-card p-8 text-center">
          <ShieldX className="mx-auto size-10 text-destructive" />
          <h2 className="mt-4 font-heading text-xl font-bold">Access denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You need administrator privileges to view this area.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
