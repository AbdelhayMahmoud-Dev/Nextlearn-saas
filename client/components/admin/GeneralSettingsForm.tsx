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

function Toggle({ label, help, checked, onChange }: { label: string; help?: string; checked: boolean; onChange: (v: boolean) => void }): JSX.Element {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <span>
        <span className="text-sm font-medium">{label}</span>
        {help && <span className="block text-xs text-muted-foreground">{help}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4" />
    </label>
  );
}

/** General platform settings form. */
export function GeneralSettingsForm({ form, onChange, onSave, saving }: Props): JSX.Element {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Platform name</label>
          <Input value={form.platformName} onChange={(e) => onChange('platformName', e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Support email</label>
          <Input type="email" value={form.supportEmail} onChange={(e) => onChange('supportEmail', e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Default language</label>
          <select value={form.defaultLanguage} onChange={(e) => onChange('defaultLanguage', e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="en">English</option>
            <option value="ar">Arabic</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Timezone</label>
          <Input value={form.timezone} onChange={(e) => onChange('timezone', e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Commission rate (%)</label>
          <Input type="number" value={form.commissionRate} onChange={(e) => onChange('commissionRate', Number(e.target.value))} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Max courses / instructor</label>
          <Input type="number" value={form.maxCoursesPerInstructor} onChange={(e) => onChange('maxCoursesPerInstructor', Number(e.target.value))} className="mt-1" />
        </div>
      </div>
      <Toggle label="Maintenance mode" help="Shows a banner to students and blocks new enrollments." checked={form.maintenanceMode} onChange={(v) => onChange('maintenanceMode', v)} />
      <Toggle label="Allow registrations" help="When off, the register page is disabled." checked={form.allowRegistrations} onChange={(v) => onChange('allowRegistrations', v)} />
      <Button variant="brand" onClick={onSave} disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />} Save settings
      </Button>
    </div>
  );
}
