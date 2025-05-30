/**
 * Fonctions serveur pour la page des services
 * Ce fichier contient toutes les fonctions nécessaires au chargement des données
 * de la page des services côté serveur lors du build time
 */

import { getSupabaseServer } from '@/lib/supabase/server';

// Définitions de types pour les entités
export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  created_at?: string;
};

export type Subcategory = {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  description?: string;
  created_at?: string;
};

export type Profile = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  is_certified?: boolean;
  certification_type?: 'standard' | 'premium' | 'expert' | null;
};

export type Service = {
  id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  subcategory_id: string;
  user_id: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  created_at: string;
  updated_at?: string;
  delivery_time?: number;
  revision_count?: number;
  freelance_id?: string;
  profiles?: Profile;
  categories?: Category;
  subcategories?: Subcategory;
  slug?: string;
};

/**
 * Charge toutes les catégories et sous-catégories
 */
export async function getAllCategoriesAndSubcategories() {
  const supabase = getSupabaseServer();
  
  // Récupération des catégories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .order('id');

  if (categoriesError) {
    console.error('Erreur lors du chargement des catégories:', categoriesError);
    return { categories: [], subcategories: [] };
  }

  // Récupération des sous-catégories
  const { data: subcategories, error: subcategoriesError } = await supabase
    .from('subcategories')
    .select('*')
    .order('id');

  if (subcategoriesError) {
    console.error('Erreur lors du chargement des sous-catégories:', subcategoriesError);
    return { categories: categories || [], subcategories: [] };
  }

  return {
    categories: categories as Category[],
    subcategories: subcategories as Subcategory[]
  };
}

/**
 * Charge tous les services actifs et validés
 * @param options Options de récupération
 */
export async function getAllValidatedServices(options?: { noCache?: string }) {
  const supabase = getSupabaseServer(options);

  // Récupération des services actifs et validés
  const { data: services, error } = await supabase
    .from('services')
    .select(`
      *,
      profiles:profiles(id, username, full_name, avatar_url, bio, is_certified, certification_type),
      categories:categories(id, name, slug),
      subcategories:subcategories(id, name, slug, category_id)
    `)
    .eq('status', 'approved')  // Uniquement le statut approuvé
    .eq('active', true)        // Et actif
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Erreur lors du chargement des services:', error);
    return [];
  }

  if (!services || services.length === 0) {
    console.log('Aucun service approuvé trouvé');
    
    // Vérifier s'il existe des services approuvés mais inactifs pour le debug
    if (options?.noCache) {
      const { data: inactiveServices } = await supabase
        .from('services')
        .select('id, title, status, active')
        .eq('status', 'approved')
        .limit(5);
        
      if (inactiveServices && inactiveServices.length > 0) {
        console.log('Debug: Services approuvés:', 
          inactiveServices.map(s => `ID: ${s.id.substring(0, 8)}, Titre: ${s.title.substring(0, 20)}, Active: ${s.active}`).join(', '));
      }
    }
    
    return [];
  }

  // Appliquer un tri intelligent aux services
  const smartSortedServices = smartSortServices(services);

  return smartSortedServices as Service[];
}

/**
 * Tri intelligent des services basé sur plusieurs critères
 * Cette fonction est utilisée côté serveur pour préordonner les services
 */
function smartSortServices(services: any[]): any[] {
  // Calculer un score pour chaque service
  const servicesWithScores = services.map(service => {
    // Facteur 1: Fraîcheur (services récents)
    const creationTime = new Date(service.created_at).getTime();
    const now = Date.now();
    const ageInDays = (now - creationTime) / (1000 * 60 * 60 * 24);
    
    // Score de fraîcheur: décroissance exponentielle (0.95^ageInDays)
    const freshnessScore = Math.pow(0.95, Math.min(ageInDays, 60)) * 100;
    
    // Facteur 2: Qualité du freelance (certification)
    const certificationScore = service.profiles?.is_certified
      ? (service.profiles.certification_type === 'expert' ? 30 :
         service.profiles.certification_type === 'premium' ? 20 : 10)
      : 0;
    
    // Facteur 3: Complétude du service (description, détails, images)
    const completenessScore = (
      (service.description && service.description.length > 200 ? 10 : 0) +
      (service.delivery_time ? 5 : 0) +
      (service.revision_count ? 5 : 0)
    );
    
    // Score final combiné (0-100)
    const finalScore = Math.min(100, 
      (freshnessScore * 0.7) +  // 70% fraîcheur
      (certificationScore * 0.2) + // 20% certification
      (completenessScore * 0.1)  // 10% complétude
    );
    
    return { 
      ...service, 
      _score: finalScore  // Ajouter le score comme propriété temporaire
    };
  });
  
  // Trier par score décroissant
  servicesWithScores.sort((a, b) => b._score - a._score);
  
  // Retirer la propriété temporaire _score avant de retourner les services
  return servicesWithScores.map(service => {
    const { _score, ...cleanService } = service;
    return cleanService;
  });
}

/**
 * Type pour les données préchargées de la page des services
 */
export type ServicesPageData = {
  categories: Category[];
  subcategories: Subcategory[];
  services: Service[];
};

/**
 * Charge toutes les données pour la page des services
 * Cette fonction est utilisée pour générer la page statique
 * @param options Options de récupération
 */
export async function getServicesPageData(options?: { noCache?: string }): Promise<ServicesPageData> {
  const { categories, subcategories } = await getAllCategoriesAndSubcategories();
  const services = await getAllValidatedServices(options);

  // Log de debug pour voir combien de services sont approuvés et actifs
  console.log(`getServicesPageData: ${services.length} services approuvés et actifs récupérés`);

  return {
    categories,
    subcategories,
    services
  };
} 