"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  CreditCard
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ServiceCard from '@/components/services/ServiceCard';
import CategoriesGrid from '@/components/categories/CategoriesGrid';
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
  freelancersCount: '50+',
  clientsCount: '100+',
  totalPayments: '5M+ FCFA'
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
    is_certified: false,
    certification_type: null
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
});

// Sous-composants extraits avec React.memo pour éviter les re-rendus inutiles
const StatsSection = React.memo(({ statsData }: { statsData: typeof STATS_DATA }) => (
  <section className="py-10 bg-gradient-to-r from-gray-50 to-white dark:from-vynal-purple-dark/80 dark:to-vynal-purple-dark/95 border-t border-gray-100 dark:border-vynal-purple-secondary/30">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Freelances */}
          <div className="relative flex flex-col items-center px-3 py-5">
            {/* Cercle décoratif */}
            <div className="absolute -z-10 w-16 h-16 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-vynal-accent-primary/5 dark:to-vynal-accent-secondary/5 rounded-full top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 blur-md opacity-80"></div>
            
            {/* Icône avec cercle */}
            <div className="flex items-center justify-center w-10 h-10 mb-3 rounded-full bg-white dark:bg-vynal-purple-secondary/10 shadow-sm">
              <Users className="h-4 w-4 text-vynal-accent-primary" />
            </div>
            
            {/* Nombre avec gradient */}
            <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-vynal-accent-primary to-purple-600 dark:from-vynal-accent-primary dark:to-vynal-accent-secondary">
              {statsData.freelancersCount}
            </h3>
            
            {/* Texte */}
            <p className="text-xs text-vynal-body mt-1 text-center">
              Freelances
            </p>
          </div>
          
          {/* Clients */}
          <div className="relative flex flex-col items-center px-3 py-5">
            {/* Cercle décoratif */}
            <div className="absolute -z-10 w-16 h-16 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-vynal-accent-primary/5 dark:to-vynal-accent-secondary/5 rounded-full top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 blur-md opacity-80"></div>
            
            {/* Icône avec cercle */}
            <div className="flex items-center justify-center w-10 h-10 mb-3 rounded-full bg-white dark:bg-vynal-purple-secondary/10 shadow-sm">
              <User className="h-4 w-4 text-vynal-accent-primary" />
            </div>
            
            {/* Nombre avec gradient */}
            <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-vynal-accent-primary to-purple-600 dark:from-vynal-accent-primary dark:to-vynal-accent-secondary">
              {statsData.clientsCount}
            </h3>
            
            {/* Texte */}
            <p className="text-xs text-vynal-body mt-1 text-center">
              Clients satisfaits
            </p>
          </div>
          
          {/* Paiements */}
          <div className="relative flex flex-col items-center px-3 py-5">
            {/* Cercle décoratif */}
            <div className="absolute -z-10 w-16 h-16 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-vynal-accent-primary/5 dark:to-vynal-accent-secondary/5 rounded-full top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 blur-md opacity-80"></div>
            
            {/* Icône avec cercle */}
            <div className="flex items-center justify-center w-10 h-10 mb-3 rounded-full bg-white dark:bg-vynal-purple-secondary/10 shadow-sm">
              <CreditCard className="h-4 w-4 text-vynal-accent-primary" />
            </div>
            
            {/* Nombre avec gradient */}
            <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-vynal-accent-primary to-purple-600 dark:from-vynal-accent-primary dark:to-vynal-accent-secondary">
              {statsData.totalPayments}
            </h3>
            
            {/* Texte */}
            <p className="text-xs text-vynal-body mt-1 text-center">
              Total des transactions
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
));
StatsSection.displayName = 'StatsSection';

