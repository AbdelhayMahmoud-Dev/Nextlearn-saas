'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from './Modal';
import { useRefundPayment, type AdminPaymentRow } from '@/hooks/useAdminPayments';

interface Props {
  payment: AdminPaymentRow | null;
  onClose: () => void;
}

/** Confirmation dialog for issuing a Stripe refund on a payment. */
export function RefundDialog({ payment, onClose }: Props): JSX.Element {
  const [reason, setReason] = useState('');
  const refund = useRefundPayment();
  if (!payment) return <Modal open={false} onClose={onClose} title="Issue refund">{null}</Modal>;

  const submit = (): void => {
    refund.mutate(
      { id: payment._id, reason: reason || undefined },
      {
        onSuccess: () => { toast.success('Refund processed'); onClose(); },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <Modal open={Boolean(payment)} onClose={onClose} title="Issue refund">
      <p className="text-sm text-muted-foreground">
        This will refund <strong>{formatPrice(payment.amount / 100, payment.currency)}</strong> to{' '}
        <strong>{payment.user?.name ?? 'the user'}</strong> and remove their course access.
      </p>
      <div className="mt-4">
        <label htmlFor="refund-reason" className="text-sm font-medium">Reason (optional)</label>
        <Input id="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer request" className="mt-1" />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="brand" onClick={submit} disabled={refund.isPending}>
          {refund.isPending && <Loader2 className="size-4 animate-spin" />} Confirm refund
        </Button>
      </div>
    </Modal>
  );
}
