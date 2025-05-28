import { SupabaseClient } from '@supabase/supabase-js';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Construit une requête de recherche en évitant les problèmes avec les relations et PostgREST
 * 
 * @param query - La requête Supabase de base
 * @param searchTerm - Le terme de recherche à utiliser
 * @param fields - Les champs dans lesquels rechercher (sans inclure categories.name qui cause des problèmes)
 * @returns La requête avec le filtre de recherche appliqué
 */
export function buildSearchQuery<T>(
  query: PostgrestFilterBuilder<any, any, any>,
  searchTerm: string,
  fields: string[]
): PostgrestFilterBuilder<any, any, any> {
  if (!searchTerm?.trim() || fields.length === 0) {
    return query;
  }

  const term = searchTerm.trim().toLowerCase();
  console.log(`Building safe search query for term: "${term}"`);
  
  // N'utiliser que les champs directs (sans relations) pour la recherche
  const safeFields = fields.filter(field => !field.includes('.'));
  
  if (safeFields.length > 0) {
    // Recherche dans les champs directs avec .or()
    const firstField = safeFields[0];
    console.log(`First safe condition: ${firstField}.ilike.%${term}%`);
    
    let result = query.or(`${firstField}.ilike.%${term}%`);
    
    // Ajouter d'autres conditions OR seulement pour les champs directs
    for (let i = 1; i < safeFields.length; i++) {
      console.log(`Adding OR safe condition: ${safeFields[i]}.ilike.%${term}%`);
      result = result.or(`${safeFields[i]}.ilike.%${term}%`);
    }
    
    return result;
  }
  
  return query;
}

/**
 * Utilitaire pour ajouter des filtres de recherche courants
 * en évitant les problèmes de recherche sur les relations
 * 
 * @param query - La requête de base à étendre
 * @param options - Options de filtrage
 * @returns La requête avec les filtres appliqués
 */
export function addCommonFilters(
  query: PostgrestFilterBuilder<any, any, any>,
  options: {
    categoryId?: string;
    subcategoryId?: string;
    freelanceId?: string;
    active?: boolean;
    searchTerm?: string;
    fields?: string[];
  }
) {
  const { categoryId, subcategoryId, freelanceId, active, searchTerm, fields = [] } = options;
  
  // Filtres de base
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  if (subcategoryId) {
    query = query.eq('subcategory_id', subcategoryId);
  }
  
  if (freelanceId) {
    query = query.eq('freelance_id', freelanceId);
  }
  
  if (active !== undefined) {
    query = query.eq('active', active);
  }
  
  // Appliquer la recherche uniquement sur les champs directs
  // (sans relation comme categories.name qui cause des problèmes)
  if (searchTerm && fields.length > 0) {
    const directFields = fields.filter(field => !field.includes('.'));
    if (directFields.length > 0) {
      query = buildSearchQuery(query, searchTerm, directFields);
    }
  }
  
  return query;
} 