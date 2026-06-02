'use client';

import { WIZARD_STEPS, type WizardStep } from '@/hooks/useCourseBuilder';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  currentStep: WizardStep;
  children: React.ReactNode;
}

/**
 * Shell for the 5-step course creation wizard.
 * Renders a progress bar with step chips and wraps the active step content.
 */
export function CourseWizard({ currentStep, children }: Props): JSX.Element {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Step progress bar */}
      <nav aria-label="Course creation steps" className="mb-8">
        <ol className="flex items-center gap-0">
          {WIZARD_STEPS.map((s, idx) => {
            const done = s.number < currentStep;
            const active = s.number === currentStep;
            return (
              <li key={s.number} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold',
                      done
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : active
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-muted-foreground/30 text-muted-foreground/60',
                    )}
                    aria-current={active ? 'step' : undefined}
                  >
                    {done ? <CheckCircle2 className="size-4" aria-hidden="true" /> : s.number}
                  </div>
                  <span
                    className={cn(
                      'hidden text-[10px] sm:block',
                      active ? 'font-semibold text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 h-0.5 flex-1',
                      done ? 'bg-brand-primary' : 'bg-muted-foreground/20',
                    )}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Active step content */}
      <div className="rounded-xl border bg-card p-6">{children}</div>
    </div>
  );
}
