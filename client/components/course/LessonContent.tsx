'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import DOMPurify from 'dompurify';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { ILesson } from '@/types';
import { Button } from '@/components/ui/button';

// HLS.js is ~200 KB and browser-only; load the player lazily so it never enters
// the server render graph or the learn route's initial JS bundle.
const CoursePlayer = dynamic(
  () => import('./CoursePlayer').then((m) => m.CoursePlayer),
  {
    ssr: false,
    loading: () => <div className="aspect-video w-full animate-pulse bg-black/80" />,
  },
);

interface LessonContentProps {
  lesson: ILesson;
  initialSeconds: number;
  isCompleted: boolean;
  completing: boolean;
  onVideoProgress: (seconds: number) => void;
  onComplete: () => void;
}

/** Renders a lesson by type: video player, sanitized article, or other. */
export function LessonContent({
  lesson,
  initialSeconds,
  isCompleted,
  completing,
  onVideoProgress,
  onComplete,
}: LessonContentProps): JSX.Element {
  // Sanitize on the client only (DOMPurify needs a DOM).
  const [safeHtml, setSafeHtml] = useState('');
  useEffect(() => {
    setSafeHtml(DOMPurify.sanitize(lesson.content?.article ?? ''));
  }, [lesson]);

  if (lesson.type === 'video' && lesson.content?.videoUrl) {
    return (
      <CoursePlayer
        src={lesson.content.videoUrl}
        initialSeconds={initialSeconds}
        onProgress={onVideoProgress}
        onCompleted={onComplete}
      />
    );
  }

  const completeAction = isCompleted ? (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary">
      <CheckCircle2 className="size-5" /> Completed
    </span>
  ) : (
    <Button variant="brand" onClick={onComplete} disabled={completing}>
      {completing && <Loader2 className="size-4 animate-spin" />}
      Mark as complete
    </Button>
  );

  if (lesson.type === 'article') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <article
          className="prose prose-neutral max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
        <div className="mt-8 border-t pt-6">{completeAction}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <h2 className="font-heading text-xl font-semibold">{lesson.title}</h2>
      <p className="mt-2 text-sm capitalize text-muted-foreground">
        This {lesson.type} lesson opens in a dedicated experience.
      </p>
      <div className="mt-6">{completeAction}</div>
    </div>
  );
}
