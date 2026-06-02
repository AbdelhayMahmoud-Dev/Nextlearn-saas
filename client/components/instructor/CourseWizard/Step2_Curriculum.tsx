'use client';

import Link from 'next/link';
import { BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  courseId?: string;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Step 2 shell — links to the dedicated curriculum editor.
 * The full drag-and-drop editor lives at /instructor/courses/:id/curriculum.
 */
export function Step2_Curriculum({ courseId, onBack, onNext }: Props): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Curriculum</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Build modules and lessons for your course using the full curriculum editor.
        </p>
      </div>

      <div className="rounded-lg border-2 border-dashed border-brand-primary/30 bg-brand-primary/5 p-8 text-center">
        <BookOpen className="mx-auto mb-3 size-10 text-brand-primary/60" aria-hidden="true" />
        <h3 className="font-semibold">Open the Curriculum Editor</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add modules, lessons, videos, articles, quizzes, and assignments — all from a
          single drag-and-drop interface.
        </p>
        {courseId ? (
          <Link href={`/instructor/courses/${courseId}/curriculum`} className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90">
            Open Curriculum Editor <ExternalLink className="size-3.5" />
          </Link>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            Save your course info first to unlock the curriculum editor.
          </p>
        )}
      </div>

      <div className="flex gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button type="button" variant="brand" onClick={onNext}>
          Next: Pricing →
        </Button>
      </div>
    </div>
  );
}
