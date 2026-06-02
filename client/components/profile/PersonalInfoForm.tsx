'use client';

import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { IUser } from '@/types';
import { useUpdateProfile } from '@/hooks/useProfile';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const optionalUrl = z.string().url('Enter a valid URL').or(z.literal('')).optional();

const schema = z.object({
  name: z.string().min(2, 'Name is too short').max(100),
  bio: z.string().max(1000).optional(),
  avatar: optionalUrl,
  website: optionalUrl,
  twitter: z.string().max(120).optional(),
  linkedin: z.string().max(120).optional(),
});
type Values = z.infer<typeof schema>;

/** Personal-info tab: name, bio, avatar (URL), and social links. */
export function PersonalInfoForm({ user }: { user: IUser }): JSX.Element {
  const update = useUpdateProfile();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name,
      bio: user.bio ?? '',
      avatar: user.avatar ?? '',
      website: user.socialLinks?.website ?? '',
      twitter: user.socialLinks?.twitter ?? '',
      linkedin: user.socialLinks?.linkedin ?? '',
    },
  });
  const avatar = watch('avatar');

  const onSubmit = (v: Values): void => {
    update.mutate(
      {
        name: v.name,
        bio: v.bio,
        avatar: v.avatar || undefined,
        socialLinks: {
          website: v.website || undefined,
          twitter: v.twitter || undefined,
          linkedin: v.linkedin || undefined,
        },
      },
      { onSuccess: () => toast.success('Profile updated'), onError: (e) => toast.error(e.message) },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="flex items-center gap-4">
        <span className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-brand-primary/10 font-heading text-lg font-semibold text-brand-primary">
          {avatar ? (
            <Image src={avatar} alt={user.name} width={64} height={64} className="object-cover" />
          ) : (
            getInitials(user.name)
          )}
        </span>
        <p className="text-xs text-muted-foreground">
          Paste an image URL below. Direct upload arrives with Cloudinary.
        </p>
      </div>

      <Field id="name" label="Name" error={errors.name?.message}>
        <Input id="name" {...register('name')} />
      </Field>
      <Field id="avatar" label="Avatar URL" error={errors.avatar?.message}>
        <Input id="avatar" placeholder="https://…" {...register('avatar')} />
      </Field>
      <Field id="bio" label="Bio" error={errors.bio?.message}>
        <textarea
          id="bio"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('bio')}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field id="website" label="Website" error={errors.website?.message}>
          <Input id="website" placeholder="https://…" {...register('website')} />
        </Field>
        <Field id="twitter" label="Twitter">
          <Input id="twitter" placeholder="@handle" {...register('twitter')} />
        </Field>
        <Field id="linkedin" label="LinkedIn">
          <Input id="linkedin" placeholder="profile" {...register('linkedin')} />
        </Field>
      </div>

      <Button type="submit" variant="brand" disabled={!isDirty || update.isPending}>
        {update.isPending && <Loader2 className="size-4 animate-spin" />} Save changes
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
