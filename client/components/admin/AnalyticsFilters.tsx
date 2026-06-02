'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  categories: string[];
  category: string;
  onCategory: (c: string) => void;
  onExport: () => void;
}

/** Filter bar for the analytics page. */
export function AnalyticsFilters({ categories, category, onCategory, onExport }: Props): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
      <select value={category} onChange={(e) => onCategory(e.target.value)} aria-label="Filter by category" className="rounded-lg border bg-background px-3 py-2 text-sm">
        <option value="">All categories</option>
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="size-4" /> Export CSV
      </Button>
    </div>
  );
}
