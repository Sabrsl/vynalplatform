/**
 * Script d'utilitaires de performance pour Vynal Platform
 * Ce script non bloquant mesure et optimise les performances client-side
 */

// Fonction utilitaire pour détecter l'environnement de production
function isProduction() {
  return window.location.hostname !== 'localhost' && 
         !window.location.hostname.includes('127.0.0.1') &&
         !window.location.hostname.includes('dev') &&
         !window.location.hostname.includes('staging');
}

// Cache pour les détections de capacités et informations sur l'appareil
const deviceInfo = {
  isLowEndDevice: null,
  isMobile: null,
  prefersReducedMotion: null
};

// Fonction pour diviser les tâches en utilisant requestIdleCallback
function chunkTasks(tasks, chunkSize = 5) {
  if (!tasks || tasks.length === 0) return;
  
  // Utiliser requestIdleCallback si disponible, sinon setTimeout
  const scheduler = window.requestIdleCallback || 
                 ((callback) => setTimeout(callback, 0));
  
  // Réutiliser la détection d'appareil peu puissant
  if (deviceInfo.isLowEndDevice === null) {
    deviceInfo.isLowEndDevice = navigator.hardwareConcurrency <= 4 || 
                             /Android|Mobile|iPhone|iPad/i.test(navigator.userAgent);
  }
  
  // Réduire la taille des chunks pour les appareils moins puissants
  const actualChunkSize = deviceInfo.isLowEndDevice ? Math.min(chunkSize, 2) : chunkSize;
  
  let index = 0;
  
  function processNextChunk(deadline) {
    // Si requestIdleCallback est utilisé, vérifier le temps disponible
    const hasTimeRemaining = deadline && typeof deadline.timeRemaining === 'function' 
      ? deadline.timeRemaining() > 0 
      : true;
      
    if (!hasTimeRemaining) {
      scheduler(processNextChunk);
      return;
    }
    
    if (index >= tasks.length) return;
    
    // Calculer la taille du chunk actuel
    const end = Math.min(index + actualChunkSize, tasks.length);
    
    // Traiter les tâches du chunk actuel avec vérification du temps restant
    for (let i = index; i < end && (deadline ? deadline.timeRemaining() > 0 : true); i++) {
      try {
        tasks[i]();
      } catch (err) {
        if (!isProduction()) {
          console.warn('[Performance] Erreur dans une tâche:', err);
        }
      }
    }
    
    index = end;
    
    // Continuer avec le prochain chunk seulement si nécessaire
    if (index < tasks.length) {
      scheduler(processNextChunk);
    }
  }
  
  // Démarrer le traitement
  scheduler(processNextChunk);
}

// Fonction de sécurité pour éviter les erreurs
function safeExecute(fn) {
  try {
    fn();
  } catch (error) {
    console.warn('[Performance] Une erreur est survenue:', error);
  }
}

