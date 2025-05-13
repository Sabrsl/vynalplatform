import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Vynal Platform',
  description: 'Contactez l\'équipe Vynal pour toute question ou assistance',
};

// Ajouter l'option de revalidation plus courte (7 jours) car la page contient un formulaire
// mais la structure générale est statique
export const revalidate = 7 * 24 * 60 * 60; // 7 jours

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
} 