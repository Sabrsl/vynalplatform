import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

// Type pour les catégories
export type Category = Database['public']['Tables']['categories']['Row'];
export type Subcategory = Database['public']['Tables']['subcategories']['Row'];

// IDs des catégories du seed
const CATEGORY_IDS = {
  DEV: '10000000-0000-0000-0000-000000000001',
  DESIGN: '20000000-0000-0000-0000-000000000002',
  MARKETING: '30000000-0000-0000-0000-000000000003',
  REDACTION: '40000000-0000-0000-0000-000000000004',
  VIDEO: '50000000-0000-0000-0000-000000000005',
  FORMATION: '60000000-0000-0000-0000-000000000006',
  BUSINESS: '70000000-0000-0000-0000-000000000007',
  ARTISANAT: '80000000-0000-0000-0000-000000000008',
  AGRICULTURE: '90000000-0000-0000-0000-000000000009',
  INFORMATIQUE: 'a0000000-0000-0000-0000-00000000000a',
  ADMIN: 'b0000000-0000-0000-0000-00000000000b',
  MODE: 'c0000000-0000-0000-0000-00000000000c',
  RELIGION: 'd0000000-0000-0000-0000-00000000000d',
  SANTE: 'e0000000-0000-0000-0000-00000000000e'
};

// Mapping entre les noms de catégories et leurs IDs
const CATEGORY_NAMES_TO_IDS: Record<string, string> = {
  'Développement Web & Mobile': CATEGORY_IDS.DEV,
  'Design Graphique': CATEGORY_IDS.DESIGN,
  'Marketing Digital': CATEGORY_IDS.MARKETING,
  'Rédaction & Traduction': CATEGORY_IDS.REDACTION,
  'Vidéo & Audio': CATEGORY_IDS.VIDEO,
  'Formation & Éducation': CATEGORY_IDS.FORMATION,
  'Conseil & Business': CATEGORY_IDS.BUSINESS,
  'Artisanat & Création': CATEGORY_IDS.ARTISANAT,
  'Agriculture & Élevage': CATEGORY_IDS.AGRICULTURE,
  'Informatique & Réseaux': CATEGORY_IDS.INFORMATIQUE,
  'Services Administratifs': CATEGORY_IDS.ADMIN,
  'Mode & Beauté': CATEGORY_IDS.MODE,
  'Religion & Spiritualité': CATEGORY_IDS.RELIGION,
  'Santé & Bien-être': CATEGORY_IDS.SANTE
};

// Cache local pour éviter des requêtes répétées
const cache = {
  categories: null as Category[] | null,
  subcategories: null as Subcategory[] | null,
  lastUpdate: 0
};

// TTL du cache (10 minutes)
const CACHE_TTL = 10 * 60 * 1000;

export function useCategories() {
  const [state, setState] = useState<{
    categories: Category[];
    subcategories: Subcategory[];
    loading: boolean;
    error: string | null;
  }>({
    categories: [],
    subcategories: [],
    loading: true,
    error: null
  });
  
  const mountedRef = useRef(true);
  const subscriptionsRef = useRef<{
    categories: any | null;
    subcategories: any | null;
  }>({
    categories: null,
    subcategories: null
  });

  // Fonction mémorisée pour récupérer les données
  const fetchCategories = useCallback(async (forceRefresh = false) => {
    // Utiliser le cache si disponible et valide
    const now = Date.now();
    if (!forceRefresh && 
        cache.categories && 
        cache.subcategories && 
        (now - cache.lastUpdate < CACHE_TTL)) {
      setState(prev => ({
        ...prev,
        categories: cache.categories || [],
        subcategories: cache.subcategories || [],
        loading: false
      }));
      return;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Récupérer les catégories avec un ordre explicite
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');
      
      if (categoriesError) throw categoriesError;
      
      // Récupérer les sous-catégories
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*');
      
      if (subcategoriesError) throw subcategoriesError;
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('Catégories récupérées:', categoriesData?.length || 0);
        console.debug('Sous-catégories récupérées:', subcategoriesData?.length || 0);
      }
      
      // Valider les données
      let validatedCategories = categoriesData || [];
      let validatedSubcategories = subcategoriesData || [];
      
      if (process.env.NODE_ENV === 'development') {
        // Vérifications uniquement en développement
        // Valider chaque catégorie récupérée
        if (categoriesData) {
          categoriesData.forEach((cat: Category) => {
            const expectedId = CATEGORY_NAMES_TO_IDS[cat.name];
            if (expectedId && cat.id !== expectedId) {
              console.warn(`La catégorie "${cat.name}" a un ID différent de celui du seed: ${cat.id} (attendu: ${expectedId})`);
            }
          });
        }
        
        // Valider que chaque sous-catégorie a une catégorie parent valide
        if (subcategoriesData) {
          validatedSubcategories = subcategoriesData.filter((subcat: Subcategory) => {
            // Vérifier si la catégorie parent existe
            const hasValidCategory = categoriesData?.some((cat: Category) => cat.id === subcat.category_id);
            if (!hasValidCategory) {
              console.warn(`Sous-catégorie "${subcat.name}" (ID: ${subcat.id}) a une catégorie parent invalide: ${subcat.category_id}`);
            }
            return hasValidCategory;
          });
          
          // Si des sous-catégories ont été filtrées, log un avertissement
          if (validatedSubcategories.length !== subcategoriesData.length) {
            console.warn(`${subcategoriesData.length - validatedSubcategories.length} sous-catégories ont été filtrées car leurs catégories parent n'existent pas`);
          }
        }
      }
      
      // Mettre à jour le cache
      cache.categories = validatedCategories;
      cache.subcategories = validatedSubcategories;
      cache.lastUpdate = now;
      
      // Mettre à jour l'état seulement si le composant est toujours monté
      if (mountedRef.current) {
        setState({
          categories: validatedCategories,
          subcategories: validatedSubcategories,
          loading: false,
          error: null
        });
      }
    } catch (err: any) {
      console.error('Erreur lors de la récupération des catégories:', err);
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Une erreur est survenue'
        }));
      }
    }
  }, []);
  
  // Effet pour charger les données et configurer les souscriptions
  useEffect(() => {
    mountedRef.current = true;
    
    // Charger les données
    fetchCategories();
    
    // Configurer les souscriptions en temps réel
    subscriptionsRef.current.categories = supabase
      .channel('categories-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'categories',
      }, () => fetchCategories(true))
      .subscribe();
    
    subscriptionsRef.current.subcategories = supabase
      .channel('subcategories-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subcategories',
      }, () => fetchCategories(true))
      .subscribe();
    
    return () => {
      mountedRef.current = false;
      
      // Nettoyer les souscriptions
      if (subscriptionsRef.current.categories) {
        supabase.removeChannel(subscriptionsRef.current.categories);
      }
      if (subscriptionsRef.current.subcategories) {
        supabase.removeChannel(subscriptionsRef.current.subcategories);
      }
    };
  }, [fetchCategories]);

  // Fonction mémorisée pour récupérer les sous-catégories d'une catégorie
  const getSubcategoriesByCategoryId = useCallback((categoryId: string) => {
    const result = state.subcategories.filter(subcategory => subcategory.category_id === categoryId);
    return result;
  }, [state.subcategories]);

  // Créer un objet mémorisé pour éviter les recréations lors du rendu
  const value = useMemo(() => ({
    categories: state.categories,
    subcategories: state.subcategories,
    loading: state.loading,
    error: state.error,
    getSubcategoriesByCategoryId
  }), [
    state.categories,
    state.subcategories,
    state.loading,
    state.error,
    getSubcategoriesByCategoryId
  ]);

  return value;
} 