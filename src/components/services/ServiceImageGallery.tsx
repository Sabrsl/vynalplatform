"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useTheme } from 'next-themes';

// Hook média query optimisé avec cleanup approprié
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', handler);
    
    return () => media.removeEventListener('change', handler);
  }, [query]);
  
  return matches;
};

interface ServiceImageGalleryProps {
  images?: string[];
  altText: string;
  className?: string;
  initialIndex?: number;
  lazyLoadingEnabled?: boolean;
}

const ServiceImageGallery: React.FC<ServiceImageGalleryProps> = ({ 
  images = [], 
  altText,
  className,
  initialIndex = 0,
  lazyLoadingEnabled = true
}) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // Validation et mémorisation des images
  const validImages = useMemo(() => 
    images.filter(img => img && typeof img === 'string' && img.trim()), 
    [images]
  );
  
  // État simplifié avec un seul setter
  const [state, setState] = useState(() => ({
    currentIndex: Math.max(0, Math.min(initialIndex, validImages.length - 1)),
    isFullscreen: false,
    isLoading: true,
    imageError: false
  }));
  
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  
  // Refs
  const galleryRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Gestionnaires d'image optimisés
  const handleImageLoad = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: false, imageError: false }));
    setLoadedImages(prev => new Set(prev).add(state.currentIndex));
  }, [state.currentIndex]);
  
  const handleImageError = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: false, imageError: true }));
  }, []);
  
  // Préchargement intelligent
  useEffect(() => {
    if (!validImages.length || !lazyLoadingEnabled) return;
    
    const currentLoaded = loadedImages.has(state.currentIndex);
    setState(prev => ({ 
      ...prev, 
      isLoading: !currentLoaded, 
      imageError: false 
    }));
    
    // Précharger l'image courante et les adjacentes
    const preloadIndices = [
      state.currentIndex,
      (state.currentIndex + 1) % validImages.length,
      (state.currentIndex - 1 + validImages.length) % validImages.length
    ].filter(index => !loadedImages.has(index));
    
    preloadIndices.forEach(index => {
      if (validImages[index]) {
        const img = new window.Image();
        img.src = validImages[index];
        img.onload = () => setLoadedImages(prev => new Set(prev).add(index));
      }
    });
  }, [validImages, state.currentIndex, loadedImages, lazyLoadingEnabled]);
  
  // Navigation avec debounce
  const navigate = useCallback((direction: 'prev' | 'next') => {
    if (validImages.length <= 1) return;
    
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    
    navigationTimeoutRef.current = setTimeout(() => {
      setState(prev => {
        const newIndex = direction === 'prev'
          ? (prev.currentIndex - 1 + validImages.length) % validImages.length
          : (prev.currentIndex + 1) % validImages.length;
        
        return {
          ...prev,
          currentIndex: newIndex,
          isLoading: !loadedImages.has(newIndex)
        };
      });
    }, 50);
  }, [validImages.length, loadedImages]);
  
  const goToPrevious = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate('prev');
  }, [navigate]);
  
  const goToNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate('next');
  }, [navigate]);
  
  const selectThumbnail = useCallback((index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (index === state.currentIndex) return;
    
    setState(prev => ({
      ...prev,
      currentIndex: index,
      isLoading: !loadedImages.has(index)
    }));
  }, [state.currentIndex, loadedImages]);
  
  // Toggle fullscreen optimisé
  const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    setState(prev => {
      const newFullscreen = !prev.isFullscreen;
      
      // Gestion du scroll body avec requestAnimationFrame pour de meilleures performances
      requestAnimationFrame(() => {
        if (newFullscreen) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      });
      
      return { ...prev, isFullscreen: newFullscreen };
    });
  }, []);
  
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === fullscreenRef.current) {
      toggleFullscreen();
    }
  }, [toggleFullscreen]);
  
  // Auto-scroll des thumbnails (seulement pour mobile)
  useEffect(() => {
    if (!thumbnailsRef.current || validImages.length <= 1 || !isMobile) return;
    
    const thumbnail = thumbnailsRef.current.children[state.currentIndex] as HTMLElement;
    if (thumbnail) {
      const container = thumbnailsRef.current;
      const scrollLeft = thumbnail.offsetLeft - (container.clientWidth / 2) + (thumbnail.clientWidth / 2);
      
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }
  }, [state.currentIndex, validImages.length, isMobile]);
  
  // Gestion clavier
  useEffect(() => {
    if (!state.isFullscreen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      switch (e.key) {
        case 'ArrowLeft': goToPrevious(); break;
        case 'ArrowRight': goToNext(); break;
        case 'Escape': toggleFullscreen(); break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isFullscreen, goToPrevious, goToNext, toggleFullscreen]);
  
  // Gestion tactile optimisée
  useEffect(() => {
    const element = galleryRef.current;
    if (!element) return;
    
    let startX = 0;
    let startTime = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startTime = Date.now();
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endTime = Date.now();
      const distance = endX - startX;
      const duration = endTime - startTime;
      
      // Vérifier que c'est un swipe rapide et suffisamment long
      if (Math.abs(distance) > 50 && duration < 300) {
        distance > 0 ? goToPrevious() : goToNext();
      }
    };
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goToPrevious, goToNext]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);
  
  // Fallback pour pas d'images
  if (!validImages.length) {
    return (
      <div className={cn(
        "relative rounded-lg aspect-[16/10] bg-gray-100 dark:bg-gray-800",
        "flex items-center justify-center shadow-sm",
        className
      )}>
        <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
          <ImageIcon className="h-8 w-8 mb-2" />
          <p className="text-sm">Aucune image disponible</p>
        </div>
      </div>
    );
  }
  
  // Mode plein écran
  if (state.isFullscreen) {
    return (
      <div 
        ref={fullscreenRef}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label={`Galerie: ${altText}`}
      >
        {/* Compteur et fermeture */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
            {state.currentIndex + 1} / {validImages.length}
          </div>
          <button
            onClick={toggleFullscreen}
            className="bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Image principale */}
        <div className="relative max-w-full max-h-full">
          {state.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {state.imageError ? (
            <div className="bg-gray-800 rounded-lg p-6 text-center text-white">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="mb-3">Impossible de charger l'image</p>
              <button 
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                onClick={() => setState(prev => ({...prev, isLoading: true, imageError: false}))}
              >
                Réessayer
              </button>
            </div>
          ) : (
            <Image 
              src={validImages[state.currentIndex]} 
              alt={`${altText} - ${state.currentIndex + 1}`}
              className={cn(
                "max-h-[90vh] max-w-full object-contain rounded shadow-2xl",
                "transition-opacity duration-200",
                state.isLoading ? "opacity-0" : "opacity-100"
              )}
              width={1600}
              height={900}
              priority
              quality={90}
              onLoad={handleImageLoad}
              onError={handleImageError}
              decoding="async"
            />
          )}
        </div>
        
        {/* Navigation */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-colors"
              aria-label="Précédent"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-colors"
              aria-label="Suivant"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
        
        {/* Miniatures */}
        {validImages.length > 1 && (
          <div 
            ref={thumbnailsRef}
            className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto pb-1"
          >
            {validImages.map((image, index) => (
              <button
                key={index}
                onClick={() => selectThumbnail(index)}
                className={cn(
                  "flex-shrink-0 h-14 w-14 sm:h-16 sm:w-16 rounded border-2 overflow-hidden transition-all",
                  index === state.currentIndex 
                    ? "border-white opacity-100 scale-105" 
                    : "border-white/30 opacity-70 hover:opacity-100 hover:border-white/70"
                )}
                aria-label={`Image ${index + 1}`}
              >
                <Image 
                  src={image} 
                  alt={`Miniature ${index + 1} de ${altText}`}
                  className="object-cover"
                  width={64}
                  height={64}
                  quality={50}
                  decoding="async"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Mode intégré
  return (
    <div 
      ref={galleryRef} 
      className={cn(
        "relative rounded-lg overflow-hidden shadow-sm",
        className
      )}
      role="region"
      aria-label={`Galerie: ${altText}`}
    >
      {/* Layout desktop vs mobile */}
      <div className={cn(
        "flex",
        isMobile ? "flex-col" : "flex-row gap-2"
      )}>
        
        {/* Miniatures à gauche sur desktop */}
        {validImages.length > 1 && !isMobile && (
          <div className="flex flex-col gap-2 w-14 p-1 bg-transparent rounded-lg">
            {validImages.map((image, index) => (
              <button
                key={index}
                onClick={() => selectThumbnail(index)}
                className={cn(
                  "flex-shrink-0 h-14 w-14 rounded border-2 overflow-hidden transition-all",
                  index === state.currentIndex 
                    ? "border-blue-500 opacity-100 ring-1 ring-blue-200" 
                    : "border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100 hover:border-gray-300"
                )}
                aria-label={`Image ${index + 1}`}
              >
                <Image 
                  src={image} 
                  alt={`Miniature ${index + 1} de ${altText}`}
                  className="object-cover"
                  width={56}
                  height={56}
                  quality={40}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        )}
      
        {/* Image principale */}
        <div className={cn(
          "relative overflow-hidden rounded-lg",
          isMobile ? "aspect-[16/10]" : "flex-1 aspect-[16/9] w-full max-h-[600px]"
        )}>
          {state.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {state.imageError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
              <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Image indisponible</p>
            </div>
          ) : (
            <Image 
              src={validImages[state.currentIndex]} 
              alt={`${altText} - ${state.currentIndex + 1}`}
              className={cn(
                "object-cover transition-opacity duration-200",
                state.isLoading ? "opacity-70" : "opacity-100"
              )}
              fill
              sizes="(max-width: 768px) 100vw, 1024px"
              quality={80}
              priority={state.currentIndex === 0}
              onLoad={handleImageLoad}
              onError={handleImageError}
              decoding="async"
            />
          )}
          
          {/* Overlay avec contrôles */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-white text-xs font-medium">
                {state.currentIndex + 1} / {validImages.length}
              </span>
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-blue-200 transition-colors flex items-center gap-1 text-xs"
                aria-label="Plein écran"
              >
                <ZoomIn size={14} />
                <span className="hidden sm:inline">Agrandir</span>
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          {validImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full",
                  "hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100",
                  isMobile ? "p-1 opacity-100" : "p-2"
                )}
                aria-label="Précédent"
              >
                <ChevronLeft size={isMobile ? 16 : 20} />
              </button>
              <button
                onClick={goToNext}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full",
                  "hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100",
                  isMobile ? "p-1 opacity-100" : "p-2"
                )}
                aria-label="Suivant"
              >
                <ChevronRight size={isMobile ? 16 : 20} />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Miniatures en bas sur mobile uniquement */}
      {validImages.length > 1 && isMobile && (
        <div 
          ref={thumbnailsRef}
          className="flex overflow-x-auto gap-1 p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm"
        >
          {validImages.map((image, index) => (
            <button
              key={index}
              onClick={() => selectThumbnail(index)}
              className={cn(
                "flex-shrink-0 h-12 w-12 rounded border-2 overflow-hidden transition-all",
                index === state.currentIndex 
                  ? "border-blue-500 opacity-100" 
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
              aria-label={`Image ${index + 1}`}
            >
              <Image 
                src={image} 
                alt={`Miniature ${index + 1} de ${altText}`}
                className="object-cover"
                width={48}
                height={48}
                quality={40}
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceImageGallery;