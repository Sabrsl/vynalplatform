/**
 * Service Worker optimisé pour Vynal Platform
 * Gestion intelligente du cache et des ressources
 */

const CACHE_NAME = 'vynal-cache-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const IMAGE_CACHE = 'images-v1';
const SUPABASE_IMAGE_CACHE = 'supabase-images-v1'; // Cache séparé pour les images Supabase

// Liste des ressources à mettre en cache immédiatement
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/css/performance-optimizations.css',
  '/js/async-interactions.js',
  '/js/performance-utils.js',
  '/js/lcp-optimizer.js'
];

// Pattern pour identifier les images de services Supabase
const SUPABASE_SERVICES_PATTERN = /cybeqoprsggfgippxtvt\.supabase\.co\/storage\/v1\/object\/public\/services\//;

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Mise en cache des ressources statiques
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_RESOURCES);
      }),
      // Préparation du cache pour les images
      caches.open(IMAGE_CACHE),
      // Préparation du cache pour les images Supabase
      caches.open(SUPABASE_IMAGE_CACHE)
    ])
  );
  // Activer immédiatement le nouveau Service Worker
  self.skipWaiting();
});

// Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, SUPABASE_IMAGE_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Prendre le contrôle de toutes les pages immédiatement
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
  
  // Stratégie spécifique pour les images de services Supabase
  if (SUPABASE_SERVICES_PATTERN.test(url.href)) {
    event.respondWith(
      caches.open(SUPABASE_IMAGE_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          // Si l'image est en cache, la retourner immédiatement
          if (response) {
            return response;
          }
          
          // Sinon, faire la requête et mettre en cache avec une longue durée
          return fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              const clonedResponse = networkResponse.clone();
              cache.put(event.request, clonedResponse);
              console.log('[Service Worker] Image Supabase mise en cache:', url.href);
            }
            return networkResponse;
          }).catch(error => {
            console.error('[Service Worker] Erreur de récupération d\'image:', error);
            // Retourner une image de secours en cas d'erreur
            return new Response(
              `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
              { 
                headers: { 'Content-Type': 'image/svg+xml' } 
              }
            );
          });
        });
      })
    );
    return;
  }
  
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