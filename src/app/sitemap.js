import { getServicesForSitemap } from './services/sitemap';

// Marquer cette route comme dynamique pour assurer la fraîcheur du contenu
export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalider quotidiennement

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vynalplatform.com';
  const currentDate = new Date().toISOString();
  
  // Routes principales - contenu dynamique
  const mainRoutes = [
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/services`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9
    },
    {
      url: `${baseUrl}/freelances-africains`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9
    }
  ];

  // Routes informatives - mises à jour mensuelles
  const infoRoutes = [
    '/about',
    '/how-it-works',
    '/devenir-freelance'
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'monthly',
    priority: 0.8
  }));

  // Routes support - mises à jour moins fréquentes
  const supportRoutes = [
    {
      url: `${baseUrl}/faq`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6
    }
  ];

  // Pages légales - rarement modifiées
  const legalRoutes = [
    '/privacy-policy',
    '/terms-of-service',
    '/code-of-conduct'
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'yearly',
    priority: 0.3
  }));

  // Récupérer les services dynamiques pour le sitemap
  let serviceRoutes = [];
  try {
    const services = await getServicesForSitemap();
    serviceRoutes = services.map(service => ({
      url: `${baseUrl}/services/${service.slug}`,
      lastModified: new Date(service.updatedAt || service.createdAt).toISOString(),
      changeFrequency: 'weekly',
      priority: 0.7
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des services pour le sitemap:', error);
    // En cas d'erreur, on continue avec un sitemap partiel
  }
  
  // Fusionner toutes les routes
  const allRoutes = [
    ...mainRoutes,
    ...infoRoutes, 
    ...supportRoutes,
    ...legalRoutes,
    ...serviceRoutes
  ];
  
  return allRoutes;
}