// Optimisation pour diviser les tâches longues et réduire le TBT
function scheduleMicroTasks() {
  // Patch requestAnimationFrame pour éviter les exécutions bloquantes
  safeExecute(() => {
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      return originalRAF.call(window, () => {
        // Utiliser Promise.resolve().then pour céder le thread principal
        Promise.resolve().then(callback);
      });
    };
    
    // Observer le TBT et intervenir si nécessaire
    if (PerformanceObserver && PerformanceObserver.supportedEntryTypes && 
        PerformanceObserver.supportedEntryTypes.includes('longtask')) {
      // Variables pour éviter des interventions trop fréquentes
      let lastInterventionTime = 0;
      let consecutiveLongTasks = 0;
      
      const longTaskObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length === 0) return;
        
        const now = performance.now();
        const longestTask = entries.reduce((max, entry) => entry.duration > max.duration ? entry : max, entries[0]);
        
        // Compter les tâches longues consécutives
        if (now - lastInterventionTime < 1000) {
          consecutiveLongTasks++;
        } else {
          consecutiveLongTasks = 1;
        }
        
        // Réduire la verbosité des logs en production
        if (!isProduction()) {
          console.warn('[Performance] Long task detected:', longestTask.duration, 'ms');
        }
        
        // Forcer un yield du thread principal avec une stratégie adaptative
        // Plus les tâches longues sont nombreuses, plus l'intervention est agressive
        Promise.resolve().then(() => {
          // Intervenir seulement pour les tâches vraiment problématiques
          // ou si on détecte un pattern de blocage du thread principal
          if (longestTask.duration > 100 || consecutiveLongTasks >= 3) {
            // Réduire temporairement les animations pour libérer des ressources
            if (!document.documentElement.classList.contains('reduced-motion')) {
              document.documentElement.classList.add('reduced-motion');
              
              // Rétablir après un court délai
              setTimeout(() => {
                document.documentElement.classList.remove('reduced-motion');
              }, consecutiveLongTasks >= 3 ? 500 : 300);
            }
            
            // Pour les cas très graves, utiliser une stratégie plus agressive
            if (longestTask.duration > 200 || consecutiveLongTasks >= 5) {
              // Forcer un reflow minimal pour débloquer le thread
              void document.documentElement.offsetHeight;
              
              // Reporter les tâches non critiques
              const deferTasks = [];
              const animations = document.querySelectorAll('.animate-gradient-x, [class*="animate-"]');
              
              // Créer des microtâches pour les animations
              animations.forEach(el => {
                deferTasks.push(() => {
                  el.style.animationPlayState = 'paused';
                  setTimeout(() => {
                    el.style.animationPlayState = '';
                  }, 700);
                });
              });
              
              // Exécuter de façon non bloquante
              if (deferTasks.length > 0) {
                chunkTasks(deferTasks, 2);
              }
            }
            
            lastInterventionTime = now;
          }
        });
      });
      
      // Configurer l'observation avec buffered pour ne pas manquer de tâches
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    }
    
    // Optimiser les événements coûteux pour éviter les reflows/repaints
    const optimizeEvent = (eventName) => {
      let running = false;
      let lastEvent = null;
      let throttleTimer = null;
      const originalListener = EventTarget.prototype.addEventListener;
      
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === eventName) {
          const optimizedListener = (e) => {
            lastEvent = e;
            if (running) return;
            
            // Désactiver les gestionnaires d'événements pendant les long tasks
            if (throttleTimer) {
              clearTimeout(throttleTimer);
            }
            
            running = true;
            
            requestAnimationFrame(() => {
              listener(lastEvent);
              running = false;
              
              // Prévenir plusieurs exécutions rapprochées
              throttleTimer = setTimeout(() => {
                throttleTimer = null;
              }, 16); // 16ms ≈ 60fps
            });
          };
          
          return originalListener.call(this, type, optimizedListener, options);
        }
        
        return originalListener.call(this, type, listener, options);
      };
    };
    
    // Optimiser les événements critiques qui causent des calculs répétés
    optimizeEvent('scroll');
    optimizeEvent('resize');
    optimizeEvent('mousemove');
    
    // Détecter les appareils à faible capacité et appliquer des optimisations automatiques
    if (deviceInfo.isLowEndDevice === null) {
      deviceInfo.isLowEndDevice = navigator.hardwareConcurrency <= 4 || 
                              /Android|Mobile|iPhone/i.test(navigator.userAgent);
    }
    
    if (deviceInfo.isLowEndDevice) {
      document.documentElement.classList.add('reduced-motion');
    }
  });
}

