import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Vynal Platform',
  description: 'Contactez l\'équipe Vynal pour toute question ou assistance',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
} 