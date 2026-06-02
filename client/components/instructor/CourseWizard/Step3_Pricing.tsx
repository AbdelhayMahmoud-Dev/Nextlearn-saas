'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';
import type { ICourse } from '@/types';

const schema = z.object({
  enrollmentType: z.enum(['free', 'one-time', 'subscription', 'both']),
  price: z.number().min(0).default(0),
  salePrice: z.number().min(0).optional(),
  currency: z.enum(['USD', 'EUR', 'SAR', 'EGP', 'GBP']).default('USD'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Partial<ICourse>;
  onSave: (data: Partial<ICourse>, advance: boolean) => Promise<boolean>;
  onBack: () => void;
  isSaving: boolean;
}

/** Step 3: pricing type, amount, sale price, currency. */
export function Step3_Pricing({ initial, onSave, onBack, isSaving }: Props): JSX.Element {
  const { register, watch, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      enrollmentType: initial?.enrollmentType ?? 'free',
      price: initial?.price ?? 0,
      salePrice: initial?.salePrice,
      currency: (initial?.currency as FormData['currency']) ?? 'USD',
    },
  });

  const type = watch('enrollmentType');
  const price = watch('price');
  const salePrice = watch('salePrice');
  const currency = watch('currency');
  const isPaid = type !== 'free';
  const savings = price && salePrice && salePrice < price
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  const toPayload = (d: FormData): Partial<ICourse> => ({
    enrollmentType: d.enrollmentType,
    price: isPaid ? d.price : 0,
    salePrice: isPaid && d.salePrice ? d.salePrice : undefined,
    currency: d.currency,
  });

  return (
    <form className="space-y-5">
      <h2 className="font-heading text-xl font-semibold">Pricing</h2>

      {/* Free / Paid toggle */}
      <div>
        <Label>Pricing Type *</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['free', 'one-time', 'subscription', 'both'] as const).map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-2">
              <input type="radio" value={t} {...register('enrollmentType')} className="sr-only" />
              <div className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${type === t ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-medium' : 'border-muted-foreground/30 text-muted-foreground hover:border-brand-primary/50'}`}>
                {t === 'free' ? 'Free' : t === 'one-time' ? 'One-time purchase' : t === 'subscription' ? 'Subscription only' : 'Both'}
              </div>
            </label>
          ))}
        </div>
      </div>

      {isPaid && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <select id="currency" {...register('currency')} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
                {(['USD', 'EUR', 'SAR', 'EGP', 'GBP'] as const).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="price">Price *</Label>
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={0.01}
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    placeholder="49.99"
                  />
                )}
              />
              {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="salePrice">Sale Price (optional)</Label>
            <Controller
              control={control}
              name="salePrice"
              render={({ field }) => (
                <Input
                  id="salePrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="29.99"
                />
              )}
            />
            {savings > 0 && (
              <p className="mt-1 text-xs text-green-600">
                Students save {savings}% — {formatPrice(price - (salePrice ?? 0), currency)}
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Platform fee: 20% of each sale. You keep 80%.
          </p>
        </div>
      )}

      <div className="flex gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onBack}>← Back</Button>
        <Button type="button" variant="outline" disabled={isSaving} onClick={handleSubmit((d) => void onSave(toPayload(d), false))}>
          {isSaving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button type="button" variant="brand" disabled={isSaving} onClick={handleSubmit((d) => void onSave(toPayload(d), true))}>
          Next: Media →
        </Button>
      </div>
    </form>
  );
}
