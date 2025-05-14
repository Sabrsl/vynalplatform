/**
 * Utilitaire pour mettre à jour uniformément la devise dans toute l'application
 * Utilisé par les tableaux de bord client et freelance pour mettre à jour les prix en temps réel
 */

import { toast } from "sonner";

/**
 * Constante pour l'événement de changement de devise
 */
export const CURRENCY_CHANGE_EVENT = 'vynal_currency_changed';

interface CurrencyChangeDetail {
  currencyCode: string;
  timestamp: number;
}

// Définir la propriété globale __currencyUpdateInProgress pour TypeScript
declare global {
  interface Window {
    __currencyUpdateInProgress?: boolean;
  }
}

/**
 * Détecte la devise appropriée en fonction des données fournies
 * Suit la logique: 
 * 1. Détection automatique par pays (préférée)
 * 2. Préférence utilisateur si définie
 * 3. Devise par défaut (XOF)
 */
export function detectCurrency(countryCode: string | null, userPreference?: string): string {
  // Carte de correspondance pays -> devise
  const currencyMap: Record<string, string> = {
    'MA': 'MAD', // Maroc
    'FR': 'EUR', // France
    'US': 'USD', // États-Unis
    'SN': 'XOF', // Sénégal
    'CI': 'XOF', // Côte d'Ivoire
    'BF': 'XOF', // Burkina Faso
    'ML': 'XOF', // Mali
    'NE': 'XOF', // Niger
    'TG': 'XOF', // Togo
    'BJ': 'XOF', // Bénin
    'GW': 'XOF', // Guinée-Bissau
    'GB': 'GBP', // Royaume-Uni
    'DE': 'EUR', // Allemagne
    'ES': 'EUR', // Espagne
    'IT': 'EUR', // Italie
    'CM': 'XAF', // Cameroun
    'GA': 'XAF', // Gabon
    'CG': 'XAF', // Congo
    'TD': 'XAF', // Tchad
    'CF': 'XAF', // République centrafricaine
    'GQ': 'XAF', // Guinée équatoriale
    // ... autres pays à ajouter selon les besoins
  };

  // 1. Détection automatique par pays
  if (countryCode && currencyMap[countryCode]) {
    console.log(`Devise détectée par localisation: ${currencyMap[countryCode]} (${countryCode})`);
    return currencyMap[countryCode];
  }

  // 2. Préférence utilisateur si définie
  if (userPreference) {
    console.log(`Devise définie par l'utilisateur: ${userPreference}`);
    return userPreference;
  }

  // 3. Devise par défaut (XOF - Franc CFA)
  console.log("Aucune devise détectée, utilisation de la devise par défaut: XOF");
  return "XOF";
}

/**
 * Vérifie si la devise est adaptée au paiement selon le pays
 * @returns Un objet avec une indication si la devise est adaptée au paiement et la devise recommandée
 */
export function validatePaymentCurrency(userCurrency: string, countryCode: string | null): { isValid: boolean; recommendedCurrency: string; message?: string } {
  // Si pas de détection de pays, on accepte la devise de l'utilisateur
  if (!countryCode) {
    return { isValid: true, recommendedCurrency: userCurrency };
  }

  // Devise détectée pour le pays
  const geoCurrency = detectCurrency(countryCode, undefined);
  
  // Si la devise de l'utilisateur est la même que celle de son pays, c'est valide
  if (userCurrency === geoCurrency) {
    return { isValid: true, recommendedCurrency: userCurrency };
  }
  
  // Devise différente -> paiement forcé en devise locale
  return { 
    isValid: false, 
    recommendedCurrency: geoCurrency,
    message: `Pour des raisons de conformité bancaire, le paiement sera traité en ${geoCurrency}, la devise locale pour votre région.`
  };
}

/**
 * Déclencher un événement de changement de devise pour informer tous les composants
 * Cela permet de mettre à jour les prix dans toute l'application
 */
export function triggerCurrencyChangeEvent(currencyCode: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    console.log(`Déclenchement de l'événement de changement de devise: ${CURRENCY_CHANGE_EVENT}`, currencyCode);
    
    // Créer un événement personnalisé avec les détails de la devise
    const event = new CustomEvent(CURRENCY_CHANGE_EVENT, { 
      detail: { 
        currencyCode,
        timestamp: Date.now()
      },
      // Permettre à l'événement de traverser la barrière des iframes et des onglets
      bubbles: true,
      cancelable: false,
      composed: true
    });
    
    // Déclencher l'événement au niveau window pour une propagation maximale
    window.dispatchEvent(event);
    
    // Stocker localement le code de devise pour les pages qui se chargent plus tard
    localStorage.setItem('vynal_current_currency', currencyCode);
    localStorage.setItem('vynal_currency_last_update', Date.now().toString());
    
    // Rafraîchir tous les composants qui affichent des prix
    refreshPriceComponents();
    
    // Notification optionnelle
    console.log(`La devise a été changée pour: ${currencyCode}`);
  } catch (error) {
    console.error("Erreur lors du déclenchement de l'événement de changement de devise:", error);
  }
}

