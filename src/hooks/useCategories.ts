import { useState, useEffect } from 'react';
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

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Récupérer les catégories avec un ordre explicite (ID=UUID dans le seed)
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');
        
        if (categoriesError) throw categoriesError;
        
        // Récupérer les sous-catégories
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('subcategories')
          .select('*');
        
        if (subcategoriesError) throw subcategoriesError;
        
        console.debug('Catégories récupérées:', categoriesData?.length || 0);
        console.debug('Sous-catégories récupérées:', subcategoriesData?.length || 0);
        
        // Valider chaque catégorie récupérée
        if (categoriesData) {
          // Vérifier si les IDs des catégories correspondent au seed
          categoriesData.forEach((cat: Category) => {
            const expectedId = CATEGORY_NAMES_TO_IDS[cat.name];
            if (expectedId && cat.id !== expectedId) {
              console.warn(`La catégorie "${cat.name}" a un ID différent de celui du seed: ${cat.id} (attendu: ${expectedId})`);
            }
          });
        }
        
        // Valider que chaque sous-catégorie a une catégorie parent valide
        if (subcategoriesData) {
          const validSubcategories = subcategoriesData.filter((subcat: Subcategory) => {
            // Vérifier si la catégorie parent existe
            const hasValidCategory = categoriesData?.some((cat: Category) => cat.id === subcat.category_id);
            if (!hasValidCategory) {
              console.warn(`Sous-catégorie "${subcat.name}" (ID: ${subcat.id}) a une catégorie parent invalide: ${subcat.category_id}`);
            }
            return hasValidCategory;
          });
          
          // Si des sous-catégories ont été filtrées, log un avertissement
          if (validSubcategories.length !== subcategoriesData.length) {
            console.warn(`${subcategoriesData.length - validSubcategories.length} sous-catégories ont été filtrées car leurs catégories parent n'existent pas`);
          }
          
          setSubcategories(validSubcategories);
        } else {
          setSubcategories([]);
        }
        
        setCategories(categoriesData || []);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des catégories:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
    
    // Souscrire aux changements des catégories en temps réel
    const categoriesSubscription = supabase
      .channel('categories-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'categories',
      }, () => {
        // Recharger les données quand il y a un changement
        fetchCategories();
      })
      .subscribe();
    
    // Souscrire aux changements des sous-catégories en temps réel
    const subcategoriesSubscription = supabase
      .channel('subcategories-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subcategories',
      }, () => {
        // Recharger les données quand il y a un changement
        fetchCategories();
      })
      .subscribe();
    
    return () => {
      categoriesSubscription.unsubscribe();
      subcategoriesSubscription.unsubscribe();
    };
  }, []);

  // Récupérer les sous-catégories d'une catégorie
  const getSubcategoriesByCategoryId = (categoryId: string) => {
    const result = subcategories.filter(subcategory => subcategory.category_id === categoryId);
    console.debug(`Sous-catégories pour la catégorie ${categoryId}:`, result.length);
    return result;
  };

  return {
    categories,
    subcategories,
    loading,
    error,
    getSubcategoriesByCategoryId
  };
} 