const HeroSection = React.memo(({ totalCount, categories, selectedCategory, getSubcategoriesCount }: { 
  totalCount: number, 
  categories: UICategoryType[], 
  selectedCategory: string | null,
  getSubcategoriesCount: (categoryId: string) => number
}) => (
  <section className="bg-gradient-to-b from-indigo-50 to-white dark:from-vynal-purple-dark dark:to-vynal-purple-darkest text-gray-900 dark:text-vynal-text-primary py-8 lg:py-14 relative overflow-hidden">
    {/* Background decorations */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-200/20 dark:bg-vynal-accent-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-100/20 dark:bg-vynal-accent-secondary/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-200/20 dark:bg-vynal-accent-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-0 dark:opacity-10"></div>
    </div>

    <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      {/* Hero content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl mx-auto pt-4 md:pt-6"
      >
        <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-slate-100/30 dark:bg-slate-800/30 rounded-full backdrop-blur-sm mb-2 text-slate-700 dark:text-vynal-text-primary">
          {totalCount > 0 ? `+${totalCount}` : "Des"} services disponibles
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 leading-tight text-slate-800 dark:text-vynal-text-primary">
          Trouvez le service idéal
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-vynal-text-secondary mb-4 sm:mb-6 max-w-2xl mx-auto">
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
          categories={categories}
          selectedCategory={selectedCategory}
          getSubcategoriesCount={getSubcategoriesCount}
          className="bg-transparent"
        />
      </motion.div>
    </div>
  </section>
));
HeroSection.displayName = 'HeroSection';

const NavigationBar = React.memo(({ 
  activeCategory, 
  activeSubcategory, 
  viewMode,
  setViewMode,
  handleSearch
}: { 
  activeCategory: UICategoryType | undefined, 
  activeSubcategory: UISubcategoryType | undefined,
  viewMode: 'grid' | 'list',
  setViewMode: (mode: 'grid' | 'list') => void,
  handleSearch: (query: string) => void
}) => {
  return (
    <section className="bg-gray-50 dark:bg-vynal-purple-dark/90 border-t border-gray-200 dark:border-vynal-purple-secondary/30 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Breadcrumbs */}
          <BreadcrumbTrail 
            activeCategory={activeCategory} 
            activeSubcategory={activeSubcategory}
          />
          
          {/* Actions */}
          <div className="flex items-center justify-end space-x-2">
            <SearchBarSimple 
              onSearch={handleSearch}
            />
            
            <div className="hidden sm:flex items-center space-x-1 bg-slate-100/30 dark:bg-slate-800/30 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-white/40 dark:bg-slate-800/40 text-vynal-accent-primary' : 'text-slate-700 dark:text-vynal-text-primary hover:bg-slate-100 dark:hover:bg-slate-800/25'}`}
                title="Vue en grille"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-white/40 dark:bg-slate-800/40 text-vynal-accent-primary' : 'text-slate-700 dark:text-vynal-text-primary hover:bg-slate-100 dark:hover:bg-slate-800/25'}`}
                title="Vue en liste"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
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
  totalPages 
}: { 
  searchQuery: string, 
  activeSubcategory: UISubcategoryType | undefined, 
  activeCategory: UICategoryType | undefined, 
  totalCount: number, 
  currentPage: number, 
  totalPages: number 
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
    <div>
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
      <p className="text-sm text-slate-600 dark:text-vynal-text-secondary mt-0.5">
        {totalCount} services disponibles
        {currentPage > 1 ? ` • Page ${currentPage} sur ${totalPages}` : ''}
      </p>
    </div>
  </div>
));
ResultsHeader.displayName = 'ResultsHeader';

const ServicesGrid = React.memo(({ 
  services, 
  currentPage, 
  totalPages, 
  handlePageChange,
  viewMode
}: { 
  services: any[], 
  currentPage: number, 
  totalPages: number, 
  handlePageChange: (page: number) => void,
  viewMode: 'grid' | 'list'
}) => (
  <>
    <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-4' : ''} gap-6`}>
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          showStatusBadge={false}
          useDemo={false}
          className="h-full shadow-none"
        />
      ))}
    </div>
    
    {/* Pagination controls */}
    {services.length > 0 && (
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        className="mt-8"
      />
    )}
  </>
));
ServicesGrid.displayName = 'ServicesGrid';

// Type de props pour le composant principal
interface ServicesClientPageProps {
  initialData: string;
}

