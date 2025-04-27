/**
 * Module de mesure et d'analyse des performances
 * Permet de capturer et analyser les métriques de performance pour 
 * optimiser l'expérience utilisateur
 */

// Types d'événements de performance que nous mesurons
export enum PerformanceEventType {
  MESSAGES_LOAD = 'messages_load',
  CONVERSATIONS_LOAD = 'conversations_load',
  MESSAGE_SEND = 'message_send',
  RENDER_TIME = 'render_time',
  CACHE_HIT = 'cache_hit',
  CACHE_MISS = 'cache_miss',
  FILE_UPLOAD = 'file_upload'
}

// Interface pour les métriques de performance
export interface PerformanceMetric {
  id: string;
  type: PerformanceEventType;
  timestamp: number;
  duration: number;
  metadata?: Record<string, any>;
}

// Stockage local des métriques
const metrics: PerformanceMetric[] = [];

// ID unique pour chaque mesure
let metricId = 0;

/**
 * Démarre une mesure de performance
 * 
 * @param type Type d'événement à mesurer
 * @param metadata Métadonnées associées à cet événement
 * @returns ID de la mesure pour l'arrêter plus tard
 */
export function startMeasure(type: PerformanceEventType, metadata?: Record<string, any>): string {
  const id = `metric_${++metricId}`;
  
  // Enregistrer le début de la mesure dans l'API Performance si disponible
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`${id}_start`);
  }
  
  return id;
}

/**
 * Termine une mesure et enregistre le résultat
 * 
 * @param id ID de la mesure à terminer (retourné par startMeasure)
 * @param type Type d'événement mesuré
 * @param additionalMetadata Métadonnées supplémentaires à ajouter
 * @returns La durée mesurée en millisecondes
 */
export function endMeasure(
  id: string, 
  type: PerformanceEventType, 
  additionalMetadata?: Record<string, any>
): number {
  let duration = 0;
  
  // Utiliser l'API Performance si disponible
  if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
    performance.mark(`${id}_end`);
    
    try {
      // Créer une mesure entre les deux marques
      performance.measure(id, `${id}_start`, `${id}_end`);
      
      // Récupérer la mesure
      const entries = performance.getEntriesByName(id);
      if (entries.length > 0) {
        duration = entries[0].duration;
      }
      
      // Nettoyer les marques
      performance.clearMarks(`${id}_start`);
      performance.clearMarks(`${id}_end`);
      performance.clearMeasures(id);
    } catch (e) {
      console.error('Erreur lors de la mesure de performance:', e);
    }
  } else {
    // Fallback si l'API Performance n'est pas disponible
    duration = Date.now() - (parseInt(id.split('_')[1]) || 0);
  }
  
  // Créer la métrique
  const metric: PerformanceMetric = {
    id,
    type,
    timestamp: Date.now(),
    duration,
    metadata: additionalMetadata
  };
  
  // Stocker la métrique
  metrics.push(metric);
  
  // Envoyer la métrique au service d'analyse
  reportMetricToAnalytics(metric);
  
  return duration;
}

/**
 * Mesure de performance simplifiée, démarre et termine automatiquement
 * 
 * @param type Type d'événement
 * @param callback Fonction à exécuter et mesurer
 * @param metadata Métadonnées à associer
 * @returns Le résultat de la fonction callback
 */
export async function measure<T>(
  type: PerformanceEventType,
  callback: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<T> {
  const id = startMeasure(type, metadata);
  
  try {
    const result = await callback();
    endMeasure(id, type, { ...metadata, success: true });
    return result;
  } catch (error) {
    endMeasure(id, type, { ...metadata, success: false, error: String(error) });
    throw error;
  }
}

/**
 * Envoie les métriques collectées à un service d'analyse externe
 * 
 * @param metric Métrique à envoyer
 */
function reportMetricToAnalytics(metric: PerformanceMetric): void {
  // Envoyer à Google Analytics si disponible
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'performance_metric', {
      event_category: 'performance',
      event_label: metric.type,
      value: Math.round(metric.duration),
      metric_id: metric.id,
      ...metric.metadata
    });
  }
  
  // Journaliser dans la console en mode développement
  if (process.env.NODE_ENV === 'development') {
    console.debug(
      `📊 Performance [${metric.type}]: ${Math.round(metric.duration)}ms`, 
      metric.metadata
    );
  }
}

/**
 * Récupère toutes les métriques collectées
 * 
 * @returns Liste des métriques
 */
export function getAllMetrics(): PerformanceMetric[] {
  return [...metrics];
}

/**
 * Récupère les métriques d'un type spécifique
 * 
 * @param type Type de métrique recherché
 * @returns Liste des métriques correspondantes
 */
export function getMetricsByType(type: PerformanceEventType): PerformanceMetric[] {
  return metrics.filter(m => m.type === type);
}

/**
 * Calcule la moyenne des durées pour un type de métrique
 * 
 * @param type Type de métrique
 * @returns Durée moyenne en millisecondes
 */
export function getAverageDuration(type: PerformanceEventType): number {
  const typeMetrics = getMetricsByType(type);
  if (typeMetrics.length === 0) return 0;
  
  const totalDuration = typeMetrics.reduce((sum, metric) => sum + metric.duration, 0);
  return totalDuration / typeMetrics.length;
} 