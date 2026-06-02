import {
  BadgePercent,
  Banknote,
  BarChart3,
  BookOpen,
  CreditCard,
  Globe,
  LayoutDashboard,
  Palette,
  Settings,
  Share2,
  Shield,
  Users,
} from 'lucide-react';
import { RoleAreaShell } from '@/components/common/RoleAreaShell';
import { AdminGuard } from '@/components/admin/AdminGuard';

// Admin pages are authenticated + data-driven (per-request session, live KPIs):
// render them dynamically rather than statically prerendering at build time.
export const dynamic = 'force-dynamic';

const ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Coupons', href: '/admin/coupons', icon: BadgePercent },
  { label: 'Branding', href: '/admin/branding', icon: Palette },
  { label: 'White-Label', href: '/admin/white-label', icon: Globe },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Affiliates', href: '/admin/affiliates', icon: Share2 },
  { label: 'Security', href: '/admin/security', icon: Shield },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Payouts', href: '/admin/settings/stripe', icon: Banknote },
];

/** Admin area layout (role-protected by middleware). */
export default function AdminLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <RoleAreaShell title="Admin" items={ITEMS}>
      <AdminGuard>{children}</AdminGuard>
    </RoleAreaShell>
  );
}
