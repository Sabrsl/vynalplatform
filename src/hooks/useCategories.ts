import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import { CACHE_EXPIRY, getCachedData, setCachedData } from '@/lib/optimizations/cache';
import { eventEmitter, EVENTS } from '@/lib/utils/events';

// Type pour les catégories
export type Category = Database['public']['Tables']['categories']['Row'];
export type Subcategory = Database['public']['Tables']['subcategories']['Row'];

// Types UI pour les composants qui nécessitent created_at obligatoire
export type UICategoryType = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  description?: string;
  icon?: string;
};

export type UISubcategoryType = {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  created_at: string;
  description?: string;
};

// Clés de cache pour les catégories et sous-catégories
const CATEGORIES_CACHE_KEY = 'global_categories';
const SUBCATEGORIES_CACHE_KEY = 'global_subcategories';

// Fonctions d'adaptation pour les composants UI
export const adaptCategoryForUI = (category: Category): UICategoryType => ({
  ...category,
  created_at: category.created_at || new Date().toISOString()
});

export const adaptSubcategoryForUI = (subcategory: Subcategory): UISubcategoryType => ({
  ...subcategory,
  created_at: subcategory.created_at || new Date().toISOString()
});

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
  SANTE: 'e0000000-0000-0000-0000-00000000000e',
  IA: 'f0000000-0000-0000-0000-00000000000f'
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
  'Santé & Bien-être': CATEGORY_IDS.SANTE,
  'Intelligence Artificielle': CATEGORY_IDS.IA
};

// Variables de contrôle pour la revalidation
let isRevalidating = false;
let lastRevalidationTime = 0;

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
    // Stratégie stale-while-revalidate:
    // 1. Servir les données du cache immédiatement si disponibles
    // 2. Vérifier si une revalidation est nécessaire en arrière-plan
    // 3. Revalider uniquement si les données sont périmées ou si forceRefresh est true
    
    // 1. Obtenir immédiatement les données du cache
    const cachedCategories = getCachedData<Category[]>(CATEGORIES_CACHE_KEY);
    const cachedSubcategories = getCachedData<Subcategory[]>(SUBCATEGORIES_CACHE_KEY);
    
    let shouldRevalidate = forceRefresh || !cachedCategories || !cachedSubcategories;
    
    // Utiliser les données en cache si disponibles
    if (cachedCategories && cachedSubcategories) {
      setState(prev => ({
        ...prev,
        categories: cachedCategories,
        subcategories: cachedSubcategories,
        loading: shouldRevalidate, // Continuer à montrer le chargement si on va revalider
        error: null
      }));
    } else {
      // Pas de cache disponible, afficher le chargement
      setState(prev => ({ 
        ...prev, 
        loading: true,
        error: null 
      }));
    }
    
    // 2. & 3. Revalider en arrière-plan si nécessaire
    if (shouldRevalidate && !isRevalidating) {
      // Prévenir les revalidations simultanées
      const now = Date.now();
      if (now - lastRevalidationTime < 5000 && !forceRefresh) {
        return; // Éviter la revalidation si moins de 5 secondes se sont écoulées
      }
      
      isRevalidating = true;
      lastRevalidationTime = now;
      
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
        
        // Valider les données
        let validatedCategories = categoriesData || [];
        let validatedSubcategories = subcategoriesData || [];
        
        // Sauvegarder dans le cache avec une priorité élevée et une longue durée
        setCachedData(CATEGORIES_CACHE_KEY, validatedCategories, {
          expiry: CACHE_EXPIRY.CATEGORIES,
          storage: 'both',
          priority: 'high'
        });
        
        setCachedData(SUBCATEGORIES_CACHE_KEY, validatedSubcategories, {
          expiry: CACHE_EXPIRY.SUBCATEGORIES,
          storage: 'both',
          priority: 'high'
        });
        
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
      } finally {
        isRevalidating = false;
      }
    }
  }, []);
  
  // Effet pour charger les données et configurer les souscriptions
  useEffect(() => {
    mountedRef.current = true;
    
    // Charger les données
    fetchCategories();
    
    // Configurer les souscriptions en temps réel avec throttling
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledRefresh = () => {
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      throttleTimeout = setTimeout(() => {
        fetchCategories(true);
        throttleTimeout = null;
      }, 5000); // Throttle à 5 secondes
    };
    
    // Configurer les subscriptions uniquement en dev/admin, pas nécessaire pour les utilisateurs normaux
    if (process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.pathname.includes('/admin'))) {
      subscriptionsRef.current.categories = supabase
        .channel('categories-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'categories',
        }, throttledRefresh)
        .subscribe();
      
      subscriptionsRef.current.subcategories = supabase
        .channel('subcategories-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'subcategories',
        }, throttledRefresh)
        .subscribe();
    }
    
    return () => {
      mountedRef.current = false;
      
      // Nettoyer les souscriptions
      if (subscriptionsRef.current.categories) {
        supabase.removeChannel(subscriptionsRef.current.categories);
      }
      if (subscriptionsRef.current.subcategories) {
        supabase.removeChannel(subscriptionsRef.current.subcategories);
      }
      
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [fetchCategories]);
  
  // Sélecteurs mémorisés pour optimiser les performances des composants
  const getCategoryById = useCallback((id: string): Category | undefined => {
    return state.categories.find(cat => cat.id === id);
  }, [state.categories]);
  
  const getCategoryBySlug = useCallback((slug: string): Category | undefined => {
    return state.categories.find(cat => cat.slug === slug);
  }, [state.categories]);
  
  const getSubcategoriesByCategoryId = useCallback((categoryId: string): Subcategory[] => {
    return state.subcategories.filter(subcat => subcat.category_id === categoryId);
  }, [state.subcategories]);
  
  const getSubcategoryBySlug = useCallback((slug: string): Subcategory | undefined => {
    return state.subcategories.find(subcat => subcat.slug === slug);
  }, [state.subcategories]);
  
  return {
    ...state,
    getCategoryById,
    getCategoryBySlug,
    getSubcategoriesByCategoryId,
    getSubcategoryBySlug,
    refresh: (force = true) => fetchCategories(force)
  };
} 