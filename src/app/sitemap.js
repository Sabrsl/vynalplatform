import { getServicesForSitemap } from './services/sitemap';

// Marquer cette route comme dynamique
export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vynalplatform.com';
  
  // Routes statiques
  const staticRoutes = [
    '',
    '/services',
    '/about',
    '/how-it-works',
    '/faq',
    '/contact',
    '/privacy-policy',
    '/terms-of-service',
    '/code-of-conduct',
    '/devenir-freelance',
    '/freelances-africains',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : route === '/freelances-africains' ? 0.9 : 0.8
  }));

  // Récupérer les services dynamiques pour le sitemap
  let serviceRoutes = [];
  try {
    const services = await getServicesForSitemap();
    serviceRoutes = services.map(service => ({
      url: `${baseUrl}/services/${service.slug}`,
      lastModified: new Date(service.updatedAt || service.createdAt),
      changeFrequency: 'weekly',
      priority: 0.7
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des services pour le sitemap:', error);
  }
  
  return [...staticRoutes, ...serviceRoutes];
} 