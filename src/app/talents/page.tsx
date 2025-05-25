import { Metadata } from 'next';
import { getTalentsPageData } from './server';
import TalentsClientPage from '@/components/talents/TalentsClientPage';

// Rendre la page des talents statique
export const dynamic = 'force-static';
export const revalidate = 3600; // 1 heure

// Métadonnées de la page pour SEO
export const metadata: Metadata = {
  title: 'Talents Freelances | Vynal - La plateforme de freelance africaine',
  description: 'Découvrez tous les talents freelances africains disponibles sur Vynal. Trouvez le freelance idéal pour votre projet parmi notre large communauté de professionnels qualifiés.',
  keywords: 'talents freelance, freelances africains, profils freelance, expertise, professionnels indépendants, talents Afrique, freelances Sénégal',
  alternates: {
    canonical: '/talents',
  },
  openGraph: {
    title: 'Talents Freelances | Vynal - La plateforme de freelance africaine',
    description: 'Découvrez tous les talents freelances disponibles sur Vynal. Trouvez le professionnel parfait pour votre projet parmi notre communauté de talents africains.',
    url: '/talents',
    type: 'website',
    images: [
      {
        url: '/assets/images/og-talents.jpg',
        width: 1200,
        height: 630,
        alt: 'Talents freelances Vynal Platform'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Talents Freelances | Vynal Platform',
    description: 'Découvrez tous les talents freelances disponibles en Afrique.',
    images: ['/assets/images/og-talents.jpg'],
  }
};

// Page des talents avec données issues du serveur
export default async function TalentsPage() {
  const data = await getTalentsPageData();
  const serializedData = JSON.stringify(data);
  
  return <TalentsClientPage initialData={serializedData} />;  
} 