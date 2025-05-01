import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { detectConnectionQuality } from '@/lib/optimizations/network';

// Interface for PerformanceEventTiming to fix type error
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  duration: number;
  startTime: number;
}

// Extend window to include gtag
declare global {
  interface Window {
    gtag?: (command: string, action: string, params: object) => void;
  }
}

interface PerformanceMetrics {
  // Métriques de performance Web Vitals
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  
  // Métriques de l'application
  pageLoadTime: number | null;
  navigationTiming: Record<string, number>;
  resourceTiming: Record<string, number>;
  
  // Informations sur la connexion
  connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
}

interface PerformanceMonitorOptions {
  enableResourceTiming?: boolean;
  enableNavigationTiming?: boolean;
  collectAutomatically?: boolean;
  reportToAnalytics?: boolean;
  throttleUpdates?: number; // Temps minimum entre mises à jour en ms
}

// Valeurs par défaut
const DEFAULT_THROTTLE_MS = 1000; // 1 seconde entre les mises à jour

// Mémoriser par défaut pour éviter les recréations inutiles
const DEFAULT_METRICS: PerformanceMetrics = {
  fcp: null,
  lcp: null,
  fid: null,
  cls: null,
  ttfb: null,
  pageLoadTime: null,
  navigationTiming: {},
  resourceTiming: {},
  connection: {
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  }
};

/**
 * Hook pour surveiller et améliorer les performances de l'application
 * Version optimisée avec meilleure gestion des états et des rendus
 */
