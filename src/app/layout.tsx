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
    <html lang="fr" suppressHydrationWarning className="overflow-x-hidden">
      <body className={`${poppins.variable} font-poppins transition-colors duration-300`}>
        <Providers>
          <Suspense fallback={<Loading />}>
            <MainLayout>
              {children}
            </MainLayout>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
} 