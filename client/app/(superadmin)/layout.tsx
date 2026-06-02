import { Activity, BarChart3, Building2, PlusCircle, Settings } from 'lucide-react';
import { RoleAreaShell } from '@/components/common/RoleAreaShell';
import { SuperAdminGuard } from '@/components/superadmin/SuperAdminGuard';

// Authenticated + data-driven → render per-request (never statically prerender).
export const dynamic = 'force-dynamic';

const ITEMS = [
  { label: 'Tenants', href: '/superadmin/tenants', icon: Building2 },
  { label: 'Global Analytics', href: '/superadmin/analytics', icon: BarChart3 },
  { label: 'Operations', href: '/superadmin/ops', icon: Activity },
  { label: 'Create Tenant', href: '/superadmin/tenants/create', icon: PlusCircle },
  { label: 'Settings', href: '/superadmin/settings', icon: Settings },
];

/** SuperAdmin (cross-tenant) area layout. */
export default function SuperAdminLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <RoleAreaShell title="SuperAdmin" items={ITEMS}>
      <SuperAdminGuard>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-500">
          SuperAdmin · cross-tenant control
        </div>
        {children}
      </SuperAdminGuard>
    </RoleAreaShell>
  );
}