export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const {
    enableResourceTiming = false,
    enableNavigationTiming = true,
    collectAutomatically = true,
    reportToAnalytics = false,
    throttleUpdates = DEFAULT_THROTTLE_MS
  } = options;
  
  // État unique pour réduire les rendus
  const [metrics, setMetrics] = useState<PerformanceMetrics>(DEFAULT_METRICS);

  // Références pour les observers et le suivi interne (ne déclenche pas de rendus)
  const refs = useRef({
    observers: new Map<string, PerformanceObserver>(),
    lastUpdateTime: 0,
    pendingUpdates: {} as Partial<PerformanceMetrics>,
    hasUpdates: false,
    timeoutId: null as NodeJS.Timeout | null,
    isClient: typeof window !== 'undefined',
    metricsCollected: false,
    clsValue: 0,
    isMounted: true
  });
  
  // Fonction pour mettre à jour les métriques avec throttling
  const queueMetricUpdate = useCallback((key: keyof PerformanceMetrics, value: any) => {
    if (!refs.current.isMounted) return;
    
    // Stocker la mise à jour en attente
    refs.current.pendingUpdates = {
      ...refs.current.pendingUpdates,
      [key]: value
    };
    refs.current.hasUpdates = true;
    
    const now = Date.now();
    
    // Appliquer les mises à jour immédiatement si suffisamment de temps s'est écoulé
    if (now - refs.current.lastUpdateTime >= throttleUpdates) {
      applyPendingUpdates();
    } else if (!refs.current.timeoutId) {
      // Sinon, planifier une mise à jour différée
      const delay = throttleUpdates - (now - refs.current.lastUpdateTime);
      refs.current.timeoutId = setTimeout(applyPendingUpdates, delay);
    }
  }, [throttleUpdates]);
  
  // Appliquer toutes les mises à jour en attente - défini avant utilisation
  const applyPendingUpdates = useCallback(() => {
    if (!refs.current.hasUpdates || !refs.current.isMounted) return;
    
    setMetrics(prev => ({
      ...prev,
      ...refs.current.pendingUpdates
    }));
    
    refs.current.lastUpdateTime = Date.now();
    refs.current.pendingUpdates = {};
    refs.current.hasUpdates = false;
    
    if (refs.current.timeoutId) {
      clearTimeout(refs.current.timeoutId);
      refs.current.timeoutId = null;
    }
    
    // Rapport d'analytique si activé
    if (reportToAnalytics && Object.keys(refs.current.pendingUpdates).length > 0) {
      sendMetricsToAnalytics(metrics);
    }
  }, [metrics, reportToAnalytics]);
  
  // Recueillir les métriques de navigation - mémorisé pour éviter les recréations
  const collectNavigationTiming = useCallback(() => {
    if (!refs.current.isClient || !window.performance) return {} as Record<string, number>;
    
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (!navigation) return {} as Record<string, number>;
      
      return {
        dnsLookup: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
        tcpConnection: Math.round(navigation.connectEnd - navigation.connectStart),
        serverResponse: Math.round(navigation.responseStart - navigation.requestStart),
        domParse: Math.round(navigation.domInteractive - navigation.responseEnd),
        resourceLoad: Math.round(navigation.loadEventStart - navigation.domContentLoadedEventEnd),
        totalPageLoad: Math.round(navigation.loadEventEnd - navigation.startTime)
      };
    } catch (error) {
      console.warn('Erreur lors de la collecte des métriques de navigation:', error);
      return {} as Record<string, number>;
    }
  }, []);
  
  // Recueillir les métriques de ressources - mémorisé pour éviter les recréations
  const collectResourceTiming = useCallback(() => {
    if (!refs.current.isClient || !window.performance) return {} as Record<string, number>;
    
    try {
      const resources = performance.getEntriesByType('resource');
      
      // Optimisation: utiliser une Map pour le regroupement
      const groupedResources = new Map<string, number>();
      
      // Initialiser les types que nous suivons
      const types = ['script', 'style', 'image', 'api', 'font', 'other'];
      types.forEach(type => groupedResources.set(type, 0));
      
      // Grouper et calculer les durées en une seule passe
      resources.forEach((resource) => {
        const resourceTiming = resource as PerformanceResourceTiming;
        const url = resourceTiming.name;
        let type = 'other';
        
        if (url.endsWith('.js')) type = 'script';
        else if (url.endsWith('.css')) type = 'style';
        else if (url.match(/\.(jpe?g|png|gif|webp|avif|svg)/)) type = 'image';
        else if (url.includes('/api/')) type = 'api';
        else if (url.includes('fonts')) type = 'font';
        
        const duration = resourceTiming.responseEnd - resourceTiming.startTime;
        groupedResources.set(type, (groupedResources.get(type) || 0) + duration);
      });
      
      // Convertir la Map en objet résultat
      const result: Record<string, number> = {};
      groupedResources.forEach((duration, type) => {
        result[`${type}LoadTime`] = Math.round(duration);
      });
      
      return result;
    } catch (error) {
      console.warn('Erreur lors de la collecte des métriques de ressources:', error);
      return {} as Record<string, number>;
    }
  }, []);
  
  // Recueillir toutes les métriques - mémorisé pour éviter les recréations
  const collectMetrics = useCallback(() => {
    if (!refs.current.isClient || refs.current.metricsCollected) return;
    
    // Marquer comme collecté pour éviter les appels en double
    refs.current.metricsCollected = true;
    
    // Connection info
    const connectionInfo = detectConnectionQuality();
    
    // Navigation timing
    const navigationTiming = enableNavigationTiming ? collectNavigationTiming() : ({} as Record<string, number>);
    
    // Resource timing
    const resourceTiming = enableResourceTiming ? collectResourceTiming() : ({} as Record<string, number>);
    
    // Page load time
    const pageLoadTime = 
      window.performance && window.performance.timing
        ? window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
        : null;
    
    // Mettre à jour l'état en une seule fois
    queueMetricUpdate('pageLoadTime', pageLoadTime);
    queueMetricUpdate('navigationTiming', navigationTiming);
    queueMetricUpdate('resourceTiming', resourceTiming);
    queueMetricUpdate('connection', {
      effectiveType: connectionInfo.effectiveType,
      downlink: connectionInfo.downlink,
      rtt: connectionInfo.rtt,
      saveData: connectionInfo.saveData
    });
  }, [collectNavigationTiming, collectResourceTiming, enableNavigationTiming, enableResourceTiming, queueMetricUpdate]);
  
  // Déconnecte tous les observateurs - mémorisé pour la stabilité
  const disconnectObservers = useCallback(() => {
    refs.current.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (e) {
        // Ignorer les erreurs
      }
    });
    refs.current.observers.clear();
  }, []);
  
  // Configuration des observers pour les Web Vitals - mémorisé pour éviter les recréations
  const setupObservers = useCallback(() => {
    if (!refs.current.isClient || !collectAutomatically) return;

    try {
      // FCP
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          queueMetricUpdate('fcp', Math.round(entries[0].startTime));
          fcpObserver.disconnect();
          refs.current.observers.delete('fcp');
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      refs.current.observers.set('fcp', fcpObserver);
      
      // LCP
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          // Utiliser la dernière entrée comme LCP définitif
          queueMetricUpdate('lcp', Math.round(entries[entries.length - 1].startTime));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      refs.current.observers.set('lcp', lcpObserver);
      
      // FID
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const firstEntry = entries[0] as PerformanceEventTiming;
          queueMetricUpdate('fid', Math.round(firstEntry.processingStart - firstEntry.startTime));
          fidObserver.disconnect();
          refs.current.observers.delete('fid');
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      refs.current.observers.set('fid', fidObserver);
      
      // CLS
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // @ts-ignore - L'API Layout Instability n'est pas encore standard
          if (!entry.hadRecentInput) {
            // @ts-ignore
            refs.current.clsValue += entry.value;
            queueMetricUpdate('cls', refs.current.clsValue);
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      refs.current.observers.set('cls', clsObserver);
      
      // TTFB
      const ttfbObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const navigationEntry = entries[0] as PerformanceNavigationTiming;
          queueMetricUpdate('ttfb', Math.round(navigationEntry.responseStart));
          ttfbObserver.disconnect();
          refs.current.observers.delete('ttfb');
        }
      });
      ttfbObserver.observe({ type: 'navigation', buffered: true });
      refs.current.observers.set('ttfb', ttfbObserver);
    } catch (error) {
      console.warn('Erreur lors de la configuration des observateurs de performance:', error);
    }
  }, [collectAutomatically, queueMetricUpdate]);

  // Envoyer les métriques à Google Analytics ou autre service - mémorisé pour stabilité
  const sendMetricsToAnalytics = useCallback((data: PerformanceMetrics) => {
    if (!refs.current.isClient || !window.gtag) return;
    
    try {
      // N'envoyer que les métriques disponibles
      const analyticsData: Record<string, any> = {};
      
      // Web Vitals
      if (data.fcp !== null) analyticsData.fcp = data.fcp;
      if (data.lcp !== null) analyticsData.lcp = data.lcp;
      if (data.fid !== null) analyticsData.fid = data.fid;
      if (data.cls !== null) analyticsData.cls = data.cls;
      if (data.ttfb !== null) analyticsData.ttfb = data.ttfb;
      
      // Page load
      if (data.pageLoadTime !== null) analyticsData.page_load_time = data.pageLoadTime;
      
      // Connection info
      analyticsData.connection_type = data.connection.effectiveType;
      analyticsData.downlink = data.connection.downlink;
      analyticsData.rtt = data.connection.rtt;
      
      // Navigation timing - sélection des métriques les plus pertinentes
      if (Object.keys(data.navigationTiming).length > 0) {
        const { domParse, totalPageLoad, serverResponse } = data.navigationTiming;
        analyticsData.dom_parse_time = domParse;
        analyticsData.total_load_time = totalPageLoad;
        analyticsData.server_response_time = serverResponse;
      }
      
      // Envoi à Google Analytics
      window.gtag?.('event', 'performance_metrics', analyticsData);
    } catch (error) {
      console.warn('Erreur lors de l\'envoi des métriques aux analytics:', error);
    }
  }, []);

  // Effet principal pour initialiser/nettoyer
  useEffect(() => {
    // Marquer comme monté
    refs.current.isMounted = true;
    
    // Ne s'exécuter que côté client
    if (typeof window === 'undefined') return;
    refs.current.isClient = true;
    
    // Configuration immédiate
    if (collectAutomatically) {
      setupObservers();
      // Délai court pour permettre le chargement initial
      setTimeout(collectMetrics, 0);
    }
    
    // Nettoyage au démontage
    return () => {
      refs.current.isMounted = false;
      
      // Nettoyer les timeout et observers
      if (refs.current.timeoutId) {
        clearTimeout(refs.current.timeoutId);
        refs.current.timeoutId = null;
      }
      
      disconnectObservers();
    };
  }, [collectAutomatically, collectMetrics, setupObservers, disconnectObservers]);

  // Exposer une API stable avec useMemo
  return useMemo(() => ({
    metrics,
    collectMetrics,
    startMonitoring: setupObservers,
    stopMonitoring: disconnectObservers
  }), [metrics, collectMetrics, setupObservers, disconnectObservers]);
} 