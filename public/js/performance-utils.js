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

// Détecter les appareils mobiles et leurs capacités
function detectMobileDevice() {
  // Détecter si l'appareil est mobile
  deviceInfo.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                       (window.innerWidth < 768);
  
  // Détecter si c'est un appareil à faibles performances
  deviceInfo.isLowEndDevice = navigator.hardwareConcurrency <= 4 || 
                           /Android [1-6]|iPhone ([5-8]|SE|X)|iPad Air 1|iPad Mini [1-3]/i.test(navigator.userAgent) ||
                           (deviceInfo.isMobile && navigator.deviceMemory && navigator.deviceMemory <= 4);
  
  // Détecter la préférence pour les animations réduites
  deviceInfo.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Ajouter des classes pour CSS
  if (deviceInfo.isMobile) document.documentElement.classList.add('is-mobile-device');
  if (deviceInfo.isLowEndDevice) document.documentElement.classList.add('is-low-end-device');
  if (deviceInfo.prefersReducedMotion) document.documentElement.classList.add('prefers-reduced-motion');
  
  // Connexion lente détection
  let isSlowConnection = false;
  if ('connection' in navigator) {
    const conn = navigator.connection;
    if (conn.saveData || 
        conn.effectiveType === 'slow-2g' || 
        conn.effectiveType === '2g' || 
        conn.effectiveType === '3g') {
      isSlowConnection = true;
      document.documentElement.classList.add('slow-connection');
    }
  }
  
  return {
    isMobile: deviceInfo.isMobile,
    isLowEndDevice: deviceInfo.isLowEndDevice,
    prefersReducedMotion: deviceInfo.prefersReducedMotion,
    isSlowConnection
  };
}

