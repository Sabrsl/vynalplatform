import { useEffect, useState, useCallback } from 'react';
import { detectConnectionQuality } from '@/lib/optimizations/network';

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
}

/**
 * Hook pour surveiller et améliorer les performances de l'application
 */
export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const {
    enableResourceTiming = false,
    enableNavigationTiming = true,
    collectAutomatically = true,
    reportToAnalytics = false
  } = options;
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
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
  });
  
  // Recueillir les métriques de navigation
  const collectNavigationTiming = useCallback(() => {
    if (typeof window === 'undefined' || !window.performance) return {} as Record<string, number>;
    
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
  
  // Recueillir les métriques de ressources
  const collectResourceTiming = useCallback(() => {
    if (typeof window === 'undefined' || !window.performance) return {} as Record<string, number>;
    
    try {
      const resources = performance.getEntriesByType('resource');
      const resourceMetrics: Record<string, number> = {};
      
      // Regrouper les ressources par type
      const groupedResources: Record<string, PerformanceResourceTiming[]> = {};
      
      resources.forEach((resource) => {
        const resourceTiming = resource as PerformanceResourceTiming;
        const url = resourceTiming.name;
        let type = 'other';
        
        if (url.endsWith('.js')) type = 'script';
        else if (url.endsWith('.css')) type = 'style';
        else if (url.match(/\.(jpe?g|png|gif|webp|avif|svg)/)) type = 'image';
        else if (url.includes('/api/')) type = 'api';
        else if (url.includes('fonts')) type = 'font';
        
        if (!groupedResources[type]) groupedResources[type] = [];
        groupedResources[type].push(resourceTiming);
      });
      
      // Calculer le temps total pour chaque type
      Object.entries(groupedResources).forEach(([type, entries]) => {
        const totalDuration = entries.reduce((sum, entry) => 
          sum + (entry.responseEnd - entry.startTime), 0);
        
        resourceMetrics[`${type}LoadTime`] = Math.round(totalDuration);
      });
      
      return resourceMetrics;
    } catch (error) {
      console.warn('Erreur lors de la collecte des métriques de ressources:', error);
      return {} as Record<string, number>;
    }
  }, []);
  
  // Recueillir toutes les métriques
  const collectMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Connection info
    const connectionInfo = detectConnectionQuality();
    
    // Navigation timing
    const navigationTiming = enableNavigationTiming ? collectNavigationTiming() : ({} as Record<string, number>);
    
    // Resource timing
    const resourceTiming = enableResourceTiming ? collectResourceTiming() : ({} as Record<string, number>);
    
    // Page load time
    const pageLoadTime = 
      typeof window.performance !== 'undefined' && window.performance.timing
        ? window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
        : null;
    
    setMetrics(prev => ({
      ...prev,
      pageLoadTime,
      navigationTiming,
      resourceTiming,
      connection: {
        effectiveType: connectionInfo.effectiveType,
        downlink: connectionInfo.downlink,
        rtt: connectionInfo.rtt,
        saveData: connectionInfo.saveData
      }
    }));
    
    // Envoyer les métriques à l'analytique si activé
    if (reportToAnalytics) {
      sendMetricsToAnalytics({
        pageLoadTime,
        navigationTiming,
        resourceTiming,
        connection: connectionInfo
      });
    }
  }, [collectNavigationTiming, collectResourceTiming, enableNavigationTiming, enableResourceTiming, reportToAnalytics]);
  
  // Observer les métriques Web Vitals
  useEffect(() => {
    if (typeof window === 'undefined' || !collectAutomatically) return;
    
    const updateFCP = (entry: any) => {
      setMetrics(prev => ({
        ...prev,
        fcp: Math.round(entry.startTime)
      }));
    };
    
    const updateLCP = (entry: any) => {
      setMetrics(prev => ({
        ...prev,
        lcp: Math.round(entry.startTime)
      }));
    };
    
    const updateFID = (entry: any) => {
      setMetrics(prev => ({
        ...prev,
        fid: Math.round(entry.processingStart - entry.startTime)
      }));
    };
    
    const updateCLS = (entry: any) => {
      setMetrics(prev => ({
        ...prev,
        cls: entry.value
      }));
    };
    
    const updateTTFB = (entry: any) => {
      setMetrics(prev => ({
        ...prev,
        ttfb: Math.round(entry.responseStart)
      }));
    };
    
    // Observer les métriques avec PerformanceObserver si disponible
    try {
      // FCP
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          updateFCP(entries[0]);
          fcpObserver.disconnect();
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      
      // LCP
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          // Utiliser la dernière entrée comme LCP définitif
          updateLCP(entries[entries.length - 1]);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      
      // FID
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          updateFID(entries[0]);
          fidObserver.disconnect();
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      
      // CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // @ts-ignore - L'API Layout Instability n'est pas encore standard
          if (!entry.hadRecentInput) {
            // @ts-ignore
            clsValue += entry.value;
            updateCLS({ value: clsValue });
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      
      // TTFB
      const navigationObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0 && entries[0].entryType === 'navigation') {
          updateTTFB(entries[0]);
          navigationObserver.disconnect();
        }
      });
      navigationObserver.observe({ type: 'navigation', buffered: true });
      
      // Collecter les métriques après le chargement de la page
      window.addEventListener('load', () => {
        setTimeout(collectMetrics, 1000);
      });
      
      return () => {
        fcpObserver.disconnect();
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        navigationObserver.disconnect();
      };
    } catch (error) {
      console.warn('PerformanceObserver n\'est pas pris en charge dans ce navigateur:', error);
    }
  }, [collectAutomatically, collectMetrics]);
  
  // Fonction pour envoyer les métriques à l'analytique
  const sendMetricsToAnalytics = (data: any) => {
    // Cette fonction est un placeholder à implémenter plus tard
    // avec un service d'analytique réel
    console.log('Métriques collectées pour analytique:', data);
    
    // Exemple d'implémentation avec Google Analytics 4
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore - L'API gtag n'est pas typée
      window.gtag('event', 'performance_metrics', {
        page_load_time: data.pageLoadTime,
        fcp: metrics.fcp,
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls,
        ttfb: metrics.ttfb,
        connection_type: data.connection.effectiveType,
        ...data.navigationTiming
      });
    }
  };
  
  // Fonction pour collecter manuellement les métriques
  const measure = useCallback(() => {
    collectMetrics();
  }, [collectMetrics]);
  
  // Fonction pour mesurer une opération spécifique
  const measureOperation = useCallback((operationName: string, callback: () => any) => {
    if (typeof window === 'undefined' || !window.performance) {
      return callback();
    }
    
    const startTime = performance.now();
    const result = callback();
    const endTime = performance.now();
    
    console.log(`Opération "${operationName}" exécutée en ${Math.round(endTime - startTime)}ms`);
    
    return result;
  }, []);
  
  // Fonction pour mesurer une opération asynchrone
  const measureAsync = useCallback(async (operationName: string, promise: Promise<any>) => {
    if (typeof window === 'undefined' || !window.performance) {
      return promise;
    }
    
    const startTime = performance.now();
    
    try {
      const result = await promise;
      const endTime = performance.now();
      
      console.log(`Opération asynchrone "${operationName}" exécutée en ${Math.round(endTime - startTime)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`Erreur dans l'opération "${operationName}" après ${Math.round(endTime - startTime)}ms:`, error);
      throw error;
    }
  }, []);
  
  return {
    metrics,
    measure,
    measureOperation,
    measureAsync,
    isLowEndDevice: metrics.connection.effectiveType !== '4g' || metrics.connection.saveData
  };
} 