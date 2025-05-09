/**
 * Service Worker optimisé pour Vynal Platform
 * Gestion intelligente du cache et des ressources
 */

const CACHE_NAME = 'vynal-cache-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const IMAGE_CACHE = 'images-v1';

// Liste des ressources à mettre en cache immédiatement
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/css/performance-optimizations.css',
  '/js/async-interactions.js',
  '/js/performance-utils.js',
  '/js/lcp-optimizer.js'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Mise en cache des ressources statiques
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_RESOURCES);
      }),
      // Préparation du cache pour les images
      caches.open(IMAGE_CACHE)
    ])
  );
  // Activer immédiatement le nouveau Service Worker
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('vynal-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  // Prendre le contrôle immédiatement
  self.clients.claim();
});

// Stratégie Stale-While-Revalidate optimisée
async function staleWhileRevalidateStrategy(request) {
  try {
    // Essayer d'abord le cache
    const cachedResponse = await caches.match(request);
    
    // Lancer la requête réseau en parallèle
    const fetchPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        // Mettre à jour le cache avec la nouvelle réponse
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }).catch(error => {
      console.error('[Service Worker] Erreur de fetch:', error);
      throw error;
    });
    
    // Retourner la réponse du cache si disponible, sinon attendre la réponse réseau
    return cachedResponse || fetchPromise;
  } catch (error) {
    console.error('[Service Worker] Erreur dans staleWhileRevalidateStrategy:', error);
    throw error;
  }
}

// Gestion des requêtes
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non GET
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Ignorer les requêtes non-http(s)
  if (!url.protocol.startsWith('http')) return;
  
  // Stratégie spécifique pour les images
  if (url.pathname.match(/\.(png|jpe?g|gif|svg|webp|avif)$/)) {
    event.respondWith(staleWhileRevalidateStrategy(event.request));
    return;
  }
  
  // Stratégie pour les ressources statiques
  if (STATIC_RESOURCES.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
    return;
  }
  
  // Stratégie par défaut pour les autres ressources
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        // Vérifier si la réponse en cache est toujours valide
        const cacheDate = new Date(response.headers.get('date'));
        const now = new Date();
        const cacheAge = now - cacheDate;
        
        // Si le cache est récent (< 1 heure), l'utiliser
        if (cacheAge < 3600000) {
          return response;
        }
      }
      
      // Sinon, utiliser la stratégie Stale-While-Revalidate
      return staleWhileRevalidateStrategy(event.request);
    })
  );
});

// Gestion améliorée des messages avec timeouts et canaux de communication robustes
self.addEventListener('message', (event) => {
  // Extraire le port de communication s'il existe
  const replyPort = event.ports && event.ports[0];
  const withReply = !!replyPort;
  
  // Traitement des différents types de messages
  if (event.data) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        // Envoyer une confirmation si un port de réponse est disponible
        if (withReply) {
          replyPort.postMessage({ success: true, action: 'SKIP_WAITING' });
        }
        break;
        
      case 'PRECACHE_ROUTES':
        // Si nous avons un port de réponse, traiter de façon asynchrone
        if (withReply) {
          const routes = event.data.payload || [];
          
          // Utiliser waitUntil pour garder le SW actif pendant le traitement
          event.waitUntil(
            // Prévoir un timeout pour ne pas laisser le message en attente indéfiniment
            Promise.race([
              // Tâche principale
              caches.open(CACHE_NAME)
                .then(cache => {
                  return Promise.all(
                    routes.map(route => 
                      cache.add(route)
                        .catch(error => {
                          console.warn('[Service Worker] Impossible de précharger:', route, error);
                          return null; // Continuer malgré l'erreur
                        })
                    )
                  );
                })
                .then(() => {
                  // Envoyer une réponse de succès
                  replyPort.postMessage({ success: true, routes: routes.length });
                })
                .catch(error => {
                  // Envoyer l'erreur
                  console.error('[Service Worker] Erreur de préchargement:', error);
                  replyPort.postMessage({ 
                    success: false, 
                    error: error.message || 'Erreur inconnue'
                  });
                }),
              
              // Timeout de sécurité (10 secondes)
              new Promise(resolve => {
                setTimeout(() => {
                  replyPort.postMessage({ 
                    success: false, 
                    error: 'Timeout: Opération trop longue'
                  });
                  resolve();
                }, 10000);
              })
            ])
          );
          
          // Indiquer que nous allons répondre de façon asynchrone
          return true;
        } else {
          // Sans port de réponse, traiter de façon synchrone (meilleure compatibilité)
          const routes = event.data.payload || [];
          if (routes.length > 0) {
            // Précharger en tâche de fond sans bloquer
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then(cache => {
                  return Promise.all(
                    routes.map(route => 
                      cache.add(route).catch(() => null)
                    )
                  );
                })
            );
          }
        }
        break;
        
      case 'CLEAR_CACHE':
        // Nettoyer le cache spécifié ou tous les caches
        const cacheName = event.data.cacheName;
        
        event.waitUntil(
          (async () => {
            try {
              if (cacheName) {
                // Nettoyer un cache spécifique
                await caches.delete(cacheName);
                if (withReply) {
                  replyPort.postMessage({ 
                    success: true, 
                    message: `Cache ${cacheName} supprimé` 
                  });
                }
              } else {
                // Nettoyer tous les caches
                const keys = await caches.keys();
                await Promise.all(
                  keys.map(key => caches.delete(key))
                );
                if (withReply) {
                  replyPort.postMessage({ 
                    success: true, 
                    message: 'Tous les caches supprimés' 
                  });
                }
              }
            } catch (error) {
              console.error('[Service Worker] Erreur lors du nettoyage du cache:', error);
              if (withReply) {
                replyPort.postMessage({ 
                  success: false, 
                  error: error.message || 'Erreur inconnue'
                });
              }
            }
          })()
        );
        
        if (withReply) return true;
        break;
        
      default:
        // Message non reconnu
        if (withReply) {
          replyPort.postMessage({ 
            success: false, 
            error: `Type de message non reconnu: ${event.data.type}` 
          });
          return true;
        }
    }
  }
}); 