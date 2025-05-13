/**
 * Enum pour les clés de cache - Documentation et typage
 * 
 * Pratiques de nommage standardisées:
 * - Utiliser le séparateur ":" entre les segments de noms
 * - Format: domaine:sous-domaine:type
 * - Exemples:
 *   - services:list - Liste des services
 *   - user:client:stats - Statistiques d'un client
 */
export enum CacheKeyPrefix {
  // Services (explorateur public)
  ServicesList = 'services:list',
  ServicesDetail = 'services:detail',
  ServicesFeatured = 'services:featured',
  ServicesSearch = 'services:search',
  ServicesCategory = 'services:category',
  
  // Dashboard client
  ClientDashboard = 'user:client:dashboard',
  ClientStats = 'user:client:stats',
  ClientActivities = 'user:client:activities',
  ClientOrders = 'user:client:orders',
  ClientMessages = 'user:client:messages',
  ClientRecommendations = 'user:client:recommendations',
  
  // Dashboard freelance
  FreelanceDashboard = 'user:freelance:dashboard',
  FreelanceStats = 'user:freelance:stats',
  FreelanceActivities = 'user:freelance:activities',
  FreelanceOrders = 'user:freelance:orders',
  FreelanceServices = 'user:freelance:services',
  
  // Avis et évaluations
  ReviewsList = 'reviews:list',
  ReviewsDetail = 'reviews:detail',
  ReviewsRating = 'reviews:rating',
  ReviewsStats = 'reviews:stats',
  
  // Catégories et paramètres
  Categories = 'taxonomy:categories',
  Subcategories = 'taxonomy:subcategories',
  Settings = 'system:settings',
}

/**
 * Groupes de clés de cache qui sont liés entre eux
 * Lors de l'invalidation, tous les membres du groupe peuvent être invalidés ensemble
 */
export enum CacheGroup {
  Services = 'services',
  ServiceDetails = 'service_details',
  FeaturedServices = 'featured_services',
  ClientStats = 'client_stats',
  ClientActivities = 'client_activities',
  ClientDashboard = 'client_dashboard',
  FreelanceStats = 'freelance_stats',
  FreelanceActivities = 'freelance_activities',
  FreelanceDashboard = 'freelance_dashboard',
  Reviews = 'reviews',
  Taxonomy = 'taxonomy'
}

/**
 * Interface pour les paramètres de cache standardisés
 * Tous les paramètres optionnels pertinents qui peuvent être inclus dans une clé de cache
 */
export interface CacheParams {
  // Paramètres d'identification
  userId?: string;
  serviceId?: string;
  orderId?: string;
  messageId?: string;
  freelanceId?: string;
  
  // Paramètres de filtrage
  categoryId?: string;
  subcategoryId?: string;
  searchTerm?: string;
  featured?: boolean;
  active?: boolean;
  
  // Paramètres de pagination
  page?: number;
  pageSize?: number;
  
  // Paramètres de tri
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Paramètres d'inclusion
  includeActivities?: boolean;
  includeRecentOrders?: boolean;
  includeDetails?: boolean;
  
  // Mode de requête
  mode?: string;
  
  // Date de référence pour les données temporelles
  referenceDate?: string;
}

/**
 * Mapper les préfixes d'enum aux clés de chaîne pour compatibilité
 */
export const CACHE_KEY_MAP: Record<string, CacheKeyPrefix> = {
  SERVICES_LIST: CacheKeyPrefix.ServicesList,
  SERVICES_DETAIL: CacheKeyPrefix.ServicesDetail,
  SERVICES_FEATURED: CacheKeyPrefix.ServicesFeatured,
  SERVICES_SEARCH: CacheKeyPrefix.ServicesSearch,
  SERVICES_CATEGORY: CacheKeyPrefix.ServicesCategory,
  
  CLIENT_DASHBOARD: CacheKeyPrefix.ClientDashboard,
  CLIENT_STATS: CacheKeyPrefix.ClientStats,
  CLIENT_ACTIVITIES: CacheKeyPrefix.ClientActivities,
  CLIENT_ORDERS: CacheKeyPrefix.ClientOrders,
  CLIENT_MESSAGES: CacheKeyPrefix.ClientMessages,
  CLIENT_RECOMMENDATIONS: CacheKeyPrefix.ClientRecommendations,
  
  FREELANCE_DASHBOARD: CacheKeyPrefix.FreelanceDashboard,
  FREELANCE_STATS: CacheKeyPrefix.FreelanceStats,
  FREELANCE_ACTIVITIES: CacheKeyPrefix.FreelanceActivities,
  FREELANCE_ORDERS: CacheKeyPrefix.FreelanceOrders,
  FREELANCE_SERVICES: CacheKeyPrefix.FreelanceServices,
  
  REVIEWS_LIST: CacheKeyPrefix.ReviewsList,
  REVIEWS_DETAIL: CacheKeyPrefix.ReviewsDetail,
  REVIEWS_RATING: CacheKeyPrefix.ReviewsRating,
  REVIEWS_STATS: CacheKeyPrefix.ReviewsStats,
  
  CATEGORIES: CacheKeyPrefix.Categories,
  SUBCATEGORIES: CacheKeyPrefix.Subcategories,
  SETTINGS: CacheKeyPrefix.Settings
}; 