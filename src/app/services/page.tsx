import { Metadata } from 'next';
import { getServicesPageData } from './server';
import ServicesClientPage from '@/components/services/ServicesClientPage';

// Rendre la page des services statique
export const dynamic = 'force-static';
export const revalidate = 604800; // 7 jours

// Métadonnées de la page pour SEO
export const metadata: Metadata = {
  title: 'Services Freelance | Vynal - La plateforme de freelance africaine',
  description: 'Découvrez tous les services freelance proposés par nos talents africains. Trouvez le prestataire idéal pour votre projet digital parmi notre large catalogue de freelances qualifiés.',
  keywords: 'services freelance, freelances africains, marketplace freelance, projets digitaux, talents africains, prestataires Sénégal, freelance Afrique',
  alternates: {
    canonical: '/services',
  },
  openGraph: {
    title: 'Services Freelance | Vynal - La plateforme de freelance africaine',
    description: 'Découvrez tous les services proposés par nos freelances talentueux. Trouvez le service parfait pour votre projet parmi notre large catalogue.',
    url: '/services',
    type: 'website',
    images: [
      {
        url: '/assets/images/og-services.jpg',
        width: 1200,
        height: 630,
        alt: 'Services freelance Vynal Platform'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Services Freelance | Vynal Platform',
    description: 'Découvrez tous les services proposés par nos freelances talentueux en Afrique.',
    images: ['/assets/images/og-services.jpg'],
  }
};

// Page des services avec données issues du serveur
export default async function ServicesPage() {
  const data = await getServicesPageData();
  const serializedData = JSON.stringify(data);
  
  return <ServicesClientPage initialData={serializedData} />;  
} 