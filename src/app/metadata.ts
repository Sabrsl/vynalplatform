import { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vynalplatform.com';
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '';

const metadata: Metadata = {
  title: 'Vynal Platform | Plateforme de Freelance en Afrique | Trouvez des talents freelances',
  description: 'Vynal Platform connecte les meilleurs freelances africains avec des clients locaux et internationaux. Trouvez des talents dans le développement web, le design, le marketing et plus.',
  keywords: 'freelance Afrique, marketplace talents africains, plateforme freelance Sénégal, recrutement freelance, talents africains, développeurs web africains, designers africains',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Vynal Platform | La Première Plateforme de Freelance en Afrique',
    description: 'Trouvez des talents freelance africains qualifiés ou proposez vos services en toute sécurité sur Vynal Platform.',
    url: siteUrl,
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
    canonical: siteUrl,
    types: {
      'application/rss+xml': `${siteUrl}/rss.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  ...(googleVerification ? {
    verification: {
      google: googleVerification,
    },
    other: {
      'google-site-verification': googleVerification,
    }
  } : {})
};

export default metadata; 