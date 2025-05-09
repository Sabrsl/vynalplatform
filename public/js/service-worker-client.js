/**
 * Utilitaire de communication avec le Service Worker
 * Gère les timeouts et empêche les erreurs de canal fermé
 */

// Méthode principale pour communiquer avec le Service Worker
function serviceWorkerCommunication() {
  // Vérifier si le Service Worker est supporté
  const isServiceWorkerSupported = 'serviceWorker' in navigator;
  
  // Référence au Service Worker actif
  let activeServiceWorker = null;
  
  // État d'enregistrement
  let isRegistered = false;
  
  // Fonction pour initialiser la communication
  async function init() {
    if (!isServiceWorkerSupported) {
      console.warn('[SW Client] Service Worker non supporté par ce navigateur');
      return false;
    }
    
    try {
      // Récupérer ou créer l'enregistrement
      const registration = await navigator.serviceWorker.ready;
      activeServiceWorker = registration.active;
      isRegistered = true;
      
      // Écouter les messages du Service Worker
      setupMessageListener();
      
      return true;
    } catch (error) {
      console.error('[SW Client] Erreur lors de l\'initialisation du Service Worker:', error);
      return false;
    }
  }
  
  // Configurer l'écouteur de messages
  function setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', event => {
      // Traiter les messages reçus
      const data = event.data;
      
      if (data && data.type) {
        switch (data.type) {
          case 'CACHE_UPDATED':
            console.log('[SW Client] Cache mis à jour:', data.url);
            // On pourrait notifier l'utilisateur qu'une nouvelle version est disponible
            break;
            
          case 'NEW_VERSION':
            console.log('[SW Client] Nouvelle version disponible');
            // On pourrait afficher une notification pour rafraîchir
            break;
        }
      }
    });
  }
  
  // Fonction pour envoyer un message au Service Worker avec timeout
  async function postMessage(message, timeout = 5000) {
    if (!isServiceWorkerSupported || !isRegistered) {
      await init();
    }
    
    if (!navigator.serviceWorker.controller) {
      console.warn('[SW Client] Aucun Service Worker actif');
      return { success: false, error: 'Aucun Service Worker actif' };
    }
    
    return new Promise((resolve, reject) => {
      // Créer un canal de message pour la communication bidirectionnelle
      const messageChannel = new MessageChannel();
      
      // Configurer un timeout pour éviter les requêtes bloquées
      const timeoutId = setTimeout(() => {
        messageChannel.port1.close();
        resolve({ 
          success: false, 
          error: 'Timeout: Service Worker n\'a pas répondu dans le délai imparti'
        });
      }, timeout);
      
      // Configurer l'écouteur pour la réponse
      messageChannel.port1.onmessage = (event) => {
        clearTimeout(timeoutId);
        resolve(event.data);
      };
      
      // Gestion des erreurs sur le port
      messageChannel.port1.onmessageerror = (error) => {
        clearTimeout(timeoutId);
        console.error('[SW Client] Erreur de message:', error);
        resolve({ success: false, error: 'Erreur de communication' });
      };
      
      // Envoyer le message avec le port de réponse
      try {
        navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('[SW Client] Erreur lors de l\'envoi du message:', error);
        resolve({ success: false, error: error.message || 'Erreur d\'envoi' });
      }
    });
  }
  
  // Précharger des routes
  async function precacheRoutes(routes) {
    if (!Array.isArray(routes) || routes.length === 0) {
      return { success: false, error: 'Liste de routes invalide' };
    }
    
    return await postMessage({
      type: 'PRECACHE_ROUTES',
      payload: routes
    }, 10000); // 10 secondes de timeout pour cette opération plus longue
  }
  
  // Nettoyer le cache
  async function clearCache(cacheName = null) {
    return await postMessage({
      type: 'CLEAR_CACHE',
      cacheName: cacheName
    });
  }
  
  // Forcer l'activation du Service Worker
  async function skipWaiting() {
    return await postMessage({
      type: 'SKIP_WAITING'
    });
  }
  
  // Fonction de vérification si le Service Worker est actif
  function isControllerActive() {
    return !!navigator.serviceWorker.controller;
  }
  
  // API publique
  return {
    init,
    postMessage,
    precacheRoutes,
    clearCache,
    skipWaiting,
    isControllerActive
  };
}

// Créer l'instance et exposer l'API
const SWClient = serviceWorkerCommunication();

// Initialiser automatiquement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SWClient.init());
} else {
  SWClient.init();
}

// Exposer l'API globalement (optionnel, pour le débogage)
window.SWClient = SWClient; 