"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Section Partenaires optimisée
 * - Performance améliorée en évitant les rendus inutiles
 * - Économie de ressources avec chargement optimisé
 * - Support complet des thèmes clair/sombre
 * - Accessibilité améliorée
 * - Animation fluide sans dépendances lourdes
 * - Responsive design avancé
 */
const PartnersSection = () => {
  // Détection du thème
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Références DOM
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  
  // États pour la gestion de l'animation
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  
  // Liste des partenaires avec mémoïsation pour éviter les re-rendus
  const partners = useMemo(() => [
    { name: "Wave", image: "/assets/partners/logo_wave_.webp" },
    { name: "Orange Money", image: "/assets/partners/om_logo_.webp" },
    { name: "Free Money", image: "/assets/partners/logo_free_money.webp" },
    { name: "Stripe", image: "/assets/partners/logo_stripe.webp" },
  ], []);
  
  // Duplication des partenaires pour l'animation infinie
  const duplicatedPartners = useMemo(() => {
    // Optimisation: calculer dynamiquement le nombre nécessaire pour couvrir la largeur
    return Array(6).fill(partners).flat();
  }, [partners]);
  
  // Détection des préférences de mouvement réduit
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setIsReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  // Détection de visibilité avec Intersection Observer
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Gestion de l'animation CSS
  useEffect(() => {
    if (!scrollerRef.current) return;
    const scroller = scrollerRef.current;
    
    // Pas d'animation si mouvement réduit
    if (isReducedMotion) {
      scroller.style.animationPlayState = 'paused';
      return;
    }
    
    // Pause/reprise de l'animation
    scroller.style.animationPlayState = isPaused || !isInView ? 'paused' : 'running';
    
    // Calcul dynamique de la durée d'animation
    const updateAnimationDuration = () => {
      // La largeur totale influence la durée pour une vitesse constante
      const scrollerWidth = scroller.scrollWidth;
      const baseDuration = 40; // secondes
      const calculatedDuration = (scrollerWidth / 2000) * baseDuration;
      scroller.style.animationDuration = `${calculatedDuration}s`;
    };
    
    updateAnimationDuration();
    
    // Recalculer si la fenêtre change de taille
    const handleResize = () => {
      updateAnimationDuration();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isPaused, isInView, isReducedMotion]);
  
  // Alternance pause/lecture
  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };
  
  return (
    <section 
      ref={containerRef}
      aria-labelledby="partners-heading"
      className={cn(
        "py-12 sm:py-16 md:py-20 overflow-hidden w-screen relative -mx-4 md:-mx-8 lg:-mx-12",
        isDarkMode ? "bg-vynal-purple-dark/50" : "bg-indigo-50/80"
      )}
    >
      <div className="container mx-auto px-4 mb-8 sm:mb-10 md:mb-12">
        <h2 
          id="partners-heading"
          className={cn(
            "text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r bg-clip-text text-transparent",
            isDarkMode 
              ? "from-vynal-accent-primary to-vynal-accent-secondary" 
              : "from-indigo-600 to-indigo-800"
          )}
        >
          Ils nous font confiance
        </h2>
      </div>
      
      {/* Section optimisée pour le défilement */}
      <div 
        className="relative w-full overflow-hidden"
        role="marquee"
        aria-live="off"
      >
        {/* Dégradés sur les côtés pour un effet d'estompage */}
        <div 
          className={cn(
            "absolute left-0 w-16 sm:w-24 md:w-32 h-full z-10",
            "bg-gradient-to-r",
            isDarkMode 
              ? "from-vynal-purple-dark/95 to-transparent"
              : "from-indigo-50/95 to-transparent"
          )} 
          aria-hidden="true"
        />
        <div 
          className={cn(
            "absolute right-0 w-16 sm:w-24 md:w-32 h-full z-10",
            "bg-gradient-to-l",
            isDarkMode 
              ? "from-vynal-purple-dark/95 to-transparent"
              : "from-indigo-50/95 to-transparent"
          )} 
          aria-hidden="true"
        />
        
        {/* Conteneur défilant optimisé avec CSS animations */}
        <div 
          ref={scrollerRef}
          className="partners-scroller flex gap-14 sm:gap-16 md:gap-20 py-4 whitespace-nowrap"
          onMouseEnter={handlePauseToggle}
          onMouseLeave={handlePauseToggle}
          onTouchStart={handlePauseToggle}
          onTouchEnd={handlePauseToggle}
          style={{
            // Animation CSS pour des performances optimales
            animation: isReducedMotion ? 'none' : 'scroll 40s linear infinite',
            // Garantit une mise à l'échelle correcte pour les petits écrans
            willChange: 'transform',
          }}
        >
          {duplicatedPartners.map((partner, index) => (
            <div 
              key={`${partner.name}-${index}`} 
              className="inline-block"
              aria-hidden={index >= partners.length ? "true" : "false"}
            >
              <div className="w-24 sm:w-28 md:w-32 h-20 sm:h-22 md:h-24 relative flex items-center justify-center">
                <Image
                  src={partner.image}
                  alt={`Logo ${partner.name}`}
                  width={100}
                  height={70}
                  className={cn(
                    "h-auto w-auto object-contain max-h-full max-w-full transition-all duration-300",
                    "hover:scale-105 select-none",
                    isDarkMode
                      ? "filter hue-rotate-275 brightness-100 contrast-100 opacity-85 hover:opacity-100"
                      : "opacity-90 hover:opacity-100"
                  )}
                  loading={index < partners.length ? "eager" : "lazy"}
                  // Optimisation de la priorité pour les LCP
                  priority={index < partners.length}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Styles CSS optimisés */}
      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .partners-scroller {
          animation-play-state: running;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          animation-name: scroll;
          min-width: max-content;
        }
        
        /* Optimisation pour réduire le CLS */
        .partners-scroller img {
          aspect-ratio: 100 / 70;
          opacity: 0;
          animation: fadeIn 0.2s ease forwards;
        }
        
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        
        /* Support de réduction de mouvement */
        @media (prefers-reduced-motion: reduce) {
          .partners-scroller {
            animation: none;
            gap: 2rem;
          }
          
          .partners-scroller > div {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
};

export default PartnersSection;