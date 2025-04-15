"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';
import { useServices } from '@/hooks/useServices';
import { formatPrice } from '@/lib/utils';
import { ChevronRight, Filter, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');
  const subcategorySlug = searchParams.get('subcategory');
  const { categories, subcategories, loading: categoriesLoading, error: categoriesError, getSubcategoriesByCategoryId } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categorySlug);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(subcategorySlug);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trouver la catégorie active
  const activeCategory = categories.find(cat => cat.slug === selectedCategory);

  // Obtenir les sous-catégories pour la catégorie sélectionnée
  const activeSubcategories = activeCategory 
    ? getSubcategoriesByCategoryId(activeCategory.id)
    : [];
    
  // Trouver la sous-catégorie active
  const activeSubcategory = activeSubcategories.find(subcat => subcat.slug === selectedSubcategory);
  
  // Paramètres pour le hook useServices
  const servicesParams = {
    categoryId: activeCategory?.id,
    subcategoryId: activeSubcategory?.id,
    // On pourrait ajouter une recherche par texte plus tard
  };
  
  // Récupérer les services avec les filtres
  const { services, loading: servicesLoading, error: servicesError } = useServices(servicesParams);
  
  // Mettre à jour les sélections quand l'URL change
  useEffect(() => {
    setSelectedCategory(categorySlug);
    setSelectedSubcategory(subcategorySlug);
  }, [categorySlug, subcategorySlug]);

  // Tri des catégories selon l'ordre exact du seed
  const sortedCategories = [...categories].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.slug);
    const indexB = CATEGORY_ORDER.indexOf(b.slug);
    
    // Si une des catégories n'est pas dans la liste, la placer à la fin
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
  
  // Gérer la recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Pour l'instant, nous ne faisons rien avec searchQuery
    // Plus tard on pourrait implémenter une recherche textuelle
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/" className="text-gray-500 hover:text-gray-700">
          Accueil
        </Link>
        <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
        <span className="font-medium">Services</span>
        {activeCategory && (
          <>
            <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            <span className="text-indigo-600">{activeCategory.name}</span>
            
            {activeSubcategory && (
              <>
                <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
                <span className="text-indigo-600">{activeSubcategory.name}</span>
              </>
            )}
          </>
        )}
      </div>

      <h1 className="text-3xl font-bold mb-6">
        {activeSubcategory 
          ? activeSubcategory.name
          : activeCategory 
          ? activeCategory.name 
          : "Tous nos services"}
      </h1>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-md p-4 mb-8 flex items-center">
        <Search className="h-5 w-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Rechercher un service..."
          className="flex-1 outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button 
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md ml-4 flex items-center"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </button>
      </form>

      {/* État de chargement - affiche le spinner uniquement pendant le chargement initial */}
      {(categoriesLoading || servicesLoading) && 
        categories.length === 0 && services.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des données...</p>
          </div>
        )
      }

      {/* États d'erreur */}
      {categoriesError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-8">
          Une erreur est survenue lors du chargement des catégories: {categoriesError}
        </div>
      )}
      
      {servicesError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-8">
          Une erreur est survenue lors du chargement des services: {servicesError}
        </div>
      )}

      {/* Message quand aucune catégorie n'est trouvée */}
      {!categoriesLoading && !categoriesError && categories.length === 0 && (
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-md mb-8">
          Aucune catégorie trouvée. Veuillez contacter l'administrateur.
        </div>
      )}

      {/* Contenu principal */}
      {!categoriesLoading && !categoriesError && categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar avec catégories */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="font-semibold text-lg mb-4">Catégories</h2>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/services" 
                  className={`block p-2 rounded-md hover:bg-gray-100 ${!selectedCategory ? 'bg-indigo-50 text-indigo-600 font-medium' : ''}`}
                >
                  Toutes les catégories ({subcategories.length})
                </Link>
              </li>
              {/* Utiliser les catégories triées selon l'ordre du seed */}
              {sortedCategories.map((category) => {
                const subCatCount = getSubcategoriesByCategoryId(category.id).length;
                return (
                  <li key={category.id}>
                    <Link 
                      href={`/services?category=${category.slug}`}
                      className={`block p-2 rounded-md hover:bg-gray-100 ${
                        selectedCategory === category.slug ? 'bg-indigo-50 text-indigo-600 font-medium' : ''
                      }`}
                    >
                      {category.name} ({subCatCount})
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contenu principal */}
          <div className="md:col-span-3">
            {/* Sous-catégories si une catégorie est sélectionnée */}
            {activeCategory && activeSubcategories.length > 0 && (
              <div className="mb-8">
                <h2 className="font-semibold text-lg mb-4">Sous-catégories de {activeCategory.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {/* Tri des sous-catégories par ordre alphabétique */}
                  {[...activeSubcategories]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((subcategory) => (
                    <Link 
                      key={subcategory.id}
                      href={`/services?category=${activeCategory.slug}&subcategory=${subcategory.slug}`}
                      className={`py-1 px-3 rounded-full text-sm ${
                        selectedSubcategory === subcategory.slug 
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      {subcategory.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Message quand aucune sous-catégorie n'est trouvée */}
            {activeCategory && activeSubcategories.length === 0 && (
              <div className="bg-gray-50 p-4 rounded-md mb-8 text-gray-600">
                Aucune sous-catégorie trouvée pour {activeCategory.name}.
              </div>
            )}

            {/* Liste des services */}
            {servicesLoading && services.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Chargement des services...</p>
              </div>
            ) : (
              <>
                {/* Afficher les services ou un message si aucun n'est trouvé */}
                {services.length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-600 mb-2">Aucun service trouvé pour ces critères.</p>
                    <p className="text-sm text-gray-500">Essayez de modifier vos filtres ou de revenir à la liste complète.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                      <Link href={`/services/${service.slug}`} key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-transform hover:translate-y-[-2px]">
                        <div className="h-40 bg-gray-200"></div>
                        <div className="p-4 flex-1">
                          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                            {service.subcategories?.name || service.categories.name}
                          </span>
                          <h3 className="font-semibold mt-2 text-lg line-clamp-1">{service.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {service.description}
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={service.profiles.avatar_url || undefined} alt={service.profiles.username || ''} />
                                <AvatarFallback>
                                  {(service.profiles.username || service.profiles.full_name || 'UN')
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{service.profiles.username || service.profiles.full_name || 'Freelance'}</span>
                            </div>
                            <span className="font-bold">{formatPrice(service.price)} FCFA</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 