'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, Globe, Loader2, Mail, Palette, ToggleLeft } from 'lucide-react';
import {
  useApplyPreset,
  useDomainInfo,
  useEmailTemplates,
  useFeatureFlags,
  usePresets,
  usePreviewEmailTemplate,
  useRemoveDomain,
  useResetEmailTemplate,
  useSetDomain,
  useSetFeatureFlags,
  useUpsertEmailTemplate,
  useVerifyDomain,
  type EmailTemplate,
  type FeatureFlags,
} from '@/hooks/useWhiteLabel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FLAG_LABELS: Record<keyof FeatureFlags, string> = {
  liveSessions: 'Live sessions',
  certificates: 'Certificates',
  coupons: 'Coupons',
  customDomain: 'Custom domain',
  affiliates: 'Affiliate program',
  marketplace: 'Marketplace',
  aiAssistant: 'AI assistant',
};

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

function EmailTemplateEditor({ template }: { template: EmailTemplate }): JSX.Element {
  const upsert = useUpsertEmailTemplate();
  const reset = useResetEmailTemplate();
  const preview = usePreviewEmailTemplate();
  const [subject, setSubject] = useState(template.subject);
  const [heading, setHeading] = useState(template.heading);
  const [body, setBody] = useState(template.body);
  const [enabled, setEnabled] = useState(template.enabled);

  useEffect(() => {
    setSubject(template.subject);
    setHeading(template.heading);
    setBody(template.body);
    setEnabled(template.enabled);
  }, [template]);

  const save = (): void => {
    upsert.mutate(
      { key: template.key, subject, heading, body, enabled },
      {
        onSuccess: () => toast.success('Template saved'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const onReset = (): void => {
    reset.mutate(template.key, {
      onSuccess: () => toast.success('Reverted to default'),
      onError: (e) => toast.error(e.message),
    });
  };

  const onPreview = (): void => {
    preview.mutate({ subject, heading, body });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        Variables:
        {template.variables.map((v) => (
          <code key={v} className="rounded bg-muted px-1.5 py-0.5">{`{{${v}}}`}</code>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Use this custom template (otherwise the platform default is sent)
      </label>
      <div>
        <label className="text-sm font-medium" htmlFor="tpl-subject">
          Subject
        </label>
        <input
          id="tpl-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="tpl-heading">
          Heading
        </label>
        <input
          id="tpl-heading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="tpl-body">
          Body
        </label>
        <textarea
          id="tpl-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="mt-1 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="brand" onClick={save} disabled={upsert.isPending}>
          {upsert.isPending && <Loader2 className="size-4 animate-spin" />} Save
        </Button>
        <Button variant="outline" onClick={onPreview} disabled={preview.isPending}>
          Preview
        </Button>
        {template.isCustom && (
          <Button variant="ghost" onClick={onReset} disabled={reset.isPending}>
            Reset to default
          </Button>
        )}
      </div>
      {preview.data && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="font-semibold">{preview.data.subject}</p>
          <p className="mt-2 font-heading text-base font-bold">{preview.data.heading}</p>
          <p className="mt-1 text-muted-foreground">{preview.data.body}</p>
        </div>
      )}
    </div>
  );
}

export default function WhiteLabelPage(): JSX.Element {
  const presets = usePresets();
  const applyPreset = useApplyPreset();
  const domain = useDomainInfo();
  const setDomain = useSetDomain();
  const verifyDomain = useVerifyDomain();
  const removeDomain = useRemoveDomain();
  const flags = useFeatureFlags();
  const setFlags = useSetFeatureFlags();
  const templates = useEmailTemplates();

  const [domainInput, setDomainInput] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<string>('welcome');

  const onApplyPreset = (id: string): void => {
    applyPreset.mutate(id, {
      onSuccess: () => toast.success('Theme applied'),
      onError: (e) => toast.error(e.message),
    });
  };

  const onToggleFlag = (key: keyof FeatureFlags, value: boolean): void => {
    setFlags.mutate({ [key]: value } as Partial<FeatureFlags>, {
      onError: (e) => toast.error(e.message),
    });
  };

  const onSaveDomain = (): void => {
    if (!domainInput.trim()) return;
    setDomain.mutate(domainInput.trim(), {
      onSuccess: () => toast.success('Domain saved — add the DNS record, then verify'),
      onError: (e) => toast.error(e.message),
    });
  };

  const onVerify = (): void => {
    verifyDomain.mutate(undefined, {
      onSuccess: (d) =>
        d.status === 'verified' ? toast.success('Domain verified!') : toast.error('TXT record not found yet'),
      onError: (e) => toast.error(e.message),
    });
  };

  const selected = templates.data?.find((t) => t.key === activeTemplate);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">White-Label</h1>

      {/* Theme presets */}
      <Section title="Theme presets" icon={<Palette className="size-5 text-brand-primary" />}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {presets.data?.themes.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onApplyPreset(p.id)}
              disabled={applyPreset.isPending}
              className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-brand-primary"
            >
              <span className="flex gap-1">
                <span className="size-6 rounded-full" style={{ background: p.primaryColor }} />
                <span className="size-6 rounded-full" style={{ background: p.accentColor }} />
              </span>
              <span>
                <span className="block text-sm font-medium">{p.name}</span>
                <span className="block text-xs text-muted-foreground capitalize">{p.font}</span>
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* Feature flags */}
      <Section title="Feature flags" icon={<ToggleLeft className="size-5 text-brand-primary" />}>
        {flags.data ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(FLAG_LABELS) as (keyof FeatureFlags)[])
              .filter((k) => k !== 'customDomain')
              .map((key) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                >
                  <span>{FLAG_LABELS[key]}</span>
                  <input
                    type="checkbox"
                    checked={flags.data[key]}
                    onChange={(e) => onToggleFlag(key, e.target.checked)}
                    className="size-4"
                  />
                </label>
              ))}
          </div>
        ) : (
          <div className="skeleton h-24 w-full rounded-lg" />
        )}
      </Section>

      {/* Custom domain */}
      <Section title="Custom domain" icon={<Globe className="size-5 text-brand-primary" />}>
        {domain.data?.customDomain ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{domain.data.customDomain}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  domain.data.status === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : domain.data.status === 'failed'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-amber-500/10 text-amber-600',
                )}
              >
                {domain.data.status}
              </span>
            </div>
            {domain.data.dnsRecord && domain.data.status !== 'verified' && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="mb-2 text-muted-foreground">
                  Add this DNS record at your provider, then click Verify:
                </p>
                <div className="space-y-1 font-mono text-xs">
                  <div>Type: {domain.data.dnsRecord.type}</div>
                  <div>Host: {domain.data.dnsRecord.host}</div>
                  <div className="break-all">Value: {domain.data.dnsRecord.value}</div>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              {domain.data.status !== 'verified' && (
                <Button variant="brand" onClick={onVerify} disabled={verifyDomain.isPending}>
                  {verifyDomain.isPending && <Loader2 className="size-4 animate-spin" />} Verify
                </Button>
              )}
              {domain.data.status === 'verified' && (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                  <Check className="size-4" /> Live
                </span>
              )}
              <Button
                variant="ghost"
                onClick={() => removeDomain.mutate()}
                disabled={removeDomain.isPending}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="learn.yourbrand.com"
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <Button variant="brand" onClick={onSaveDomain} disabled={setDomain.isPending}>
              {setDomain.isPending && <Loader2 className="size-4 animate-spin" />} Add domain
            </Button>
          </div>
        )}
      </Section>

      {/* Email templates */}
      <Section title="Email templates" icon={<Mail className="size-5 text-brand-primary" />}>
        <div className="flex flex-wrap gap-2">
          {templates.data?.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTemplate(t.key)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm capitalize',
                activeTemplate === t.key
                  ? 'border-brand-primary bg-brand-primary/10'
                  : 'hover:border-brand-primary',
              )}
            >
              {t.key}
              {t.isCustom && t.enabled && <span className="ml-1 text-xs text-brand-primary">●</span>}
            </button>
          ))}
        </div>
        <div className="mt-4">{selected && <EmailTemplateEditor template={selected} />}</div>
      </Section>
    </div>
  );
}
