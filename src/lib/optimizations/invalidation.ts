import { 
  invalidateCache, 
  requestManager,
} from './cache';

import {
  CacheKeyPrefix,
  CacheGroup,
  CacheParams,
  CACHE_KEY_MAP
} from './cache-keys';

// Type pour les groupes de dépendances
export interface CacheDependencyGroup {
  name: string;
  keys: string[];
  dependsOn?: string[];
  priority: 'high' | 'medium' | 'low';
}

/**
 * Clés de cache standardisées
 * Pour compatibilité avec le code existant
 */
export const CACHE_KEYS = {
  // Services (explorateur public)
  SERVICES_LIST: CacheKeyPrefix.ServicesList,
  SERVICES_DETAIL: CacheKeyPrefix.ServicesDetail,
  SERVICES_FEATURED: CacheKeyPrefix.ServicesFeatured,
  SERVICES_SEARCH: CacheKeyPrefix.ServicesSearch,
  SERVICES_CATEGORY: CacheKeyPrefix.ServicesCategory,
  
  // Dashboards client
  CLIENT_DASHBOARD: CacheKeyPrefix.ClientDashboard,
  CLIENT_STATS: CacheKeyPrefix.ClientStats,
  CLIENT_ACTIVITIES: CacheKeyPrefix.ClientActivities,
  CLIENT_ORDERS: CacheKeyPrefix.ClientOrders,
  CLIENT_MESSAGES: CacheKeyPrefix.ClientMessages,
  CLIENT_RECOMMENDATIONS: CacheKeyPrefix.ClientRecommendations,
  
  // Dashboards freelance
  FREELANCE_DASHBOARD: CacheKeyPrefix.FreelanceDashboard,
  FREELANCE_STATS: CacheKeyPrefix.FreelanceStats,
  FREELANCE_ACTIVITIES: CacheKeyPrefix.FreelanceActivities,
  FREELANCE_ORDERS: CacheKeyPrefix.FreelanceOrders,
  FREELANCE_SERVICES: CacheKeyPrefix.FreelanceServices,
  
  // Avis et évaluations
  REVIEWS_LIST: CacheKeyPrefix.ReviewsList,
  REVIEWS_DETAIL: CacheKeyPrefix.ReviewsDetail,
  REVIEWS_RATING: CacheKeyPrefix.ReviewsRating,
  REVIEWS_STATS: CacheKeyPrefix.ReviewsStats,
  
  // Catégories et paramètres
  CATEGORIES: CacheKeyPrefix.Categories,
  SUBCATEGORIES: CacheKeyPrefix.Subcategories,
  SETTINGS: CacheKeyPrefix.Settings,
};

// Définition des groupes de dépendances de cache
const CACHE_DEPENDENCY_GROUPS: CacheDependencyGroup[] = [
  // Services (explorateur public)
  {
    name: CacheGroup.Services,
    keys: [
      CacheKeyPrefix.ServicesList,
      CacheKeyPrefix.ServicesSearch,
      CacheKeyPrefix.ServicesCategory
    ],
    priority: 'high'
  },
  {
    name: CacheGroup.ServiceDetails,
    keys: [
      CacheKeyPrefix.ServicesDetail
    ],
    dependsOn: [CacheGroup.Services],
    priority: 'medium'
  },
  {
    name: CacheGroup.FeaturedServices,
    keys: [
      CacheKeyPrefix.ServicesFeatured
    ],
    dependsOn: [CacheGroup.Services],
    priority: 'high'
  },
  
  // Avis et évaluations
  {
    name: CacheGroup.Reviews,
    keys: [
      CacheKeyPrefix.ReviewsList,
      CacheKeyPrefix.ReviewsDetail,
      CacheKeyPrefix.ReviewsRating,
      CacheKeyPrefix.ReviewsStats
    ],
    dependsOn: [CacheGroup.Services, CacheGroup.FreelanceStats],
    priority: 'high'
  },
  
  // Dashboard Client
  {
    name: CacheGroup.ClientStats,
    keys: [
      CacheKeyPrefix.ClientStats
    ],
    priority: 'high'
  },
  {
    name: CacheGroup.ClientActivities,
    keys: [
      CacheKeyPrefix.ClientActivities
    ],
    priority: 'medium'
  },
  {
    name: CacheGroup.ClientDashboard,
    keys: [
      CacheKeyPrefix.ClientDashboard,
      CacheKeyPrefix.ClientOrders,
      CacheKeyPrefix.ClientMessages,
      CacheKeyPrefix.ClientRecommendations
    ],
    dependsOn: [CacheGroup.ClientStats, CacheGroup.ClientActivities],
    priority: 'high'
  },
  
  // Dashboard Freelance
  {
    name: CacheGroup.FreelanceStats,
    keys: [
      CacheKeyPrefix.FreelanceStats
    ],
    priority: 'high'
  },
  {
    name: CacheGroup.FreelanceActivities,
    keys: [
      CacheKeyPrefix.FreelanceActivities
    ],
    priority: 'medium'
  },
  {
    name: CacheGroup.FreelanceDashboard,
    keys: [
      CacheKeyPrefix.FreelanceDashboard,
      CacheKeyPrefix.FreelanceOrders,
      CacheKeyPrefix.FreelanceServices
    ],
    dependsOn: [CacheGroup.FreelanceStats, CacheGroup.FreelanceActivities, CacheGroup.Services],
    priority: 'high'
  },
  
  // Taxonomie
  {
    name: CacheGroup.Taxonomy,
    keys: [
      CacheKeyPrefix.Categories,
      CacheKeyPrefix.Subcategories
    ],
    priority: 'medium'
  }
];

