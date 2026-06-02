'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BrandingInput } from '@/hooks/useAdminBranding';

interface Props {
  form: BrandingInput;
  onChange: <K extends keyof BrandingInput>(key: K, value: BrandingInput[K]) => void;
  onSave: () => void;
  saving: boolean;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }): JSX.Element {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="size-9 cursor-pointer rounded border bg-transparent" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="w-32 font-mono" />
      </div>
    </div>
  );
}

/** Branding settings form (platform name, logo, colors, support email). */
export function BrandingForm({ form, onChange, onSave, saving }: Props): JSX.Element {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <div>
        <label className="text-sm font-medium">Platform name</label>
        <Input value={form.platformName ?? ''} onChange={(e) => onChange('platformName', e.target.value)} className="mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium">Logo URL</label>
        <Input value={form.logo ?? ''} onChange={(e) => onChange('logo', e.target.value)} placeholder="https://…" className="mt-1" />
      </div>
      <ColorField label="Primary color" value={form.primaryColor ?? '#6366f1'} onChange={(v) => onChange('primaryColor', v)} />
      <ColorField label="Accent color" value={form.accentColor ?? '#8b5cf6'} onChange={(v) => onChange('accentColor', v)} />
      <div>
        <label className="text-sm font-medium">Support email</label>
        <Input type="email" value={form.supportEmail ?? ''} onChange={(e) => onChange('supportEmail', e.target.value)} className="mt-1" />
      </div>
      <Button variant="brand" onClick={onSave} disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />} Save changes
      </Button>
    </div>
  );
}
