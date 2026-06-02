import { GraduationCap } from 'lucide-react';
import type { CSSProperties } from 'react';

interface Props {
  platformName: string;
  primaryColor: string;
  accentColor: string;
  logo?: string;
}

/** Isolated live preview of the brand colors (uses scoped CSS variables). */
export function BrandPreview({ platformName, primaryColor, accentColor, logo }: Props): JSX.Element {
  const style = { '--preview-primary': primaryColor, '--preview-accent': accentColor } as CSSProperties;
  return (
    <div style={style} className="space-y-4 rounded-xl border bg-card p-5">
      <p className="text-sm font-medium text-muted-foreground">Live preview</p>

      {/* Mini navbar */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2 font-heading font-bold">
          <span className="flex size-7 items-center justify-center rounded-md text-white" style={{ background: 'var(--preview-primary)' }}>
            {logo ? <img src={logo} alt="" className="size-7 rounded-md object-cover" /> : <GraduationCap className="size-4" />}
          </span>
          {platformName || 'NextLearn'}
        </div>
        <span className="rounded-md px-3 py-1 text-xs font-medium text-white" style={{ background: 'var(--preview-primary)' }}>Sign in</span>
      </div>

      {/* Sample course card */}
      <div className="overflow-hidden rounded-lg border">
        <div className="h-20" style={{ background: `linear-gradient(120deg, var(--preview-primary), var(--preview-accent))` }} />
        <div className="p-3">
          <p className="text-xs font-medium" style={{ color: 'var(--preview-primary)' }}>Development</p>
          <p className="font-heading text-sm font-semibold">Sample Course Title</p>
          <span className="mt-2 inline-block rounded-md px-3 py-1 text-xs font-medium text-white" style={{ background: 'var(--preview-primary)' }}>
            Enroll now
          </span>
        </div>
      </div>
    </div>
  );
}