// Optimisations spécifiques pour mobile
function optimizeMobile() {
  const device = detectMobileDevice();
  
  if (device.isMobile) {
    // 1. Désactiver les animations complexes
    if (device.isLowEndDevice || device.isSlowConnection) {
      document.querySelectorAll('.animate-gradient-x, .animate-ping, .animate-pulse, .bg-gradient-animate')
        .forEach(el => {
          el.classList.add('animation-disabled');
          if (el.style.animationPlayState !== 'paused') {
            el.style.animationPlayState = 'paused';
          }
        });
      
      // Simplifier les effets de parallaxe et d'opacité
      document.querySelectorAll('.parallax, .opacity-animate')
        .forEach(el => {
          el.classList.add('simplified-effect');
        });
    }
    
    // 2. Optimiser les images pour mobile
    document.querySelectorAll('img:not([data-no-optimize])')
      .forEach(img => {
        // Assurer que toutes les images ont des attributs width/height
        if (!img.getAttribute('width') && !img.getAttribute('height') && img.src) {
          img.style.aspectRatio = '16/9';
        }
        
        // Appliquer lazy loading pour les images non critiques
        if (!img.hasAttribute('data-lcp-element') && !img.closest('.hero-section')) {
          img.loading = 'lazy';
        }
        
        // Pour les mobiles bas de gamme, réduire la qualité des images d'arrière-plan
        if (device.isLowEndDevice && img.classList.contains('bg-image')) {
          img.classList.add('reduced-quality');
        }
      });
    
    // 3. Réduire la fréquence des mises à jour pour les éléments non critiques
    const debouncedEvents = ['scroll', 'resize'];
    
    debouncedEvents.forEach(eventType => {
      // Augmenter le délai de debounce pour mobile
      const debounceDelay = device.isLowEndDevice ? 150 : 100;
      
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === eventType && !options?.critical) {
          let debounceTimer;
          const debouncedListener = (e) => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              listener(e);
            }, debounceDelay);
          };
          return originalAddEventListener.call(this, type, debouncedListener, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
    });
    
    // 4. Optimiser les polices pour mobile
    if (device.isSlowConnection) {
      // Prioriser seulement les polices essentielles
      document.querySelectorAll('link[rel="preload"][as="font"]:not([data-critical="true"])')
        .forEach(fontLink => {
          // Convertir les préchargements de polices non essentielles en prefetch
          fontLink.setAttribute('rel', 'prefetch');
        });
    }
    
    // 5. Style CSS spécifique pour mobile
    const mobileStyle = document.createElement('style');
    mobileStyle.textContent = `
      .is-mobile-device .desktop-only { display: none !important; }
      .is-mobile-device .animation-disabled { animation: none !important; }
      .is-mobile-device .simplified-effect { transform: none !important; }
      .is-mobile-device .reduced-quality { filter: none !important; }
      .is-low-end-device .fancy-border { border-image: none !important; border: 1px solid #ccc !important; }
      .is-low-end-device .shadow-effect { box-shadow: none !important; }
      .slow-connection img.auto-responsive[src$='.jpg'], 
      .slow-connection img.auto-responsive[src$='.png'] { 
        content-visibility: auto;
      }
    `;
    document.head.appendChild(mobileStyle);
    
    // 6. Économie de batterie
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        if (battery.level < 0.2 && !battery.charging) {
          // Mode économie de batterie renforcé
          document.documentElement.classList.add('battery-saving');
          
          // Réduire la fréquence des animations
          document.querySelectorAll('[class*="animate-"]').forEach(el => {
            if (el.style.animationDuration) {
              // Ralentir les animations
              const currentDuration = parseFloat(getComputedStyle(el).animationDuration);
              if (!isNaN(currentDuration)) {
                el.style.animationDuration = (currentDuration * 1.5) + 's';
              }
            }
          });
        }
      }).catch(() => {
        // API batterie non disponible, ne rien faire
      });
    }
  }
}

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
  
  // Utiliser une stratégie plus agressive pour fragmenter les tâches afin de réduire le TBT
  const maxTaskTimeMs = 5; // Limiter chaque tâche à 5ms maximum
  
  // Obtenir une estimation de la charge CPU en cours
  const estimateCpuLoad = () => {
    // Si nous avons des tâches longues consécutives, nous estimons une charge élevée
    if (typeof window.consecutiveLongTasks !== 'undefined' && window.consecutiveLongTasks > 1) {
      return 'high';
    }
    
    // Vérifier les animations en cours
    const hasActiveAnimations = document.querySelectorAll('.animate-pulse, .animate-spin, [class*="animate-"]').length > 0;
    
    // Vérifier si un défilement est en cours
    const isScrolling = typeof window.lastScrollTime !== 'undefined' && 
                        (performance.now() - window.lastScrollTime) < 100;
    
    if (hasActiveAnimations && isScrolling) {
      return 'high';
    } else if (hasActiveAnimations || isScrolling) {
      return 'medium';
    }
    
    return 'low';
  };
  
  let index = 0;
  let aborted = false;
  let lastYield = performance.now();
  
  // Optimisation: détecter les freezes pendant le traitement
  const checkPerformance = () => {
    const now = performance.now();
    const elapsed = now - lastProcessTime;
    const timeSinceYield = now - lastYield;
    
    // Céder le thread plus fréquemment si la charge CPU est élevée
    const cpuLoad = estimateCpuLoad();
    const yieldThreshold = cpuLoad === 'high' ? 8 : (cpuLoad === 'medium' ? 12 : 16);
    
    if (timeSinceYield > yieldThreshold) {
      // Céder le thread avec queueMicrotask ou Promise
      return new Promise(resolve => {
        queueMicrotask(() => {
          lastYield = performance.now();
          resolve(true);
        });
      });
    }
    
    // Si l'exécution prend trop de temps, interrompre temporairement
    if (elapsed > 50) {
      aborted = true;
      
      // Reprendre après un court délai
      return new Promise(resolve => {
        setTimeout(() => {
          aborted = false;
          lastProcessTime = performance.now();
          lastYield = performance.now();
          resolve(false);
          scheduler(processNextChunk);
        }, 50);
      });
    }
    
    return Promise.resolve(true);
  };
  
  let lastProcessTime = performance.now();
  
  async function processNextChunk(deadline) {
    // Si le traitement a été interrompu, ne pas continuer
    if (aborted) return;
    
    // Si requestIdleCallback est utilisé, vérifier le temps disponible
    const hasTimeRemaining = deadline && typeof deadline.timeRemaining === 'function' 
      ? deadline.timeRemaining() > 0 
      : true;
      
    if (!hasTimeRemaining) {
      scheduler(processNextChunk);
      return;
    }
    
    if (index >= tasks.length) return;
    
    // Mettre à jour le temps de début du traitement
    lastProcessTime = performance.now();
    
    // Calculer la taille du chunk actuel (plus petite si charge CPU élevée)
    const cpuLoad = estimateCpuLoad();
    const dynamicChunkSize = cpuLoad === 'high' ? 1 : (cpuLoad === 'medium' ? Math.max(1, Math.floor(actualChunkSize / 2)) : actualChunkSize);
    
    const end = Math.min(index + dynamicChunkSize, tasks.length);
    
    // Traiter les tâches du chunk actuel avec vérification du temps restant
    for (let i = index; i < end && (deadline ? deadline.timeRemaining() > 0 : true); i++) {
      const startTaskTime = performance.now();
      
      try {
        // Exécuter la tâche
        await Promise.resolve(tasks[i]());
        
        const taskTime = performance.now() - startTaskTime;
        
        // Si la tâche a pris trop de temps, céder le thread
        if (taskTime > maxTaskTimeMs) {
          await new Promise(resolve => setTimeout(resolve, 0));
          lastYield = performance.now();
        }
        
        // Après chaque tâche, vérifier si nous devons interrompre le traitement
        if (i > index && i % 2 === 0) {
          const shouldContinue = await checkPerformance();
          if (!shouldContinue) {
            // Si interrompu, sortir de la boucle
            return;
          }
        }
      } catch (err) {
        if (!isProduction()) {
          console.warn('[Performance] Erreur dans une tâche:', err);
        }
      }
    }
    
    index = end;
    
    // Continuer avec le prochain chunk seulement si nécessaire
    if (index < tasks.length) {
      // Utiliser un délai variable basé sur la charge
      const cpuLoad = estimateCpuLoad();
      const delay = cpuLoad === 'high' ? 12 : (cpuLoad === 'medium' ? 8 : 4);
      setTimeout(() => scheduler(processNextChunk), delay);
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
          // Intervenir plus tôt pour les tâches longues
          if (longestTask.duration > 50 || consecutiveLongTasks >= 2) {
            // Réduire temporairement les animations pour libérer des ressources
            if (!document.documentElement.classList.contains('reduced-motion')) {
              document.documentElement.classList.add('reduced-motion');
              
              // Rétablir après un court délai
              setTimeout(() => {
                document.documentElement.classList.remove('reduced-motion');
              }, consecutiveLongTasks >= 3 ? 400 : 200);
            }
            
            // Forcer un yield minimal pour débloquer le thread
            setTimeout(() => {}, 0);
            
            // Pour les cas graves, utiliser une stratégie plus agressive
            if (longestTask.duration > 100 || consecutiveLongTasks >= 3) {
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
                  }, 500);
                });
              });
              
              // Exécuter de façon non bloquante avec une priorité plus élevée
              if (deferTasks.length > 0) {
                chunkTasks(deferTasks, 1);
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
      let lastFireTime = 0;
      const originalListener = EventTarget.prototype.addEventListener;
      
      // Maintenir un compteur d'events pour détecter les surcharges
      let eventCount = 0;
      let lastCountResetTime = performance.now();
      
      const resetEventCount = () => {
        eventCount = 0;
        lastCountResetTime = performance.now();
      };
      
      // Délai dynamique basé sur les performances actuelles
      const getThrottleDelay = () => {
        const now = performance.now();
        
        // Si beaucoup d'événements en peu de temps, augmenter le délai
        if (now - lastCountResetTime < 1000) {
          if (eventCount > 20) {
            return 32; // ~30fps
          } else if (eventCount > 10) {
            return 20; // ~50fps
          }
        } else {
          resetEventCount();
        }
        
        return deviceInfo.isLowEndDevice ? 20 : 16; // 16ms ≈ 60fps, 20ms ≈ 50fps
      };
      
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === eventName) {
          const optimizedListener = (e) => {
            eventCount++;
            lastEvent = e;
            
            const now = performance.now();
            const timeSinceLastFire = now - lastFireTime;
            
            // Ignorer les événements trop fréquents
            if (running || timeSinceLastFire < 8) return;
            
            // Désactiver les gestionnaires d'événements pendant les long tasks
            if (throttleTimer) {
              clearTimeout(throttleTimer);
            }
            
            running = true;
            lastFireTime = now;
            
            // Utiliser microtask puis RAF pour céder le thread
            Promise.resolve().then(() => {
              requestAnimationFrame(() => {
                try {
                  listener(lastEvent);
                } catch (error) {
                  console.warn(`[Performance] Erreur dans gestionnaire ${eventName}:`, error);
                } finally {
                  running = false;
                  
                  // Prévenir plusieurs exécutions rapprochées
                  throttleTimer = setTimeout(() => {
                    throttleTimer = null;
                  }, getThrottleDelay());
                }
              });
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
    
    // Surveiller la charge du thread principal et optimiser automatiquement
    const optimizeMainThread = () => {
      let lastMainThreadCheckTime = performance.now();
      let suspectedHeavyOperations = 0;
      const intervals = [];
      
      // Vérifier périodiquement si le thread principal est surchargé
      const checkMainThread = () => {
        const now = performance.now();
        const elapsed = now - lastMainThreadCheckTime;
        
        // Si l'intervalle a pris plus de temps que prévu, le thread principal est probablement bloqué
        if (elapsed > 60) { // Plus de 60ms pour un intervalle de 50ms indique une surcharge
          suspectedHeavyOperations++;
          
          if (suspectedHeavyOperations >= 3) {
            // Appliquer des optimisations d'urgence
            document.documentElement.classList.add('critical-performance-mode');
            
            // Pause temporaire des animations non essentielles
            const nonCriticalAnimations = document.querySelectorAll('[class*="animate-"]:not(.critical-animation)');
            
            nonCriticalAnimations.forEach(el => {
              el.style.animationPlayState = 'paused';
              el.dataset.animationPaused = 'true';
            });
            
            // Réduire la fréquence des vérifications pendant la période de récupération
            intervals.forEach(id => clearInterval(id));
            intervals.length = 0;
            
            // Après un délai, restaurer progressivement
            setTimeout(() => {
              document.documentElement.classList.remove('critical-performance-mode');
              
              // Restaurer progressivement les animations
              let index = 0;
              const animationsToRestore = Array.from(document.querySelectorAll('[data-animation-paused="true"]'));
              
              const restoreNextBatch = () => {
                const end = Math.min(index + 5, animationsToRestore.length);
                
                for (let i = index; i < end; i++) {
                  animationsToRestore[i].style.animationPlayState = '';
                  animationsToRestore[i].removeAttribute('data-animation-paused');
                }
                
                index = end;
                
                if (index < animationsToRestore.length) {
                  setTimeout(restoreNextBatch, 100);
                } else {
                  // Restaurer les vérifications normales
                  startChecking();
                }
              };
              
              if (animationsToRestore.length > 0) {
                restoreNextBatch();
              } else {
                startChecking();
              }
            }, 2000);
            
            suspectedHeavyOperations = 0;
          }
        } else {
          // Réduire progressivement le compteur si tout va bien
          if (suspectedHeavyOperations > 0 && Math.random() > 0.5) {
            suspectedHeavyOperations--;
          }
        }
        
        lastMainThreadCheckTime = now;
      };
      
      // Démarrer les vérifications périodiques
      const startChecking = () => {
        // Nettoyer les anciens intervalles par sécurité
        intervals.forEach(id => clearInterval(id));
        intervals.length = 0;
        
        // Utiliser plusieurs intervalles décalés pour une meilleure détection
        intervals.push(setInterval(checkMainThread, 50));
        intervals.push(setInterval(checkMainThread, 70));
      };
      
      startChecking();
    };
    
    // Activer la surveillance du thread principal
    setTimeout(optimizeMainThread, 2000); // Attendre que la page soit stable
    
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
  
  // LCP (Largest Contentful Paint) - Identification et optimisation
  safeExecute(() => {
    if (!PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) return;
    
    let lcpElement = null;
    let lcpUrl = null;

    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lcpEntry = entries[entries.length - 1]; // Dernière entrée = élément LCP final
      
      if (lcpEntry && lcpEntry.element) {
        lcpElement = lcpEntry.element;
        console.log('[Performance] LCP:', lcpEntry.startTime, 'ms, élément:', lcpElement.tagName);
        
        // Marquer l'élément pour référence
        lcpElement.setAttribute('data-lcp-element', 'true');
        
        // Si c'est une image, optimiser son chargement
        if (lcpElement.tagName === 'IMG') {
          lcpUrl = lcpElement.src;
          
          // Appliquer des attributs d'optimisation
          lcpElement.fetchPriority = 'high';
          lcpElement.loading = 'eager';
          lcpElement.decoding = 'async';
          
          // Précharger l'image si elle n'est pas encore chargée
          if (!lcpElement.complete) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = lcpUrl;
            link.fetchPriority = 'high';
            document.head.appendChild(link);
          }
          
          // Écouter le prochain chargement de page pour précharger cette image
          window.addEventListener('beforeunload', () => {
            try {
              if (lcpUrl) {
                localStorage.setItem('last-lcp-image', lcpUrl);
              }
            } catch (e) {
              // Ignorer les erreurs de localStorage
            }
          });
        } 
        // Si c'est un texte, s'assurer qu'il est rendu rapidement
        else if (lcpElement.tagName === 'H1' || lcpElement.tagName === 'H2' || 
                lcpElement.tagName === 'P' || lcpElement.tagName === 'DIV') {
          lcpElement.style.contentVisibility = 'auto';
          lcpElement.style.containIntrinsicSize = 'auto 100px';
        }
        
        // Optimiser la hiérarchie parente
        let parent = lcpElement.parentElement;
        while (parent && parent !== document.body) {
          // Donner une priorité de rendu élevée aux parents
          parent.setAttribute('data-lcp-parent', 'true');
          parent = parent.parentElement;
        }
        
        // Déconnecter après avoir identifié l'élément final
        if (lcpEntry.startTime > 1000) {
          lcpObserver.disconnect();
        }
      }
    });
    
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    
    // Vérifier si nous avons un LCP précédent à précharger
    try {
      const previousLcpUrl = localStorage.getItem('last-lcp-image');
      if (previousLcpUrl) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = previousLcpUrl;
        link.fetchPriority = 'high';
        document.head.appendChild(link);
      }
    } catch (e) {
      // Ignorer les erreurs de localStorage
    }
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

// Optimiser le chargement des ressources
function optimizeResourceLoading() {
  safeExecute(() => {
    // Vérifier les ressources préchargées non utilisées
    if (window.performance && window.performance.getEntriesByType) {
      // Attendre que la page soit complètement chargée
      window.addEventListener('load', () => {
        // Laisser un peu de temps pour que les ressources préchargées soient utilisées
        setTimeout(() => {
          // Obtenir toutes les entrées de ressources
          const resources = performance.getEntriesByType('resource');
          const preloadLinks = Array.from(document.querySelectorAll('link[rel="preload"]'));
          
          if (preloadLinks.length === 0) return;
          
          // Pour chaque lien preload, vérifier s'il est utilisé
          preloadLinks.forEach(link => {
            const href = link.href;
            
            // Vérifier si cette ressource est utilisée ailleurs dans la page
            const isUsed = Array.from(document.querySelectorAll('script, img, style, video, audio, iframe'))
              .some(el => {
                if (el.src) return el.src === href;
                if (el.href) return el.href === href;
                return false;
              });
              
            // Si elle n'est pas utilisée et qu'elle est déjà chargée, changer en prefetch
            if (!isUsed) {
              const resource = resources.find(r => r.name === href);
              
              if (resource) {
                // Transformer le preload en prefetch pour éviter les avertissements
                link.setAttribute('rel', 'prefetch');
                
                // Pour les ressources de type image, créer un élément caché pour l'utiliser
                if (link.getAttribute('as') === 'image') {
                  const img = new Image();
                  img.src = href;
                  img.style.position = 'absolute';
                  img.style.width = '1px';
                  img.style.height = '1px';
                  img.style.opacity = '0.01';
                  img.style.pointerEvents = 'none';
                  img.style.zIndex = '-1';
                  document.body.appendChild(img);
                  
                  // Nettoyer après quelques secondes
                  setTimeout(() => {
                    document.body.removeChild(img);
                  }, 3000);
                }
              }
            }
          });
        }, 3000); // Vérifier 3 secondes après le chargement de la page
      });
    }
    
    // Optimiser le chargement des scripts secondaires
    const deferScriptLoading = () => {
      // Rechercher les scripts qui pourraient être retardés
      const scripts = Array.from(document.querySelectorAll('script[data-priority="low"]'));
      
      if (scripts.length > 0) {
        // Charger les scripts à faible priorité seulement après le chargement complet
        chunkTasks(scripts.map(script => () => {
          const newScript = document.createElement('script');
          
          // Copier tous les attributs
          Array.from(script.attributes).forEach(attr => {
            if (attr.name !== 'data-priority') {
              newScript.setAttribute(attr.name, attr.value);
            }
          });
          
          // Remplacer l'ancien script par le nouveau
          script.parentNode.replaceChild(newScript, script);
        }));
      }
    };
    
    // Exécuter après le chargement initial
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', deferScriptLoading);
    } else {
      deferScriptLoading();
    }
  });
}

// Fonction pour réduire spécifiquement le TBT (Total Blocking Time)
function reduceTBT() {
  safeExecute(() => {
    // Détecter les événements qui peuvent indiquer une interaction utilisateur
    const userInteractionEvents = ['mousedown', 'keydown', 'touchstart', 'pointerdown'];
    
    // Stocker le temps de la dernière interaction
    let lastInteractionTime = 0;
    
    // Surveiller les interactions utilisateur qui contribuent au TBT
    userInteractionEvents.forEach(eventType => {
      window.addEventListener(eventType, () => {
        lastInteractionTime = performance.now();
        
        // Prioriser les opérations importantes juste après l'interaction utilisateur
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            // Déplacer les tâches non essentielles hors du chemin critique
            const nonEssentialTasks = Array.from(document.querySelectorAll('[data-animation], .bg-gradient-animate, .lazy-bg'));
            
            // Suspendre temporairement les animations et effets non essentiels
            nonEssentialTasks.forEach(el => {
              if (el.style.animationPlayState !== 'paused') {
                el.dataset.originalAnimationState = el.style.animationPlayState || '';
                el.style.animationPlayState = 'paused';
                
                // Restaurer après l'interaction
                setTimeout(() => {
                  el.style.animationPlayState = el.dataset.originalAnimationState;
                }, 300);
              }
            });
          }, { timeout: 200 });
        }
      }, { passive: true });
    });
    
    // Tracker les événements de scroll pour optimiser les périodes de scroll intensif
    let isScrolling = false;
    let scrollTimeoutId = null;
    
    window.addEventListener('scroll', () => {
      window.lastScrollTime = performance.now();
      
      if (!isScrolling) {
        isScrolling = true;
        document.documentElement.classList.add('is-scrolling');
      }
      
      // Réinitialiser le timeout à chaque événement de scroll
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
      }
      
      // Considérer que le scroll est terminé après 100ms sans événement de scroll
      scrollTimeoutId = setTimeout(() => {
        isScrolling = false;
        document.documentElement.classList.remove('is-scrolling');
      }, 100);
    }, { passive: true });
    
    // Optimiser l'utilisation de setTimeout/setInterval qui sont sources de TBT
    const originalSetInterval = window.setInterval;
    window.setInterval = function(callback, delay, ...args) {
      if (delay < 100) {
        console.warn('[Performance] Intervalles courts (<100ms) peuvent contribuer au TBT');
      }
      
      // Utiliser requestAnimationFrame pour les intervalles visuels
      if (delay >= 16 && delay <= 64) {
        let lastTime = 0;
        let animFrameId;
        
        const tick = (timestamp) => {
          if (!lastTime || timestamp - lastTime >= delay) {
            lastTime = timestamp;
            callback(...args);
          }
          animFrameId = requestAnimationFrame(tick);
        };
        
        animFrameId = requestAnimationFrame(tick);
        
        // Retourner un objet avec une méthode pour l'annuler
        return {
          _rafInterval: true,
          _id: animFrameId,
          _cleared: false,
          valueOf: function() { return this._id; },
          toString: function() { return String(this._id); }
        };
      }
      
      return originalSetInterval.call(window, callback, delay, ...args);
    };
    
    // Patcher clearInterval pour gérer nos intervalles spéciaux
    const originalClearInterval = window.clearInterval;
    window.clearInterval = function(id) {
      if (id && id._rafInterval && !id._cleared) {
        id._cleared = true;
        return cancelAnimationFrame(id._id);
      }
      return originalClearInterval.call(window, id);
    };
    
    // Ajouter du CSS pour optimiser les périodes de scroll
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .is-scrolling [class*="animate-"]:not(.critical-animation) {
        animation-play-state: paused !important;
      }
      .is-scrolling .lazy-load {
        transition: none !important;
      }
    `;
    document.head.appendChild(styleElement);
  });
}

// Initialisation des optimisations de performance
function init() {
  // Vérifier que le navigateur est supporté
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  // Appliquer les optimisations pour réduire le TBT immédiatement
  safeExecute(scheduleMicroTasks);
  safeExecute(reduceTBT);
  
  // Optimisations spécifiques mobiles en priorité
  safeExecute(optimizeMobile);
  
  // Optimisation spécifique pour réduire le TBT
  safeExecute(() => {
    // Diviser l'exécution des scripts en microtâches
    const originalCreateElement = Document.prototype.createElement;
    Document.prototype.createElement = function(tagName, options) {
      const element = originalCreateElement.call(this, tagName, options);
      
      // Optimiser spécifiquement les scripts
      if (tagName.toLowerCase() === 'script') {
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name, value) {
          if (name === 'src' && !this.hasAttribute('async') && !this.hasAttribute('defer')) {
            // Encourager l'utilisation d'async pour les scripts non-critiques
            originalSetAttribute.call(this, 'async', '');
          }
          return originalSetAttribute.call(this, name, value);
        };
      }
      
      return element;
    };
    
    // Patcher setTimeout pour éviter les longs délais qui bloquent le thread
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(callback, delay, ...args) {
      // Pour les délais longs, diviser en segments plus courts pour céder le thread
      if (delay > 100) {
        const maxSegment = 50;
        let remainingDelay = delay;
        let timeoutId;
        
        const executeAfterDelay = () => {
          if (remainingDelay <= maxSegment) {
            timeoutId = originalSetTimeout.call(window, () => {
              if (typeof callback === 'function') {
                callback(...args);
              } else if (typeof callback === 'string') {
                eval(callback);
              }
            }, remainingDelay);
          } else {
            remainingDelay -= maxSegment;
            timeoutId = originalSetTimeout.call(window, executeAfterDelay, maxSegment);
          }
        };
        
        executeAfterDelay();
        
        // Retourner un objet qui imite un ID de timeout
        // mais qui contient une méthode pour annuler la chaîne de timeouts
        return {
          _chainedTimeout: true,
          _id: timeoutId,
          _cleared: false,
          valueOf: function() { return this._id; },
          toString: function() { return String(this._id); }
        };
      }
      
      // Pour les courts délais, utiliser le comportement normal
      return originalSetTimeout.call(window, callback, delay, ...args);
    };
    
    // Patcher clearTimeout pour gérer nos timeouts spéciaux
    const originalClearTimeout = window.clearTimeout;
    window.clearTimeout = function(id) {
      if (id && id._chainedTimeout && !id._cleared) {
        id._cleared = true;
        return originalClearTimeout.call(window, id._id);
      }
      return originalClearTimeout.call(window, id);
    };
  });
  
  // Attendre que le contenu soit chargé
  const runOptimizations = () => {
    // Utiliser chunkTasks pour diviser le travail d'initialisation
    chunkTasks([
      () => safeExecute(optimizeResourceLoading),
      () => safeExecute(measureWebVitals),
      () => safeExecute(optimizeImageLoading),
      () => safeExecute(optimizeAnimations)
    ], 1); // Réduire la taille des chunks pour éviter le blocage
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runOptimizations);
  } else {
    runOptimizations();
  }
}

// Exécuter les optimisations
init(); 