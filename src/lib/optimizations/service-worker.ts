/**
 * Configuration et gestion du service worker pour optimisation des performances
 */

/**
 * Initialise et configure le service worker
 */
export function setupServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Attendre que la page soit complètement chargée pour enregistrer le service worker
  window.addEventListener('load', () => {
    // Ne pas enregistrer en mode développement
    if (process.env.NODE_ENV !== 'production') {
      console.info('Service Worker désactivé en développement');
      return;
    }

    registerServiceWorker();
  });
}

/**
 * Enregistre le service worker
 */
async function registerServiceWorker(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    
    console.info('Service Worker enregistré avec succès:', registration.scope);
    
    // Vérifier si une mise à jour est disponible
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      // Suivre le changement d'état du service worker
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Une nouvelle version est disponible
          notifyUserAboutUpdate();
        }
      });
    });
  } catch (error) {
    console.error('Échec d\'enregistrement du Service Worker:', error);
  }
}

/**
 * Notifie l'utilisateur qu'une mise à jour est disponible
 */
function notifyUserAboutUpdate(): void {
  // Créer une notification pour informer de la mise à jour
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <p>Une nouvelle version est disponible!</p>
    <button id="update-app">Mettre à jour</button>
    <button id="dismiss-update">Plus tard</button>
  `;

  // Ajouter la notification à la page
  document.body.appendChild(notification);

  // Configurer les gestionnaires d'événements
  document.getElementById('update-app')?.addEventListener('click', () => {
    window.location.reload();
  });

  document.getElementById('dismiss-update')?.addEventListener('click', () => {
    notification.remove();
  });
}

/**
 * Précharge le service worker pour les routes importantes
 * @param routes Routes à précharger
 */
export function precacheRoutes(routes: string[]): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Attendre que le service worker soit prêt
  navigator.serviceWorker.ready.then(registration => {
    // La précharge est gérée par le service worker lui-même
    if (registration.active) {
      registration.active.postMessage({
        type: 'PRECACHE_ROUTES',
        payload: routes
      });
    }
  });
}

/**
 * Génère un fichier service-worker.js minimal
 * Note: Ce code doit être intégré au build process
 */
export function generateServiceWorkerContent(): string {
  const timestamp = Date.now();
  
  return `
    // Service Worker généré automatiquement - ${timestamp}
    const CACHE_NAME = 'vynal-app-cache-v1';
    const STATIC_ASSETS = [
      '/',
      '/index.html',
      '/manifest.json',
      '/favicon.ico',
      '/assets/main.css',
      '/assets/main.js'
    ];

    // Installation: mettre en cache les ressources statiques
    self.addEventListener('install', (event) => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then((cache) => {
            return cache.addAll(STATIC_ASSETS);
          })
      );
    });

    // Activation: nettoyer les anciens caches
    self.addEventListener('activate', (event) => {
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.filter((name) => name !== CACHE_NAME)
              .map((name) => caches.delete(name))
          );
        })
      );
    });

    // Stratégie de cache: Network First pour les API, Cache First pour les assets
    self.addEventListener('fetch', (event) => {
      const url = new URL(event.request.url);
      
      // Stratégie différente selon le type de requête
      if (event.request.method === 'GET') {
        // API requests - Network first, then cache
        if (url.pathname.startsWith('/api/')) {
          event.respondWith(
            fetch(event.request)
              .then((response) => {
                // Mettre en cache la réponse valide
                if (response.ok) {
                  const clonedResponse = response.clone();
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clonedResponse);
                  });
                }
                return response;
              })
              .catch(() => {
                // Utiliser le cache en cas d'échec réseau
                return caches.match(event.request);
              })
          );
        } 
        // Static assets - Cache first, then network
        else if (
          url.pathname.match(/\\.(js|css|png|jpg|jpeg|svg|ico)$/) ||
          STATIC_ASSETS.includes(url.pathname)
        ) {
          event.respondWith(
            caches.match(event.request).then((response) => {
              return response || fetch(event.request).then((fetchResponse) => {
                // Mettre en cache la nouvelle ressource
                const clonedResponse = fetchResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, clonedResponse);
                });
                return fetchResponse;
              });
            })
          );
        } 
        // Autres requêtes - Stratégie réseau normal
        else {
          event.respondWith(
            fetch(event.request).catch(() => {
              return caches.match(event.request);
            })
          );
        }
      }
    });

    // Gestion des messages
    self.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PRECACHE_ROUTES') {
        const routes = event.data.payload || [];
        
        caches.open(CACHE_NAME).then((cache) => {
          // Précharger les routes spécifiées
          routes.forEach((route) => {
            cache.add(route).catch((error) => {
              console.warn('Impossible de précharger:', route, error);
            });
          });
        });
      }
    });
  `;
} 