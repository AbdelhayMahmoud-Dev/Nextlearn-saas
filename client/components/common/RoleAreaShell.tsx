import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { RoleSidebar, type NavItem } from './RoleSidebar';

/** Shared chrome for instructor/admin/superadmin areas: sidebar + top bar. */
export function RoleAreaShell({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block">
        <RoleSidebar title={title} items={items} />
      </div>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to NextLearn
          </Link>
          <span className="font-heading font-semibold lg:hidden">{title}</span>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
