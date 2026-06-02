'use client';

import { useState } from 'react';
import { useMe } from '@/hooks/useProfile';
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm';
import { SecurityTab } from '@/components/profile/SecurityTab';
import { PreferencesTab } from '@/components/profile/PreferencesTab';
import { ErrorState } from '@/components/common/ErrorState';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'personal', label: 'Personal Info' },
  { id: 'security', label: 'Security' },
  { id: 'preferences', label: 'Preferences' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function ProfilePage(): JSX.Element {
  const { data: user, isLoading, isError, refetch } = useMe();
  const [tab, setTab] = useState<TabId>('personal');

  if (isLoading) {
    return (
      <div className="container max-w-3xl space-y-4 py-10">
        <div className="skeleton h-9 w-40 rounded" />
        <div className="skeleton h-10 w-full rounded" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (isError || !user) {
    return (
      <div className="container max-w-3xl py-10">
        <ErrorState title="Couldn't load your profile" onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight">Profile</h1>

      <div role="tablist" aria-label="Profile sections" className="mt-6 flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'relative px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              tab === t.id ? 'text-brand-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-primary" />}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'personal' && <PersonalInfoForm user={user} />}
        {tab === 'security' && <SecurityTab />}
        {tab === 'preferences' && <PreferencesTab user={user} />}
      </div>
    </div>
  );
}