/**
 * Invalide le cache local de la devise pour forcer la détection à la prochaine utilisation
 */
export function clearCurrencyCache() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vynal_currency_preference');
    localStorage.removeItem('vynal_currency_timestamp');
    console.log('Cache de devise invalidé');
    
    // Déclencher un événement pour informer les composants du changement
    triggerCurrencyChangeEvent('invalidated');
  }
}

/**
 * Rafraîchir tous les composants qui affichent des prix
 * Cette fonction recherche tous les éléments avec l'attribut data-currency-component
 * et déclenche une mise à jour
 */
export function refreshPriceComponents(): void {
  if (typeof window === 'undefined') return;
  
  try {
    console.log("Rafraîchissement des composants de prix...");
    
    // Identifier tous les composants de devise qui doivent être mis à jour
    const priceComponents = document.querySelectorAll('[data-currency-component]');
    const amountDisplays = document.querySelectorAll('[data-price-amount]');
    const currencyDisplays = document.querySelectorAll('.currency-display');
    const formattedPrices = document.querySelectorAll('[data-formatted-price]');
    
    console.log(`Composants trouvés: ${priceComponents.length} price-components, ${amountDisplays.length} amount-displays, ${currencyDisplays.length} currency-displays, ${formattedPrices.length} formatted-prices`);
    
    // 1. Pour les composants React avec l'attribut data-currency-component
    // Leur envoi un événement pour déclencher une mise à jour
    priceComponents.forEach(component => {
      const event = new CustomEvent('currency-update', {
        detail: { timestamp: Date.now() },
        bubbles: true
      });
      component.dispatchEvent(event);
    });
    
    // 2. Pour les éléments qui affichent directement un montant
    // (utilisé pour les affichages non-React)
    amountDisplays.forEach(element => {
      // Déclencher une actualisation en modifiant temporairement une classe CSS
      element.classList.add('currency-refreshing');
      setTimeout(() => {
        element.classList.remove('currency-refreshing');
      }, 50);
    });
    
    // 3. Pour les composants CurrencyDisplay spécifiques
    currencyDisplays.forEach(display => {
      display.classList.add('currency-update-pending');
      setTimeout(() => {
        display.classList.remove('currency-update-pending');
      }, 50);
      
      // Déclencher un événement de mise à jour spécifique
      const updateEvent = new CustomEvent('currency-update', {
        detail: { timestamp: Date.now() },
        bubbles: true
      });
      display.dispatchEvent(updateEvent);
    });
    
    // 4. Pour les éléments utilisant formatPrice directement
    formattedPrices.forEach(element => {
      // Récupérer le montant original en XOF
      const originalAmount = element.getAttribute('data-original-amount');
      if (originalAmount) {
        try {
          // Charger la devise actuelle
          const currencyCode = localStorage.getItem('vynal_current_currency') || 'XOF';
          
          // Essayer de recharger la page ou d'actualiser l'affichage
          element.classList.add('price-refreshing');
          
          // On peut définir un attribut pour indiquer qu'une mise à jour est nécessaire
          // Cela sera utilisé par les observateurs qui peuvent recharger le contenu
          element.setAttribute('data-needs-refresh', 'true');
          
          setTimeout(() => {
            element.classList.remove('price-refreshing');
          }, 100);
        } catch (err) {
          console.error("Erreur lors de la mise à jour d'un prix formaté:", err);
        }
      }
    });
    
    // 5. Forcer un rafraîchissement des données dans les pages qui ont besoin de mettre à jour leurs prix
    // Pages qui doivent être rafraîchies en cas de changement de devise
    const pagesToRefresh = [
      '/client-dashboard',
      '/dashboard',
      '/services',
      '/orders',
      '/payment',
      '/checkout'
    ];
    
    // Vérifier si la page actuelle correspond à l'une des pages à rafraîchir
    const shouldRefreshPage = pagesToRefresh.some(page => 
      window.location.pathname.includes(page)
    );
    
    if (shouldRefreshPage) {
      // Déclencher un événement pour les hooks personnalisés qui chargent des données avec des prix
      const refreshEvent = new CustomEvent('force-data-refresh', {
        detail: { source: 'currency-change', timestamp: Date.now() },
        bubbles: true
      });
      window.dispatchEvent(refreshEvent);
      
      // Déclencher un événement spécifique pour les tableaux de bord
      const dashboardRefreshEvent = new CustomEvent('force-dashboard-refresh', {
        detail: { source: 'currency-change', timestamp: Date.now() },
        bubbles: true
      });
      window.dispatchEvent(dashboardRefreshEvent);
      
      console.log("Événements de rafraîchissement forcé des données déclenchés");
    }
    
    console.log("Rafraîchissement des composants de prix terminé");
  } catch (error) {
    console.error("Erreur lors du rafraîchissement des composants de prix:", error);
  }
}

