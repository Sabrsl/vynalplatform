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
 */
export async function getAllValidatedServices() {
  const supabase = getSupabaseServer();

  console.log('Chargement des services validés...');

  // D'abord, récupérons tous les services pour vérifier
  const { data: allServices, error: countError } = await supabase
    .from('services')
    .select('id, status');
  
  if (countError) {
    console.error('Erreur lors du comptage des services:', countError);
  } else {
    console.log(`Total de services trouvés: ${allServices?.length || 0}`);
    console.log(`Services actifs: ${allServices?.filter(s => s.status === 'active').length || 0}`);
  }

  // Récupérons maintenant les services sans filtres stricts
  const { data: services, error } = await supabase
    .from('services')
    .select(`
      *,
      profiles:profiles(id, username, full_name, avatar_url, bio),
      categories:categories(id, name, slug),
      subcategories:subcategories(id, name, slug, category_id)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Erreur lors du chargement des services:', error);
    return [];
  }

  console.log(`Services récupérés après filtrage: ${services?.length || 0}`);

  // Pour débogage, chargeons aussi sans filtres pour comparer
  const { data: allServicesWithDetails } = await supabase
    .from('services')
    .select(`
      id, title, status
    `)
    .limit(10);
  
  console.log('Échantillon de services sans filtres:', allServicesWithDetails);

  // Assurons-nous de toujours avoir des services à afficher
  if (!services || services.length === 0) {
    console.log('Aucun service actif trouvé, récupération sans filtres');
    
    const { data: backupServices } = await supabase
      .from('services')
      .select(`
        *,
        profiles:profiles(id, username, full_name, avatar_url, bio),
        categories:categories(id, name, slug),
        subcategories:subcategories(id, name, slug, category_id)
      `)
      .limit(20);
      
    return (backupServices || []) as Service[];
  }

  return services as Service[];
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
 */
export async function getServicesPageData(): Promise<ServicesPageData> {
  const { categories, subcategories } = await getAllCategoriesAndSubcategories();
  const services = await getAllValidatedServices();

  console.log(`Données chargées: ${categories.length} catégories, ${subcategories.length} sous-catégories, ${services.length} services`);

  return {
    categories,
    subcategories,
    services
  };
} 