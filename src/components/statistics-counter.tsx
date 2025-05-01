"use client";

import { useEffect, useRef, useCallback } from "react";

export default function StatisticsCounter({ duration = 2000 }: { duration?: number }) {
  // Utiliser une référence pour l'observateur pour éviter de le recréer à chaque rendu
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Mémoriser la fonction d'animation pour éviter de la recréer
  const animateValue = useCallback((counter: HTMLElement, start: number, end: number, animDuration: number) => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    
    // Fonction pour animer progressivement un compteur
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / animDuration, 1);
      const currentValue = Math.floor(progress * (end - start) + start);
      
      // N'actualiser le DOM que si la valeur a changé
      if (counter.textContent !== currentValue.toString()) {
        counter.textContent = currentValue.toString();
      }
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };
    
    animationFrameId = window.requestAnimationFrame(step);
    
    // Retourner une fonction de nettoyage
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  // Fonction pour gérer l'intersection
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target as HTMLElement;
        
        // Vérifier si le compteur a déjà été animé
        if (counter.dataset.animated === 'true') return;
        
        // Marquer le compteur comme animé
        counter.dataset.animated = 'true';
        
        // Récupérer la valeur cible depuis l'attribut data-target
        const target = parseInt(counter.getAttribute('data-target') || '0');
        const start = 0;
        
        // Animer le compteur
        animateValue(counter, start, target, duration);
      }
    });
  }, [animateValue, duration]);
  
  useEffect(() => {
    // Nettoyer l'observateur existant
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Créer un nouvel observateur avec la fonction de rappel
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.1, // Déclencher plus tôt pour améliorer la perception de vitesse
      rootMargin: '0px 0px 50px 0px' // Déclencher légèrement avant que l'élément soit visible
    });
    
    // Sélectionner tous les compteurs et les observer
    const counters = document.querySelectorAll('.counter-value');
    counters.forEach(counter => {
      observerRef.current?.observe(counter);
    });
    
    // Nettoyer l'observateur lors du démontage
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [handleIntersection]); // Ne recréer l'effet que si handleIntersection change
  
  // Ce composant n'a pas de rendu propre, il ajoute simplement un comportement
  return null;
} 