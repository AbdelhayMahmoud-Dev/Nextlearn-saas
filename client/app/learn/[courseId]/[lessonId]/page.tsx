'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useCourseLearn, useLesson, useMarkProgress } from '@/hooks/useLearn';
import { useCourseProgress } from '@/hooks/useProgress';
import { useLessonAccess } from '@/hooks/useEnrollment';
import { LessonContent } from '@/components/course/LessonContent';
import { AccessDenied } from '@/components/course/AccessDenied';
import { CurriculumSidebar } from '@/components/course/CurriculumSidebar';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';

function PlayerSkeleton(): JSX.Element {
  return (
    <div className="flex h-screen flex-col">
      <div className="skeleton h-14 border-b" />
      <div className="flex flex-1">
        <div className="flex-1">
          <div className="skeleton aspect-video w-full" />
        </div>
        <div className="hidden w-80 space-y-3 border-l p-4 lg:block">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LearnPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}): JSX.Element {
  const { courseId, lessonId } = params;
  const router = useRouter();
  const learn = useCourseLearn(courseId);
  const lesson = useLesson(courseId, lessonId);
  const progressQuery = useCourseProgress(courseId);
  const access = useLessonAccess(courseId, lessonId);
  const mark = useMarkProgress(courseId);

  const lessonProgress = progressQuery.data?.find((p) => p.lessonId === lessonId);
  const initialSeconds = lessonProgress?.watchedSeconds ?? 0;
  const isCompleted =
    Boolean(lessonProgress?.isCompleted) ||
    Boolean(learn.data?.progress.completedLessons.includes(lessonId));

  const flatLessons = learn.data?.modules.flatMap((m) => m.lessons) ?? [];
  const currentIndex = flatLessons.findIndex((l) => l._id === lessonId);
  const nextLesson = currentIndex >= 0 ? flatLessons[currentIndex + 1] : undefined;

  const onVideoProgress = useCallback(
    (seconds: number) => {
      mark.mutate({ lessonId, courseId, watchedSeconds: seconds });
    },
    [mark, lessonId, courseId],
  );

  const onComplete = useCallback(() => {
    mark.mutate(
      { lessonId, courseId, isCompleted: true },
      {
        onSuccess: () => {
          toast.success('Lesson complete! 🎉', {
            description: nextLesson ? 'On to the next one.' : 'You finished the course!',
          });
          if (nextLesson) router.push(`/learn/${courseId}/${nextLesson._id}`);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }, [mark, lessonId, courseId, nextLesson, router]);

  if (learn.isLoading || lesson.isLoading) return <PlayerSkeleton />;

  if (learn.isError || lesson.isError || !learn.data || !lesson.data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <ErrorState
          title="Couldn't load this lesson"
          description={lesson.error?.message ?? learn.error?.message}
          onRetry={() => {
            void learn.refetch();
            void lesson.refetch();
          }}
        />
      </div>
    );
  }

  const data = learn.data;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/courses/${data.course.slug}`} aria-label="Back to course">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="flex-1 truncate font-heading font-semibold">{data.course.title}</h1>
        <span className="hidden text-sm text-muted-foreground sm:block">
          {data.progress.percentage}% complete
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {access.data === false ? (
            <AccessDenied courseSlug={data.course.slug} courseTitle={data.course.title} />
          ) : (
            <LessonContent
              key={lessonId}
              lesson={lesson.data}
              initialSeconds={initialSeconds}
              isCompleted={isCompleted}
              completing={mark.isPending}
              onVideoProgress={onVideoProgress}
              onComplete={onComplete}
            />
          )}
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-6">
            <h2 className="font-heading text-lg font-semibold">{lesson.data.title}</h2>
            {nextLesson && (
              <Button variant="outline" onClick={() => router.push(`/learn/${courseId}/${nextLesson._id}`)}>
                Next lesson →
              </Button>
            )}
          </div>
        </div>

        <aside className="hidden w-80 shrink-0 border-l lg:block">
          <CurriculumSidebar
            courseId={courseId}
            modules={data.modules}
            completedLessons={data.progress.completedLessons}
            currentLessonId={lessonId}
            isEnrolled={data.isEnrolled}
            percentage={data.progress.percentage}
          />
        </aside>
      </div>
    </div>
  );
}
