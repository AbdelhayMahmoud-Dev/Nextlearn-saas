'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateTenant, type CreateTenantInput } from '@/hooks/useSuperAdminTenants';
import type { TenantPlan } from '@/types';

const slugify = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30);

/** SuperAdmin: create a new tenant. */
export default function CreateTenantPage(): JSX.Element {
  const router = useRouter();
  const create = useCreateTenant();
  const [form, setForm] = useState<CreateTenantInput>({
    name: '', slug: '', adminName: '', adminEmail: '', plan: 'free',
  });
  const [slugEdited, setSlugEdited] = useState(false);

  const set = <K extends keyof CreateTenantInput>(k: K, v: CreateTenantInput[K]): void =>
    setForm((f) => ({ ...f, [k]: v }));

  const onName = (v: string): void =>
    setForm((f) => ({ ...f, name: v, slug: slugEdited ? f.slug : slugify(v) }));

  const submit = (): void => {
    create.mutate(
      { ...form, planExpiresAt: form.planExpiresAt || undefined },
      {
        onSuccess: (res) => {
          toast.success('Tenant created — credentials sent by email');
          router.push(`/superadmin/tenants/${res.tenant._id}`);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const valid = form.name.trim() && /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(form.slug) && form.adminName.trim() && /.+@.+/.test(form.adminEmail);

  return (
    <div className="max-w-xl space-y-6">
      <Link href="/superadmin/tenants" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to tenants
      </Link>
      <h1 className="font-heading text-2xl font-bold">Create tenant</h1>

      <div className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <label className="text-sm font-medium">Organization name</label>
          <Input value={form.name} onChange={(e) => onName(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Subdomain</label>
          <div className="mt-1 flex items-center gap-2">
            <Input value={form.slug} onChange={(e) => { setSlugEdited(true); set('slug', slugify(e.target.value)); }} className="font-mono" />
            <span className="whitespace-nowrap text-sm text-muted-foreground">.nextlearn.com</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Admin name</label>
            <Input value={form.adminName} onChange={(e) => set('adminName', e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Admin email</label>
            <Input type="email" value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Plan</label>
            <select value={form.plan} onChange={(e) => set('plan', e.target.value as TenantPlan)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Plan expires (optional)</label>
            <Input type="date" value={form.planExpiresAt?.slice(0, 10) ?? ''} onChange={(e) => set('planExpiresAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)} className="mt-1" />
          </div>
        </div>
        <Button variant="brand" onClick={submit} disabled={!valid || create.isPending}>
          {create.isPending && <Loader2 className="size-4 animate-spin" />} Create tenant
        </Button>
      </div>
    </div>
  );
}
