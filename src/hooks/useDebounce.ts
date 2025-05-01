import { useEffect, useState, useRef } from 'react';

/**
 * Un hook personnalisé pour debouncer les valeurs
 * Utile pour limiter les appels API ou les opérations coûteuses lors des saisies 
 * Version optimisée avec comparaison efficace des valeurs
 * 
 * @param value - La valeur à debouncer
 * @param delay - Le délai en millisecondes (par défaut: 300ms)
 * @returns La valeur après le délai
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  // Utiliser une seule référence pour toutes les données
  const refs = useRef({
    timeout: null as NodeJS.Timeout | null,
    mounted: true,
    // Utiliser une référence pour la valeur précédente évite la comparaison JSON coûteuse
    previousValue: value
  });
  
  useEffect(() => {
    // Effet de montage/démontage
    refs.current.mounted = true;
    
    // Nettoyage
    return () => {
      refs.current.mounted = false;
      if (refs.current.timeout) {
        clearTimeout(refs.current.timeout);
        refs.current.timeout = null;
      }
    };
  }, []);
  
  useEffect(() => {
    // Optimisation: comparer directement pour les types primitifs, superficiellement pour les objets
    const valueChanged = (
      typeof value !== typeof refs.current.previousValue ||
      value !== refs.current.previousValue
    );
    
    // Ne rien faire si la valeur n'a pas changé
    if (!valueChanged) return;
    
    // Mettre à jour la référence immédiatement
    refs.current.previousValue = value;
    
    // Nettoyer le timeout précédent
    if (refs.current.timeout) {
      clearTimeout(refs.current.timeout);
    }
    
    // Créer un nouveau timeout
    refs.current.timeout = setTimeout(() => {
      if (refs.current.mounted) {
        setDebouncedValue(value);
      }
    }, delay);
  }, [value, delay]);
  
  return debouncedValue;
} 