// Fonction utilitaire pour générer des clés de cache standardisées
export const makeCacheKey = (base: CacheKeyPrefix | string, params: CacheParams = {}): string => {
  if (Object.keys(params).length === 0) {
    return base.toString();
  }
  
  // Tri des paramètres par clé pour garantir la cohérence
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result: Record<string, any>, key: string) => {
      // Ignorer les valeurs undefined ou null
      if (params[key as keyof CacheParams] !== undefined && params[key as keyof CacheParams] !== null) {
        // Normaliser les chaînes de recherche (trim et lowercase)
        if (key === 'searchTerm' && typeof params.searchTerm === 'string') {
          result[key] = params.searchTerm.trim().toLowerCase();
        } else {
          result[key] = params[key as keyof CacheParams];
        }
      }
      return result;
    }, {});
  
  return `${base}:${JSON.stringify(sortedParams)}`;
};

// Classe pour gérer les invalidations de cache avec leurs dépendances
class CacheInvalidationManager {
  private static instance: CacheInvalidationManager;
  private groups: Map<string, CacheDependencyGroup>;
  private pendingInvalidations: Set<string> = new Set();
  private processingInvalidations: boolean = false;
  
  private constructor() {
    this.groups = new Map();
    CACHE_DEPENDENCY_GROUPS.forEach(group => {
      this.groups.set(group.name, group);
    });
  }
  
  // Singleton pattern
  public static getInstance(): CacheInvalidationManager {
    if (!CacheInvalidationManager.instance) {
      CacheInvalidationManager.instance = new CacheInvalidationManager();
    }
    return CacheInvalidationManager.instance;
  }
  
  // Invalider un groupe de cache et ses dépendants
  public invalidateGroup(groupName: CacheGroup | string): number {
    // Ajouter à la file d'attente des invalidations
    this.pendingInvalidations.add(groupName);
    
    // Traiter les invalidations si pas déjà en cours
    if (!this.processingInvalidations) {
      return this.processInvalidations();
    }
    
    return 0;
  }
  
