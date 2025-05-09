/**
 * LCP Optimizer - Optimisation avancée du Largest Contentful Paint
 * Réduit le TBT en divisant les tâches en micro-tâches et optimise proactivement le LCP
 * Script à charger au plus tôt dans le head avec `strategy="beforeInteractive"`
 */

(function() {
  // Détection de production pour réduire les logs
  const isProduction = () => {
    return window.location.hostname !== 'localhost' && 
           !window.location.hostname.includes('127.0.0.1') &&
           !window.location.hostname.includes('dev') &&
           !window.location.hostname.includes('staging');
  };

  // Détection du type de page pour optimisations spécifiques
  const isDashboard = () => document.querySelector('.dashboard-main-content, .dashboard-stats, .dashboard-header') !== null;

  // Cache des éléments importants pour éviter les requêtes DOM répétées
  const elementCache = {
    lcpElement: null,
    lcpCandidates: [],
    visibleImages: []
  };

  // Fonction rapide pour créer une tâche de haute priorité
  function createHighPriorityTask(fn) {
    try {
      // Exécuter immédiatement pour les tâches critiques LCP
      fn();
    } catch (err) {
      if (!isProduction()) {
        console.warn('[LCP] Erreur dans une tâche prioritaire:', err);
      }
    }
  }

  // Fonction pour diviser les tâches non critiques
  function scheduleTask(fn, delay = 0) {
    if (delay > 0) {
      setTimeout(fn, delay);
    } else {
      // Utiliser microtâche pour céder le thread mais exécuter rapidement
      Promise.resolve().then(fn);
    }
  }

  // Mesurer et observer le LCP pour interventions en temps réel
  function observeLCP() {
    if (PerformanceObserver && PerformanceObserver.supportedEntryTypes && 
        PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
      
      try {
        // Observer les éléments LCP en temps réel
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length === 0) return;
          
          // Obtenir l'entrée LCP la plus récente
          const lcpEntry = entries[entries.length - 1];
          
          // Récupérer l'élément LCP détecté par le navigateur
          const lcpElement = lcpEntry.element;
          if (lcpElement) {
            elementCache.lcpElement = lcpElement;
            
            // Appliquer des optimisations spécifiques à l'élément identifié
            createHighPriorityTask(() => {
              // Optimisations majeures: forcer l'affichage et la priorité
              lcpElement.style.display = 'block';
              lcpElement.style.visibility = 'visible';
              lcpElement.style.opacity = '1';
              lcpElement.style.contentVisibility = 'auto';
              lcpElement.setAttribute('importance', 'high');
              
              // Pour les images, optimiser davantage
              if (lcpElement.tagName === 'IMG') {
                lcpElement.loading = 'eager';
                if ('fetchPriority' in lcpElement) {
                  lcpElement.fetchPriority = 'high';
                }
                
                // Si l'image n'est pas chargée, forcer son préchargement
                if (!lcpElement.complete) {
                  const link = document.createElement('link');
                  link.rel = 'preload';
                  link.as = 'image';
                  link.href = lcpElement.src;
                  document.head.appendChild(link);
                }
              }

              // Forcer un petit reflow pour que les styles s'appliquent immédiatement
              void lcpElement.offsetHeight;
              
              // Si le LCP est lent, prendre des mesures supplémentaires
              if (lcpEntry.startTime > 2000) {
                // Réduire temporairement les animations pour accélérer le rendu
                document.documentElement.classList.add('reduced-motion');
                
                // Restaurer après un court délai
                scheduleTask(() => {
                  document.documentElement.classList.remove('reduced-motion');
                }, 500);
              }
            });
            
            // Optimiser les éléments parents et voisins pour réduire les shifts
            scheduleTask(() => {
              const parent = lcpElement.parentElement;
              if (parent) {
                parent.style.contain = 'layout';
                
                // Stabiliser les dimensions si nécessaire
                const rect = parent.getBoundingClientRect();
                if (rect.height > 0) {
                  parent.style.minHeight = `${rect.height}px`;
                }
              }
              
              // Chercher les images voisines et les précharger aussi
              if (parent) {
                const siblingImages = parent.querySelectorAll('img:not([loading="lazy"])');
                siblingImages.forEach(img => {
                  if (img !== lcpElement && !img.complete) {
                    img.loading = 'eager';
                    if ('fetchPriority' in img) {
                      img.fetchPriority = 'high';
                    }
                  }
                });
              }
            }, 20);
          }
        });
        
        // Configurer l'observation avec buffered pour ne pas manquer d'entrées
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Déconnecter après le chargement complet pour économiser les ressources
        window.addEventListener('load', () => {
          scheduleTask(() => {
            lcpObserver.disconnect();
          }, 1000);
        });
      } catch (err) {
        console.warn('[LCP] Erreur lors de l\'observation LCP:', err);
      }
    }
  }

  // Préidentifier et optimiser les éléments LCP potentiels
  function optimizePotentialLCPElements() {
    // Sélecteurs pour les éléments LCP typiques
    const lcpSelectors = [
      '#lcp-title',
      '.hero-section h1, .hero-section img',
      '.dashboard-header h1',
      '.dashboard-main-content h1',
      'main h1:first-of-type',
      'article h1, article img:first-of-type',
      'h1:first-of-type',
      '.main-title',
      'img.featured-image'
    ];
    
    // Trouver le premier élément visible correspondant à un sélecteur LCP
    createHighPriorityTask(() => {
      const potentialLCPElements = [];
      
      for (const selector of lcpSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) continue;
        
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          
          // Vérifier si l'élément est dans la zone visible
          if (rect.top < window.innerHeight && rect.width > 0 && rect.height > 0) {
            // Calculer un score de priorité basé sur la position et la taille
            const score = (window.innerHeight - rect.top) * (rect.width * rect.height);
            potentialLCPElements.push({ element: el, score });
          }
        }
      }
      
      // Trier par score et optimiser les 3 premiers éléments les plus probables
      if (potentialLCPElements.length > 0) {
        potentialLCPElements.sort((a, b) => b.score - a.score);
        
        // Mettre en cache les candidats
        elementCache.lcpCandidates = potentialLCPElements.slice(0, 3).map(item => item.element);
        
        // Optimiser les 3 premiers éléments avec un délai progressif pour ne pas bloquer
        elementCache.lcpCandidates.forEach((el, index) => {
          scheduleTask(() => {
            el.style.display = 'block';
            el.style.visibility = 'visible';
            el.style.opacity = '1';
            el.setAttribute('importance', 'high');
            
            if (el.tagName === 'IMG') {
              el.loading = 'eager';
              if ('fetchPriority' in el) {
                el.fetchPriority = 'high';
              }
            }
          }, index * 10); // Espacer légèrement pour réduire l'impact sur le TBT
        });
      }
    });
  }

  // Optimiser les images visibles rapidement
  function optimizeVisibleImages() {
    scheduleTask(() => {
      try {
        const images = Array.from(document.querySelectorAll('img:not([loading="lazy"])'));
        
        // Filtrer pour ne garder que les images dans la zone visible
        const visibleImages = images.filter(img => {
          if (img.complete) return false; // Ignorer les images déjà chargées
          
          const rect = img.getBoundingClientRect();
          return rect.top < window.innerHeight * 1.5 && 
                 rect.width > 0 && 
                 rect.height > 0;
        });
        
        // Mettre en cache
        elementCache.visibleImages = visibleImages;
        
        // Optimiser en microtâches
        if (visibleImages.length > 0) {
          let processedCount = 0;
          
          // Traiter quelques images à la fois avec un petit délai entre chaque
          function processNextBatch() {
            const batchSize = 2;
            const end = Math.min(processedCount + batchSize, visibleImages.length);
            
            for (let i = processedCount; i < end; i++) {
              const img = visibleImages[i];
              img.loading = 'eager';
              
              // Ajouter les attributs manquants pour réduire le CLS
              if (!img.getAttribute('width') && !img.getAttribute('height')) {
                img.style.aspectRatio = '16/9';
              }
            }
            
            processedCount = end;
            
            if (processedCount < visibleImages.length) {
              scheduleTask(processNextBatch, 15);
            }
          }
          
          processNextBatch();
        }
      } catch (err) {
        console.warn('[LCP] Erreur dans optimizeVisibleImages:', err);
      }
    }, 20);
  }

  // Optimiser les connexions réseau pour les ressources externes
  function optimizeNetworkConnections() {
    createHighPriorityTask(() => {
      // Domaines à préconnecter
      const domains = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net'
      ];
      
      // Créer un fragment pour minimiser les reflows
      const fragment = document.createDocumentFragment();
      
      domains.forEach(domain => {
        // Vérifier si la préconnexion n'existe pas déjà
        if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
          const link = document.createElement('link');
          link.rel = 'preconnect';
          link.href = domain;
          link.crossOrigin = 'anonymous';
          fragment.appendChild(link);
        }
      });
      
      // Ajouter tout en une fois
      if (fragment.childNodes.length > 0) {
        document.head.appendChild(fragment);
      }
    });
  }

  // Fonction principale qui orchestre toutes les optimisations par priorité
  function init() {
    // 1. Premières optimisations critiques - immédiates
    optimizeNetworkConnections();
    optimizePotentialLCPElements();
    
    // 2. Observer le LCP - légèrement différé pour ne pas bloquer le rendu
    scheduleTask(observeLCP, 0);
    
    // 3. Optimiser les images en second plan
    scheduleTask(optimizeVisibleImages, 20);
    
    // 4. Effectuer une vérification supplémentaire après un court délai
    scheduleTask(() => {
      // Si aucun élément LCP n'a été détecté, optimiser la première image/titre visible
      if (!elementCache.lcpElement && elementCache.lcpCandidates.length === 0) {
        const fallbackElement = 
          document.querySelector('h1:first-of-type') || 
          document.querySelector('.main-content img:first-of-type') ||
          document.querySelector('img:first-of-type');
        
        if (fallbackElement) {
          fallbackElement.style.display = 'block';
          fallbackElement.style.visibility = 'visible';
          fallbackElement.style.opacity = '1';
          fallbackElement.setAttribute('importance', 'high');
        }
      }
    }, 50);
  }
  
  // Exécuter immédiatement
  init();
})(); 