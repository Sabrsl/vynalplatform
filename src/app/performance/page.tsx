'use client';

import React, { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, Clock, LineChart, Network, BarChart2, Activity } from 'lucide-react';

/**
 * Page d'analyse des performances de l'application
 * Cette page utilise le hook usePerformanceMonitor pour afficher les métriques de performance
 */
export default function PerformancePage() {
  const { metrics, collectMetrics } = usePerformanceMonitor({
    enableResourceTiming: true,
    enableNavigationTiming: true,
    collectAutomatically: true
  });
  
  const [showAlert, setShowAlert] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  
  // Détecter les appareils à faibles performances
  useEffect(() => {
    // Utiliser une approche sécurisée sans dépendre des types spécifiques de l'API Navigator
    if (typeof window !== 'undefined') {
      try {
        // Vérification simplifiée des faibles performances
        // @ts-ignore - Accéder de manière sécurisée aux propriétés non standard
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const effectiveType = connection?.effectiveType;
        const slowConnection = effectiveType === '2g' || effectiveType === 'slow-2g';
        
        // @ts-ignore - Accéder de manière sécurisée à deviceMemory
        const limitedMemory = navigator.deviceMemory < 4;
        
        // La propriété hardwareConcurrency est standard mais vérifions quand même
        const lowCPU = navigator.hardwareConcurrency < 4;
        
        setIsLowEndDevice(slowConnection || limitedMemory || lowCPU || false);
      } catch (e) {
        // Fallback en cas d'erreur
        setIsLowEndDevice(false);
      }
    }
  }, []);
  
  // Afficher un avertissement pour les appareils à faibles performances
  useEffect(() => {
    if (isLowEndDevice) {
      setShowAlert(true);
    }
  }, [isLowEndDevice]);
  
  // Formater les millisecondes en une chaîne lisible
  const formatTime = (ms: number | null): string => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  // Évaluer la rapidité d'un temps en ms
  const evaluateSpeed = (ms: number | null, thresholds: { good: number; average: number }): string => {
    if (ms === null) return 'unknown';
    if (ms <= thresholds.good) return 'good';
    if (ms <= thresholds.average) return 'average';
    return 'slow';
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center dark:text-white">
        <Activity className="inline-block mr-2 mb-1" />
        Analyse des performances
      </h1>
      
      {showAlert && (
        <div className="bg-amber-100 dark:bg-amber-900 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 flex items-start">
          <AlertCircle className="text-amber-600 dark:text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-300">Appareil à performances limitées détecté</h3>
            <p className="text-amber-700 dark:text-amber-400 mt-1 text-sm">
              Nous avons détecté que vous utilisez un appareil avec des ressources limitées ou une connexion lente.
              L'application s'adaptera automatiquement pour optimiser votre expérience.
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="mr-2" />
            Métriques Web Vitals
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  First Contentful Paint (FCP)
                </span>
                <p className={`font-medium ${
                  evaluateSpeed(metrics.fcp, { good: 1000, average: 2500 }) === 'good' 
                    ? 'text-green-600 dark:text-green-400' 
                    : evaluateSpeed(metrics.fcp, { good: 1000, average: 2500 }) === 'average'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatTime(metrics.fcp)}
                </p>
              </div>
              <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    evaluateSpeed(metrics.fcp, { good: 1000, average: 2500 }) === 'good'
                      ? 'bg-green-500'
                      : evaluateSpeed(metrics.fcp, { good: 1000, average: 2500 }) === 'average'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ 
                    width: metrics.fcp 
                      ? `${Math.min(100, (metrics.fcp / 3000) * 100)}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Largest Contentful Paint (LCP)
                </span>
                <p className={`font-medium ${
                  evaluateSpeed(metrics.lcp, { good: 2500, average: 4000 }) === 'good' 
                    ? 'text-green-600 dark:text-green-400' 
                    : evaluateSpeed(metrics.lcp, { good: 2500, average: 4000 }) === 'average'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatTime(metrics.lcp)}
                </p>
              </div>
              <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    evaluateSpeed(metrics.lcp, { good: 2500, average: 4000 }) === 'good'
                      ? 'bg-green-500'
                      : evaluateSpeed(metrics.lcp, { good: 2500, average: 4000 }) === 'average'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ 
                    width: metrics.lcp 
                      ? `${Math.min(100, (metrics.lcp / 5000) * 100)}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  First Input Delay (FID)
                </span>
                <p className={`font-medium ${
                  evaluateSpeed(metrics.fid, { good: 100, average: 300 }) === 'good' 
                    ? 'text-green-600 dark:text-green-400' 
                    : evaluateSpeed(metrics.fid, { good: 100, average: 300 }) === 'average'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatTime(metrics.fid)}
                </p>
              </div>
              <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    evaluateSpeed(metrics.fid, { good: 100, average: 300 }) === 'good'
                      ? 'bg-green-500'
                      : evaluateSpeed(metrics.fid, { good: 100, average: 300 }) === 'average'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ 
                    width: metrics.fid 
                      ? `${Math.min(100, (metrics.fid / 500) * 100)}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Cumulative Layout Shift (CLS)
                </span>
                <p className={`font-medium ${
                  metrics.cls === null ? 'text-gray-500' :
                  metrics.cls < 0.1 ? 'text-green-600 dark:text-green-400' :
                  metrics.cls < 0.25 ? 'text-amber-600 dark:text-amber-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {metrics.cls === null ? 'N/A' : metrics.cls.toFixed(3)}
                </p>
              </div>
              <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    metrics.cls === null ? 'bg-gray-400' :
                    metrics.cls < 0.1 ? 'bg-green-500' :
                    metrics.cls < 0.25 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ 
                    width: metrics.cls === null 
                      ? '0%' 
                      : `${Math.min(100, (metrics.cls / 0.5) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart2 className="mr-2" />
            Temps de Chargement
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Time to First Byte (TTFB)
                </span>
                <p className={`font-medium ${
                  evaluateSpeed(metrics.ttfb, { good: 200, average: 500 }) === 'good' 
                    ? 'text-green-600 dark:text-green-400' 
                    : evaluateSpeed(metrics.ttfb, { good: 200, average: 500 }) === 'average'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatTime(metrics.ttfb)}
                </p>
              </div>
              <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    evaluateSpeed(metrics.ttfb, { good: 200, average: 500 }) === 'good'
                      ? 'bg-green-500'
                      : evaluateSpeed(metrics.ttfb, { good: 200, average: 500 }) === 'average'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ 
                    width: metrics.ttfb 
                      ? `${Math.min(100, (metrics.ttfb / 1000) * 100)}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Temps de chargement de la page
                </span>
                <p className={`font-medium ${
                  evaluateSpeed(metrics.pageLoadTime, { good: 2000, average: 5000 }) === 'good' 
                    ? 'text-green-600 dark:text-green-400' 
                    : evaluateSpeed(metrics.pageLoadTime, { good: 2000, average: 5000 }) === 'average'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatTime(metrics.pageLoadTime)}
                </p>
              </div>
              <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    evaluateSpeed(metrics.pageLoadTime, { good: 2000, average: 5000 }) === 'good'
                      ? 'bg-green-500'
                      : evaluateSpeed(metrics.pageLoadTime, { good: 2000, average: 5000 }) === 'average'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ 
                    width: metrics.pageLoadTime 
                      ? `${Math.min(100, (metrics.pageLoadTime / 8000) * 100)}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>
            
            {metrics.navigationTiming.serverResponse !== undefined && (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Temps de réponse du serveur
                  </span>
                  <p className={`font-medium ${
                    (metrics.navigationTiming.serverResponse || 0) < 100 
                      ? 'text-green-600 dark:text-green-400' 
                      : (metrics.navigationTiming.serverResponse || 0) < 300
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatTime(metrics.navigationTiming.serverResponse || null)}
                  </p>
                </div>
                <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      (metrics.navigationTiming.serverResponse || 0) < 100
                        ? 'bg-green-500'
                        : (metrics.navigationTiming.serverResponse || 0) < 300
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    style={{ 
                      width: metrics.navigationTiming.serverResponse 
                        ? `${Math.min(100, (metrics.navigationTiming.serverResponse / 500) * 100)}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>
            )}
            
            {metrics.navigationTiming.domParse !== undefined && (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Temps d'analyse du DOM
                  </span>
                  <p className={`font-medium ${
                    (metrics.navigationTiming.domParse || 0) < 100 
                      ? 'text-green-600 dark:text-green-400' 
                      : (metrics.navigationTiming.domParse || 0) < 300
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatTime(metrics.navigationTiming.domParse || null)}
                  </p>
                </div>
                <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      (metrics.navigationTiming.domParse || 0) < 100
                        ? 'bg-green-500'
                        : (metrics.navigationTiming.domParse || 0) < 300
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    style={{ 
                      width: metrics.navigationTiming.domParse 
                        ? `${Math.min(100, (metrics.navigationTiming.domParse / 500) * 100)}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Network className="mr-2" />
            Informations sur la connexion
          </h2>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Type de connexion
              </span>
              <p className="font-medium">
                {metrics.connection.effectiveType === 'slow-2g' ? '2G lent' :
                 metrics.connection.effectiveType === '2g' ? '2G' :
                 metrics.connection.effectiveType === '3g' ? '3G' :
                 metrics.connection.effectiveType === '4g' ? '4G/LTE' :
                 'Inconnue'}
              </p>
            </div>
            
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Débit descendant estimé
              </span>
              <p className="font-medium">
                {metrics.connection.downlink ? `${metrics.connection.downlink} Mbps` : 'Inconnu'}
              </p>
            </div>
            
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                RTT (aller-retour)
              </span>
              <p className="font-medium">
                {metrics.connection.rtt ? `${metrics.connection.rtt} ms` : 'Inconnu'}
              </p>
            </div>
            
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Mode économie de données
              </span>
              <p className="font-medium">
                {metrics.connection.saveData ? 'Activé' : 'Désactivé'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <LineChart className="mr-2" />
            Ressources
          </h2>
          
          <div className="space-y-3">
            {Object.entries(metrics.resourceTiming).map(([type, time]) => (
              <div key={type} className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {type.replace('LoadTime', '')}
                  </span>
                  <p className="font-medium">
                    {formatTime(time)}
                  </p>
                </div>
                <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ width: `${Math.min(100, (time / 2000) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            
            {Object.keys(metrics.resourceTiming).length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Aucune donnée de ressource disponible
              </p>
            )}
          </div>
        </Card>
      </div>
      
      <div className="flex justify-center mt-8">
        <Button 
          onClick={() => collectMetrics()} 
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg"
        >
          <RefreshCw className="h-4 w-4" />
          Rafraîchir les métriques
        </Button>
      </div>
      
      <div className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Les métriques Web Vitals sont des indicateurs importants de la qualité de l'expérience utilisateur sur le web.
          <br />
          Pour en savoir plus, consultez <a href="https://web.dev/vitals/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">web.dev/vitals</a>.
        </p>
      </div>
    </div>
  );
} 