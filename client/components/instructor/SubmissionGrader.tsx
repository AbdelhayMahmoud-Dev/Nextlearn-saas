'use client';

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getInitials, timeAgo } from '@/lib/utils';
import { useAssignmentSubmissions, useGradeSubmission } from '@/hooks/useAssignments';
import type { IAssignment, ISubmission } from '@/types';

interface Props {
  assignment: IAssignment;
}

/** Two-pane grading UI: student list on left, submission detail on right. */
export function SubmissionGrader({ assignment }: Props): JSX.Element {
  const { data: submissions, isLoading } = useAssignmentSubmissions(assignment._id);
  const [selected, setSelected] = useState<ISubmission | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const gradeSubmission = useGradeSubmission(assignment._id);

  const selectSubmission = (sub: ISubmission): void => {
    setSelected(sub);
    setScore(sub.score ?? 0);
    setFeedback(sub.feedback ?? '');
  };

  const handleGrade = async (): Promise<void> => {
    if (!selected) return;
    await gradeSubmission.mutateAsync({
      subId: selected._id,
      score,
      feedback,
    }).then(() => {
      toast.success('Grade saved');
    }).catch(() => {
      toast.error('Failed to save grade');
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  const pending = submissions?.filter((s) => s.status === 'pending') ?? [];
  const graded = submissions?.filter((s) => s.status === 'graded') ?? [];

  return (
    <div className="flex h-full min-h-[500px] overflow-hidden rounded-xl border">
      {/* Left: student list */}
      <div className="w-56 shrink-0 overflow-y-auto border-r">
        <div className="border-b p-3">
          <p className="text-xs text-muted-foreground">
            {pending.length} pending · {graded.length} graded
          </p>
        </div>
        <ul>
          {submissions?.map((sub) => (
            <li key={sub._id}>
              <button
                type="button"
                onClick={() => selectSubmission(sub)}
                className={cn(
                  'w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent',
                  selected?._id === sub._id && 'bg-brand-primary/10',
                )}
              >
                <p className="flex items-center gap-1.5 font-medium truncate">
                  <span className={cn('size-2 shrink-0 rounded-full', sub.status === 'graded' ? 'bg-green-500' : 'bg-orange-400')} />
                  {sub.student?.name ?? getInitials('?')}
                </p>
                {sub.isLate && (
                  <span className="mt-0.5 text-[10px] text-orange-500">Late</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Right: submission detail */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a student to grade their submission.
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{selected.student?.name ?? 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">
                  Submitted {timeAgo(selected.submittedAt)}
                  {selected.isLate && ' · '}
                  {selected.isLate && <span className="text-orange-500">Late</span>}
                </p>
              </div>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', selected.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                {selected.status}
              </span>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap text-sm">{selected.content || <em className="text-muted-foreground">No text content</em>}</p>
            </div>

            {selected.attachments?.length > 0 && (
              <div>
                <Label>Attachments</Label>
                <ul className="mt-1 space-y-1">
                  {selected.attachments.map((a, i) => (
                    <li key={i}>
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary hover:underline">
                        {a.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="grade-score">Score (/ {assignment.maxScore})</Label>
                <Input
                  id="grade-score"
                  type="number"
                  min={0}
                  max={assignment.maxScore}
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="grade-feedback">Feedback</Label>
              <textarea
                id="grade-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-y"
                placeholder="Provide constructive feedback for the student…"
              />
            </div>

            <Button
              type="button"
              variant="brand"
              onClick={() => void handleGrade()}
              disabled={gradeSubmission.isPending}
            >
              {gradeSubmission.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              Save Grade
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