// Mesurer les Web Vitals et envoyer les métriques
function measureWebVitals() {
  if (typeof PerformanceObserver !== 'function') return;
  
  // FCP (First Contentful Paint)
  safeExecute(() => {
    if (!PerformanceObserver.supportedEntryTypes.includes('paint')) return;
    
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        console.log('[Performance] FCP:', fcpEntry.startTime, 'ms');
        
        // Si FCP est bon, prédire un bon LCP en préchargeant les ressources restantes
        if (fcpEntry.startTime < 1000) {
          // Limiter la portée de la sélection pour réduire la charge
          let selector = 'img[loading="lazy"]';
          const container = document.querySelector('main') || document.body;
          
          // Utiliser requestIdleCallback pour cette opération non-critique
          (window.requestIdleCallback || setTimeout)(() => {
            const visibleLazyImages = Array.from(container.querySelectorAll(selector))
              .filter(img => {
                const rect = img.getBoundingClientRect();
                return rect.top < window.innerHeight * 2;
              });
            
            // Traiter les images par lots
            chunkTasks(visibleLazyImages.map(img => () => {
              img.loading = 'eager';
            }), 3);
          }, { timeout: 300 });
        }
        
        fcpObserver.disconnect();
      }
    });
    
    fcpObserver.observe({ type: 'paint', buffered: true });
  });
  
  // CLS (Cumulative Layout Shift) - version optimisée
  safeExecute(() => {
    if (!PerformanceObserver.supportedEntryTypes.includes('layout-shift')) return;
    
    let clsValue = 0;
    let clsEntries = [];
    let sessionValue = 0;
    let sessionEntries = [];
    let clsReported = false;
    
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          clsEntries.push(entry);
          
          // Trouver une "session" de CLS (groupe d'entrées séparées par moins d'une seconde)
          if (sessionValue && performance.now() - sessionEntries[sessionEntries.length - 1].startTime < 1000) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }
          
          // Si le CLS est élevé pour la session, stabiliser les éléments
          if (sessionValue > 0.05) {
            // Utiliser requestIdleCallback pour ne pas ajouter au TBT
            (window.requestIdleCallback || setTimeout)(() => {
              if (!clsReported) {
                const selector = 'img:not([width]):not([height]), iframe:not([width]):not([height])';
                
                // Limiter aux éléments dans le viewport actuel + marge
                const elementsToStabilize = Array.from(document.querySelectorAll(selector))
                  .filter(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.top < window.innerHeight * 1.5;
                  });
                
                if (elementsToStabilize.length > 0) {
                  // Stabiliser en lots
                  chunkTasks(elementsToStabilize.map(el => () => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width && rect.height) {
                      el.setAttribute('width', rect.width);
                      el.setAttribute('height', rect.height);
                    }
                  }), 5);
                }
                
                clsReported = true;
                
                // Permettre un nouveau rapport après un délai
                setTimeout(() => {
                  clsReported = false;
                }, 2000);
              }
            }, { timeout: 300 });
          }
        }
      });
      
      console.log('[Performance] CLS:', clsValue.toFixed(4));
    });
    
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  });
}

// Optimiser le chargement des images
function optimizeImageLoading() {
  safeExecute(() => {
    if (!('loading' in HTMLImageElement.prototype)) return;
    
    // Attendre un peu pour s'assurer que le contenu est chargé
    setTimeout(() => {
      // Appliquer un lazy loading aux images non critiques
      document.querySelectorAll('img:not([loading])').forEach(img => {
        if (!img.closest('#lcp-container') && !img.closest('.hero-section')) {
          img.loading = 'lazy';
          
          // Ajouter les dimensions si absentes pour éviter le CLS
          if (!img.getAttribute('width') && !img.getAttribute('height')) {
            img.style.aspectRatio = '16/9';
          }
        }
      });
      
      // Utiliser IntersectionObserver pour charger les images de manière optimisée
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
              }
              imageObserver.unobserve(img);
            }
          });
        }, { rootMargin: '200px 0px' });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
          imageObserver.observe(img);
        });
      }
    }, 100);
  });
}

// Optimisation des animations pour les appareils à faible capacité
function optimizeAnimations() {
  safeExecute(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isMobile = false;
    let isLowEndDevice = false;
    
    // Détection mobile
    if (typeof window !== 'undefined' && window.innerWidth) {
      isMobile = window.innerWidth < 768 || 
                (typeof navigator !== 'undefined' && 
                 navigator.userAgent && 
                 navigator.userAgent.toLowerCase().includes('mobi'));
    }
    
    // Détection de device bas de gamme
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
      isLowEndDevice = navigator.hardwareConcurrency <= 4;
    }
    
    if (prefersReducedMotion || (isMobile && isLowEndDevice)) {
      document.documentElement.classList.add('reduced-motion');
      console.log('[Performance] Mode animations réduites activé');
    }
  });
}

// Initialisation des optimisations de performance
function init() {
  // Vérifier que le navigateur est supporté
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  // Appliquer les optimisations pour réduire le TBT immédiatement
  safeExecute(scheduleMicroTasks);
  
  // Attendre que le contenu soit chargé
  const runOptimizations = () => {
    // Utiliser chunkTasks pour diviser le travail d'initialisation
    chunkTasks([
      () => safeExecute(measureWebVitals),
      () => safeExecute(optimizeImageLoading),
      () => safeExecute(optimizeAnimations)
    ]);
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runOptimizations);
  } else {
    runOptimizations();
  }
}

// Exécuter les optimisations
init(); 