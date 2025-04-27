import { useEffect, useState, useRef } from 'react';

/**
 * Un hook personnalisé pour debouncer les valeurs
 * Utile pour limiter les appels API ou les opérations coûteuses lors des saisies 
 * 
 * @param value - La valeur à debouncer
 * @param delay - Le délai en millisecondes (par défaut: 300ms)
 * @returns La valeur après le délai
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const previousValueRef = useRef<T>(value);
  
  useEffect(() => {
    // Marquer le composant comme monté
    mountedRef.current = true;
    
    // Nettoyage à la destruction
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    // Skip si la valeur n'a pas changé (optimisation de performance)
    if (JSON.stringify(value) === JSON.stringify(previousValueRef.current)) {
      return;
    }
    
    // Mettre à jour la référence de la valeur précédente
    previousValueRef.current = value;
    
    // Nettoyer le timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Créer un nouveau timeout
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setDebouncedValue(value);
      }
    }, delay);
    
    // Nettoyage lors du changement
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);
  
  return debouncedValue;
} 