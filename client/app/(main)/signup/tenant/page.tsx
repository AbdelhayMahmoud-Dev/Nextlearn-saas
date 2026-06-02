'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ApiErrorShape, ApiResponse } from '@/types';

const slugify = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30);

interface SignupForm {
  orgName: string;
  slug: string;
  adminName: string;
  adminEmail: string;
}

/** Public self-onboarding: spin up a new white-label platform. */
export default function TenantSignupPage(): JSX.Element {
  const [form, setForm] = useState<SignupForm>({ orgName: '', slug: '', adminName: '', adminEmail: '' });
  const [slugEdited, setSlugEdited] = useState(false);

  const signup = useMutation<string, ApiErrorShape, SignupForm>({
    mutationFn: async (body): Promise<string> => {
      const res = await apiClient.post<ApiResponse<{ tenantSlug: string }>>('/tenant/signup', {
        orgName: body.orgName,
        slug: body.slug,
        adminName: body.adminName,
        adminEmail: body.adminEmail,
      });
      return res.data.data.tenantSlug;
    },
  });

  const set = <K extends keyof SignupForm>(k: K, v: SignupForm[K]): void => setForm((f) => ({ ...f, [k]: v }));
  const onName = (v: string): void => setForm((f) => ({ ...f, orgName: v, slug: slugEdited ? f.slug : slugify(v) }));
  const valid =
    form.orgName.trim().length >= 3 &&
    /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(form.slug) &&
    form.adminName.trim() &&
    /.+@.+\..+/.test(form.adminEmail);

  if (signup.isSuccess) {
    return (
      <div className="container flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 py-12 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-green-500/15 text-green-500"><CheckCircle2 className="size-9" /></span>
        <h1 className="font-heading text-2xl font-bold">Check your email for login details 🎉</h1>
        <p className="text-muted-foreground">
          Your platform <span className="font-mono">{signup.data}.nextlearn.com</span> is being set up. We&apos;ve sent the admin credentials to <strong>{form.adminEmail}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-12">
      <h1 className="font-heading text-3xl font-bold">Launch your own platform</h1>
      <p className="mt-2 text-muted-foreground">Create a free white-label learning platform in seconds.</p>

      <div className="mt-8 space-y-4 rounded-xl border bg-card p-6">
        <div>
          <label className="text-sm font-medium">Organization name</label>
          <Input value={form.orgName} onChange={(e) => onName(e.target.value)} placeholder="Acme Academy" className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Subdomain</label>
          <div className="mt-1 flex items-center gap-2">
            <Input value={form.slug} onChange={(e) => { setSlugEdited(true); set('slug', slugify(e.target.value)); }} className="font-mono" placeholder="acme" />
            <span className="whitespace-nowrap text-sm text-muted-foreground">.nextlearn.com</span>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Your name</label>
          <Input value={form.adminName} onChange={(e) => set('adminName', e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Admin email</label>
          <Input type="email" value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Plan</label>
          <Input value="Free" disabled className="mt-1" />
          <p className="mt-1 text-xs text-muted-foreground">Paid plans are provisioned by our team after signup.</p>
        </div>

        {signup.isError && (
          <p className="text-sm text-red-500">
            {signup.error.statusCode === 409 ? 'This subdomain is taken — try another.' : signup.error.message}
          </p>
        )}

        <Button variant="brand" className="w-full" onClick={() => signup.mutate(form)} disabled={!valid || signup.isPending}>
          {signup.isPending && <Loader2 className="size-4 animate-spin" />} Create platform →
        </Button>
      </div>
    </div>
  );
}
