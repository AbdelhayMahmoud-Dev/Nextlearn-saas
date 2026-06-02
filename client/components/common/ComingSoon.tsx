import { Construction } from 'lucide-react';

/** Placeholder for areas scaffolded but not yet implemented. */
export function ComingSoon({ title, phase }: { title: string; phase: string }): JSX.Element {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
        <Construction className="size-7" />
      </span>
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This area is part of {phase} and is coming soon.
      </p>
    </div>
  );
}
