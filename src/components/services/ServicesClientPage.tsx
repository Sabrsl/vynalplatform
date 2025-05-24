"use client";

import { useEffect, useState, useCallback, useRef, useMemo, Suspense, lazy, memo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { 
  ChevronRight, 
  Filter, 
  Search, 
  RefreshCw, 
  Grid, 
  List, 
  ArrowRight, 
  AlertCircle,
  Users,
  User,
  CreditCard,
  LayoutGrid,
  MapPin
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ServiceCard from '@/components/services/ServiceCard';
import ServicesList from '@/components/services/ServicesList';
import ServiceListSkeleton from '@/components/services/ServiceListSkeleton';

import CategoriesGrid from '@/components/categories/CategoriesGrid';
import HorizontalCategoriesScroll from '@/components/categories/HorizontalCategoriesScroll';
import SubcategoriesGrid from '@/components/categories/SubcategoriesGrid';
import SearchBarSimple from '@/components/categories/SearchBarSimple';
import BreadcrumbTrail from '@/components/categories/BreadcrumbTrail';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination';
import ServiceSkeletonLoader from '@/components/services/ServiceSkeletonLoader';
import { filterServicesBySearchTerm } from '@/lib/search/smartSearch';
import { PublicServicesPageSkeleton } from '@/components/skeletons/PublicServicesPageSkeleton';
import React from 'react';
import { toast } from 'sonner';
import { ServicesPageData, Category, Subcategory, Service } from '@/app/services/server';
import { ServiceWithFreelanceAndCategories } from '@/hooks/useServices';
import { UICategoryType, UISubcategoryType, adaptCategoryForUI, adaptSubcategoryForUI } from '@/hooks/useCategories';
import { addRefreshListener } from '@/lib/services/servicesRefreshService';
import { setCachedData } from '@/lib/optimizations';
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import { useInView } from 'react-intersection-observer';
import { QuickTooltip } from '@/components/ui/tooltip';

// Utilisons les fonctions d'adaptation des catégories depuis les hooks

// Les adaptateurs sont importés de useCategories

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
  'sante-bien-etre',
  'intelligence-artificielle'
];

// Statistiques pour la page
const STATS_DATA = {
  freelancersCount: '20+',
  clientsCount: '50+',
  totalPayments: '2M+ FCFA'
};

// Adaptation pour le type ServiceWithFreelanceAndCategories
const adaptServiceForSearch = (service: Service): ServiceWithFreelanceAndCategories => ({
  ...service,
  profiles: {
    id: service.user_id || service.profiles?.id || '',
    username: service.profiles?.username || 'utilisateur',
    full_name: service.profiles?.full_name || null,
    avatar_url: service.profiles?.avatar_url || null,
    email: service.profiles?.username || null,
    role: null,
    bio: service.profiles?.bio || null,
    is_certified: service.profiles?.is_certified || false,
    certification_type: service.profiles?.certification_type || null
  },
  categories: service.categories || {
    id: service.category_id || '',
    name: 'Catégorie',
    slug: 'categorie'
  },
  subcategories: service.subcategories || null,
  // Ajouter les champs manquants pour rendre compatible avec ServiceWithFreelanceAndCategories
  freelance_id: service.freelance_id || service.user_id || '',
  updated_at: service.updated_at || service.created_at,
  status: (service.status === 'inactive' ? 'pending' : service.status) as 'active' | 'pending' | 'rejected' | 'approved',
  active: true,
  // Préserver le slug pour la navigation statique
  slug: service.slug || ''
});

// Sous-composants extraits avec React.memo pour éviter les re-rendus inutiles
const StatsSection = lazy(() => import('@/components/services/StatsSection'));

const NavigationBar = React.memo(({ 
  activeCategory, 
  activeSubcategory, 
  viewMode,
  setViewMode,
  handleSearch
}: { 
  activeCategory: UICategoryType | undefined, 
  activeSubcategory: UISubcategoryType | undefined,
  viewMode: 'grid' | 'list' | 'map',
  setViewMode: (mode: 'grid' | 'list' | 'map') => void,
  handleSearch: (query: string) => void
}) => {
  return (
    <section className="bg-gray-50 dark:bg-vynal-purple-dark/90 border-t border-gray-200 dark:border-vynal-purple-secondary/30 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <BreadcrumbTrail 
            activeCategory={activeCategory} 
            activeSubcategory={activeSubcategory}
          />
          
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <SearchBarSimple 
                onSearch={handleSearch}
              />
            </div>
            <QuickTooltip 
              content={viewMode === 'grid' ? 'Passer en vue liste' : 'Passer en vue grille'}
              side="bottom"
              variant="default"
              className="bg-slate-100/90 dark:bg-slate-800/90
                border border-slate-200 dark:border-slate-700/30
                text-slate-700 dark:text-vynal-text-primary
                shadow-sm backdrop-blur-sm
                rounded-lg"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="h-8 w-8 hidden md:block
                  bg-white/30 dark:bg-slate-900/30
                  border border-slate-200 dark:border-slate-700/30
                  text-slate-700 dark:text-vynal-text-primary
                  hover:bg-white/40 dark:hover:bg-slate-900/40
                  hover:border-slate-300 dark:hover:border-slate-700/40
                  rounded-lg shadow-sm backdrop-blur-sm
                  transition-all duration-200"
              >
                {viewMode === 'grid' ? (
                  <List className="h-5 w-5" />
                ) : (
                  <LayoutGrid className="h-5 w-5" />
                )}
              </Button>
            </QuickTooltip>
          </div>
        </div>
      </div>
    </section>
  );
});
NavigationBar.displayName = 'NavigationBar';

const ResultsHeader = React.memo(({ 
  searchQuery, 
  activeSubcategory, 
  activeCategory, 
  totalCount, 
  currentPage, 
  totalPages,
  viewMode,
  setViewMode
}: { 
  searchQuery: string, 
  activeSubcategory: UISubcategoryType | undefined, 
  activeCategory: UICategoryType | undefined, 
  totalCount: number, 
  currentPage: number, 
  totalPages: number,
  viewMode: 'grid' | 'list' | 'map',
  setViewMode: (mode: 'grid' | 'list' | 'map') => void
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg text-slate-800 dark:text-vynal-text-primary">
          {searchQuery 
            ? `Résultats pour "${searchQuery}"`
            : activeSubcategory 
              ? `Services de ${activeSubcategory.name}`
              : activeCategory 
                ? `Services de ${activeCategory.name}` 
                : "Tous les services"
          }
        </h2>
        {/* Bouton de changement de vue - visible uniquement sur mobile */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List className="h-5 w-5" />
            ) : (
              <LayoutGrid className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-vynal-text-secondary mt-0.5">
        {totalCount} services disponibles
        {currentPage > 1 ? ` • Page ${currentPage} sur ${totalPages}` : ''}
      </p>
    </div>
  </div>
));
ResultsHeader.displayName = 'ResultsHeader';

// Composant de rendu de ligne virtualisée
const VirtualizedGrid = memo(({ 
  services,
  hasNextPage,
  isNextPageLoading,
  loadNextPage,
  viewMode
}: { 
  services: ServiceWithFreelanceAndCategories[],
  hasNextPage: boolean,
  isNextPageLoading: boolean,
  loadNextPage: () => void,
  viewMode: 'grid' | 'list' | 'map'
}) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  // Charger automatiquement la page suivante quand l'élément est visible
  useEffect(() => {
    if (inView && hasNextPage && !isNextPageLoading) {
      loadNextPage();
    }
  }, [inView, hasNextPage, isNextPageLoading, loadNextPage]);

  // Optimisation de l'affichage selon le mode
  const columnCount = useMemo(() => {
    if (viewMode === 'list') return 1;
    
    // Détection de la largeur d'écran pour le responsive
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return 1; // Mobile
      if (width < 1024) return 2; // Tablet 
      if (width < 1280) return 3; // Small desktop
      return 4; // Large desktop
    }
    
    return 4; // Default
  }, [viewMode]);

  return (
    <div className="w-full">
      <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''} gap-6`}>
        {services.map((service, index) => (
          <ServiceCard
            key={service.id}
            service={service}
            showStatusBadge={false}
            useDemo={false}
            className="h-full shadow-none"
            isPriority={index < 8} // Optimisation: priorité seulement pour les premières cartes
          />
        ))}
      </div>

      {/* Indicateur de chargement / déclencheur pour charger plus */}
      {(hasNextPage || isNextPageLoading) && (
        <div 
          ref={ref}
          className="w-full flex justify-center items-center py-8"
        >
          {isNextPageLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
          ) : (
            <Button 
              variant="ghost" 
              className="text-indigo-500"
              onClick={loadNextPage}
            >
              Charger plus
            </Button>
          )}
        </div>
      )}
    </div>
  );
});
VirtualizedGrid.displayName = 'VirtualizedGrid';

// Type de props pour le composant principal
interface ServicesClientPageProps {
  initialData: string;
}

// Nombre de services par page - augmenté pour optimiser les performances
const ITEMS_PER_PAGE = 20;

// Type pour la fonction onSelectSubcategory
type SubcategorySelectHandler = (subcategory: UISubcategoryType) => void;

// Composant principal pour la page des services 
export default function ServicesClientPage({ initialData }: ServicesClientPageProps) {
  // Parsing des données initiales
  const initialParsedData: ServicesPageData = JSON.parse(initialData);
  
  // Hooks React et Next.js
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Extraction des paramètres d'URL
  const categorySlug = searchParams?.get('category') || null;
  const subcategorySlug = searchParams?.get('subcategory') || null;
  const page = Number(searchParams?.get('page') || '1');
  const urlSearchQuery = searchParams?.get('search') || '';
  
  // États locaux
  const [selectedCategory, setSelectedCategory] = useState(categorySlug);
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategorySlug);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>(() => {
    // Récupérer le mode de vue depuis localStorage ou utiliser 'grid' par défaut
    if (typeof window !== 'undefined') {
      const savedViewMode = localStorage.getItem('services_view_mode');
      return (savedViewMode === 'list' ? 'list' : savedViewMode === 'map' ? 'map' : 'grid') as 'grid' | 'list' | 'map';
    }
    return 'grid';
  });

  // Sauvegarder le mode de vue dans localStorage quand il change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('services_view_mode', viewMode);
    }
  }, [viewMode]);

  const [currentPage, setCurrentPage] = useState(page);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);
  
  // Données des catégories et services
  const [categories, setCategories] = useState<Category[]>(initialParsedData.categories);
  const [subcategories, setSubcategories] = useState<Subcategory[]>(initialParsedData.subcategories);
  const [allServices, setAllServices] = useState<Service[]>(initialParsedData.services);
  
  // Conversion des types pour l'UI
  const uiCategories = useMemo(() => 
    categories.map(cat => adaptCategoryForUI(cat as any)), 
    [categories]
  );
  
  const uiSubcategories = useMemo(() => 
    subcategories.map(subcat => adaptSubcategoryForUI(subcat as any)),
    [subcategories]
  );
  
  // Tri des catégories selon l'ordre exact du seed
  const sortedCategories = useMemo(() => 
    [...uiCategories].sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a.slug);
      const indexB = CATEGORY_ORDER.indexOf(b.slug);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    }), 
    [uiCategories]
  );
  
  // Trouver la catégorie et sous-catégorie actives
  const activeCategory = useMemo(() => 
    uiCategories.find(cat => cat.slug === selectedCategory),
    [uiCategories, selectedCategory]
  );
  
  const activeSubcategories = useMemo(() => 
    activeCategory
      ? uiSubcategories.filter(subcat => subcat.category_id === activeCategory.id)
      : [],
    [activeCategory, uiSubcategories]
  );
  
  const activeSubcategory = useMemo(() => 
    activeSubcategories.find(subcat => subcat.slug === selectedSubcategory),
    [activeSubcategories, selectedSubcategory]
  );
  
  // Fonction utilitaire pour obtenir le nombre de sous-catégories par catégorie
  const getSubcategoriesCount = useCallback((categoryId: string) => {
    return subcategories.filter(subcat => subcat.category_id === categoryId).length;
  }, [subcategories]);
  
  // Services filtrés avec mémoisation
  const filteredServices = useMemo(() => {
    let results = [...allServices].map(adaptServiceForSearch);
    
    // Filtrer par catégorie
    if (selectedCategory) {
      results = results.filter(service => 
        service.categories?.slug === selectedCategory
      );
    }
    
    // Filtrer par sous-catégorie
    if (selectedSubcategory) {
      results = results.filter(service => 
        service.subcategories?.slug === selectedSubcategory
      );
    }
    
    // Filtrer par recherche
    if (searchQuery.trim()) {
      results = filterServicesBySearchTerm(results, searchQuery);
    }
    
    return results;
  }, [allServices, selectedCategory, selectedSubcategory, searchQuery]);

  // Pagination mémorisée
  const paginatedServices = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    return filteredServices.slice(startIndex, endIndex);
  }, [filteredServices, currentPage]);
  
  // Calcul du total et des pages
  const totalServices = useMemo(() => filteredServices.length, [filteredServices]);
  const totalPages = useMemo(() => Math.ceil(totalServices / ITEMS_PER_PAGE), [totalServices]);

  // Calcul de s'il y a plus de pages à charger
  useEffect(() => {
    setHasMorePages(currentPage < totalPages);
  }, [currentPage, totalPages]);

  // Fonction pour charger plus de services
  const loadMoreServices = useCallback(() => {
    if (currentPage < totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      // Simuler un délai de chargement pour UX
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsLoadingMore(false);
      }, 500);
    }
  }, [currentPage, totalPages, isLoadingMore]);

  // Réinitialiser la pagination lors du changement de filtres
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubcategory, searchQuery]);

  // Fonction optimisée pour le changement de page
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    
    // Mise à jour de l'URL
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', newPage.toString());
    
    // Mettre à jour l'URL sans déclencher de navigation
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    
    // Scroll au début des résultats
    document.getElementById('services-results')?.scrollIntoView({ behavior: 'smooth' });
  }, [searchParams, router, pathname]);

  // Gestion de la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    handlePageChange(1);
  };
  
  // Synchroniser les états locaux avec les paramètres d'URL
  useEffect(() => {
    setSelectedCategory(categorySlug);
    setSelectedSubcategory(subcategorySlug);
    setSearchQuery(urlSearchQuery);
    setCurrentPage(page);
  }, [categorySlug, subcategorySlug, urlSearchQuery, page]);
  
  // Après l'initialisation des états et avant les effets, ajouter une fonction pour récupérer les données des services
  const fetchServicesData = useCallback(async () => {
    try {
      // Récupérer les données de l'API
      const response = await fetch('/api/services');
      if (!response.ok) {
        throw new Error('Impossible de récupérer les services');
        return;
      }

      const data = await response.json();
      
      // Mettre à jour les états
      if (data && data.services) {
        setAllServices(data.services);
      }
      if (data && data.categories) {
        setCategories(data.categories);
      }
      if (data && data.subcategories) {
        setSubcategories(data.subcategories);
      }
      
      console.log('Données des services rafraîchies');
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des services:', error);
    }
  }, []);
  
  // Ajouter l'import pour le service de rafraîchissement
  useEffect(() => {
    // Ajouter un écouteur de rafraîchissement pour cette page
    const removeListener = addRefreshListener(() => {
      console.log('ServicesClientPage: Rafraîchissement demandé');
      
      // Récupérer les dernières données
      if (typeof window !== 'undefined') {
        // Forcer l'invalidation du cache
        setCachedData('services_', null, { expiry: 0 });
        
        // Refaire la requête
        fetchServicesData();
      }
    });
    
    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      removeListener();
    };
  }, [fetchServicesData]);
  
  // Gestion de la sélection d'une sous-catégorie
  const handleSelectSubcategory = useCallback<SubcategorySelectHandler>((subcategory) => {
    setSelectedSubcategory(subcategory.slug);
    setCurrentPage(1);
    
    // Mise à jour de l'URL
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('subcategory', subcategory.slug);
    params.set('page', '1');
    
    // Mettre à jour l'URL sans déclencher de navigation
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    
    // Scroll au début des résultats
    document.getElementById('services-results')?.scrollIntoView({ behavior: 'smooth' });
  }, [searchParams, router, pathname]);

  // Réinitialisation des filtres
  const handleResetFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSearchQuery('');
    setCurrentPage(1);
    
    // Mise à jour de l'URL
    router.replace('/services', { scroll: false });
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-vynal-purple-darkest">
      {/* Barre de catégories défilables placée juste avant la barre de navigation */}
      <div className="relative py-1 sm:py-1.5 bg-slate-50 dark:bg-vynal-purple-dark border-b border-gray-100 dark:border-vynal-purple-secondary/20">
        <div className="container mx-auto">
          <HorizontalCategoriesScroll 
            categories={sortedCategories}
            selectedCategory={selectedCategory}
            getSubcategoriesCount={getSubcategoriesCount}
            className="bg-transparent"
          />
        </div>
      </div>
      
      <NavigationBar 
        activeCategory={activeCategory}
        activeSubcategory={activeSubcategory}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleSearch={handleSearch}
      />
      
      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-16 py-4 sm:py-5 md:py-6" id="services-results">
        {/* Sous-catégories si une catégorie est sélectionnée */}
        {selectedCategory && activeSubcategories.length > 0 && (
          <SubcategoriesGrid 
            subcategories={activeSubcategories}
            selectedSubcategory={selectedSubcategory}
            onSelectSubcategory={handleSelectSubcategory}
            className="mb-6"
          />
        )}

        {/* En-tête des résultats */}
        <ResultsHeader 
          searchQuery={searchQuery}
          activeSubcategory={activeSubcategory}
          activeCategory={activeCategory}
          totalCount={totalServices}
          currentPage={currentPage}
          totalPages={totalPages}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        
        {/* Affichage des services */}
        {totalServices === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white/30 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700/30 backdrop-blur-sm">
            <AlertCircle className="h-12 w-12 text-vynal-accent-primary mb-4" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-vynal-text-primary mb-2">
              Aucun service trouvé
            </h3>
            <p className="text-xs text-slate-600 dark:text-vynal-text-secondary max-w-md mb-6">
              {searchQuery 
                ? `Nous n'avons trouvé aucun service correspondant à "${searchQuery}"`
                : selectedSubcategory
                  ? `Aucun service disponible dans cette sous-catégorie pour le moment`
                  : selectedCategory
                    ? `Aucun service disponible dans cette catégorie pour le moment`
                    : `Aucun service disponible pour le moment`
              }
            </p>
            <Button 
              variant="outline" 
              onClick={handleResetFilters}
              className="text-xs text-slate-700 dark:text-vynal-text-primary hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all duration-200"
            >
              Afficher tous les services
            </Button>
          </div>
        ) : viewMode === 'list' ? (
          // Affichage en mode liste
          <div className="w-full">
            {/* Squelette de chargement pendant le chargement initial */}
            {isLoadingMore && paginatedServices.length === 0 ? (
              <ServiceListSkeleton count={5} />
            ) : (
              <ServicesList 
                services={paginatedServices}
                isPriority={true}
                showStatusBadge={false}
              />
            )}
            
            {/* Indicateur de chargement pour "charger plus" */}
            {(hasMorePages || isLoadingMore) && (
              <div className="w-full flex justify-center items-center py-8 mt-4">
                {isLoadingMore ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                ) : (
                  <Button 
                    variant="ghost" 
                    className="text-indigo-500"
                    onClick={loadMoreServices}
                  >
                    Charger plus
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          // Affichage en mode grille (par défaut)
          <VirtualizedGrid 
            services={paginatedServices}
            hasNextPage={hasMorePages}
            isNextPageLoading={isLoadingMore}
            loadNextPage={loadMoreServices}
            viewMode={viewMode}
          />
        )}
      </main>
      
      {/* Section des statistiques chargée de façon différée */}
      <Suspense fallback={null}>
        <StatsSection statsData={STATS_DATA} />
      </Suspense>
    </div>
  );
} 