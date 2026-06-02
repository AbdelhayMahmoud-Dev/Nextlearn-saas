'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useChangePassword } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { DeviceSessionsCard } from '@/components/profile/DeviceSessionsCard';
import { LoginHistoryCard } from '@/components/profile/LoginHistoryCard';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-z]/, 'Add a lowercase letter')
      .regex(/[A-Z]/, 'Add an uppercase letter')
      .regex(/[0-9]/, 'Add a number'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });
type Values = z.infer<typeof schema>;

/** Security tab: change password, active sessions, sign out everywhere. */
export function SecurityTab(): JSX.Element {
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = (v: Values): void => {
    change.mutate(
      { currentPassword: v.currentPassword, newPassword: v.newPassword },
      {
        onSuccess: async () => {
          toast.success('Password changed — please sign in again');
          await signOut({ callbackUrl: '/login' });
        },
        onError: (e) => {
          if (e.statusCode === 400) setError('currentPassword', { message: e.message });
          else toast.error(e.message);
        },
      },
    );
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
        <h3 className="font-heading text-lg font-semibold">Change password</h3>
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <PasswordInput id="currentPassword" autoComplete="current-password" {...register('currentPassword')} />
          {errors.currentPassword && (
            <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput id="newPassword" autoComplete="new-password" {...register('newPassword')} />
          {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <PasswordInput id="confirm" autoComplete="new-password" {...register('confirm')} />
          {errors.confirm && <p className="text-sm text-destructive">{errors.confirm.message}</p>}
        </div>
        <Button type="submit" variant="brand" disabled={change.isPending}>
          {change.isPending && <Loader2 className="size-4 animate-spin" />} Update password
        </Button>
      </form>

      <DeviceSessionsCard />

      <LoginHistoryCard />
    </div>
  );
}