  // Invalider une clé spécifique
  public invalidateKey(key: CacheKeyPrefix | string, includePrefix: boolean = true): boolean {
    let result = false;
    
    // Invalider la clé directement
    result = invalidateCache(key.toString());
    
    // Rechercher les groupes qui contiennent cette clé
    if (includePrefix) {
      this.groups.forEach((group, groupName) => {
        const matchesPrefix = group.keys.some(groupKey => 
          key.toString().startsWith(groupKey) || groupKey.startsWith(key.toString())
        );
        
        if (matchesPrefix) {
          this.pendingInvalidations.add(groupName);
        }
      });
      
      // Traiter les invalidations si pas déjà en cours
      if (this.pendingInvalidations.size > 0 && !this.processingInvalidations) {
        this.processInvalidations();
      }
    }
    
    // Émettre un événement d'invalidation
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { 
        detail: { key, type: 'direct-invalidation' }
      }));
    }
    
    return result;
  }
  
  // Traiter les invalidations en attente
  private processInvalidations(): number {
    if (this.pendingInvalidations.size === 0) return 0;
    
    this.processingInvalidations = true;
    const processedGroups = new Set<string>();
    let totalInvalidated = 0;
    
    // Fonction récursive pour traiter un groupe et ses dépendants
    const processGroup = (groupName: string) => {
      // Éviter les traitements en double
      if (processedGroups.has(groupName)) return;
      processedGroups.add(groupName);
      
      const group = this.groups.get(groupName);
      if (!group) return;
      
      // Invalider les clés du groupe
      group.keys.forEach(key => {
        if (invalidateCache(key)) {
          totalInvalidated++;
          
          // Émettre un événement spécifique pour cette clé
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { 
              detail: { key, groupName, type: 'group-invalidation' }
            }));
          }
        }
      });
      
      // Trouver et traiter les groupes dépendants
      this.groups.forEach((dependentGroup, dependentName) => {
        if (dependentGroup.dependsOn && dependentGroup.dependsOn.includes(groupName)) {
          processGroup(dependentName);
        }
      });
    };
    
    // Traiter tous les groupes en attente
    this.pendingInvalidations.forEach(groupName => {
      processGroup(groupName);
    });
    
    // Réinitialiser l'état
    this.pendingInvalidations.clear();
    this.processingInvalidations = false;
    
    // Émettre un événement global pour signaler que des invalidations ont eu lieu
    if (totalInvalidated > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vynal:cache-bulk-invalidated', { 
        detail: { count: totalInvalidated, groups: Array.from(processedGroups) }
      }));
    }
    
    return totalInvalidated;
  }
  
  // Invalider toutes les clés qui correspondent à un préfixe
  public invalidateByPrefix(prefix: CacheKeyPrefix | string): number {
    let count = 0;
    
    // Trouver tous les groupes dont les clés commencent par ce préfixe
    this.groups.forEach((group, groupName) => {
      const matchesPrefix = group.keys.some(key => key.startsWith(prefix.toString()));
      if (matchesPrefix) {
        this.pendingInvalidations.add(groupName);
        count++;
      }
    });
    
    // Traiter les invalidations si des correspondances ont été trouvées
    if (count > 0 && !this.processingInvalidations) {
      return this.processInvalidations();
    }
    
    return 0;
  }
  
  // Invalider toutes les clés qui correspondent à un utilisateur
  public invalidateByUserId(userId: string): number {
    if (!userId) return 0;
    
    let count = 0;
    
    // Invalider manuellement les clés spécifiques à cet utilisateur en utilisant makeCacheKey
    [
      makeCacheKey(CacheKeyPrefix.ClientStats, { userId }),
      makeCacheKey(CacheKeyPrefix.ClientDashboard, { userId }),
      makeCacheKey(CacheKeyPrefix.ClientActivities, { userId }),
      makeCacheKey(CacheKeyPrefix.FreelanceStats, { userId }),
      makeCacheKey(CacheKeyPrefix.FreelanceDashboard, { userId }),
      makeCacheKey(CacheKeyPrefix.FreelanceActivities, { userId })
    ].forEach(key => {
      if (invalidateCache(key)) {
        count++;
        
        // Émettre un événement d'invalidation
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { 
            detail: { key, userId, type: 'user-invalidation' }
          }));
        }
      }
    });
    
    return count;
  }
}

// Exporter l'instance singleton
export const cacheInvalidationManager = CacheInvalidationManager.getInstance();

// Fonction utilitaire pour invalider un groupe de cache
export function invalidateCacheGroup(groupName: CacheGroup | string): number {
  return cacheInvalidationManager.invalidateGroup(groupName);
}

// Fonction utilitaire pour invalider les caches liés à un utilisateur
export function invalidateUserCache(userId: string): number {
  return cacheInvalidationManager.invalidateByUserId(userId);
}

// Fonction utilitaire pour invalider toutes les clés qui correspondent à un préfixe
export function invalidateCacheByPrefix(prefix: CacheKeyPrefix | string): number {
  return cacheInvalidationManager.invalidateByPrefix(prefix);
} 