/**
 * Enregistre un écouteur d'événements pour les changements de devise
 * @param callback Fonction à appeler lors d'un changement de devise
 * @returns Fonction pour nettoyer l'écouteur
 */
export function listenToCurrencyChanges(callback: (detail: CurrencyChangeDetail) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<CurrencyChangeDetail>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };
  
  window.addEventListener(CURRENCY_CHANGE_EVENT, handler);
  
  return () => {
    window.removeEventListener(CURRENCY_CHANGE_EVENT, handler);
  };
}

/**
 * Met à jour la devise globalement et rafraîchit tous les composants affichant des prix
 * @param currencyCode Code de la devise à utiliser
 */
export async function updateGlobalCurrency(currencyCode: string): Promise<void> {
  try {
    // Invalider le cache de devise actuel
    clearCurrencyCache();
    
    // Déclencher un événement personnalisé avec le nouveau code de devise
    const event = new CustomEvent(CURRENCY_CHANGE_EVENT, { 
      detail: { currencyCode, timestamp: Date.now() } 
    });
    window.dispatchEvent(event);
    
    // Rafraîchir les composants affichant des prix
    refreshPriceComponents();
    
    // Afficher un toast de confirmation
    toast.success(`Devise mise à jour dans tout le tableau de bord (${currencyCode})`, {
      duration: 3000,
    });
    
  } catch (error) {
    console.error("Erreur lors de la mise à jour globale de la devise:", error);
    toast.error("Erreur lors de la mise à jour de la devise", {
      duration: 3000,
    });
  }
}

/**
 * Hook personnalisé pour réagir aux changements de devise dans n'importe quel composant
 * @param callback Fonction à appeler lors d'un changement de devise
 */
export function setupCurrencyChangeHandler(callback: () => void): void {
  if (typeof window !== 'undefined') {
    const cleanup = listenToCurrencyChanges(() => {
      // Exécuter le callback
      callback();
      
      // Nettoyer lorsque le composant est démonté
      return cleanup;
    });
  }
}

/**
 * Vérifie et met à jour les taux de change si nécessaire
 * Version ULTRA optimisée pour réduire les requêtes au serveur
 * N'effectue une mise à jour que lorsque c'est absolument nécessaire
 */
