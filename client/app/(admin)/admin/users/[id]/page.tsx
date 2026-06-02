'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { useAdminUser } from '@/hooks/useAdminUsers';

type Tab = 'enrollments' | 'payments' | 'activity';

export default function AdminUserDetailPage({ params }: { params: { id: string } }): JSX.Element {
  const { data, isLoading } = useAdminUser(params.id);
  const [tab, setTab] = useState<Tab>('enrollments');

  if (isLoading || !data) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-primary" /></div>;
  }
  const { user, enrollments, payments, certificates } = data;

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to users
      </Link>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-primary/10 font-heading text-xl font-bold text-brand-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="mt-3 font-heading text-lg font-bold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex justify-center gap-2">
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium capitalize text-amber-500">{user.role}</span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', user.isActive ? 'bg-green-500/15 text-green-500' : 'bg-muted text-muted-foreground')}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
          </div>
        </aside>

        <div>
          <div className="mb-4 inline-flex rounded-lg border bg-card p-1">
            {(['enrollments', 'payments', 'activity'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} className={cn('rounded-md px-4 py-1.5 text-sm font-medium capitalize', tab === t ? 'bg-brand-primary text-brand-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'enrollments' && (
            <div className="space-y-2">
              {enrollments.length === 0 && <p className="text-sm text-muted-foreground">No enrollments.</p>}
              {enrollments.map((e) => (
                <div key={e._id} className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm">
                  <span>{e.course?.title ?? 'Unknown course'}</span>
                  <span className="text-muted-foreground">{e.progress.percentage}% · {e.status}</span>
                </div>
              ))}
            </div>
          )}
          {tab === 'payments' && (
            <div className="space-y-2">
              {payments.length === 0 && <p className="text-sm text-muted-foreground">No payments.</p>}
              {payments.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm">
                  <span>{formatDate(p.createdAt)} · {p.type}</span>
                  <span>{formatPrice(p.amount / 100, p.currency)} <span className="text-muted-foreground">· {p.status}</span></span>
                </div>
              ))}
            </div>
          )}
          {tab === 'activity' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{certificates.length} certificate(s) earned.</p>
              {certificates.map((c) => (
                <div key={c._id} className="rounded-lg border bg-card p-3 text-sm">
                  Certificate {c.certificateNumber} · {formatDate(c.createdAt)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
