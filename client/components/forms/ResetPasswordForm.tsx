'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from './PasswordInput';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-z]/, 'Add a lowercase letter')
      .regex(/[A-Z]/, 'Add an uppercase letter')
      .regex(/[0-9]/, 'Add a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
type Values = z.infer<typeof schema>;

/** Completes a password reset using the token from the URL. */
export function ResetPasswordForm(): JSX.Element {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values): Promise<void> => {
    setSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password: values.password });
      toast.success('Password reset — please sign in.');
      router.push('/login');
    } catch (error) {
      toast.error((error as ApiErrorShape).message ?? 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <AlertCircle className="mx-auto size-12 text-destructive" />
        <h2 className="font-heading text-xl font-semibold">Invalid reset link</h2>
        <p className="text-sm text-muted-foreground">
          This link is missing its token. Request a new one to continue.
        </p>
        <Button asChild variant="brand" className="w-full">
          <Link href="/forgot-password">Request new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} {...register('confirmPassword')} />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" variant="brand" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Reset password
      </Button>
    </form>
  );
}
