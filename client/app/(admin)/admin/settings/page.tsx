'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { GeneralSettingsForm } from '@/components/admin/GeneralSettingsForm';
import { SecuritySettingsForm } from '@/components/admin/SecuritySettingsForm';
import { useAdminSettings, useUpdateSettings, type TenantSettings } from '@/hooks/useAdminSettings';

/** Platform settings (general + security tabs). */
export default function AdminSettingsPage(): JSX.Element {
  const { data, isLoading } = useAdminSettings();
  const update = useUpdateSettings();
  const [tab, setTab] = useState<'general' | 'security'>('general');
  const [form, setForm] = useState<TenantSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const onChange = <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]): void =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const onSave = (): void => {
    if (!form) return;
    update.mutate(form, { onSuccess: () => toast.success('Settings saved'), onError: (e) => toast.error(e.message) });
  };

  if (isLoading || !form) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold">Settings</h1>
      <div className="inline-flex rounded-lg border bg-card p-1">
        {(['general', 'security'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn('rounded-md px-4 py-1.5 text-sm font-medium capitalize', tab === t ? 'bg-brand-primary text-brand-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>{t}</button>
        ))}
      </div>
      {tab === 'general' ? (
        <GeneralSettingsForm form={form} onChange={onChange} onSave={onSave} saving={update.isPending} />
      ) : (
        <SecuritySettingsForm form={form} onChange={onChange} onSave={onSave} saving={update.isPending} />
      )}
    </div>
  );
}
