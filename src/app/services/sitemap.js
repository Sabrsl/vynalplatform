import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Récupère les services pour le sitemap
 * @returns {Promise<Array>} - Liste des services avec les propriétés slug, updatedAt et createdAt
 */
export async function getServicesForSitemap() {
  try {
    // Créer un client Supabase sans cookies pour l'accès public
    const supabase = createServerComponentClient({ cookies });
    
    // Récupérer uniquement les services actifs et approuvés
    const { data, error } = await supabase
      .from('services')
      .select('slug, updated_at, created_at')
      .eq('active', true)
      .eq('status', 'approved');
    
    if (error) {
      console.error('Erreur lors de la récupération des services pour le sitemap:', error);
      return [];
    }
    
    // Reformater les données pour le sitemap
    return data.map(service => ({
      slug: service.slug,
      updatedAt: service.updated_at,
      createdAt: service.created_at
    }));
  } catch (error) {
    console.error('Exception lors de la récupération des services pour le sitemap:', error);
    return [];
  }
}

/**
 * Sitemap statique pour la section services
 */
export default function sitemap() {
  return [
    {
      url: '/services',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    }
  ];
} 