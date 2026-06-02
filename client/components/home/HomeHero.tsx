import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCounter } from './StatCounter';

interface HomeHeroProps {
  stats: { courses: number; students: number; instructors: number };
}

/** Marketing hero with animated gradient + real platform stats. */
export function HomeHero({ stats }: HomeHeroProps): JSX.Element {
  const items = [
    { value: stats.courses, label: 'Courses' },
    { value: stats.students, label: 'Students' },
    { value: stats.instructors, label: 'Instructors' },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="hero-gradient absolute inset-0 -z-10 opacity-[0.12]" aria-hidden="true" />
      <div className="container flex flex-col items-center gap-6 py-24 text-center md:py-32">
        <span className="rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
          A premium learning experience
        </span>
        <h1 className="max-w-3xl font-heading text-4xl font-bold tracking-tight md:text-6xl">
          Learn without limits, <span className="text-brand-primary">grow without ceilings</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Master in-demand skills with expert-led courses, hands-on projects, and shareable
          certificates.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="brand" size="lg">
            <Link href="/courses">
              Browse courses <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Get started free</Link>
          </Button>
        </div>
        <dl className="mt-8 grid grid-cols-3 gap-8 sm:gap-12">
          {items.map((s) => (
            <div key={s.label}>
              <dt className="font-heading text-3xl font-bold">
                <StatCounter value={s.value} />
              </dt>
              <dd className="text-sm text-muted-foreground">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
