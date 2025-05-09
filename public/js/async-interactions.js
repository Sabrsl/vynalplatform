/**
 * Gestion asynchrone des interactions - réduit le TBT sans modifier le comportement visible
 */
(function() {
  // Détection du type de page pour optimisations spécifiques
  const isDashboard = document.querySelector('.dashboard-main-content, .dashboard-stats, .dashboard-header') !== null;
  
  // Fonction utilitaire pour détecter l'environnement de production
  function isProduction() {
    return window.location.hostname !== 'localhost' && 
           !window.location.hostname.includes('127.0.0.1') &&
           !window.location.hostname.includes('dev') &&
           !window.location.hostname.includes('staging');
  }
  
  // Fonction utilitaire pour exécuter des tâches en arrière-plan de façon sûre
  function runInBackground(task, timeout = isDashboard ? 8 : 16) {
    return new Promise(resolve => {
      const timerId = setTimeout(() => {
        try {
          const result = task();
          resolve(result);
        } catch (err) {
          console.warn('[AsyncInteractions] Erreur dans runInBackground:', err);
          resolve(null);
        }
      }, timeout);
      
      // Gérer le cas de fermeture du canal de message
      window.addEventListener('unload', () => {
        clearTimeout(timerId);
        resolve(null);
      }, { once: true });
    });
  }
  
  // Division des traitements en micro-tâches - réduit le TBT
  function chunkTasks(tasks, chunkSize = 5) {
    if (!tasks || tasks.length === 0) return;
    
    // Utiliser requestIdleCallback si disponible, sinon setTimeout
    const scheduler = window.requestIdleCallback || 
                   ((callback) => setTimeout(callback, 0));
    
    // Détection simplifiée des appareils peu puissants 
    const isLowPowerDevice = window.navigator.hardwareConcurrency <= 4 || 
                          /Android|Mobile|iPhone|iPad/i.test(navigator.userAgent);
    
    // Réduire la taille des chunks pour les appareils moins puissants
    const actualChunkSize = isLowPowerDevice ? Math.min(chunkSize, 2) : chunkSize;
    
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
        
        // Traiter les tâches du chunk actuel
        for (let i = index; i < end && (deadline ? deadline.timeRemaining() > 0 : true); i++) {
            try {
                tasks[i]();
            } catch (err) {
                // Réduire la verbosité des logs en production
                if (!isProduction()) {
                    console.warn('[AsyncInteractions] Erreur dans une tâche:', err);
                }
            }
        }
        
        // Mettre à jour l'index
        index = end;
        
        // Continuer avec le prochain chunk seulement si nécessaire
        if (index < tasks.length) {
            scheduler(processNextChunk);
        }
    }
    
    // Démarrer le traitement
    scheduler(processNextChunk);
  }
  
  // Préchargement de l'image LCP identifiée
  function preloadLCPImage() {
    try {
      // Recherche d'images candidates LCP (images larges dans la partie visible)
      const images = Array.from(document.querySelectorAll('img'));
      const candidates = images.filter(img => {
        const rect = img.getBoundingClientRect();
        return (rect.top < window.innerHeight) && 
               (rect.width * rect.height > 50000) && 
               (!img.loading || img.loading !== 'lazy');
      });
      
      // Précharger les images candidates
      if (candidates.length > 0) {
        candidates.forEach(img => {
          // Marquer comme haute priorité
          if ('fetchPriority' in HTMLImageElement.prototype) {
            img.fetchPriority = 'high';
          }
          
          // Forcer le chargement immédiat
          if (img.loading === 'lazy') {
            img.loading = 'eager';
          }
          
          // Précharger avec un lien si pas encore chargé
          if (!img.complete && img.src) {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            preloadLink.href = img.src;
            document.head.appendChild(preloadLink);
          }
        });
      }
    } catch (err) {
      console.warn('[AsyncInteractions] Erreur dans preloadLCPImage:', err);
    }
  }
  
  // Diffère l'initialisation des gestionnaires d'événements non critiques
  function deferNonCriticalEventListeners() {
    try {
      // Stocker les références aux méthodes originales
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      
      // Remplacer addEventListener pour les événements non critiques
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        // Liste des événements qui ne sont pas critiques pour l'interaction initiale
        const nonCriticalEvents = ['mouseover', 'mouseenter', 'mouseleave', 'focus', 'blur', 'resize'];
        
        if (nonCriticalEvents.includes(type)) {
          // Différer davantage sur le dashboard pour améliorer la première interaction
          const delay = isDashboard ? 1500 : 1000;
          
          // Différer l'enregistrement des événements non critiques
          setTimeout(() => {
            originalAddEventListener.call(this, type, listener, options);
          }, delay);
        } else {
          // Optimiser les écouteurs de scroll/wheel pour réduire le TBT
          if (type === 'scroll' || type === 'wheel') {
            const passiveOptions = options === undefined ? { passive: true } :
                                  typeof options === 'boolean' ? { passive: true, capture: options } :
                                  { ...options, passive: options.passive !== false };
            originalAddEventListener.call(this, type, listener, passiveOptions);
          } else {
            // Événements critiques - enregistrer immédiatement
            originalAddEventListener.call(this, type, listener, options);
          }
        }
      };
      
      // Restaurer la méthode originale après le chargement complet
      window.addEventListener('load', () => {
        // Délai plus long pour le dashboard pour permettre au contenu critique d'être interactif
        const delay = isDashboard ? 4000 : 3000;
        setTimeout(() => {
          EventTarget.prototype.addEventListener = originalAddEventListener;
        }, delay);
      });
    } catch (err) {
      console.warn('[AsyncInteractions] Erreur dans deferNonCriticalEventListeners:', err);
    }
  }
  
  // Optimisation des animations pour réduire la charge sur le thread principal
  function optimizeAnimations() {
    try {
      // Identifier les animations en cours
      const animatedElements = document.querySelectorAll('.animate-fade-in, .animate-gradient-x, [class*="transition-"]');
      if (animatedElements.length === 0) return;
      
      // Détecter les appareils à basse performance
      const isLowPowerDevice = window.navigator.hardwareConcurrency <= 4 || 
                              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Dans le dashboard, suspendre plus d'animations initialement pour réduire le TBT
      const tasks = [];
      animatedElements.forEach(element => {
        tasks.push(() => {
          element.style.animationPlayState = 'paused';
          element.style.transitionProperty = 'none';
          
          // Réduire la complexité des animations sur les appareils à basse performance
          if (isLowPowerDevice) {
            element.style.animationDuration = '0.5s';
            element.style.transitionDuration = '0.3s';
          }
          
          // Pour le dashboard, optimiser davantage les animations complexes
          if (isDashboard) {
            // Désactiver les animations de fond et dégradés qui sont lourdes
            if (element.classList.contains('animate-gradient-x') || 
                window.getComputedStyle(element).background.includes('linear-gradient')) {
              element.style.backgroundImage = 'none';
              element.style.backgroundColor = window.getComputedStyle(element).backgroundColor;
            }
          }
        });
      });
      
      // Exécuter les tâches par petits lots pour éviter de bloquer le thread principal
      chunkTasks(tasks);
      
      // Réactiver les animations après le chargement
      window.addEventListener('load', () => {
        // Attendre plus longtemps pour le dashboard
        const delay = isDashboard ? 2000 : 1000;
        
        // Utiliser requestIdleCallback si disponible
        const scheduleReactivation = window.requestIdleCallback || setTimeout;
        
        scheduleReactivation(() => {
          const reactivationTasks = [];
          animatedElements.forEach(element => {
            reactivationTasks.push(() => {
              // Réactiver progressivement les animations
              element.style.animationPlayState = '';
              element.style.transitionProperty = '';
            });
          });
          
          // Exécuter par petits lots avec délai entre chaque
          chunkTasks(reactivationTasks, 3);
        }, { timeout: delay });
      });
    } catch (err) {
      console.warn('[AsyncInteractions] Erreur dans optimizeAnimations:', err);
    }
  }
  
  // Éviter les calculs de layout et style fréquents
  function preventLayoutThrashing() {
    try {
      // Rechercher les éléments qui pourraient causer des calculs fréquents
      const potentiallyExpensiveElements = document.querySelectorAll('[class*="hover:"], [class*="focus:"]');
      if (potentiallyExpensiveElements.length === 0) return;
      
      // Optimiser chaque élément par lots
      const tasks = [];
      potentiallyExpensiveElements.forEach(element => {
        tasks.push(() => {
          // Éviter le changement de compositing layer pour tous les éléments (cause de CLS)
          const rect = element.getBoundingClientRect();
          if (rect.width > 50 && rect.height > 50) {
            element.style.willChange = 'transform, opacity';
            element.style.transform = 'translateZ(0)'; // Forcer la promotion sur un layer GPU
          }
        });
      });
      
      // Exécuter les tâches par petits lots
      chunkTasks(tasks);
      
      // Nettoyage après le chargement complet
      window.addEventListener('load', () => {
        // Sur le dashboard, attendre plus longtemps avant de nettoyer
        const delay = isDashboard ? 4000 : 3000;
        
        // Utiliser requestIdleCallback si disponible, sinon setTimeout
        const cleanupFn = window.requestIdleCallback || setTimeout;
        cleanupFn(() => {
          const cleanupTasks = [];
          potentiallyExpensiveElements.forEach(element => {
            cleanupTasks.push(() => {
              element.style.willChange = 'auto';
            });
          });
          chunkTasks(cleanupTasks);
        }, { timeout: delay });
      });
    } catch (err) {
      console.warn('[AsyncInteractions] Erreur dans preventLayoutThrashing:', err);
    }
  }
  
  // Fonction pour stabiliser la mise en page (réduit CLS)
  function stabilizeLayout() {
    try {
      // Identifier les éléments qui pourraient causer des CLS
      const clsRiskElements = document.querySelectorAll('img, video, iframe, [class*="h-"], [class*="w-"]');
      if (clsRiskElements.length === 0) return;
      
      // Traiter les éléments en petits lots pour ne pas bloquer le thread principal
      const tasks = [];
      
      clsRiskElements.forEach(element => {
        tasks.push(() => {
          if (element.tagName.toLowerCase() === 'img' && !element.getAttribute('width') && !element.getAttribute('height')) {
            element.setAttribute('width', '100%');
            element.setAttribute('height', 'auto');
            element.style.aspectRatio = '16/9'; // Aspect ratio par défaut
          }
        });
      });
      
      // Exécuter les tâches en petits lots
      chunkTasks(tasks, 10);
      
      // Pour le dashboard, stabiliser spécifiquement les conteneurs de graphiques et tableaux
      if (isDashboard) {
        const dashboardStabilizationTasks = [];
        document.querySelectorAll('.chart-container, .data-table-wrapper, .stats-container').forEach(container => {
          dashboardStabilizationTasks.push(() => {
            const rect = container.getBoundingClientRect();
            if (rect.height > 0) {
              container.style.minHeight = `${rect.height}px`;
            }
          });
        });
        
        // Exécuter avec une priorité plus élevée
        setTimeout(() => {
          chunkTasks(dashboardStabilizationTasks, 3);
        }, 10);
      }
    } catch (err) {
      console.warn('[AsyncInteractions] Erreur dans stabilizeLayout:', err);
    }
  }
  
  // Optimisation des images avec WebP/AVIF
  function optimizeImageFormats() {
    try {
      // Sur le dashboard, cibler uniquement les images visibles pour réduire le TBT initial
      const selector = isDashboard ? 
        'img:not([data-optimized]):not([loading="lazy"])' : 
        'img:not([data-optimized])';
      
      const images = document.querySelectorAll(selector);
      if (images.length === 0) return;
      
      // Vérifier le support des formats modernes
      const hasWebP = document.createElement('canvas')
        .toDataURL('image/webp').indexOf('data:image/webp') === 0;
      const hasAVIF = document.createElement('canvas')
        .toDataURL('image/avif').indexOf('data:image/avif') === 0;
      
      if (!hasWebP && !hasAVIF) return;
      
      // Optimiser les images en utilisant le bon format
      const tasks = [];
      images.forEach(img => {
        tasks.push(() => {
          const src = img.src;
          if (!src || src.startsWith('data:') || src.includes('.svg')) return;
          
          // Marquer comme optimisée
          img.setAttribute('data-optimized', 'true');
          
          // Utiliser les formats modernes via picture si possible
          const parent = img.parentNode;
          if (parent.tagName.toLowerCase() !== 'picture' && !img.srcset) {
            const imgClone = img.cloneNode(true);
            const picture = document.createElement('picture');
            
            if (hasAVIF) {
              const avifSource = document.createElement('source');
              avifSource.srcset = src.replace(/\.(jpe?g|png)$/i, '.avif');
              avifSource.type = 'image/avif';
              picture.appendChild(avifSource);
            }
            
            if (hasWebP) {
              const webpSource = document.createElement('source');
              webpSource.srcset = src.replace(/\.(jpe?g|png)$/i, '.webp');
              webpSource.type = 'image/webp';
              picture.appendChild(webpSource);
            }
            
            picture.appendChild(imgClone);
            parent.replaceChild(picture, img);
          }
        });
      });
      
      // Exécuter avec une taille de chunk plus petite pour le dashboard et spacing entre lots
      chunkTasks(tasks, isDashboard ? 1 : 2);
    } catch (err) {
      console.warn('[AsyncInteractions] Erreur dans optimizeImageFormats:', err);
    }
  }
  
  // Optimisations spécifiques au dashboard
  function optimizeDashboard() {
    if (!isDashboard) return;
    
    try {
      // Retarder le chargement des éléments non critiques du dashboard
      document.querySelectorAll('.dashboard-sidebar, .dashboard-notifications, .dashboard-activity').forEach(element => {
        element.style.visibility = 'hidden';
      });
      
      // Restaurer après le chargement initial
      setTimeout(() => {
        document.querySelectorAll('.dashboard-sidebar, .dashboard-notifications, .dashboard-activity').forEach(element => {
          element.style.visibility = '';
        });
      }, 300);
      
    } catch (err) {
      console.warn('[AsyncInteractions] Erreur dans optimizeDashboard:', err);
    }
  }
  
  // Délai d'initialisation pour donner la priorité au rendu
  setTimeout(() => {
    try {
      // Précharger l'image LCP pour améliorer le LCP
      preloadLCPImage();
      
      // Stabiliser la mise en page pour réduire le CLS
      runInBackground(stabilizeLayout);
      
      // Différer les écouteurs d'événements non critiques
      runInBackground(deferNonCriticalEventListeners);
      
      // Utiliser requestIdleCallback pour les optimisations non critiques
      const scheduleNonCritical = window.requestIdleCallback || setTimeout;
      scheduleNonCritical(() => {
        // Après le rendu initial, optimiser les animations
        runInBackground(optimizeAnimations);
        
        // Éviter les calculs de layout trop fréquents
        runInBackground(preventLayoutThrashing);
        
        // Optimisation spécifique au dashboard
        if (isDashboard) {
          runInBackground(optimizeDashboard);
        }
      }, { timeout: 200 });
      
      // Optimiser les formats d'image (après le chargement initial)
      window.addEventListener('load', () => {
        // Attendre un peu plus longtemps sur le dashboard pour prioritiser l'interactivité
        setTimeout(() => {
          runInBackground(optimizeImageFormats);
        }, isDashboard ? 300 : 100);
      });
    } catch (err) {
      console.warn('[AsyncInteractions] Erreur dans le bloc d\'initialisation:', err);
    }
  }, isDashboard ? 5 : 10); // Délai encore plus court pour le dashboard pour améliorer le LCP
})(); 