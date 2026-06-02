'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CouponTable } from '@/components/admin/CouponTable';
import { CouponFormDialog } from '@/components/admin/CouponFormDialog';
import { useAdminCoupons, useCourseOptions, useDeleteCoupon } from '@/hooks/useAdminCoupons';
import type { ICoupon } from '@/types';

/** Admin coupon management. */
export default function AdminCouponsPage(): JSX.Element {
  const { data: coupons, isLoading } = useAdminCoupons();
  const { data: courseOptions } = useCourseOptions();
  const del = useDeleteCoupon();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ICoupon | null>(null);

  const openCreate = (): void => { setEditing(null); setDialogOpen(true); };
  const openEdit = (c: ICoupon): void => { setEditing(c); setDialogOpen(true); };
  const onDelete = (id: string): void => {
    if (!window.confirm('Delete this coupon?')) return;
    del.mutate(id, { onSuccess: () => toast.success('Coupon deleted'), onError: (e) => toast.error(e.message) });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Coupons</h1>
        <Button variant="brand" onClick={openCreate}>
          <Plus className="size-4" /> Create coupon
        </Button>
      </div>

      {isLoading || !coupons ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-primary" /></div>
      ) : coupons.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">No coupons yet.</div>
      ) : (
        <CouponTable rows={coupons} onEdit={openEdit} onDelete={onDelete} />
      )}

      {dialogOpen && (
        <CouponFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} initial={editing} courseOptions={courseOptions ?? []} />
      )}
    </div>
  );
}
