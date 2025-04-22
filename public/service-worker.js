// Service Worker pour Vynal Platform
const CACHE_NAME = 'vynal-app-cache-v1';

// Ressources à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png',
  // Ajoutez d'autres ressources statiques importantes ici
];

// Installation: mettre en cache les ressources statiques
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Mise en cache des ressources statiques');
        return cache.addAll(STATIC_ASSETS);
      })
  );
  
  // Activer immédiatement sans attendre la fermeture des onglets
  self.skipWaiting();
});

// Activation: nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('Service Worker: Suppression de l\'ancien cache', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Prendre le contrôle de tous les clients non contrôlés
  event.waitUntil(self.clients.claim());
});

// Stratégie de cache: Network First pour les API, Cache First pour les assets
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non GET
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Ignorer les requêtes de chrome-extension ou autres protocoles non-http(s)
  if (!url.protocol.startsWith('http')) return;
  
  // Stratégie différente selon le type de requête
  // 1. API requests (Network First)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(event.request));
  } 
  // 2. Static assets (Cache First)
  else if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|webp|woff2?)$/) ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(cacheFirstStrategy(event.request));
  } 
  // 3. HTML navigations (Network First with timeout fallback)
  else if (
    event.request.mode === 'navigate' ||
    event.request.headers.get('accept')?.includes('text/html')
  ) {
    event.respondWith(networkFirstWithTimeoutStrategy(event.request, 3000));
  }
  // 4. Autres requêtes (Network First simple)
  else {
    event.respondWith(networkFirstStrategy(event.request));
  }
});

// Stratégie Cache First: essayer d'abord le cache, puis le réseau
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Mettre en cache une copie de la réponse si elle est valide
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Si le réseau échoue et que nous n'avons pas de cache, 
    // essayer de retourner une page d'erreur offline pour les requêtes HTML
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Stratégie Network First: essayer d'abord le réseau, puis le cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Mettre en cache une copie de la réponse si elle est valide
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Si le réseau échoue, essayer le cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si le réseau échoue et que nous n'avons pas de cache, 
    // essayer de retourner une page d'erreur offline pour les requêtes HTML
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Stratégie Network First avec timeout: essayer le réseau avec un délai maximum
async function networkFirstWithTimeoutStrategy(request, timeoutMs) {
  const timeoutPromise = new Promise(resolve => {
    setTimeout(() => {
      resolve('TIMEOUT');
    }, timeoutMs);
  });
  
  try {
    // Course entre le timeout et la requête réseau
    const result = await Promise.race([
      fetch(request.clone()),
      timeoutPromise
    ]);
    
    // Si c'est un timeout, utiliser le cache
    if (result === 'TIMEOUT') {
      console.log('Service Worker: Timeout pour', request.url);
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        // Essayer quand même de mettre à jour le cache en arrière-plan
        fetchAndUpdateCache(request);
        return cachedResponse;
      }
    } else {
      // C'est une réponse réseau
      const networkResponse = result;
      
      // Mettre en cache une copie de la réponse
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    }
  } catch (error) {
    // Si le réseau échoue, essayer le cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Retourner la page offline en dernier recours
    return caches.match('/offline.html');
  }
}

// Mettre à jour le cache en arrière-plan sans attendre
function fetchAndUpdateCache(request) {
  fetch(request.clone())
    .then(response => {
      if (response.ok) {
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(request, response);
          });
      }
    })
    .catch(error => {
      console.error('Service Worker: Erreur de mise à jour en arrière-plan', error);
    });
}

// Gestion des messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRECACHE_ROUTES') {
    const routes = event.data.payload || [];
    
    if (routes.length > 0) {
      console.log('Service Worker: Préchargement des routes:', routes);
      
      caches.open(CACHE_NAME)
        .then(cache => {
          return Promise.all(
            routes.map(route => 
              cache.add(route)
                .catch(error => {
                  console.warn('Service Worker: Impossible de précharger:', route, error);
                })
            )
          );
        });
    }
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 