// Nombre de services par page
const ITEMS_PER_PAGE = 12;

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(page);
  
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
  
  // Filtrage des services en fonction des critères
  const filteredServices = useMemo(() => allServices.filter(service => {
    // Filtrer par catégorie et sous-catégorie
    if (activeSubcategory) {
      return service.subcategory_id === activeSubcategory.id;
    }
    
    if (activeCategory) {
      return service.category_id === activeCategory.id;
    }
    
    return true;
  }), [allServices, activeCategory, activeSubcategory]);
  
  // Recherche par terme - adapter les services pour le type attendu par la fonction de recherche
  const adaptedServicesForSearch = useMemo(() => 
    filteredServices.map(adaptServiceForSearch),
    [filteredServices]
  );
  
  const searchResults = useMemo(() => 
    searchQuery
      ? filterServicesBySearchTerm(adaptedServicesForSearch, searchQuery)
      : filteredServices,
    [adaptedServicesForSearch, filteredServices, searchQuery]
  );
  
  // Pagination
  const totalItems = searchResults.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  
  // Services à afficher pour la page courante
  const paginatedServices = searchResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  // Méthode pour mettre à jour l'URL
  const updateURLParams = useCallback((params: { category?: string | null; subcategory?: string | null; page?: number; search?: string | null }) => {
    const urlParams = new URLSearchParams(searchParams?.toString() || '');
    
    // Mise à jour des paramètres
    if (params.category !== undefined) {
      if (params.category) {
        urlParams.set('category', params.category);
      } else {
        urlParams.delete('category');
      }
    }
    
    if (params.subcategory !== undefined) {
      if (params.subcategory) {
        urlParams.set('subcategory', params.subcategory);
      } else {
        urlParams.delete('subcategory');
      }
    }
    
    if (params.page !== undefined) {
      urlParams.set('page', params.page.toString());
    }
    
    if (params.search !== undefined) {
      if (params.search) {
        urlParams.set('search', params.search);
      } else {
        urlParams.delete('search');
      }
    }
    
    // Mise à jour de l'URL
    router.push(`${pathname}?${urlParams.toString()}`);
  }, [searchParams, router, pathname]);
  
  // Gestion du changement de page
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateURLParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Gestion de la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    updateURLParams({ search: query || null, page: 1 });
  };
  
  // Synchroniser les états locaux avec les paramètres d'URL
  useEffect(() => {
    setSelectedCategory(categorySlug);
    setSelectedSubcategory(subcategorySlug);
    setSearchQuery(urlSearchQuery);
    setCurrentPage(page);
  }, [categorySlug, subcategorySlug, urlSearchQuery, page]);
  
  return (
    <div className="min-h-screen bg-white dark:bg-vynal-purple-dark animate-in fade-in duration-300">
      {/* Hero Section */}
      <main data-content="loaded">
        <HeroSection 
          totalCount={allServices.length}
          categories={sortedCategories}
          selectedCategory={selectedCategory}
          getSubcategoriesCount={getSubcategoriesCount}
        />

        {/* Navigation bar */}
        <NavigationBar 
          activeCategory={activeCategory} 
          activeSubcategory={activeSubcategory}
          viewMode={viewMode}
          setViewMode={setViewMode}
          handleSearch={handleSearch}
        />

        {/* Subcategories section */}
        {activeCategory && activeSubcategories.length > 0 && (
          <section className="bg-white dark:bg-vynal-purple-dark/80 border-y border-gray-200 dark:border-vynal-purple-secondary/30 shadow-sm">
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
        <div className="container mx-auto px-4 lg:px-16 py-12">
          {/* Results header */}
          <ResultsHeader 
            searchQuery={searchQuery}
            activeSubcategory={activeSubcategory}
            activeCategory={activeCategory}
            totalCount={totalItems}
            currentPage={currentPage}
            totalPages={totalPages}
          />
          
          {/* Services results */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {paginatedServices.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-vynal-body dark:text-vynal-text-secondary">
                  Aucun service trouvé pour votre recherche.
                </p>
              </div>
            ) : (
              <ServicesGrid 
                services={paginatedServices}
                currentPage={currentPage}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
                viewMode={viewMode}
              />
            )}
          </motion.div>
        </div>
      </main>

      {/* Stats footer */}
      <StatsSection statsData={STATS_DATA} />
    </div>
  );
} 