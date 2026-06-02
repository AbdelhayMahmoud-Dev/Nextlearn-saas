import { InstructorSidebar } from '@/components/instructor/InstructorSidebar';
import { InstructorTopBar } from '@/components/instructor/InstructorTopBar';

/**
 * Instructor area layout. Route protection (`instructor|admin|superadmin`)
 * is handled upstream by `middleware.ts`.
 *
 * Structure:
 *   Desktop: fixed sidebar + scrollable main
 *   Mobile:  sidebar hidden, TopBar has hamburger to open it
 */
export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — hidden on mobile, always visible on lg+ */}
      <div className="hidden lg:flex lg:shrink-0">
        <InstructorSidebar />
      </div>

      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <InstructorTopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
