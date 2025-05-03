"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useTheme } from 'next-themes';

// Hook personnalisé pour les requêtes média (à ajouter à votre projet)
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    const updateMatch = () => setMatches(media.matches);
    
    // Vérification initiale
    updateMatch();
    
    // S'abonner aux changements
    media.addEventListener('change', updateMatch);
    
    return () => {
      media.removeEventListener('change', updateMatch);
    };
  }, [query]);
  
  return matches;
};

// Type de props pour une meilleure typage et sécurité
interface ServiceImageGalleryProps {
  images?: string[];
  altText: string;
  className?: string;
  initialIndex?: number;
  lazyLoadingEnabled?: boolean;
}

/**
 * Galerie d'images optimisée pour services
 * - Performance mobile améliorée avec UI adaptative
 * - Support complet des thèmes clair/sombre
 * - Optimisation du chargement des images avec lazy-loading intelligent
 * - Accessibilité complète (clavier, lecteurs d'écran)
 * - Gestion avancée des erreurs et fallbacks
 */
const ServiceImageGallery: React.FC<ServiceImageGalleryProps> = ({ 
  images = [], 
  altText,
  className,
  initialIndex = 0,
  lazyLoadingEnabled = true
}) => {
  // Hooks pour le thème et la taille d'écran
  const { theme, resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark' || theme === 'dark';
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // Vérifier et nettoyer les images invalides
  const validImages = useMemo(() => {
    return (images || []).filter(img => img && typeof img === 'string');
  }, [images]);
  
  // États avec regroupement pour réduire les rendus
  const [viewState, setViewState] = useState({
    currentIndex: Math.min(initialIndex, Math.max(0, (validImages.length || 1) - 1)) || 0,
    isFullscreen: false,
    isLoading: true,
    imageError: false,
    thumbnailsVisible: true,
  });
  
  // Suivre les images déjà chargées pour optimiser le chargement
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  
  // Références pour les éléments DOM
  const galleryRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  
  // Référence pour gérer le debounce des clics
  const navigationThrottleRef = useRef<boolean>(false);
  
  // Gestionnaire optimisé pour le chargement d'image
  const handleImageLoad = useCallback(() => {
    setViewState(prev => ({ ...prev, isLoading: false, imageError: false }));
    setLoadedImages(prev => ({
      ...prev,
      [viewState.currentIndex]: true
    }));
  }, [viewState.currentIndex]);
  
  // Gestionnaire d'erreur d'image avec retry
  const handleImageError = useCallback(() => {
    setViewState(prev => ({ ...prev, isLoading: false, imageError: true }));
  }, []);
  
  // Préchargement de l'image actuelle et des deux images adjacentes
  useEffect(() => {
    if (!validImages.length) return;
    
    // Toujours marquer l'image courante comme en chargement si elle n'est pas déjà chargée
    setViewState(prev => ({ 
      ...prev, 
      isLoading: !loadedImages[prev.currentIndex], 
      imageError: false 
    }));
    
    // Préchargement optimisé des images adjacentes
    if (lazyLoadingEnabled) {
      const preloadIndexes = [
        viewState.currentIndex,  // Image actuelle
        (viewState.currentIndex + 1) % validImages.length,  // Image suivante
        (viewState.currentIndex - 1 + validImages.length) % validImages.length  // Image précédente
      ];
      
      // Précharger uniquement les images qui ne sont pas déjà chargées
      preloadIndexes.forEach(index => {
        if (!loadedImages[index] && validImages[index]) {
          const img = new window.Image();
          img.src = validImages[index];
          img.onload = () => {
            setLoadedImages(prev => ({ ...prev, [index]: true }));
            if (index === viewState.currentIndex) {
              setViewState(prev => ({ ...prev, isLoading: false }));
            }
          };
          img.onerror = () => {
            if (index === viewState.currentIndex) {
              setViewState(prev => ({ ...prev, isLoading: false, imageError: true }));
            }
          };
        }
      });
    }
  }, [validImages, viewState.currentIndex, loadedImages, lazyLoadingEnabled]);
  
  // Navigation avec throttle pour éviter les multiples clics accidentels
  const navigateWithThrottle = useCallback((direction: 'prev' | 'next') => {
    if (navigationThrottleRef.current) return;
    if (!validImages.length) return;
    
    // Activer le throttle
    navigationThrottleRef.current = true;
    
    setViewState(prev => {
      const newIndex = direction === 'prev'
        ? (prev.currentIndex - 1 + validImages.length) % validImages.length
        : (prev.currentIndex + 1) % validImages.length;
      
      return {
        ...prev,
        currentIndex: newIndex,
        isLoading: !loadedImages[newIndex]
      };
    });
    
    // Désactiver le throttle après un court délai
    setTimeout(() => {
      navigationThrottleRef.current = false;
    }, 200);
  }, [validImages, loadedImages]);
  
  // Navigation sécurisée avec vérification
  const goToPrevious = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (validImages.length <= 1) return;
    navigateWithThrottle('prev');
  }, [validImages.length, navigateWithThrottle]);
  
  const goToNext = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (validImages.length <= 1) return;
    navigateWithThrottle('next');
  }, [validImages.length, navigateWithThrottle]);
  
  // Sélection de thumbnail optimisée
  const selectThumbnail = useCallback((index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (index === viewState.currentIndex || navigationThrottleRef.current) return;
    
    // Activer le throttle
    navigationThrottleRef.current = true;
    
    setViewState(prev => ({
      ...prev,
      currentIndex: index,
      isLoading: !loadedImages[index]
    }));
    
    // Désactiver le throttle après un court délai
    setTimeout(() => {
      navigationThrottleRef.current = false;
    }, 200);
  }, [viewState.currentIndex, loadedImages]);
  
  // Basculer le mode plein écran avec animation fluide
  const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Activer/désactiver le scroll avec animation pour une meilleure UX
    setViewState(prev => {
      const newFullscreen = !prev.isFullscreen;
      
      if (newFullscreen) {
        document.body.style.overflow = 'hidden';
        document.documentElement.classList.add('gallery-fullscreen-open');
      } else {
        setTimeout(() => {
          document.body.style.overflow = '';
          document.documentElement.classList.remove('gallery-fullscreen-open');
        }, 300);
      }
      
      return { ...prev, isFullscreen: newFullscreen };
    });
  }, []);
  
  // Fermer le mode plein écran lors du clic à l'extérieur de l'image
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === fullscreenContainerRef.current) {
      toggleFullscreen();
    }
  }, [toggleFullscreen]);
  
  // Centrer automatiquement la miniature active
  useEffect(() => {
    if (!thumbnailsRef.current || validImages.length <= 1) return;
    
    const thumbnailElements = thumbnailsRef.current.querySelectorAll('button');
    const activeThumbnail = thumbnailElements[viewState.currentIndex];
    
    if (activeThumbnail) {
      // Calculer le scroll optimal pour centrer la miniature
      const containerWidth = thumbnailsRef.current.clientWidth;
      const thumbLeft = activeThumbnail.offsetLeft;
      const thumbWidth = activeThumbnail.clientWidth;
      const scrollPosition = thumbLeft - (containerWidth / 2) + (thumbWidth / 2);
      
      // Utiliser scrollTo avec behavior smooth pour une animation fluide
      thumbnailsRef.current.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [viewState.currentIndex, validImages.length]);
  
  // Gérer les touches du clavier pour la navigation avec optimisation des événements
  useEffect(() => {
    if (!viewState.isFullscreen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewState.isFullscreen, goToPrevious, goToNext, toggleFullscreen]);
  
  // Ajouter support pour les gestes tactiles (swipe)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const galleryElement = galleryRef.current;
    if (!galleryElement) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };
    
    const handleSwipe = () => {
      const minSwipeDistance = 50;
      const swipeDistance = touchEndX - touchStartX;
      
      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          goToPrevious();
        } else {
          goToNext();
        }
      }
    };
    
    galleryElement.addEventListener('touchstart', handleTouchStart);
    galleryElement.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      galleryElement.removeEventListener('touchstart', handleTouchStart);
      galleryElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goToPrevious, goToNext]);
  
  // Nettoyer l'état de défilement lorsque le composant est démonté
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.documentElement.classList.remove('gallery-fullscreen-open');
    };
  }, []);
  
  // Si pas d'images, afficher un fallback propre
  if (!validImages.length) {
    return (
      <div 
        className={cn(
          "relative rounded-lg overflow-hidden shadow-md",
          "aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center",
          className
        )}
      >
        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
          <ImageIcon className="h-10 w-10 mb-2" />
          <p className="text-sm font-medium">Aucune image disponible</p>
        </div>
      </div>
    );
  }
  
  // Préparation des classes CSS pour le thème actuel
  const darkModeClasses = isDarkMode ? "dark" : "";
  
  // Mode plein écran avec portail pour une meilleure performance DOM
  if (viewState.isFullscreen) {
    return (
      <div 
        ref={fullscreenContainerRef}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          "bg-black/90 backdrop-blur-sm transition-opacity duration-300",
          darkModeClasses
        )}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label={`Galerie d'images : ${altText}`}
      >
        <div className="relative w-full h-full flex items-center justify-center p-4">
          {/* Compteur d'images */}
          <div className="absolute bottom-4 sm:top-4 sm:bottom-auto left-4 z-10 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-sm sm:bg-black/75 sm:px-2 sm:py-1 sm:text-xs">
            {viewState.currentIndex + 1} / {validImages.length}
          </div>
          
          {/* Bouton de fermeture - fixe et très visible */}
          <div className="absolute bottom-4 sm:top-4 sm:bottom-auto right-4 z-50">
            <button
              onClick={toggleFullscreen}
              className="bg-transparent border border-white text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-white/10 transition-all sm:bg-black/40 sm:w-9 sm:h-9 sm:hover:bg-white/10"
              aria-label="Fermer le plein écran"
            >
              <X size={18} strokeWidth={2.5} className="sm:size-[20px]" />
            </button>
          </div>
          
          {/* Image en cours */}
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            {viewState.isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {viewState.imageError ? (
              <div className="bg-gray-800 rounded-lg p-6 text-center text-white">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-500" />
                <p>Impossible de charger l'image</p>
                <button 
                  className="mt-3 px-3 py-1 bg-indigo-600 rounded-md text-sm hover:bg-indigo-700 transition-colors"
                  onClick={() => setViewState(prev => ({...prev, isLoading: true, imageError: false}))}
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <div className="relative">
                <Image 
                  src={validImages[viewState.currentIndex]} 
                  alt={`${altText} - Image ${viewState.currentIndex + 1}`}
                  className={cn(
                    "max-h-[85vh] max-w-full object-contain rounded shadow-2xl transition-opacity duration-300",
                    viewState.isLoading ? "opacity-0" : "opacity-100"
                  )}
                  width={1200}
                  height={800}
                  priority={true}
                  quality={90}
                  unoptimized={false}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </div>
            )}
          </div>
          
          {/* Boutons de navigation */}
          {validImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Image précédente"
              >
                <ChevronLeft size={28} />
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Image suivante"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
          
          {/* Miniatures en bas - optimisées pour mobile */}
          {validImages.length > 1 && (
            <div 
              ref={thumbnailsRef}
              className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 px-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400/50 scrollbar-track-transparent pb-2"
            >
              {validImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => selectThumbnail(index, e)}
                  className={cn(
                    "flex-shrink-0 h-14 w-14 sm:h-16 sm:w-16 rounded-md overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500",
                    index === viewState.currentIndex 
                      ? "border-indigo-500 opacity-100 scale-105" 
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  aria-label={`Aller à l'image ${index + 1}`}
                  aria-current={index === viewState.currentIndex ? "true" : "false"}
                >
                  <Image 
                    src={image} 
                    alt={`Miniature ${index + 1}`}
                    className="h-full w-full object-cover"
                    width={64}
                    height={64}
                    quality={50}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Mode normal (intégré dans la page) - optimisé pour mobile et thème
  return (
    <div 
      ref={galleryRef} 
      className={cn(
        "relative rounded-lg overflow-hidden shadow-md",
        isDarkMode ? "bg-gray-900" : "bg-gray-100",
        className
      )}
      role="region"
      aria-label={`Galerie d'images : ${altText}`}
    >
      {/* Image principale */}
      <div className="relative aspect-video">
        {viewState.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/20 dark:bg-gray-900/40 z-10">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {viewState.imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-800">
            <ImageIcon className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Image non disponible</p>
          </div>
        ) : (
          <Image 
            src={validImages[viewState.currentIndex]} 
            alt={`${altText} - Image ${viewState.currentIndex + 1}`}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              viewState.isLoading ? "opacity-70" : "opacity-100"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={75}
            priority={viewState.currentIndex === 0}
          />
        )}
        
        {/* Indicateur de position et bouton plein écran */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-center justify-between">
          <div className="text-white text-[10px] sm:text-xs font-medium">
            {viewState.currentIndex + 1} / {validImages.length}
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-indigo-200 transition-colors flex items-center gap-1 text-xs sm:text-sm focus:outline-none focus:underline"
            aria-label="Voir en plein écran"
          >
            <ZoomIn size={16} />
          </button>
        </div>
        
        {/* Boutons de navigation - adaptés en fonction de la taille d'écran */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className={cn(
                "absolute left-2 top-1/2 transform -translate-y-1/2",
                "bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-white/50",
                isMobile ? "p-1.5" : "p-2"
              )}
              aria-label="Image précédente"
            >
              <ChevronLeft size={isMobile ? 16 : 20} />
            </button>
            
            <button
              onClick={goToNext}
              className={cn(
                "absolute right-2 top-1/2 transform -translate-y-1/2",
                "bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-white/50",
                isMobile ? "p-1.5" : "p-2"
              )}
              aria-label="Image suivante"
            >
              <ChevronRight size={isMobile ? 16 : 20} />
            </button>
          </>
        )}
      </div>
      
      {/* Miniatures - optimisées pour mobile avec défilement fluide */}
      {validImages.length > 1 && (
        <div 
          ref={thumbnailsRef}
          className={cn(
            "flex overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent",
            isDarkMode ? "bg-gray-800/40" : "bg-gray-100/60"
          )}
          role="tablist"
          aria-label="Sélection d'images"
        >
          {validImages.map((image, index) => (
            <button
              key={index}
              onClick={() => selectThumbnail(index)}
              className={cn(
                "flex-shrink-0 mx-1",
                isMobile ? "h-14 w-14" : "h-16 w-16",
                "rounded-md overflow-hidden border-2 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-purple-500 relative",
                index === viewState.currentIndex 
                  ? "border-purple-600 opacity-100" 
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
              role="tab"
              aria-selected={index === viewState.currentIndex}
              aria-label={`Image ${index + 1}`}
            >
              <Image 
                src={image} 
                alt={`Miniature ${index + 1}`}
                className="object-cover"
                fill
                sizes="64px"
                quality={30}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
      
      {/* CSS pour optimiser les transitions et animations */}
      <style jsx global>{`
        /* Animation en entrée de plein écran */
        .gallery-fullscreen-open {
          overflow: hidden;
        }
        
        /* Optimisations pour les appareils mobiles */
        @media (max-width: 640px) {
          .scrollbar-thin {
            scrollbar-width: thin;
          }
          .scrollbar-thin::-webkit-scrollbar {
            height: 4px;
          }
        }
        
        /* Optimisation des performances d'animation */
        .transition-opacity {
          will-change: opacity;
        }
        
        /* Optimisation pour réduire CLS */
        .aspect-video {
          aspect-ratio: 16/10;
        }
      `}</style>
    </div>
  );
};

export default ServiceImageGallery;