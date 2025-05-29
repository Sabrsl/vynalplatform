"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
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
const PartnersSection = memo(() => {
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
  
  // Fonction mémorisée pour mettre à jour la durée d'animation
  const updateAnimationDuration = useCallback(() => {
    if (!scrollerRef.current) return;
    const scroller = scrollerRef.current;
    
    // La largeur totale influence la durée pour une vitesse constante
    const scrollerWidth = scroller.scrollWidth;
    const baseDuration = 40; // secondes
    const calculatedDuration = (scrollerWidth / 2000) * baseDuration;
    scroller.style.animationDuration = `${calculatedDuration}s`;
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
    
    updateAnimationDuration();
    
    // Recalculer si la fenêtre change de taille
    const handleResize = () => {
      updateAnimationDuration();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isPaused, isInView, isReducedMotion, updateAnimationDuration]);
  
  // Alternance pause/lecture
  const handlePauseToggle = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);
  
  // Classes CSS mémorisées pour les performances
  const sectionClasses = useMemo(() => cn(
    "py-16 md:py-24 overflow-hidden w-screen relative -mx-4 md:-mx-8 lg:-mx-12",
    isDarkMode ? "bg-vynal-purple-dark/50" : "bg-white"
  ), [isDarkMode]);
  
  const headingClasses = useMemo(() => cn(
    "text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent",
  ), []);
  
  const leftGradientClasses = useMemo(() => cn(
    "absolute left-0 w-16 sm:w-24 md:w-32 h-full z-10",
    "bg-gradient-to-r",
    isDarkMode 
      ? "from-vynal-purple-dark/95 to-transparent"
      : "from-white/95 to-transparent"
  ), [isDarkMode]);
  
  const rightGradientClasses = useMemo(() => cn(
    "absolute right-0 w-16 sm:w-24 md:w-32 h-full z-10",
    "bg-gradient-to-l",
    isDarkMode 
      ? "from-vynal-purple-dark/95 to-transparent"
      : "from-white/95 to-transparent"
  ), [isDarkMode]);
  
  // Styles d'animation mémorisés
  const scrollerStyle = useMemo(() => ({
    animation: isReducedMotion ? 'none' : 'scroll 40s linear infinite',
    willChange: 'transform',
    animationPlayState: isPaused || !isInView ? 'paused' : 'running'
  }), [isReducedMotion, isPaused, isInView]);
  
  return (
    <section 
      ref={containerRef}
      aria-labelledby="partners-heading"
      className={sectionClasses}
    >
      <div className="container mx-auto px-4 mb-8 sm:mb-10 md:mb-12">
        <h2 
          id="partners-heading"
          className={headingClasses}
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
          className={leftGradientClasses} 
          aria-hidden="true"
        />
        <div 
          className={rightGradientClasses}
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
          style={scrollerStyle}
        >
          {duplicatedPartners.map((partner, index) => {
            // Mémoriser les classes d'image pour chaque partenaire
            const imageClasses = cn(
              "h-auto w-auto object-contain max-h-full max-w-full transition-all duration-300",
              "hover:scale-105 select-none",
              isDarkMode
                ? "filter hue-rotate-275 brightness-100 contrast-100 opacity-85 hover:opacity-100"
                : "opacity-90 hover:opacity-100"
            );
            
            return (
              <div 
                key={`${partner.name}-${index}`} 
                className="inline-block"
                aria-hidden={index >= partners.length ? "true" : "false"}
              >
                <div className="w-16 sm:w-20 md:w-24 h-14 sm:h-16 md:h-18 relative flex items-center justify-center">
                  <Image
                    src={partner.image}
                    alt={`Logo ${partner.name}`}
                    width={80}
                    height={56}
                    className={imageClasses}
                    loading={index < partners.length ? "eager" : "lazy"}
                    // Optimisation de la priorité pour les LCP
                    priority={index < partners.length}
                  />
                </div>
              </div>
            );
          })}
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
});

PartnersSection.displayName = "PartnersSection";

export default PartnersSection;