export function validateAndUpdateCurrency(forceRefresh = false): Promise<boolean> {
  return new Promise(async (resolve) => {
    try {
      // Vérifier si une mise à jour est déjà en cours
      if (typeof window !== 'undefined' && window.__currencyUpdateInProgress) {
        console.log("Mise à jour des taux de change déjà en cours, pas de requête supplémentaire");
        resolve(false);
        return;
      }
      
      // Vérifier si une mise à jour est vraiment nécessaire
      const lastUpdate = localStorage.getItem('vynal_currency_last_update');
      const now = Date.now();
      
      // Mise à jour nécessaire seulement si:
      // 1. Refresh forcé OU
      // 2. Pas de mise à jour précédente OU
      // 3. La dernière mise à jour date de plus d'un jour (au lieu de 15 minutes)
      const needsUpdate = forceRefresh || 
                       !lastUpdate || 
                       (now - parseInt(lastUpdate)) > 24 * 60 * 60 * 1000; // 24 heures
      
      if (!needsUpdate) {
        console.log("Les taux de change sont récents, pas de mise à jour nécessaire");
        resolve(false);
        return;
      }
      
      // Marquer qu'une mise à jour est en cours
      if (typeof window !== 'undefined') {
        window.__currencyUpdateInProgress = true;
      }
      
      console.log("Mise à jour des taux de change...");
      
      // Récupérer le code de devise actuel
      const currentCurrency = localStorage.getItem('vynal_current_currency') || 'XOF';
      
      // Timeout plus court pour éviter les attentes trop longues
      const timeoutId = setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.__currencyUpdateInProgress = false;
        }
        console.warn("Timeout lors de la mise à jour des taux de change");
        resolve(false);
      }, 5000); // Réduit à 5 secondes
      
      try {
        // Vérifier si le cache des devises existe et est récent (validité étendue à 7 jours)
        const cachedCurrencies = localStorage.getItem('vynal_currencies_cache');
        const cacheTimestamp = localStorage.getItem('vynal_currencies_cache_timestamp');
        const cacheIsValid = cacheTimestamp && (now - parseInt(cacheTimestamp) < 7 * 24 * 60 * 60 * 1000);
        
        let currencies;
        if (cachedCurrencies && cacheIsValid && !forceRefresh) {
          // Utiliser le cache si valide
          currencies = JSON.parse(cachedCurrencies);
          console.log("Utilisation du cache des devises (validité 7 jours)");
        } else {
          // Mettre en place un système de vérification pour ne pas faire cette requête plus d'une fois par session
          const sessionCacheKey = 'currencies_fetched_this_session';
          const alreadyFetchedThisSession = sessionStorage.getItem(sessionCacheKey);
          
          if (alreadyFetchedThisSession && !forceRefresh) {
            console.log("Devises déjà récupérées dans cette session, utilisation du cache existant");
            
            if (cachedCurrencies) {
              currencies = JSON.parse(cachedCurrencies);
            } else {
              // Si vraiment aucun cache n'existe, faire la requête mais une seule fois
              const response = await fetch('/data/currencies.json');
              if (!response.ok) throw new Error("Impossible de charger les taux de change");
              
              currencies = await response.json();
              
              // Mettre en cache pour les prochaines requêtes
              localStorage.setItem('vynal_currencies_cache', JSON.stringify(currencies));
              localStorage.setItem('vynal_currencies_cache_timestamp', now.toString());
              sessionStorage.setItem(sessionCacheKey, 'true');
            }
          } else {
            // Requête réelle (une seule fois par session)
            const response = await fetch('/data/currencies.json');
            if (!response.ok) throw new Error("Impossible de charger les taux de change");
            
            currencies = await response.json();
            
            // Mettre en cache pour les prochaines requêtes
            localStorage.setItem('vynal_currencies_cache', JSON.stringify(currencies));
            localStorage.setItem('vynal_currencies_cache_timestamp', now.toString());
            sessionStorage.setItem(sessionCacheKey, 'true');
            console.log("Mise à jour du cache des devises (première requête de la session)");
          }
        }
        
        // Annuler le timeout car la requête a réussi
        clearTimeout(timeoutId);
        
        // Trouver la devise actuelle dans la liste
        const currencyInfo = currencies.find((c: any) => c.code === currentCurrency);
        
        if (currencyInfo) {
          // Mettre à jour le localStorage
          localStorage.setItem('vynal_currency_rate', currencyInfo.rate_to_xof.toString());
          localStorage.setItem('vynal_currency_last_update', now.toString());
          
          // Déclencher l'événement de mise à jour UNIQUEMENT si la devise a changé
          const previousRate = localStorage.getItem('vynal_currency_previous_rate');
          if (!previousRate || previousRate !== currencyInfo.rate_to_xof.toString()) {
            // Si le taux a changé de plus de 1%, déclencher une notification
            if (previousRate) {
              const oldRate = parseFloat(previousRate);
              const newRate = currencyInfo.rate_to_xof;
              const percentChange = Math.abs((newRate - oldRate) / oldRate * 100);
              
              if (percentChange > 1) {
                console.log(`Taux de change modifié de ${percentChange.toFixed(2)}%, notification aux composants`);
                triggerCurrencyChangeEvent(currentCurrency);
              } else {
                console.log(`Variation du taux négligeable (${percentChange.toFixed(2)}%), pas de notification`);
              }
            } else {
              // Premier chargement, notification
              triggerCurrencyChangeEvent(currentCurrency);
            }
            
            localStorage.setItem('vynal_currency_previous_rate', currencyInfo.rate_to_xof.toString());
          } else {
            console.log("Le taux n'a pas changé, pas de notification aux composants");
          }
          
          console.log("Taux de change mis à jour avec succès:", currencyInfo);
          
          // Marquer que la mise à jour est terminée
          if (typeof window !== 'undefined') {
            window.__currencyUpdateInProgress = false;
          }
          
          resolve(true);
        } else {
          console.error("Devise non trouvée dans les données:", currentCurrency);
          
          // Marquer que la mise à jour est terminée
          if (typeof window !== 'undefined') {
            window.__currencyUpdateInProgress = false;
          }
          
          resolve(false);
        }
      } catch (error) {
        // Annuler le timeout en cas d'erreur
        clearTimeout(timeoutId);
        
        // Marquer que la mise à jour est terminée
        if (typeof window !== 'undefined') {
          window.__currencyUpdateInProgress = false;
        }
        
        throw error;
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des taux de change:", error);
      
      // Marquer que la mise à jour est terminée
      if (typeof window !== 'undefined') {
        window.__currencyUpdateInProgress = false;
      }
      
      resolve(false);
    }
  });
} 