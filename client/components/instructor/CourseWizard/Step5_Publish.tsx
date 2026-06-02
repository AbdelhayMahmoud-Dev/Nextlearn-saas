'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { usePublishCourse } from '@/hooks/useInstructorCourses';
import { cn } from '@/lib/utils';
import type { ICourse, ApiResponse } from '@/types';

interface ChecklistItem {
  key: string;
  label: string;
  step: number;
  pass: boolean;
}

interface LessonMinimal {
  isPublished?: boolean;
}
interface ModuleMinimal {
  lessons?: LessonMinimal[];
}
interface CourseEditData extends Omit<ICourse, 'modules'> {
  modules?: ModuleMinimal[];
}

interface Props {
  courseId: string;
  onBack: () => void;
  onNavigateToStep: (step: number) => void;
}

/** Step 5: publish checklist + publish action. */
export function Step5_Publish({ courseId, onBack, onNavigateToStep }: Props): JSX.Element {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const publish = usePublishCourse(courseId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void apiClient
      .get<ApiResponse<CourseEditData>>(`/courses/${courseId}/edit`)
      .then(({ data }) => {
        if (cancelled) return;
        const course = data.data;
        const modules = course.modules ?? [];
        const publishedLessons = (modules as CourseEditData['modules'] ?? [])
          .flatMap((m) => m.lessons ?? [])
          .filter((l) => l.isPublished);

        setChecklist([
          { key: 'title', label: 'Course title (min 5 chars)', step: 1, pass: (course.title?.length ?? 0) >= 5 },
          { key: 'outcomes', label: 'At least one learning outcome', step: 1, pass: (course.outcomes?.length ?? 0) >= 1 },
          { key: 'thumbnail', label: 'Thumbnail image uploaded', step: 4, pass: Boolean(course.thumbnail) },
          { key: 'modules', label: 'At least one module created', step: 2, pass: modules.length >= 1 },
          { key: 'publishedLessons', label: 'At least one published lesson', step: 2, pass: publishedLessons.length >= 1 },
          { key: 'price', label: 'Price set or marked as free', step: 3, pass: (course.price ?? 0) >= 0 },
        ]);
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load course data');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId]);

  const allPass = checklist.length > 0 && checklist.every((c) => c.pass);

  const handlePublish = async (): Promise<void> => {
    const ok = await publish.mutateAsync().catch(() => null);
    if (ok) {
      const confetti = await import('canvas-confetti');
      void confetti.default({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      toast.success('Course published! 🎉');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Ready to Publish?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All items below must be green before your course goes live.
        </p>
      </div>

      <ul className="space-y-3">
        {checklist.map((item) => (
          <li key={item.key} className="flex items-center gap-3">
            {item.pass ? (
              <CheckCircle2 className="size-5 shrink-0 text-green-500" aria-label="Pass" />
            ) : (
              <XCircle className="size-5 shrink-0 text-destructive" aria-label="Fail" />
            )}
            <span className={cn('text-sm', !item.pass && 'text-destructive')}>
              {item.label}
            </span>
            {!item.pass && (
              <button
                type="button"
                onClick={() => onNavigateToStep(item.step)}
                className="ml-auto text-xs text-brand-primary hover:underline"
              >
                Fix →
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="flex gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onBack}>← Back</Button>
        <Button
          type="button"
          variant="brand"
          disabled={!allPass || publish.isPending}
          onClick={() => void handlePublish()}
        >
          {publish.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {allPass ? 'Publish Course 🚀' : 'Complete checklist to publish'}
        </Button>
      </div>
    </div>
  );
}
