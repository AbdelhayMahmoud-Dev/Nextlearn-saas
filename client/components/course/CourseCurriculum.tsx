'use client';

import { useState } from 'react';
import { ChevronDown, FileText, HelpCircle, Lock, PlayCircle } from 'lucide-react';
import type { ILesson, IModule, LessonType } from '@/types';
import { cn, formatDuration } from '@/lib/utils';

const LESSON_ICON: Record<LessonType, typeof PlayCircle> = {
  video: PlayCircle,
  article: FileText,
  quiz: HelpCircle,
  assignment: FileText,
  live: PlayCircle,
};

/** Accessible accordion of modules → lessons, with free-preview / locked affordances. */
export function CourseCurriculum({ modules }: { modules: IModule[] }): JSX.Element {
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));

  const toggle = (index: number): void =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <div className="divide-y overflow-hidden rounded-xl border">
      {modules.map((module, index) => {
        const lessons = module.lessons as ILesson[];
        const isOpen = open.has(index);
        return (
          <div key={module._id}>
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className="font-medium">{module.title}</span>
              <span className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{lessons.length} lessons</span>
                <ChevronDown className={cn('size-4 transition-transform', isOpen && 'rotate-180')} />
              </span>
            </button>
            {isOpen && (
              <ul className="divide-y border-t bg-muted/30">
                {lessons.map((lesson) => {
                  const Icon = LESSON_ICON[lesson.type];
                  return (
                    <li key={lesson._id} className="flex items-center gap-3 px-4 py-3 text-sm">
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1">{lesson.title}</span>
                      {lesson.isFree ? (
                        <span className="rounded bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary">
                          Free preview
                        </span>
                      ) : (
                        <Lock className="size-3.5 text-muted-foreground" aria-label="Locked" />
                      )}
                      {lesson.content?.duration ? (
                        <span className="w-14 text-right text-xs text-muted-foreground">
                          {formatDuration(lesson.content.duration)}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
