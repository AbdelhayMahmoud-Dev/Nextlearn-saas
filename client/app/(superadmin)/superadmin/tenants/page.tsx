'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { TenantTable } from '@/components/superadmin/TenantTable';
import {
  useDeleteTenant,
  useSuperAdminTenants,
  useToggleTenantStatus,
  type TenantRow,
} from '@/hooks/useSuperAdminTenants';

/** SuperAdmin tenants list. */
export default function SuperAdminTenantsPage(): JSX.Element {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useSuperAdminTenants({ page, search: debounced || undefined, plan: plan || undefined });
  const toggle = useToggleTenantStatus();
  const del = useDeleteTenant();

  const onToggle = (id: string, isActive: boolean): void =>
    toggle.mutate({ id, isActive }, { onError: (e) => toast.error(e.message) });

  const onDelete = (tenant: TenantRow): void => {
    const confirmSlug = window.prompt(`Type the slug "${tenant.slug}" to permanently delete this tenant and ALL its data:`);
    if (confirmSlug !== tenant.slug) {
      if (confirmSlug !== null) toast.error('Slug did not match — deletion cancelled');
      return;
    }
    del.mutate({ id: tenant._id, confirmSlug }, { onSuccess: () => toast.success('Tenant deleted'), onError: (e) => toast.error(e.message) });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Tenants {data ? `(${data.meta.total})` : ''}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name/slug" className="w-52 pl-8" />
          </div>
          <select value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }} aria-label="Filter by plan" className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="">All plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <Button asChild variant="brand" size="sm">
            <Link href="/superadmin/tenants/create"><Plus className="size-4" /> Create</Link>
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-primary" /></div>
      ) : (
        <>
          <TenantTable rows={data.items} onToggleStatus={onToggle} onDelete={onDelete} />
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={!data.meta.hasPrev} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={!data.meta.hasNext} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </>
      )}
    </div>
  );
}
