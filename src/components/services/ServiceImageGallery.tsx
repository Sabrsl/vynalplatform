"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceImageGalleryProps {
  images?: string[];
  altText: string;
  className?: string;
}

const ServiceImageGallery: React.FC<ServiceImageGalleryProps> = ({ 
  images = [], 
  altText,
  className
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const galleryRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  
  // Précharger les images
  useEffect(() => {
    if (!images || images.length === 0) return;
    
    const img = new Image();
    img.src = images[currentIndex];
    img.onload = () => setIsLoading(false);
    img.onerror = () => setIsLoading(false);
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [currentIndex, images]);
  
  // Naviguer à l'image précédente
  const goToPrevious = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsLoading(true);
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };
  
  // Naviguer à l'image suivante
  const goToNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsLoading(true);
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };
  
  // Basculer le mode plein écran
  const toggleFullscreen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Si on active le mode plein écran, bloquer le défilement de la page
    if (!isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    setIsFullscreen(!isFullscreen);
  };
  
  // Fermer le mode plein écran lors du clic à l'extérieur de l'image
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === fullscreenContainerRef.current) {
      toggleFullscreen();
    }
  };
  
  // Gérer les touches du clavier pour la navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        switch (e.key) {
          case 'ArrowLeft':
            goToPrevious();
            break;
          case 'ArrowRight':
            goToNext();
            break;
          case 'Escape':
            toggleFullscreen();
            break;
          default:
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Assurer que le défilement est restauré si le composant est démonté
      document.body.style.overflow = '';
    };
  }, [isFullscreen, images.length]);
  
  // Si pas d'images, ne rien afficher
  if (!images || images.length === 0) {
    return null;
  }
  
  // Mode plein écran
  if (isFullscreen) {
    return (
      <div 
        ref={fullscreenContainerRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="relative w-full h-full flex items-center justify-center p-4">
          {/* Compteur d'images */}
          <div className="absolute top-4 left-4 z-10 bg-black/60 text-white text-sm px-3 py-1.5 rounded-md">
            {currentIndex + 1} / {images.length}
          </div>
          
          {/* Bouton de fermeture */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-10 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
            aria-label="Fermer le plein écran"
          >
            <X size={24} />
          </button>
          
          {/* Image en cours */}
          <div className="relative max-w-full max-h-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <img 
              src={images[currentIndex]} 
              alt={`${altText} - Image ${currentIndex + 1}`}
              className={cn(
                "max-h-[85vh] max-w-full object-contain rounded shadow-2xl transition-opacity duration-300",
                isLoading ? "opacity-0" : "opacity-100"
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          </div>
          
          {/* Boutons de navigation */}
          {images.length > 1 && (
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
          
          {/* Miniatures en bas */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 px-4 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                  setIsLoading(true);
                }}
                className={cn(
                  "flex-shrink-0 h-14 w-14 sm:h-16 sm:w-16 rounded-md overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  index === currentIndex 
                    ? "border-indigo-500 opacity-100 scale-105" 
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img 
                  src={image} 
                  alt={`Miniature ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Mode normal (intégré dans la page)
  return (
    <div 
      ref={galleryRef} 
      className={cn("relative rounded-lg overflow-hidden shadow-md bg-gray-900", className)}
    >
      {/* Image principale */}
      <div className="relative aspect-video">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/20 z-10">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <img 
          src={images[currentIndex]} 
          alt={`${altText} - Image ${currentIndex + 1}`}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoading ? "opacity-70" : "opacity-100"
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
        
        {/* Indicateur de position et bouton plein écran */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-center justify-between">
          <div className="text-white text-xs sm:text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-indigo-200 transition-colors flex items-center gap-1 text-xs sm:text-sm"
            aria-label="Voir en plein écran"
          >
            <ZoomIn size={16} className="mr-1" />
            <span className="hidden sm:inline">Agrandir</span>
          </button>
        </div>
        
        {/* Boutons de navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/80 transition-colors"
              aria-label="Image précédente"
            >
              <ChevronLeft size={20} />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/80 transition-colors"
              aria-label="Image suivante"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      
      {/* Miniatures */}
      {images.length > 1 && (
        <div className="flex overflow-x-auto py-2 px-1 bg-gray-800/20 dark:bg-gray-900/40 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsLoading(true);
              }}
              className={cn(
                "flex-shrink-0 mx-1 h-14 w-14 sm:h-16 sm:w-16 rounded-md overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500",
                index === currentIndex 
                  ? "border-purple-600 opacity-100" 
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img 
                src={image} 
                alt={`Miniature ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceImageGallery; 