import { Brain, Camera, Code, Database, LineChart, Megaphone, Palette, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Browsable course categories shown on the homepage grid and the navbar dropdown.
 *
 * `slug` is the value stored on `Course.category` and used as the
 * `/courses?category=<slug>` filter — it is the single source of truth that keeps
 * the grid links, the navbar dropdown, and the catalog filter in sync.
 */
export interface CategoryDef {
  /** Human-readable label. */
  name: string;
  /** Stored category value + catalog filter query param. */
  slug: string;
  icon: LucideIcon;
  /** Tinted background for the icon tile (works in light & dark). */
  bg: string;
  /** Icon color token. */
  iconColor: string;
}

export const CATEGORIES: CategoryDef[] = [
  { name: 'Development', slug: 'Development', icon: Code, bg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
  { name: 'Design', slug: 'Design', icon: Palette, bg: 'bg-pink-500/10', iconColor: 'text-pink-400' },
  { name: 'Business', slug: 'Business', icon: LineChart, bg: 'bg-green-500/10', iconColor: 'text-green-400' },
  { name: 'Marketing', slug: 'Marketing', icon: Megaphone, bg: 'bg-orange-500/10', iconColor: 'text-orange-400' },
  { name: 'Data Science', slug: 'Data Science', icon: Database, bg: 'bg-purple-500/10', iconColor: 'text-purple-400' },
  { name: 'Photography', slug: 'Photography', icon: Camera, bg: 'bg-yellow-500/10', iconColor: 'text-yellow-400' },
  { name: 'AI', slug: 'ai-ml', icon: Brain, bg: 'bg-violet-500/10', iconColor: 'text-violet-400' },
  { name: 'Cybersecurity', slug: 'cybersecurity', icon: Shield, bg: 'bg-red-500/10', iconColor: 'text-red-400' },
];

/** Builds the catalog filter href for a category slug. */
export function categoryHref(slug: string): string {
  return `/courses?category=${encodeURIComponent(slug)}`;
}
