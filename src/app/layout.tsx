import './globals.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { Providers } from './providers';
import MainLayout from '@/components/layout/main-layout';
import { ThemeProvider } from 'next-themes';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';

// Utilisation de la police Poppins
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const inter = Inter({ subsets: ['latin'] });

function Loading() {
  return <div className="p-6 animate-pulse bg-vynal-purple-dark min-h-screen text-vynal-text-primary">Chargement de la page...</div>;
}

export const metadata: Metadata = {
  title: 'Vynal Platform | Mise en relation freelances et clients',
  description: 'Plateforme de mise en relation entre freelances et clients pour des services de qualité',
  keywords: 'freelance, clients, services, marketplace, gig economy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning className="overflow-x-hidden no-scrollbar">
      <body className={`${poppins.variable} font-poppins transition-colors duration-300 no-scrollbar`}>
        <Providers>
          <Suspense fallback={<Loading />}>
            <MainLayout>
              {children}
            </MainLayout>
          </Suspense>
          <div id="navigation-progress-indicator" className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-vynal-purple-primary via-vynal-accent-primary to-vynal-purple-primary bg-size-200 animate-gradient-x z-50 hidden" />
        </Providers>
      </body>
    </html>
  );
} 