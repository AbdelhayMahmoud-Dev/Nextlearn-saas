'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TenantSettings } from '@/hooks/useAdminSettings';

interface Props {
  form: TenantSettings;
  onChange: <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => void;
  onSave: () => void;
  saving: boolean;
}

/** Security settings form. */
export function SecuritySettingsForm({ form, onChange, onSave, saving }: Props): JSX.Element {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <label className="flex items-start justify-between gap-4 rounded-lg border p-3">
        <span className="text-sm font-medium">Require email verification</span>
        <input type="checkbox" checked={form.requireEmailVerification} onChange={(e) => onChange('requireEmailVerification', e.target.checked)} className="mt-1 size-4" />
      </label>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-3 opacity-60">
        <span className="text-sm font-medium">Two-factor auth for admins</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Coming soon</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Session timeout</label>
          <select value={form.sessionTimeout} onChange={(e) => onChange('sessionTimeout', e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="1h">1 hour</option>
            <option value="8h">8 hours</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Password min length</label>
          <Input type="number" min={8} max={32} value={form.passwordMinLength} onChange={(e) => onChange('passwordMinLength', Number(e.target.value))} className="mt-1" />
        </div>
      </div>

      <Button variant="brand" onClick={onSave} disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />} Save settings
      </Button>
    </div>
  );
}
