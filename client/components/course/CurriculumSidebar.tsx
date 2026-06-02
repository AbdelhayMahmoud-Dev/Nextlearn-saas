'use client';

import Link from 'next/link';
import { Check, FileText, HelpCircle, Lock, PlayCircle } from 'lucide-react';
import type { LessonType } from '@/types';
import type { LearnModule } from '@/hooks/useLearn';
import { cn, formatDuration } from '@/lib/utils';

const LESSON_ICON: Record<LessonType, typeof PlayCircle> = {
  video: PlayCircle,
  article: FileText,
  quiz: HelpCircle,
  assignment: FileText,
  live: PlayCircle,
};

interface CurriculumSidebarProps {
  courseId: string;
  modules: LearnModule[];
  completedLessons: string[];
  currentLessonId: string;
  isEnrolled: boolean;
  percentage: number;
}

/** Course player sidebar: overall progress + module/lesson tree with state. */
export function CurriculumSidebar({
  courseId,
  modules,
  completedLessons,
  currentLessonId,
  isEnrolled,
  percentage,
}: CurriculumSidebarProps): JSX.Element {
  const completed = new Set(completedLessons);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Your progress</span>
          <span>{percentage}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${percentage}%` }} />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto" aria-label="Course curriculum">
        {modules.map((module) => {
          const done = module.lessons.filter((l) => completed.has(l._id)).length;
          return (
            <div key={module._id} className="border-b">
              <div className="flex items-center justify-between px-4 py-3 text-sm font-medium">
                <span>{module.title}</span>
                <span className="text-xs text-muted-foreground">
                  {done}/{module.lessons.length}
                </span>
              </div>
              <ul>
                {module.lessons.map((lesson) => {
                  const Icon = LESSON_ICON[lesson.type];
                  const isDone = completed.has(lesson._id);
                  const isCurrent = lesson._id === currentLessonId;
                  const locked = !lesson.isFree && !isEnrolled;
                  const content = (
                    <span
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 text-sm',
                        isCurrent && 'bg-brand-primary/10 font-medium text-brand-primary',
                        !isCurrent && !locked && 'hover:bg-accent',
                        locked && 'opacity-60',
                      )}
                    >
                      {isDone ? (
                        <Check className="size-4 shrink-0 text-brand-primary" />
                      ) : locked ? (
                        <Lock className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="flex-1 line-clamp-2">{lesson.title}</span>
                      {lesson.content?.duration ? (
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(lesson.content.duration)}
                        </span>
                      ) : null}
                    </span>
                  );
                  return (
                    <li key={lesson._id}>
                      {locked ? (
                        <div aria-disabled className="cursor-not-allowed">
                          {content}
                        </div>
                      ) : (
                        <Link
                          href={`/learn/${courseId}/${lesson._id}`}
                          aria-current={isCurrent ? 'page' : undefined}
                          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        >
                          {content}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
