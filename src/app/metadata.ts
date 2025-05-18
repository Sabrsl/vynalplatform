import { Metadata } from "next";

const metadata: Metadata = {
  title: 'Vynal Platform | Plateforme de Freelance en Afrique | Trouvez des talents freelances',
  description: 'Vynal Platform connecte les meilleurs freelances africains avec des clients locaux et internationaux. Trouvez des talents dans le développement web, le design, le marketing et plus.',
  keywords: 'freelance Afrique, marketplace talents africains, plateforme freelance Sénégal, recrutement freelance, talents africains, développeurs web africains, designers africains',
  openGraph: {
    title: 'Vynal Platform | La Première Plateforme de Freelance en Afrique',
    description: 'Trouvez des talents freelance africains qualifiés ou proposez vos services en toute sécurité sur Vynal Platform.',
    url: 'https://vynalplatform.com',
    siteName: 'Vynal Platform',
    images: [
      {
        url: '/assets/images/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Vynal Platform - La Première Plateforme de Freelance en Afrique'
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vynal Platform | Talents Freelance en Afrique',
    description: 'Connectez-vous avec les meilleurs freelances africains sur Vynal Platform.',
    images: ['/assets/images/og-home.jpg'],
  },
  alternates: {
    canonical: 'https://vynalplatform.com',
  }
};

export default metadata; 