import { Award, Flame, GraduationCap, Rocket, Trophy } from 'lucide-react';
import type { DashboardStats } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';

/** Milestone badges derived from the student's real stats. */
export function AchievementBadges({ stats }: { stats: DashboardStats }): JSX.Element {
  const badges = [
    { icon: Rocket, label: 'First Course', earned: stats.enrolledCount >= 1 },
    { icon: GraduationCap, label: '5 Courses', earned: stats.enrolledCount >= 5 },
    { icon: Flame, label: '7-Day Streak', earned: stats.streakDays >= 7 },
    { icon: Trophy, label: '10 Hours', earned: stats.hoursLearned >= 10 },
    { icon: Award, label: 'Certified', earned: stats.certificatesCount >= 1 },
  ];

  return (
    <section>
      <h2 className="mb-4 font-heading text-xl font-semibold">Achievements</h2>
      <div className="flex flex-wrap gap-4">
        {badges.map((b) => (
          <div
            key={b.label}
            className={cn(
              'flex w-24 flex-col items-center gap-2 rounded-xl border p-4 text-center',
              b.earned ? 'bg-card' : 'opacity-40',
            )}
            aria-label={`${b.label}: ${b.earned ? 'earned' : 'locked'}`}
          >
            <span
              className={cn(
                'flex size-12 items-center justify-center rounded-full',
                b.earned ? 'bg-brand-primary text-brand-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              <b.icon className="size-6" />
            </span>
            <span className="text-xs font-medium">{b.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
