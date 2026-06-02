'use client';

import { useState } from 'react';

/**
 * SuperAdmin platform settings — read-only environment + jobs overview.
 * (Deep platform config lives in server env vars; see README.)
 */
export default function SuperAdminSettingsPage(): JSX.Element {
  const [copied, setCopied] = useState(false);

  const copyId = (): void => {
    void navigator.clipboard
      .writeText(process.env.NEXT_PUBLIC_TENANT_ID ?? 'not configured')
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-bold">Platform Settings</h1>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">Environment Info</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">API URL</dt>
            <dd className="font-mono">{process.env.NEXT_PUBLIC_API_URL ?? '—'}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Default Tenant ID</dt>
            <dd className="flex items-center gap-2 font-mono">
              {process.env.NEXT_PUBLIC_TENANT_ID?.slice(0, 12) ?? '—'}…
              <button type="button" onClick={copyId} className="text-xs text-brand-primary hover:underline">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">Jobs Status</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          3 cron jobs registered:{' '}
          <span className="font-medium text-foreground">subscriptionExpiry</span> (hourly),{' '}
          <span className="font-medium text-foreground">planExpiry</span> (daily midnight),{' '}
          <span className="font-medium text-foreground">weeklyDigest</span> (Monday 09:00 UTC).
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Job execution is logged server-side via Pino.</p>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
          ⚙️ Advanced platform configuration (SMTP, media, custom domains) is managed via environment
          variables on the server. See <code className="rounded bg-muted px-1">README.md</code> for the full list.
        </p>
      </div>
    </div>
  );
}
