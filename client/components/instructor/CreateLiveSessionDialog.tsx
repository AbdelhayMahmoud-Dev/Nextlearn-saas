'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateLiveSession } from '@/hooks/useInstructorLiveSessions';
import { useInstructorCourses } from '@/hooks/useInstructorCourses';

const schema = z.object({
  courseId: z.string().min(1, 'Select a course'),
  title: z.string().trim().min(1, 'Title is required').max(200),
  scheduledAt: z.string().min(1, 'Select a date and time'),
  duration: z.coerce.number().int().min(15).max(300).default(60),
  meetingUrl: z.string().url('Enter a valid meeting URL'),
  description: z.string().max(2000).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
}

/** Dialog for creating a new live session. */
export function CreateLiveSessionDialog({ onClose }: Props): JSX.Element {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { duration: 60 },
  });
  const create = useCreateLiveSession();
  const { data: courses } = useInstructorCourses();

  const onSubmit = async (data: FormData): Promise<void> => {
    await create.mutateAsync({
      ...data,
      scheduledAt: new Date(data.scheduledAt).toISOString(),
    } as Parameters<typeof create.mutateAsync>[0]).then(() => {
      toast.success('Session scheduled!');
      onClose();
    }).catch(() => {
      toast.error('Failed to create session');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-xl bg-background p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Schedule Live Session</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-md p-1 hover:bg-accent">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => void onSubmit(d))} className="space-y-4">
          <div>
            <Label htmlFor="ls-course">Course *</Label>
            <select id="ls-course" {...register('courseId')} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">Select a course…</option>
              {courses?.filter((c) => c.isPublished).map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
            {errors.courseId && <p className="mt-1 text-xs text-destructive">{errors.courseId.message}</p>}
          </div>

          <div>
            <Label htmlFor="ls-title">Title *</Label>
            <Input id="ls-title" {...register('title')} placeholder="e.g. Live Q&A — Week 3" />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ls-date">Date & Time *</Label>
              <Input id="ls-date" type="datetime-local" {...register('scheduledAt')} />
              {errors.scheduledAt && <p className="mt-1 text-xs text-destructive">{errors.scheduledAt.message}</p>}
            </div>
            <div>
              <Label htmlFor="ls-duration">Duration (min)</Label>
              <select id="ls-duration" {...register('duration')} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
                {[30, 60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="ls-url">Meeting URL *</Label>
            <Input id="ls-url" type="url" {...register('meetingUrl')} placeholder="https://zoom.us/j/…" />
            {errors.meetingUrl && <p className="mt-1 text-xs text-destructive">{errors.meetingUrl.message}</p>}
          </div>

          <div>
            <Label htmlFor="ls-desc">Description (optional)</Label>
            <textarea
              id="ls-desc"
              {...register('description')}
              rows={2}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              placeholder="What will you cover in this session?"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="brand" disabled={create.isPending}>
              {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Schedule Session
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
