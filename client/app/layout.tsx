import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { TenantThemeProvider } from '@/providers/TenantThemeProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import { cn } from '@/lib/utils';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'NextLearn — Learn without limits', template: '%s · NextLearn' },
  description: 'A premium white-label learning platform: courses, certificates, and live sessions.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
};

/** Root layout: fonts + provider stack (Theme → Session → Query) + toaster. */
export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning className={cn(GeistSans.variable, inter.variable)}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>
              <TenantThemeProvider>
                <SocketProvider>{children}</SocketProvider>
              </TenantThemeProvider>
              <Toaster richColors closeButton position="top-right" />
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
