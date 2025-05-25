"use server";

import { cookies } from 'next/headers';
import { getSupabaseServer } from '@/lib/supabase/server';
import { Category, Subcategory } from '@/app/services/server';
import { Talent } from '@/components/talents/TalentCard';
import { revalidatePath } from 'next/cache';

// Types exportés
export type { Category, Subcategory };

export interface TalentsPageData {
  talents: Talent[];
  categories: Category[];
  subcategories: Subcategory[];
  totalCount: number;
}

// Types pour les données brutes
interface FreelanceSkill {
  skills: {
    name: string;
  };
}

interface FreelanceCategory {
  categories: {
    id: string;
    name: string;
    slug: string;
  };
  subcategories: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface FreelanceData {
  id: string;
  bio?: string;
  hourly_rate?: number;
  currency_code?: string;
  years_experience?: number;
  location?: string;
  availability?: 'available' | 'limited' | 'unavailable';
  profiles?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    is_certified?: boolean;
    certification_type?: 'standard' | 'premium' | 'expert' | null;
  };
  freelance_skills?: FreelanceSkill[];
  freelance_categories?: FreelanceCategory[];
}

interface RatingData {
  freelance_id: string;
  avg_rating: number;
  reviews_count: number;
}

interface CountData {
  freelance_id: string;
  count: number;
}

export async function revalidateTalents() {
  revalidatePath('/talents');
  return { revalidated: true, now: Date.now() };
}

