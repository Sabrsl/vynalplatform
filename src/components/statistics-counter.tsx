"use client";

import { useEffect } from "react";

export default function StatisticsCounter({ duration = 2000 }: { duration?: number }) {
  useEffect(() => {
    // Sélectionne tous les éléments avec la classe counter-value
    const counters = document.querySelectorAll('.counter-value');
    
    const animateValue = (counter: HTMLElement, start: number, end: number, duration: number) => {
      let startTimestamp: number | null = null;
      
      // Fonction pour animer progressivement un compteur
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        
        counter.textContent = currentValue.toString();
        
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      
      window.requestAnimationFrame(step);
    };
    
    // Fonction pour gérer l'intersection des compteurs avec le viewport
    const handleIntersection = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target as HTMLElement;
          // Récupérer la valeur cible depuis l'attribut data-target
          const target = parseInt(counter.getAttribute('data-target') || '0');
          const start = 0;
          
          animateValue(counter, start, target, duration);
          observer.unobserve(counter);
        }
      });
    };
    
    // Créer un observateur d'intersection pour détecter quand les compteurs sont visibles
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.5
    });
    
    // Observer chaque compteur
    counters.forEach(counter => {
      observer.observe(counter);
    });
    
    // Nettoyer l'observateur quand le composant est démonté
    return () => {
      observer.disconnect();
    };
  }, [duration]);
  
  // Ce composant n'a pas de rendu propre, il ajoute simplement un comportement
  return null;
} 