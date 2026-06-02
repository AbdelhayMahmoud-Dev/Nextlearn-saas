'use client';

import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import type { IUser } from '@/types';
import { useUpdateProfile } from '@/hooks/useProfile';
import { Label } from '@/components/ui/label';

type ToggleKey = 'emailCourseUpdates' | 'emailPromotions' | 'emailWeeklyDigest';

const TOGGLES: { key: ToggleKey; label: string; desc: string }[] = [
  { key: 'emailCourseUpdates', label: 'Course updates', desc: 'New lessons and announcements from your courses.' },
  { key: 'emailPromotions', label: 'Promotions', desc: 'Occasional offers and product news.' },
  { key: 'emailWeeklyDigest', label: 'Weekly digest', desc: 'A summary of your learning each week.' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ar', label: 'العربية' },
];

const selectClass =
  'mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Preferences tab: email notification toggles, language, and theme. */
export function PreferencesTab({ user }: { user: IUser }): JSX.Element {
  const update = useUpdateProfile();
  const { theme, setTheme } = useTheme();
  const prefs = user.preferences;

  const save = (preferences: Partial<IUser['preferences']>): void => {
    update.mutate({ preferences }, { onError: (e) => toast.error(e.message) });
  };

  return (
    <div className="max-w-md space-y-8">
      <section>
        <h3 className="font-heading text-lg font-semibold">Email notifications</h3>
        <div className="mt-4 space-y-4">
          {TOGGLES.map((t) => (
            <label key={t.key} className="flex items-start justify-between gap-4">
              <span>
                <span className="font-medium">{t.label}</span>
                <span className="block text-sm text-muted-foreground">{t.desc}</span>
              </span>
              <input
                type="checkbox"
                className="mt-1 size-5 rounded border-input accent-brand-primary"
                checked={prefs[t.key]}
                onChange={(e) => save({ [t.key]: e.target.checked } as Partial<IUser['preferences']>)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="border-t pt-6">
        <Label htmlFor="lang">Language</Label>
        <select
          id="lang"
          value={prefs.language}
          onChange={(e) => save({ language: e.target.value })}
          className={selectClass}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </section>

      <section className="border-t pt-6">
        <Label htmlFor="theme">Theme</Label>
        <select
          id="theme"
          value={theme ?? 'system'}
          onChange={(e) => setTheme(e.target.value)}
          className={selectClass}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </section>
    </div>
  );
}
