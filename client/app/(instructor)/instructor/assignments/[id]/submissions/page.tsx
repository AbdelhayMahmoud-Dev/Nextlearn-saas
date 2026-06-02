'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { SubmissionGrader } from '@/components/instructor/SubmissionGrader';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, IAssignment } from '@/types';

interface Props {
  params: { id: string };
}

export default function SubmissionsPage({ params }: Props): JSX.Element {
  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', params.id],
    queryFn: async (): Promise<IAssignment> => {
      const { data } = await apiClient.get<ApiResponse<IAssignment>>(
        `/assignments/${params.id}`,
      );
      return data.data;
    },
  });

  if (isLoading || !assignment) {
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
          href="/instructor/assignments"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to assignments
        </Link>
        <h1 className="font-heading text-xl font-bold">{assignment.title}</h1>
      </div>
      <SubmissionGrader assignment={assignment} />
    </div>
  );
}
