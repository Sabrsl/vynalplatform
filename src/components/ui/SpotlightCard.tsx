"use client";

import React, { useState, useRef, useCallback, useMemo, memo } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Désactiver l'effet de spotlight pour les appareils à faible puissance
   * @default false 
   */
  disableEffects?: boolean;
}

const SpotlightCard = memo(function SpotlightCard({ 
  children, 
  className = '',
  disableEffects = false
}: SpotlightCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Réduire les calculs en limitant la fréquence des mises à jour
  const throttledSetPosition = useCallback((x: number, y: number) => {
    // Limitation à 30fps pour réduire la charge CPU
    requestAnimationFrame(() => {
      setPosition({ x, y });
    });
  }, []);

  // Optimisation des fonctions avec useCallback
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || disableEffects) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate position relative to the card
    throttledSetPosition(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
  }, [disableEffects, throttledSetPosition]);

  const handleMouseEnter = useCallback(() => {
    if (!disableEffects) {
      setIsHovering(true);
    }
  }, [disableEffects]);

  const handleMouseLeave = useCallback(() => {
    if (!disableEffects) {
      setIsHovering(false);
    }
  }, [disableEffects]);

  // Mémorisation des styles pour éviter de les recréer inutilement
  const borderStyle = useMemo(() => ({
    boxShadow: 'inset 0 0 0 1px rgba(255, 155, 255, 0.3)'
  }), []);

  // Optimisation: utiliser une version simplifiée du gradient pour les appareils mobiles/à faible puissance
  const spotlightStyle = useMemo(() => {
    if (disableEffects) {
      return { opacity: 0 };
    }
    
    return {
      opacity: isHovering ? 1 : 0,
      background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, 
                 rgba(255, 0, 255, 0.12), 
                 rgba(255, 105, 180, 0.08) 15%, 
                 rgba(255, 20, 147, 0.04) 30%, 
                 transparent 50%)`,
      willChange: isHovering ? 'background' : 'auto',
    };
  }, [isHovering, position.x, position.y, disableEffects]);

  // Classes CSS mémorisées
  const cardClassName = useMemo(() => 
    `relative overflow-hidden group transition-all duration-300 will-change-transform hover:scale-[1.02] hover:-translate-y-1 ${className}`,
    [className]
  );

  return (
    <div
      ref={cardRef}
      className={cardClassName}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Subtle border highlight on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={borderStyle}
        aria-hidden="true"
      />

      {/* Spotlight effect */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-500"
        style={spotlightStyle}
        aria-hidden="true"
      />

      {/* Card content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

SpotlightCard.displayName = "SpotlightCard";

export default SpotlightCard; 