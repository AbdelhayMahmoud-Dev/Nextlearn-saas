import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { PageTransition } from '@/components/common/PageTransition';
import { MaintenanceBanner } from '@/components/common/MaintenanceBanner';

/** Public/student-facing layout: navbar + content + footer. */
export default function MainLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <MaintenanceBanner>
          <PageTransition>{children}</PageTransition>
        </MaintenanceBanner>
      </main>
      <Footer />
    </div>
  );
}
