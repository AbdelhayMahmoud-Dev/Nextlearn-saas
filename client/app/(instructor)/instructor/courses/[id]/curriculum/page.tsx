'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CurriculumEditor } from '@/components/instructor/CurriculumEditor/CurriculumEditor';

interface Props {
  params: { id: string };
}

/** Dedicated curriculum editor page at /instructor/courses/:id/curriculum. */
export default function CurriculumPage({ params }: Props): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/instructor/courses/${params.id}/edit?step=2`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to wizard
        </Link>
        <h1 className="font-heading text-2xl font-bold">Curriculum Editor</h1>
      </div>
      <CurriculumEditor courseId={params.id} />
    </div>
  );
}
