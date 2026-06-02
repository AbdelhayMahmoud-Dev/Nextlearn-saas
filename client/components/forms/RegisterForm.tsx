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
import { PasswordInput } from './PasswordInput';
import { GoogleButton } from './GoogleButton';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name is too short').max(100),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-z]/, 'Add a lowercase letter')
      .regex(/[A-Z]/, 'Add an uppercase letter')
      .regex(/[0-9]/, 'Add a number'),
    confirmPassword: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
type RegisterValues = z.infer<typeof registerSchema>;

const ASSIGNABLE_FIELDS = ['name', 'email', 'password', 'confirmPassword'] as const;

function strength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return { score, label: ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][score] ?? 'Too weak' };
}

/** Account registration via the Express API; shows a verify-email confirmation on success. */
export function RegisterForm(): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const password = watch('password') ?? '';
  const meter = strength(password);

  const onSubmit = async (values: RegisterValues): Promise<void> => {
    setSubmitting(true);
    try {
      await apiClient.post('/auth/register', {
        name: values.name,
        email: values.email,
        password: values.password,
      });
      setDone(true);
    } catch (error) {
      const apiError = error as ApiErrorShape;
      if (apiError.fieldErrors) {
        for (const [field, messages] of Object.entries(apiError.fieldErrors)) {
          if ((ASSIGNABLE_FIELDS as readonly string[]).includes(field)) {
            setError(field as (typeof ASSIGNABLE_FIELDS)[number], { message: messages[0] });
          }
        }
      }
      toast.error(apiError.message ?? 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto size-12 text-brand-primary" />
        <h2 className="font-heading text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a verification link to your inbox. Verify your email to activate your
          account.
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
        <Label htmlFor="name">Full name</Label>
        <Input id="name" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
        {password.length > 0 && (
          <div className="flex items-center gap-2" aria-hidden="true">
            <div className="flex h-1.5 flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-full flex-1 rounded-full ${i < meter.score ? 'bg-brand-primary' : 'bg-muted'}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{meter.label}</span>
          </div>
        )}
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} {...register('confirmPassword')} />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-0.5 size-4 rounded border-input" {...register('terms')} />
        <span className="text-muted-foreground">
          I agree to the Terms of Service and Privacy Policy.
        </span>
      </label>
      {errors.terms && <p className="text-sm text-destructive">{errors.terms.message}</p>}

      <Button type="submit" variant="brand" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Create account
      </Button>

      <GoogleButton />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
