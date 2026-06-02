'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BrandingForm } from '@/components/admin/BrandingForm';
import { BrandPreview } from '@/components/admin/BrandPreview';
import { useAdminBranding, useUpdateBranding, type BrandingInput } from '@/hooks/useAdminBranding';

const DEFAULTS: BrandingInput = {
  platformName: 'NextLearn',
  logo: '',
  primaryColor: '#6366f1',
  accentColor: '#8b5cf6',
  supportEmail: '',
  defaultLanguage: 'en',
};

/** Branding settings with a live preview. */
export default function AdminBrandingPage(): JSX.Element {
  const { data, isLoading } = useAdminBranding();
  const update = useUpdateBranding();
  const [form, setForm] = useState<BrandingInput>(DEFAULTS);

  useEffect(() => {
    if (data) {
      setForm((f) => ({
        ...f,
        platformName: data.name ?? f.platformName,
        logo: data.logo ?? '',
        primaryColor: data.primaryColor ?? f.primaryColor,
        accentColor: data.accentColor ?? f.accentColor,
      }));
    }
  }, [data]);

  const onChange = <K extends keyof BrandingInput>(key: K, value: BrandingInput[K]): void =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSave = (): void => {
    update.mutate(
      { ...form, logo: form.logo || undefined },
      { onSuccess: () => toast.success('Branding updated'), onError: (e) => toast.error(e.message) },
    );
  };

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Branding</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <BrandingForm form={form} onChange={onChange} onSave={onSave} saving={update.isPending} />
        <BrandPreview
          platformName={form.platformName ?? 'NextLearn'}
          primaryColor={form.primaryColor ?? '#6366f1'}
          accentColor={form.accentColor ?? '#8b5cf6'}
          logo={form.logo || undefined}
        />
      </div>
    </div>
  );
}