export async function getTalentsPageData() {
  const cookieStore = cookies();
  const supabase = getSupabaseServer();
  
  // Récupérer les catégories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (categoriesError) {
    console.error('Erreur lors de la récupération des catégories:', categoriesError);
  }
  
  // Récupérer les sous-catégories
  const { data: subcategories, error: subcategoriesError } = await supabase
    .from('subcategories')
    .select('*')
    .order('name');
  
  if (subcategoriesError) {
    console.error('Erreur lors de la récupération des sous-catégories:', subcategoriesError);
  }
  
  // Récupérer les freelances depuis la table profiles
  const { data: freelances, error: freelancesError, count } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      bio,
      is_certified,
      certification_type,
      country,
      currency_preference,
      role,
      is_active,
      created_at,
      specialty
    `, { count: 'exact' })
    .eq('role', 'freelance')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(24);
  
  if (freelancesError) {
    console.error('Erreur lors de la récupération des freelances:', freelancesError);
  }
  
  // Obtenir les évaluations moyennes pour chaque freelance
  let ratings: any[] = [];
  try {
    // Calculer directement les évaluations moyennes à partir de la table reviews
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('freelance_id, rating');
      
    if (reviewsError) {
      console.error('Erreur lors de la récupération des avis:', reviewsError);
    } else if (reviewsData && reviewsData.length > 0) {
      // Regrouper les avis par freelance_id et calculer la moyenne
      const ratingsMap: Record<string, { sum: number; count: number }> = {};
      reviewsData.forEach((review: { freelance_id: string; rating: number }) => {
        if (!ratingsMap[review.freelance_id]) {
          ratingsMap[review.freelance_id] = {
            sum: 0,
            count: 0
          };
        }
        ratingsMap[review.freelance_id].sum += review.rating;
        ratingsMap[review.freelance_id].count += 1;
      });
      
      // Convertir en format compatible
      ratings = Object.entries(ratingsMap).map(([freelance_id, data]) => ({
        freelance_id,
        avg_rating: data.sum / data.count,
        reviews_count: data.count
      }));
    } else {
      console.log('Aucun avis trouvé dans la base de données');
      ratings = [];
    }
  } catch (error) {
    console.error('Exception lors de la récupération des évaluations:', error);
    ratings = [];
  }
  
  // Obtenir le nombre de services pour chaque freelance
  const servicesCountMap: Record<string, number> = {};
  try {
    // Récupérer tous les services actifs sans filtrer par statut
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('freelance_id, status')
      .eq('active', true);
    
    if (servicesError) {
      throw servicesError;
    }
    
    // Ajouter un log pour déboguer
    console.log('Tous les services actifs trouvés:', servicesData?.length || 0);
    
    if (servicesData && servicesData.length > 0) {
      // Log des statuts pour déboguer
      const statusCounts: Record<string, number> = {};
      servicesData.forEach((service: { status: string }) => {
        statusCounts[service.status] = (statusCounts[service.status] || 0) + 1;
      });
      console.log('Statuts des services:', JSON.stringify(statusCounts));
      
      // Compter tous les services actifs par freelance, indépendamment du statut
      servicesData.forEach((service: { freelance_id: string }) => {
        const { freelance_id } = service;
        if (freelance_id) {
          servicesCountMap[freelance_id] = (servicesCountMap[freelance_id] || 0) + 1;
        }
      });
      
      // Log des compteurs pour déboguer
      console.log('Services par freelance:', JSON.stringify(servicesCountMap));
    }
    
    // Récupérer les IDs des freelances pour lesquels nous avons trouvé des talents
    const freelanceIds = (freelances || []).map((f: any) => f.id).filter(Boolean);
    
    // S'assurer que chaque freelance a une entrée dans la map, même si c'est 0
    freelanceIds.forEach(id => {
      if (id && !servicesCountMap[id]) {
        servicesCountMap[id] = 0;
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de services:', error);
  }
  
  // Obtenir le nombre de projets terminés pour chaque freelance
  const projectsCountMap: Record<string, number> = {};
  try {
    // Récupérer tous les projets terminés
    const { data: projectsData, error: projectsError } = await supabase
      .from('orders')
      .select('freelance_id')
      .eq('status', 'completed');
    
    if (projectsError) {
      throw projectsError;
    }
    
    if (projectsData && projectsData.length > 0) {
      // Compter le nombre de projets par freelance
      projectsData.forEach((project: { freelance_id: string }) => {
        const { freelance_id } = project;
        if (freelance_id) {
          projectsCountMap[freelance_id] = (projectsCountMap[freelance_id] || 0) + 1;
        }
      });
    }
    
    // Récupérer les IDs des freelances pour lesquels nous avons trouvé des talents
    const freelanceIds = (freelances || []).map((f: any) => f.id).filter(Boolean);
    
    // S'assurer que chaque freelance a une entrée dans la map, même si c'est 0
    freelanceIds.forEach(id => {
      if (id && !projectsCountMap[id]) {
        projectsCountMap[id] = 0;
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des projets terminés:', error);
  }
  
  // Transformer les données pour correspondre au type Talent
  const talents: Talent[] = (freelances || [])
    .filter((freelance: any) => {
      // Vérifier que le freelance a une description et une spécialité non vides
      return freelance.bio && 
             freelance.specialty && 
             freelance.bio.trim() !== '' && 
             freelance.specialty.trim() !== '';
    })
    .map((freelance: any) => {
      // Trouver l'évaluation moyenne et le nombre d'avis pour ce freelance
      const freelanceRating = ratings?.find((r: any) => r.freelance_id === freelance.id);
      
      // Obtenir les compteurs depuis nos maps
      // Utiliser une approche plus robuste pour s'assurer qu'un nombre est retourné
      const servicesCount = typeof servicesCountMap[freelance.id] === 'number' ? servicesCountMap[freelance.id] : 0;
      const completedProjectsCount = typeof projectsCountMap[freelance.id] === 'number' ? projectsCountMap[freelance.id] : 0;
      
      // Log pour déboguer chaque freelance
      console.log(`Freelance ${freelance.id} (${freelance.username}): ${servicesCount} services, ${completedProjectsCount} projets`);
      
      // Extraire les compétences
      const skills = freelance.freelance_skills?.map((skill: any) => ({
        name: skill.skills.name
      })) || [];
      
      return {
        id: freelance.id,
        username: freelance.username,
        full_name: freelance.full_name,
        avatar_url: freelance.avatar_url,
        bio: freelance.bio,
        skills,
        location: freelance.country,
        hourly_rate: freelance.currency_preference,
        currency_code: freelance.currency_code,
        rating: freelanceRating?.avg_rating || 0,
        review_count: freelanceRating?.reviews_count || 0,
        is_certified: freelance.is_certified,
        certification_type: freelance.certification_type,
        completed_projects: completedProjectsCount,
        years_experience: freelance.years_experience,
        availability: freelance.availability,
        services_count: servicesCount,
        specialty: freelance.specialty
      };
    });
  
  return {
    talents,
    categories: categories || [],
    subcategories: subcategories || [],
    totalCount: count || 0
  };
} 