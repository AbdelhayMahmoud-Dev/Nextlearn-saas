'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({ email: z.string().email('Enter a valid email address') });
type Values = z.infer<typeof schema>;

/**
 * Early-access email capture. Validates client-side and shows a success state.
 * (Wiring to a newsletter/CRM provider is intentionally out of Phase 2 scope.)
 */
export function CtaBanner(): JSX.Element {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  return (
    <section className="relative overflow-hidden bg-brand-primary py-16 text-brand-primary-foreground">
      {/* Subtle dot pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="container relative max-w-2xl text-center">
        <h2 className="font-heading text-3xl font-bold">Start learning today</h2>
        <p className="mt-2 opacity-90">
          Join thousands of learners and get early access to new courses.
        </p>

        {done ? (
          <p className="mt-6 inline-flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-5" /> You&apos;re on the list! 🎉
          </p>
        ) : (
          <form
            onSubmit={handleSubmit(() => setDone(true))}
            className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
            noValidate
          >
            <Input
              type="email"
              placeholder="you@example.com"
              aria-label="Email address"
              className="bg-white text-foreground"
              {...register('email')}
            />
            <Button type="submit" variant="secondary">
              <Send className="size-4" /> Notify me
            </Button>
          </form>
        )}
        {errors.email && <p className="mt-2 text-sm">{errors.email.message}</p>}
      </div>
    </section>
  );
}
