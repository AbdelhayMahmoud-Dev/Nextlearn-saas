'use client';

import { cn, formatDate } from '@/lib/utils';
import type { ICoupon } from '@/types';

interface Props {
  rows: ICoupon[];
  onEdit: (c: ICoupon) => void;
  onDelete: (id: string) => void;
}

/** Admin coupon table. */
export function CouponTable({ rows, onEdit, onDelete }: Props): JSX.Element {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Code</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Value</th>
            <th className="px-4 py-3 font-medium">Uses</th>
            <th className="px-4 py-3 font-medium">Expires</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c._id} className="border-b last:border-0">
              <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
              <td className="px-4 py-3 capitalize">{c.discountType}</td>
              <td className="px-4 py-3">{c.discountType === 'percent' ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
              <td className="px-4 py-3">{c.usedCount}/{c.maxUses === 0 ? '∞' : c.maxUses}</td>
              <td className="px-4 py-3">{c.expiresAt ? formatDate(c.expiresAt) : '—'}</td>
              <td className="px-4 py-3">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', c.isActive ? 'bg-green-500/15 text-green-500' : 'bg-muted text-muted-foreground')}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-3 text-xs">
                  <button type="button" onClick={() => onEdit(c)} className="text-brand-primary hover:underline">Edit</button>
                  <button type="button" onClick={() => onDelete(c._id)} className="text-red-500 hover:underline">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
