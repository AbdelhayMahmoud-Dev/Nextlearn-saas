'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAdminCourse,
  useApproveCourse,
  useDeleteCourse,
  useFeatureCourse,
  useRejectCourse,
} from '@/hooks/useAdminCourses';

export default function AdminCourseDetailPage({ params }: { params: { id: string } }): JSX.Element {
  const router = useRouter();
  const { data: c, isLoading } = useAdminCourse(params.id);
  const [reason, setReason] = useState('');
  const feature = useFeatureCourse();
  const approve = useApproveCourse();
  const reject = useRejectCourse();
  const del = useDeleteCourse();

  if (isLoading || !c) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-primary" /></div>;
  }

  const id = params.id;
  const handleReject = (): void => {
    if (reason.trim().length < 3) { toast.error('Enter a rejection reason'); return; }
    reject.mutate({ id, body: { reason } }, { onSuccess: () => toast.success('Course rejected'), onError: (e) => toast.error(e.message) });
  };
  const handleDelete = (): void => {
    if (!window.confirm('Permanently delete this course?')) return;
    del.mutate({ id }, { onSuccess: () => { toast.success('Deleted'); router.push('/admin/courses'); }, onError: (e) => toast.error(e.message) });
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to courses
      </Link>

      <div className="rounded-xl border bg-card p-6">
        <h1 className="font-heading text-2xl font-bold">{c.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">By {c.instructor?.name ?? 'Unknown'} · {c.category} · {c.price === 0 ? 'Free' : formatPrice(c.price, c.currency)}</p>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{c.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className={cn('rounded-full px-2.5 py-0.5 font-medium', c.isPublished ? 'bg-green-500/15 text-green-500' : 'bg-muted text-muted-foreground')}>{c.isPublished ? 'Published' : 'Draft'}</span>
          {c.isFeatured && <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 font-medium text-amber-500">Featured</span>}
          <span className={cn('rounded-full px-2.5 py-0.5 font-medium', c.isApproved ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500')}>{c.isApproved ? 'Approved' : 'Pending / Rejected'}</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">Moderation</h2>
        {c.rejectionReason && <p className="mt-2 text-sm text-red-500">Rejection reason: {c.rejectionReason}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => feature.mutate({ id })}>{c.isFeatured ? 'Unfeature' : 'Feature'}</Button>
          <Button variant="outline" size="sm" onClick={() => approve.mutate({ id }, { onSuccess: () => toast.success('Approved') })}>Approve</Button>
          <Button variant="outline" size="sm" className="text-red-500" onClick={handleDelete}>Delete</Button>
        </div>
        <div className="mt-4 flex gap-2">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection reason" />
          <Button variant="outline" onClick={handleReject} disabled={reject.isPending}>Reject</Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-3 font-heading text-lg font-semibold">Curriculum</h2>
        <div className="space-y-3">
          {c.modules.map((m) => (
            <div key={m._id}>
              <p className="font-medium">{m.title}</p>
              <ul className="mt-1 space-y-1 pl-4 text-sm text-muted-foreground">
                {m.lessons.map((l) => <li key={l._id}>· {l.title} <span className="text-xs">({l.type})</span></li>)}
              </ul>
            </div>
          ))}
          {c.modules.length === 0 && <p className="text-sm text-muted-foreground">No modules.</p>}
        </div>
      </div>
    </div>
  );
}
