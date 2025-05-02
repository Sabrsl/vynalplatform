"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';
import { usePaginatedServices } from '@/hooks/usePaginatedServices';
import { formatPrice } from '@/lib/utils';
import { ChevronRight, Filter, Search, RefreshCw, Grid, List, ArrowRight, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ServiceCard from '@/components/services/ServiceCard';
import CategoriesGrid from '@/components/categories/CategoriesGrid';
import SubcategoriesGrid from '@/components/categories/SubcategoriesGrid';
import ServiceResults from '@/components/categories/ServiceResults';
import SearchBar from '@/components/categories/SearchBar';
import BreadcrumbTrail from '@/components/categories/BreadcrumbTrail';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { testConnection } from '@/lib/supabase/client';
import { PaginationControls } from '@/components/ui/pagination';
import ServiceSkeletonLoader from '@/components/services/ServiceSkeletonLoader';
import { filterServicesBySearchTerm } from '@/lib/search/smartSearch';
import { PublicServicesPageSkeleton } from '@/components/skeletons/PublicServicesPageSkeleton';

// Ordre exact des catégories comme défini dans le seed.sql
const CATEGORY_ORDER = [
  'developpement-web-mobile',
  'design-graphique',
  'marketing-digital',
  'redaction-traduction',
  'video-audio',
  'formation-education',
  'conseil-business',
  'artisanat-creation',
  'agriculture-elevage',
  'informatique-reseaux',
  'services-administratifs',
  'mode-beaute',
  'religion-spiritualite',
  'sante-bien-etre'
];

// Statistiques pour la page
const STATS_DATA = {
  freelancersCount: '50+',
  clientsCount: '100+',
  totalPayments: '5M+ FCFA'
};

// Composant principal content
function ServicesPageContent() {
  // Hooks React et Next.js
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Extraction des paramètres d'URL
  const categorySlug = searchParams.get('category');
  const subcategorySlug = searchParams.get('subcategory');
  const page = Number(searchParams.get('page') || '1');
  const paginationMode = searchParams.get('mode') || 'pagination';
  const urlSearchQuery = searchParams.get('search') || '';
  
  // États locaux
  const [selectedCategory, setSelectedCategory] = useState(categorySlug);
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategorySlug);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  
  // Références
  const refs = useRef({
    mounted: true,
    forceRefresh: false,
    lastVisibilityTime: Date.now(),
    refreshTimer: null as ReturnType<typeof setTimeout> | null
  });
  
  // Obtenir les catégories
  const { 
    categories, 
    getSubcategoriesByCategoryId 
  } = useCategories();
  
  // Trouver la catégorie et sous-catégorie actives
  const activeCategory = categories.find(cat => cat.slug === selectedCategory);
  const activeSubcategories = activeCategory 
    ? getSubcategoriesByCategoryId(activeCategory.id)
    : [];
  const activeSubcategory = activeSubcategories.find(subcat => subcat.slug === selectedSubcategory);
  
  // Tri des catégories selon l'ordre exact du seed
  const sortedCategories = [...categories].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.slug);
    const indexB = CATEGORY_ORDER.indexOf(b.slug);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
  
  // Configuration des paramètres de pagination
  const isLoadMoreMode = paginationMode === 'loadmore';
  const paginationParams = {
    categoryId: activeCategory?.id,
    subcategoryId: activeSubcategory?.id,
    active: true,
    pageSize: 12,
    loadMoreMode: isLoadMoreMode,
    searchTerm: searchQuery,
    forceRefresh: refs.current.forceRefresh
  };
  
  // Utilisation du hook de services avec pagination
  const {
    services: fetchedServices,
    loading: servicesLoading,
    error: servicesError,
    currentPage,
    totalPages,
    totalCount,
    goToPage,
    loadMore,
    refresh
  } = usePaginatedServices(paginationParams);
  
  // Appliquer la recherche intelligente côté client
  const services = searchQuery 
    ? filterServicesBySearchTerm(fetchedServices, searchQuery)
    : fetchedServices;
  
  // Mémoriser updateURLParams pour éviter les re-rendus
  const updateURLParams = useCallback((newPage: number, newSearchQuery?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    
    if (newSearchQuery !== undefined) {
      if (newSearchQuery) {
        params.set('search', newSearchQuery);
      } else {
        params.delete('search');
      }
    }
    
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);
  
  // Gestion de la pagination
  const handlePageChange = useCallback((newPage: number) => {
    updateURLParams(newPage);
    goToPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updateURLParams, goToPage]);
  
  // Charger plus de services
  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);
  
  // Basculer le mode de pagination
  const togglePaginationMode = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    const newMode = isLoadMoreMode ? 'pagination' : 'loadmore';
    params.set('mode', newMode);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  }, [isLoadMoreMode, searchParams, router, pathname]);
  
  // Fonction optimisée pour rafraîchir les données
  const refreshData = useCallback(async () => {
    if (!refs.current.mounted) {
      console.debug('Rafraîchissement ignoré - composant démonté');
      return;
    }
    
    if (isRefreshing) {
      console.debug('Rafraîchissement ignoré - déjà en cours');
      return;
    }
    
    setIsRefreshing(true);
    setRenderError(null);
    refs.current.forceRefresh = true;
    
    try {
      // Vérifier la connexion
      const { success } = await testConnection();
      if (!success) {
        if (refs.current.mounted) {
          setConnectionError('Problème de connexion à la base de données');
          setIsRefreshing(false);
          refs.current.forceRefresh = false;
        }
        return;
      }
      
      // Actualiser les services
      if (refs.current.mounted) {
        try {
          await refresh();
          // Délai pour éviter un flash de chargement
          if (refs.current.refreshTimer) {
            clearTimeout(refs.current.refreshTimer);
          }
          refs.current.refreshTimer = setTimeout(() => {
            if (refs.current.mounted) {
              setIsRefreshing(false);
              setConnectionError(null);
              refs.current.forceRefresh = false;
            }
          }, 800);
        } catch (err) {
          console.error('Erreur lors du rafraîchissement:', err);
          if (refs.current.mounted) {
            setIsRefreshing(false);
            refs.current.forceRefresh = false;
          }
        }
      }
    } catch (error) {
      if (refs.current.mounted) {
        console.error('Erreur lors du rafraîchissement des données:', error);
        setIsRefreshing(false);
        refs.current.forceRefresh = false;
      }
    }
  }, [isRefreshing, refresh]);
  
  // Synchroniser searchQuery avec l'URL
  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);
  
  // Mettre à jour les sélections quand l'URL change
  useEffect(() => {
    setSelectedCategory(categorySlug);
    setSelectedSubcategory(subcategorySlug);
    
    // Synchroniser la page avec l'URL
    if (page && page !== currentPage) {
      goToPage(page);
    }
  }, [categorySlug, subcategorySlug, page, goToPage, currentPage]);
  
  // Effet pour les tests de connexion
  useEffect(() => {
    testConnection().then(({ success, error }) => {
      if (!success && refs.current.mounted) {
        setConnectionError(error || 'Erreur de connexion à la base de données');
      }
    }).catch(() => {
      if (refs.current.mounted) {
        setConnectionError('Erreur lors de la vérification de la connexion');
      }
    });
    
    // Intercepteur d'erreur
    const handleError = () => setRenderError("Une erreur est survenue. Veuillez rafraîchir la page.");
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  // Effet combiné pour la gestion de visibilité et du focus
  useEffect(() => {
    if (typeof window === 'undefined') return;
    refs.current.mounted = true;
    
    // Nettoyage des états
    setIsRefreshing(false);
    refs.current.forceRefresh = false;
    
    // Sauvegarde de l'état
    const saveTabState = () => {
      sessionStorage.setItem('vynal_last_page', window.location.href);
      sessionStorage.setItem('vynal_tab_inactive_time', Date.now().toString());
    };
    
    // Gestionnaire de changement de visibilité
    const handleVisibilityChange = () => {
      if (!refs.current.mounted) return;
      
      if (document.visibilityState === 'visible') {
        const lastInactiveTimeStr = sessionStorage.getItem('vynal_tab_inactive_time');
        if (lastInactiveTimeStr) {
          try {
            const lastInactiveTime = parseInt(lastInactiveTimeStr, 10);
            const currentTime = Date.now();
            const inactiveDuration = currentTime - lastInactiveTime;
            
            if (inactiveDuration > 10000 && window.location.pathname === '/services' && !isRefreshing) {
              console.log('Retour à la page des services après inactivité, rafraîchissement forcé');
              refreshData();
            }
            
            sessionStorage.removeItem('vynal_tab_inactive_time');
          } catch (err) {
            console.error('Erreur lors du traitement du changement de visibilité:', err);
          }
        }
      } else {
        saveTabState();
      }
    };
    
    // Gestionnaire de focus
    const handleWindowFocus = () => {
      if (!refs.current.mounted) return;
      
      const lastInactiveTimeStr = sessionStorage.getItem('vynal_tab_inactive_time');
      if (lastInactiveTimeStr && !isRefreshing) {
        try {
          const lastInactiveTime = parseInt(lastInactiveTimeStr, 10);
          const currentTime = Date.now();
          const inactiveDuration = currentTime - lastInactiveTime;
          
          if (inactiveDuration > 10000 && window.location.pathname === '/services') {
            console.log('Focus retourné à la fenêtre des services après inactivité, rafraîchissement forcé');
            refreshData();
          }
          
          sessionStorage.removeItem('vynal_tab_inactive_time');
        } catch (err) {
          console.error('Erreur lors du traitement du focus de la fenêtre:', err);
        }
      }
    };
    
    // Événement personnalisé pour le rafraîchissement
    const handleForceRefresh = (event: Event) => {
      if (!refs.current.mounted || isRefreshing) return;
      
      try {
        const customEvent = event as CustomEvent;
        const targetPage = customEvent.detail?.targetPage;
        
        if (targetPage === 'services' || !targetPage) {
          console.log('Rafraîchissement forcé des services demandé par un événement');
          refreshData();
        }
      } catch (err) {
        console.error('Erreur lors du traitement de l\'événement de rafraîchissement forcé:', err);
      }
    };
    
    // Ajouter les écouteurs d'événements
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('vynal:force-refresh-after-tab-return', handleForceRefresh);
    
    // Nettoyage
    return () => {
      refs.current.mounted = false;
      
      if (refs.current.refreshTimer) {
        clearTimeout(refs.current.refreshTimer);
        refs.current.refreshTimer = null;
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('vynal:force-refresh-after-tab-return', handleForceRefresh);
    };
  }, [isRefreshing, refreshData]);
  
  // JSX - Structure simplifiée
  return (
    <div className="min-h-screen bg-vynal-purple-dark">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest text-vynal-text-primary py-8 lg:py-14 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-vynal-accent-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-vynal-accent-secondary/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-vynal-accent-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-10"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Hero content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto pt-4 md:pt-6"
          >
            <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-vynal-purple-secondary/30 rounded-full backdrop-blur-sm mb-2 text-vynal-text-primary">
              {totalCount > 0 ? `+${totalCount}` : "Des"} services disponibles
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 leading-tight text-vynal-text-primary">
              Trouvez le service idéal
            </h1>
            <p className="text-sm sm:text-base text-vynal-text-secondary mb-4 sm:mb-6 max-w-2xl mx-auto">
              Des milliers de freelances talentueux prêts à réaliser vos projets
            </p>
          </motion.div>
          
          {/* Categories grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-5xl mx-auto"
          >
            <CategoriesGrid 
              categories={sortedCategories}
              selectedCategory={selectedCategory}
              getSubcategoriesCount={(categoryId) => getSubcategoriesByCategoryId(categoryId).length}
              className="bg-transparent"
            />
          </motion.div>
        </div>
      </section>

      {/* Navigation bar */}
      <section className="bg-vynal-purple-dark/90 border-y border-vynal-purple-secondary/30 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Breadcrumbs */}
            <BreadcrumbTrail 
              activeCategory={activeCategory} 
              activeSubcategory={activeSubcategory}
            />
            
            {/* Actions */}
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={refreshData}
                disabled={isRefreshing || servicesLoading}
                className="p-1.5 text-vynal-text-secondary hover:text-vynal-accent-primary hover:bg-vynal-purple-secondary/30 rounded-full disabled:opacity-50 transition-colors"
                title="Actualiser"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={togglePaginationMode}
                className="text-xs px-2 py-1 border border-vynal-purple-secondary/50 rounded-md hover:bg-vynal-purple-secondary/30 bg-vynal-purple-secondary/10 text-vynal-text-secondary transition-colors"
                title={isLoadMoreMode ? "Passer à la pagination classique" : "Passer au mode 'Charger plus'"}
              >
                {isLoadMoreMode ? "Pagination" : "Charger plus"}
              </button>
              
              <div className="hidden sm:flex items-center space-x-1 bg-vynal-purple-secondary/30 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-vynal-purple-secondary/50 shadow-sm text-vynal-accent-primary' : 'text-vynal-text-secondary hover:text-vynal-text-primary'}`}
                  title="Vue en grille"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-vynal-purple-secondary/50 shadow-sm text-vynal-accent-primary' : 'text-vynal-text-secondary hover:text-vynal-text-primary'}`}
                  title="Vue en liste"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subcategories section */}
      {activeCategory && activeSubcategories.length > 0 && (
        <section className="bg-vynal-purple-dark/80 border-b border-vynal-purple-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <SubcategoriesGrid 
              subcategories={activeSubcategories}
              selectedSubcategory={selectedSubcategory}
              category={activeCategory}
            />
          </div>
        </section>
      )}

      {/* Main content */}
      <div className="container mx-auto px-4 py-12">
        {/* Results header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h2 className="text-lg font-semibold text-vynal-text-primary">
              {searchQuery 
                ? `Résultats pour "${searchQuery}"`
                : activeSubcategory 
                  ? `Services de ${activeSubcategory.name}`
                  : activeCategory 
                    ? `Services de ${activeCategory.name}` 
                    : "Tous les services"
              }
            </h2>
            <p className="text-sm text-vynal-text-secondary mt-0.5">
              {totalCount} services disponibles
              {currentPage > 1 ? ` • Page ${currentPage} sur ${totalPages}` : ''}
            </p>
          </div>
        </div>
        
        {/* Error messages */}
        {(connectionError || servicesError) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-vynal-status-error/20 p-4 rounded-xl border border-vynal-status-error/30 mb-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-vynal-status-error mt-0.5" />
              <div>
                <h3 className="font-medium text-vynal-text-primary">Un problème est survenu</h3>
                <p className="text-sm text-vynal-text-secondary mt-0.5">
                  {connectionError || (servicesError ? servicesError.toString() : '')}
                </p>
                <button
                  onClick={refreshData}
                  className="mt-2 text-xs font-medium px-2 py-1 bg-vynal-purple-secondary/30 text-vynal-accent-primary border border-vynal-purple-secondary/50 rounded-md hover:bg-vynal-purple-secondary/50 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Services loading and results */}
        <AnimatePresence>
          {servicesLoading && !isLoadMoreMode ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="loading"
            >
              <ServiceSkeletonLoader 
                count={12}
                showShimmer={true}
                className="mb-4"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key="results"
            >
              <ServiceResults 
                services={services}
                loading={false}
                error={null}
                onRetry={refreshData}
                className="mb-4"
              />
              
              {/* Pagination controls */}
              {!servicesError && !servicesLoading && services.length > 0 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  showLoadMore={isLoadMoreMode}
                  onLoadMore={handleLoadMore}
                  isLoading={isLoadMoreMode && servicesLoading}
                  className="mt-8"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats footer */}
      <section className="py-16 bg-vynal-purple-dark/90 border-t border-vynal-purple-secondary/30 shadow-lg shadow-vynal-accent-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-vynal-text-primary mb-2">
                {STATS_DATA.freelancersCount}
              </h3>
              <p className="text-sm text-vynal-text-secondary">Freelances</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-vynal-text-primary mb-2">
                {STATS_DATA.clientsCount}
              </h3>
              <p className="text-sm text-vynal-text-secondary">Clients</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-vynal-text-primary mb-2">
                {STATS_DATA.totalPayments}
              </h3>
              <p className="text-sm text-vynal-text-secondary">Total des paiements</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Component principal avec Suspense
export default function ServicesPage() {
  return (
    <Suspense fallback={<PublicServicesPageSkeleton />}>
      {/* Use key={Math.random()} to avoid hydration mismatch and ensure client-side rendering */}
      <div suppressHydrationWarning>
        {typeof window === 'undefined' ? (
          <PublicServicesPageSkeleton />
        ) : (
          <ServicesPageContent />
        )}
      </div>
    </Suspense>
  );
} 