'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, MailCheck } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({ email: z.string().email('Enter a valid email address') });
type Values = z.infer<typeof schema>;

/** Requests a password-reset link from the Express API. */
export function ForgotPasswordForm(): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values): Promise<void> => {
    setSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', values);
      setSent(true);
    } catch (error) {
      toast.error((error as ApiErrorShape).message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto size-12 text-brand-primary" />
        <h2 className="font-heading text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          If an account exists for that address, we&apos;ve sent a password reset link.
        </p>
        <Button asChild variant="brand" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" variant="brand" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Send reset link
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link href="/login" className="text-brand-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
