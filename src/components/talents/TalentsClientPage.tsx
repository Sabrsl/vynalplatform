"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { 
  Search, 
  Grid, 
  List, 
  RefreshCw,
} from 'lucide-react';
import TalentsList from './TalentsList';
import TalentsGrid from './TalentsGrid';
import TalentSkeletonLoader from './TalentSkeletonLoader';
import SearchBarSimple from '@/components/categories/SearchBarSimple';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination';
import { TalentsPageData, getTalentsPageData, revalidateTalents } from '@/app/talents/server';
import { Talent } from './TalentCard';
import { Category, Subcategory } from '@/app/services/server';

interface TalentsClientPageProps {
  initialData: string;
}

// En-tête des résultats avec options de tri
const ResultsHeader = ({
  searchQuery,
  totalCount,
  currentPage,
  totalPages,
  sortMethod,
  onSortChange,
  onRefresh,
  isLoading
}: {
  searchQuery: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  sortMethod: string;
  onSortChange: (method: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}) => {
  // Construction du titre
  let title = "Tous les talents";
  if (searchQuery) {
    title = `Résultats pour "${searchQuery}"`;
  }
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-vynal-text-primary mb-1">
          {title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-vynal-text-secondary">
          {totalCount} {totalCount > 1 ? 'talents disponibles' : 'talent disponible'}
          {currentPage > 1 && totalPages > 1 && ` • Page ${currentPage} sur ${totalPages}`}
        </p>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Menu de tri */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-700 dark:text-vynal-text-primary">Trier par:</span>
          <select 
            className="text-sm border border-slate-200 dark:border-slate-700/30 rounded-md px-2 py-1 bg-white/30 dark:bg-slate-900/30 text-slate-700 dark:text-vynal-text-primary"
            value={sortMethod}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="recommended" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-vynal-text-primary">Recommandés</option>
            <option value="rating" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-vynal-text-primary">Mieux notés</option>
            <option value="projects" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-vynal-text-primary">Plus de projets</option>
            <option value="price_low" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-vynal-text-primary">Tarif horaire ↑</option>
            <option value="price_high" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-vynal-text-primary">Tarif horaire ↓</option>
          </select>
        </div>

        {/* Bouton de rafraîchissement */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="flex items-center gap-1 border-slate-200/80 dark:border-slate-700/30 bg-white/30 dark:bg-slate-900/30 text-slate-800 dark:text-vynal-text-primary hover:bg-slate-100/50 dark:hover:bg-slate-800/50 px-1.5 py-0.5 h-6"
          disabled={isLoading}
        >
          <RefreshCw className={`h-2.5 w-2.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-[10px]">Rafraîchir</span>
        </Button>
      </div>
    </div>
  );
};

// Composant principal pour la page des talents
export default function TalentsClientPage({ initialData }: TalentsClientPageProps) {
  // Parsing des données initiales
  const initialParsedData: TalentsPageData = JSON.parse(initialData);
  
  // Hooks React et Next.js
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Extraction des paramètres d'URL
  const page = Number(searchParams?.get('page') || '1');
  const urlSearchQuery = searchParams?.get('search') || '';
  
  // États locaux
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [currentPage, setCurrentPage] = useState(page);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [sortMethod, setSortMethod] = useState('recommended');
  
  // Données des talents
  const [allTalents, setAllTalents] = useState<Talent[]>(initialParsedData.talents || []);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>(initialParsedData.talents || []);
  const [totalTalents, setTotalTalents] = useState(initialParsedData.totalCount || 0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Nombre total de pages
  const totalPages = useMemo(() => {
    const itemsPerPage = 24;
    return Math.ceil(totalTalents / itemsPerPage);
  }, [totalTalents]);
  
  // Talents affichés (avec pagination)
  const paginatedTalents = useMemo(() => {
    const itemsPerPage = 24;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTalents.slice(startIndex, endIndex);
  }, [filteredTalents, currentPage]);
  
  // Mise à jour des états en fonction des paramètres d'URL
  useEffect(() => {
    setSearchQuery(urlSearchQuery);
    setCurrentPage(page);
  }, [urlSearchQuery, page]);
  
  // Fonction pour filtrer les talents en fonction des filtres sélectionnés
  const filterTalents = useCallback(() => {
    setIsLoading(true);
    
    let filtered = [...allTalents];
    
    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(talent => {
        // Chercher dans le nom
        const nameMatch = (talent.full_name || talent.username || '')
          .toLowerCase()
          .includes(query);
        
        // Chercher dans la bio
        const bioMatch = (talent.bio || '').toLowerCase().includes(query);
        
        // Chercher dans les compétences
        const skillsMatch = talent.skills?.some(skill => 
          skill.name.toLowerCase().includes(query)
        );
        
        // Chercher dans la localisation
        const locationMatch = (talent.location || '').toLowerCase().includes(query);

        // Chercher dans la spécialité
        const specialtyMatch = (talent.specialty || talent.title || '')
          .toLowerCase()
          .includes(query);

        // Chercher dans la certification
        const certificationMatch = talent.certification_type
          ? talent.certification_type.toLowerCase().includes(query)
          : false;
        
        return nameMatch || bioMatch || skillsMatch || locationMatch || specialtyMatch || certificationMatch;
      });
    }
    
    // Appliquer le tri
    const sortFiltered = () => {
      switch (sortMethod) {
        case 'rating':
          return [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'projects':
          return [...filtered].sort((a, b) => (b.completed_projects || 0) - (a.completed_projects || 0));
        case 'price_low':
          return [...filtered].sort((a, b) => (a.hourly_rate || 0) - (b.hourly_rate || 0));
        case 'price_high':
          return [...filtered].sort((a, b) => (b.hourly_rate || 0) - (a.hourly_rate || 0));
        case 'recommended':
        default:
          return [...filtered].sort((a, b) => {
            // Algorithme de recommandation complexe
            const aScore = (a.is_certified ? 5 : 0) + 
                          (a.rating || 0) + 
                          Math.min((a.completed_projects || 0) / 10, 5);
            const bScore = (b.is_certified ? 5 : 0) + 
                          (b.rating || 0) + 
                          Math.min((b.completed_projects || 0) / 10, 5);
            return bScore - aScore;
          });
      }
    };
    
    const sortedFiltered = sortFiltered();
    
    setFilteredTalents(sortedFiltered);
    setTotalTalents(sortedFiltered.length);
    setIsLoading(false);
  }, [allTalents, searchQuery, sortMethod]);
  
  // Appliquer le filtrage quand les filtres changent
  useEffect(() => {
    filterTalents();
  }, [filterTalents]);
  
  // Mettre à jour l'URL en fonction des filtres sélectionnés
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    
    const newUrl = `${pathname}${params.toString() ? '?' + params.toString() : ''}`;
    router.push(newUrl, { scroll: false });
  }, [pathname, router, searchQuery, currentPage]);
  
  // Mettre à jour l'URL quand les filtres changent
  useEffect(() => {
    updateUrl();
  }, [searchQuery, currentPage, updateUrl]);
  
  // Gestionnaires d'événements
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);
  
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  const handleSortChange = useCallback((method: string) => {
    setSortMethod(method);
  }, []);
  
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // Forcer la revalidation du cache
      await revalidateTalents();
      // Récupérer les nouvelles données
      const newData = await getTalentsPageData();
      setAllTalents(newData.talents);
      setFilteredTalents(newData.talents);
      setTotalTalents(newData.totalCount);
      setCurrentPage(1);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 md:py-10">
      {/* Barre de recherche */}
      <div className="mb-6 sm:mb-8">
        <SearchBarSimple
          placeholder="Rechercher un talent..."
          onSearch={handleSearch}
          initialValue={searchQuery}
        />
      </div>

      {/* En-tête des résultats */}
      <ResultsHeader
        searchQuery={searchQuery}
        totalCount={totalTalents}
        currentPage={currentPage}
        totalPages={totalPages}
        sortMethod={sortMethod}
        onSortChange={handleSortChange}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Liste des talents */}
      {isLoading ? (
        <TalentSkeletonLoader count={12} grid={true} />
      ) : (
        <TalentsGrid
          talents={paginatedTalents}
          isPriority={true}
          onViewTalent={(id) => router.push(`/profile/id/${id}`)}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 sm:mt-10 flex justify-center">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
} 