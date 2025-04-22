/**
 * Utilitaires d'optimisation des appels réseau
 * Permet d'améliorer la fiabilité et les performances des requêtes API
 */

import { FETCH_CONFIG } from './index';

// Types pour les appels réseau
interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

interface OptimizedResponse<T> {
  data: T | null;
  error: Error | null;
  status: number;
  fromCache?: boolean;
}

// Interface pour l'API NetworkInformation
interface NetworkInformation {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

/**
 * Effectue une requête fetch avec retry automatique et timeout
 * @param url URL à appeler
 * @param options Options de fetch et de retry
 * @returns Résultat de la requête
 */
export async function optimizedFetchWithRetry<T>(
  url: string,
  options: FetchOptions = {}
): Promise<OptimizedResponse<T>> {
  const {
    timeout = FETCH_CONFIG.TIMEOUT,
    retries = FETCH_CONFIG.MAX_RETRIES,
    retryDelay = FETCH_CONFIG.RETRY_DELAY,
    onRetry,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts <= retries) {
    try {
      // Créer un contrôleur d'abandon pour gérer le timeout
      const controller = new AbortController();
      const { signal } = controller;

      // Configurer le timeout
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      // Combiner les options avec le signal
      const combinedOptions = {
        ...fetchOptions,
        signal
      };

      // Effectuer la requête
      const response = await fetch(url, combinedOptions);
      clearTimeout(timeoutId);

      // Vérifier si la réponse est OK
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      // Extraire les données
      let data: T | null = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as unknown as T;
      }

      return {
        data,
        error: null,
        status: response.status
      };
    } catch (error: any) {
      lastError = error;
      attempts++;

      // Si c'est la dernière tentative, lancer l'erreur
      if (attempts > retries) {
        break;
      }

      // Notifier de la nouvelle tentative
      if (onRetry) {
        onRetry(attempts, error);
      }

      // Attendre avant de réessayer avec un délai exponentiel
      await new Promise(resolve => 
        setTimeout(resolve, retryDelay * Math.pow(2, attempts - 1))
      );
    }
  }

  return {
    data: null,
    error: lastError,
    status: 0
  };
}

/**
 * Précharge les ressources critiques pour améliorer les performances perçues
 * @param urls URLs des ressources à précharger
 */
export function preloadResources(urls: string[]): void {
  if (typeof window === 'undefined') return;

  urls.forEach(url => {
    // Déterminer le type de préchargement en fonction de l'extension
    const extension = url.split('.').pop()?.toLowerCase();
    let rel = 'prefetch';
    let as: string | undefined;

    if (extension === 'css') {
      rel = 'preload';
      as = 'style';
    } else if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(extension || '')) {
      rel = 'preload';
      as = 'image';
    } else if (['js'].includes(extension || '')) {
      rel = 'preload';
      as = 'script';
    }

    // Créer l'élément link
    const link = document.createElement('link');
    link.rel = rel;
    link.href = url;
    if (as) link.setAttribute('as', as);
    
    // Ajouter à la page
    document.head.appendChild(link);
  });
}

/**
 * Détecte la qualité de la connexion et ajuste les stratégies en conséquence
 * @returns Informations sur la connexion
 */
export function detectConnectionQuality(): { 
  type: string; 
  saveData: boolean; 
  rtt: number;
  downlink: number;
  effectiveType: string;
  isLowEnd: boolean 
} {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return { 
      type: 'unknown', 
      saveData: false, 
      rtt: 0,
      downlink: 0,
      effectiveType: '4g',
      isLowEnd: false
    };
  }
  
  // Cast to NetworkInformation interface
  const connection = navigator.connection as NetworkInformation;
  
  return {
    type: connection?.type || 'unknown',
    saveData: connection?.saveData || false,
    rtt: connection?.rtt || 0,
    downlink: connection?.downlink || 0,
    effectiveType: connection?.effectiveType || '4g',
    isLowEnd: isLowEndDevice()
  };
}

// Détecte si l'appareil est un appareil de faible puissance
function isLowEndDevice(): boolean {
  // Tester la mémoire disponible si possible
  if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
    // @ts-ignore - L'API deviceMemory n'est pas encore standard
    return navigator.deviceMemory < 4;
  }
  
  return false;
} 