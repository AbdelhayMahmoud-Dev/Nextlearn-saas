import { Award, BookOpen, Clock, Infinity as InfinityIcon } from 'lucide-react';
import type { ICourse, ILesson, IModule } from '@/types';
import { formatDuration } from '@/lib/utils';
import { CourseEnrollCard } from './CourseEnrollCard';

/** Finds the first lesson id for deep-linking into the player after enrolling. */
function getFirstLessonId(course: ICourse): string | undefined {
  const modules = Array.isArray(course.modules) ? (course.modules as IModule[]) : [];
  for (const mod of modules) {
    const lessons = mod.lessons as ILesson[] | string[];
    const first = lessons?.[0];
    if (first && typeof first !== 'string') return first._id;
  }
  return undefined;
}

/**
 * Sticky course panel: real Stripe-backed enroll/coupon card (CourseEnrollCard)
 * plus a summary of what the course includes.
 */
export function CourseSidebar({ course }: { course: ICourse }): JSX.Element {
  const includes = [
    { icon: BookOpen, label: `${course.totalLessons} lessons` },
    { icon: Clock, label: `${formatDuration(course.totalDuration)} of content` },
    { icon: InfinityIcon, label: 'Full lifetime access' },
    { icon: Award, label: 'Certificate of completion' },
  ];

  return (
    <div className="space-y-4">
      <CourseEnrollCard course={course} firstLessonId={getFirstLessonId(course)} />

      <div className="rounded-xl border bg-card p-6">
        <p className="font-medium">This course includes</p>
        <ul className="mt-4 space-y-3 text-sm">
          {includes.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <Icon className="size-4 text-brand-primary" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
