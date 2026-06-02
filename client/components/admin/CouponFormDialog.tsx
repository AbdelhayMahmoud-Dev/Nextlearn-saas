'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from './Modal';
import { useCreateCoupon, useUpdateCoupon, type CouponInput } from '@/hooks/useAdminCoupons';
import type { ICoupon } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  initial: ICoupon | null;
  courseOptions: { _id: string; title: string }[];
}

/** Create/edit coupon form in a modal. */
export function CouponFormDialog({ open, onClose, initial, courseOptions }: Props): JSX.Element {
  const create = useCreateCoupon();
  const update = useUpdateCoupon();
  const [form, setForm] = useState<CouponInput>(() => ({
    code: initial?.code ?? '',
    discountType: initial?.discountType ?? 'percent',
    discountValue: initial?.discountValue ?? 10,
    maxUses: initial?.maxUses ?? 0,
    expiresAt: initial?.expiresAt ? initial.expiresAt.slice(0, 10) : null,
    applicableCourses: initial?.applicableCourses ?? [],
    isActive: initial?.isActive ?? true,
  }));

  const set = <K extends keyof CouponInput>(k: K, v: CouponInput[K]): void => setForm((f) => ({ ...f, [k]: v }));

  const submit = (): void => {
    const body: CouponInput = {
      ...form,
      code: form.code.trim().toUpperCase(),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    const opts = {
      onSuccess: () => { toast.success(initial ? 'Coupon updated' : 'Coupon created'); onClose(); },
      onError: (e: { message: string }) => toast.error(e.message),
    };
    if (initial) update.mutate({ id: initial._id, body }, opts);
    else create.mutate(body, opts);
  };

  const pending = create.isPending || update.isPending;

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit coupon' : 'Create coupon'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Code</label>
            <Input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="SAVE20" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <div className="mt-1 inline-flex rounded-lg border p-1">
              {(['percent', 'fixed'] as const).map((t) => (
                <button key={t} type="button" onClick={() => set('discountType', t)} className={cn('rounded-md px-3 py-1 text-sm', form.discountType === t ? 'bg-brand-primary text-brand-primary-foreground' : 'text-muted-foreground')}>
                  {t === 'percent' ? '%' : '$'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Value</label>
            <Input type="number" value={form.discountValue} onChange={(e) => set('discountValue', Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Max uses (0 = ∞)</label>
            <Input type="number" value={form.maxUses} onChange={(e) => set('maxUses', Number(e.target.value))} className="mt-1" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Expires (optional)</label>
          <Input type="date" value={form.expiresAt ?? ''} onChange={(e) => set('expiresAt', e.target.value || null)} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Applicable courses (none = all)</label>
          <select
            multiple
            value={form.applicableCourses}
            onChange={(e) => set('applicableCourses', Array.from(e.target.selectedOptions, (o) => o.value))}
            className="mt-1 h-28 w-full rounded-lg border bg-background p-2 text-sm"
          >
            {courseOptions.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="brand" onClick={submit} disabled={pending || !form.code.trim()}>
            {pending && <Loader2 className="size-4 animate-spin" />} Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
