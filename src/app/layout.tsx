import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import MainLayout from '@/components/layout/main-layout';

// Utilisation de la police Inter
const inter = Inter({ subsets: ['latin'] });

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
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  );
} 