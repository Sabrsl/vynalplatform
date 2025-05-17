/**
 * Système de traitement par lots optimisé pour Vynal Platform
 * Évite la surcharge du thread principal en divisant les tâches en micro-tâches
 */

class Batcher {
  constructor(options = {}) {
    // Paramètres de configuration avec valeurs par défaut optimisées
    this.options = {
      batchSize: options.batchSize || 1,
      frameThreshold: options.frameThreshold || 8, // ms disponibles par frame (60fps = 16ms)
      useIdleCallback: options.useIdleCallback !== false,
      lowPriorityDelay: options.lowPriorityDelay || 0,
      highPriorityThreshold: options.highPriorityThreshold || 100
    };

    // Détection des capacités du navigateur
    this.capabilities = {
      hasIdleCallback: typeof window !== 'undefined' && 'requestIdleCallback' in window,
      isLowPowerDevice: typeof navigator !== 'undefined' && (
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
        /Android|Mobile|iPhone|iPad/i.test(navigator.userAgent)
      )
    };

    // Files d'attente par priorité
    this.queues = {
      high: [],    // Tâches critiques qui doivent s'exécuter rapidement
      normal: [],  // Tâches standard
      low: []      // Tâches non critiques qui peuvent attendre
    };

    // État interne
    this.state = {
      isProcessing: false,
      currentPriority: null,
      frameEndTime: 0,
      taskCount: 0,
      preventLongTask: false
    };

    // Métriques
    this.metrics = {
      tasksProcessed: 0,
      batchesProcessed: 0,
      totalProcessingTime: 0,
      maxTaskDuration: 0
    };

    // Lier les méthodes au contexte actuel
    this.add = this.add.bind(this);
    this.process = this.process.bind(this);
    this.processNextBatch = this.processNextBatch.bind(this);
    this.flush = this.flush.bind(this);
    this.pause = this.pause.bind(this);
    this.resume = this.resume.bind(this);

    // Surveillance de la visibilité de la page pour optimiser les ressources
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.pause();
        } else {
          this.resume();
        }
      });
    }
  }

  /**
   * Ajoute une tâche à la file d'attente
   * @param {Function} task - La fonction à exécuter
   * @param {string} priority - Priorité: 'high', 'normal' (défaut), ou 'low'
   * @returns {Batcher} - Instance pour chaînage
   */
  add(task, priority = 'normal') {
    if (typeof task !== 'function') {
      console.warn('[Batcher] Tâche non valide, doit être une fonction');
      return this;
    }

    if (!['high', 'normal', 'low'].includes(priority)) {
      priority = 'normal';
    }

    this.queues[priority].push({
      fn: task,
      addedAt: performance.now()
    });

    // Démarrer automatiquement le traitement si inactif
    if (!this.state.isProcessing) {
      this.process();
    }

    return this;
  }

  /**
   * Démarre le traitement des files d'attente
   * @returns {Batcher} - Instance pour chaînage
   */
  process() {
    if (this.state.isProcessing) return this;

    this.state.isProcessing = true;
    this.scheduleNextBatch();

    return this;
  }

  /**
   * Planifie le traitement du prochain lot
   * @private
   */
  scheduleNextBatch() {
    // Déterminer la priorité à traiter
    if (this.queues.high.length > 0) {
      this.state.currentPriority = 'high';
    } else if (this.queues.normal.length > 0) {
      this.state.currentPriority = 'normal';
    } else if (this.queues.low.length > 0) {
      this.state.currentPriority = 'low';
    } else {
      // Aucune tâche à traiter
      this.state.isProcessing = false;
      this.state.currentPriority = null;
      return;
    }

    // Utiliser requestIdleCallback pour les tâches de faible priorité si disponible
    if (this.state.currentPriority === 'low' && this.capabilities.hasIdleCallback && this.options.useIdleCallback) {
      window.requestIdleCallback(this.processNextBatch, { timeout: 500 });
    } else if (this.state.currentPriority === 'low' && this.options.lowPriorityDelay > 0) {
      // Délai pour les tâches de faible priorité
      setTimeout(this.processNextBatch, this.options.lowPriorityDelay);
    } else {
      // Pour les tâches normales ou critiques, utiliser requestAnimationFrame
      // qui est plus efficace que setTimeout(0)
      window.requestAnimationFrame(this.processNextBatch);
    }
  }

  /**
   * Traite le prochain lot de tâches
   * @param {IdleDeadline|number} deadline - Deadline pour requestIdleCallback ou timestamp
   * @private
   */
  processNextBatch(deadline) {
    // Vérifier si le traitement est en pause
    if (!this.state.isProcessing) return;

    const queue = this.queues[this.state.currentPriority];
    if (!queue || queue.length === 0) {
      // Cette queue est vide, planifier la suivante
      this.scheduleNextBatch();
      return;
    }

    // Déterminer combien de temps nous pouvons utiliser pour ce frame
    let timeRemaining;
    const now = performance.now();

    if (deadline && typeof deadline.timeRemaining === 'function') {
      // Cas de requestIdleCallback
      timeRemaining = deadline.timeRemaining();
    } else {
      // Cas normal avec requestAnimationFrame
      // Calculer le temps restant jusqu'au prochain frame (basé sur 60fps)
      this.state.frameEndTime = now + this.options.frameThreshold;
      timeRemaining = this.options.frameThreshold;
    }

    // Utiliser un budget de temps plus petit sur les appareils à faible puissance
    const effectiveBatchSize = this.capabilities.isLowPowerDevice 
      ? Math.min(this.options.batchSize, 1) 
      : this.options.batchSize;

    // Nombre de tâches traitées dans ce lot
    let processed = 0;
    const batchStartTime = now;
    let shouldYield = false;

    // Traiter les tâches tant qu'il reste du temps
    while (queue.length > 0 && processed < effectiveBatchSize && !shouldYield) {
      const task = queue.shift();
      const taskStartTime = performance.now();

      try {
        task.fn();
      } catch (error) {
        console.error('[Batcher] Erreur lors de l\'exécution de la tâche:', error);
      }

      // Mesurer le temps d'exécution
      const taskDuration = performance.now() - taskStartTime;
      this.metrics.tasksProcessed++;
      this.metrics.maxTaskDuration = Math.max(this.metrics.maxTaskDuration, taskDuration);

      processed++;

      // Vérifier si nous devons céder le thread
      const elapsedTime = performance.now() - now;
      if (elapsedTime >= timeRemaining) {
        shouldYield = true;
      }

      // Vérifier si la tâche était trop longue et éviter les futures longues tâches
      if (taskDuration > this.options.highPriorityThreshold) {
        this.state.preventLongTask = true;
        
        // Forcer une pause pour éviter les longues tâches consécutives
        setTimeout(() => {
          this.state.preventLongTask = false;
          this.scheduleNextBatch();
        }, 10);
        
        return;
      }
    }

    // Mettre à jour les métriques
    this.metrics.batchesProcessed++;
    this.metrics.totalProcessingTime += performance.now() - batchStartTime;

    // Planifier le prochain lot
    if (this.state.preventLongTask) {
      // Attendre la fin de la période de protection
      return;
    }
    
    this.scheduleNextBatch();
  }

  /**
   * Force le traitement immédiat de toutes les tâches pour une priorité donnée
   * @param {string} priority - Priorité à vider: 'high', 'normal', 'low' ou 'all'
   * @returns {Batcher} - Instance pour chaînage
   */
  flush(priority = 'all') {
    const priorities = priority === 'all' 
      ? ['high', 'normal', 'low'] 
      : [priority];

    priorities.forEach(prio => {
      if (!this.queues[prio]) return;

      const queue = this.queues[prio];
      while (queue.length > 0) {
        try {
          const task = queue.shift();
          task.fn();
          this.metrics.tasksProcessed++;
        } catch (error) {
          console.error('[Batcher] Erreur lors du flush:', error);
        }
      }
    });

    return this;
  }

  /**
   * Met en pause le traitement des tâches
   * @returns {Batcher} - Instance pour chaînage
   */
  pause() {
    this.state.isProcessing = false;
    return this;
  }

  /**
   * Reprend le traitement des tâches
   * @returns {Batcher} - Instance pour chaînage
   */
  resume() {
    if (!this.state.isProcessing) {
      this.process();
    }
    return this;
  }

  /**
   * Réinitialise complètement le batcher
   * @returns {Batcher} - Instance pour chaînage
   */
  reset() {
    this.pause();
    this.queues.high = [];
    this.queues.normal = [];
    this.queues.low = [];
    this.metrics = {
      tasksProcessed: 0,
      batchesProcessed: 0,
      totalProcessingTime: 0,
      maxTaskDuration: 0
    };
    return this;
  }

  /**
   * Retourne les métriques actuelles du batcher
   * @returns {Object} - Métriques d'exécution
   */
  getMetrics() {
    return {
      ...this.metrics,
      pendingTasks: {
        high: this.queues.high.length,
        normal: this.queues.normal.length,
        low: this.queues.low.length,
        total: this.queues.high.length + this.queues.normal.length + this.queues.low.length
      }
    };
  }
}

// Créer une instance globale
const globalBatcher = new Batcher();

// Exporter les fonctions utilitaires et l'instance
export default globalBatcher;
export { Batcher }; 