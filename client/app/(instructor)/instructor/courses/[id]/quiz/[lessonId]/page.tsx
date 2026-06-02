'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { QuizBuilder } from '@/components/instructor/QuizBuilder/QuizBuilder';
import { useQuizByLesson } from '@/hooks/useQuizBuilder';

interface Props {
  params: { id: string; lessonId: string };
}

/** Quiz builder page for a specific lesson. */
export default function QuizBuilderPage({ params }: Props): JSX.Element {
  const { data: quiz, isLoading } = useQuizByLesson(params.lessonId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/instructor/courses/${params.id}/curriculum`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to curriculum
        </Link>
        <h1 className="font-heading text-2xl font-bold">Quiz Builder</h1>
      </div>
      <QuizBuilder lessonId={params.lessonId} initialQuiz={quiz} />
    </div>
  );
}
