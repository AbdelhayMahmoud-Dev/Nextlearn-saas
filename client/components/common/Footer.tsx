import Link from 'next/link';
import { Github, GraduationCap, Linkedin, Twitter } from 'lucide-react';

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Platform',
    links: [
      { label: 'Courses', href: '/courses' },
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Affiliate Program', href: '/affiliate' },
      { label: 'Pricing', href: '/#pricing' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

const SOCIALS: { label: string; href: string; icon: typeof Twitter }[] = [
  { label: 'X (Twitter)', href: 'https://x.com', icon: Twitter },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
  { label: 'GitHub', href: 'https://github.com', icon: Github },
];

/** Site footer: brand column + Platform / Company / Legal navigation + socials. */
export function Footer(): JSX.Element {
  return (
    <footer className="border-t-2 border-t-brand-primary/70 bg-card/40">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-primary text-brand-primary-foreground">
                <GraduationCap className="size-5" />
              </span>
              NextLearn
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Learn without limits — expert-led courses, hands-on projects, and shareable certificates.
            </p>
            <div className="mt-4 flex gap-2">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-brand-primary hover:text-brand-primary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="text-sm font-semibold">{col.heading}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} NextLearn. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
