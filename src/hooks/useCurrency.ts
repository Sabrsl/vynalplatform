import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CURRENCY, COUNTRY_TO_CURRENCY, getCurrencyFromCountry } from '@/lib/constants/currency';
import { supabase } from '@/lib/supabase/client';
import { NextApiRequest } from 'next';
import { detectCurrency, validateAndUpdateCurrency } from '@/lib/utils/currency-updater';
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache,
  CACHE_EXPIRY
} from '@/lib/optimizations/cache';

// Constantes pour le cache
const CURRENCY_CACHE_KEY = 'user_currency';
const CURRENCY_PROFILES_CACHE_KEY = 'currency_profile_';
const CURRENCY_FETCH_INTERVAL = 30 * 60 * 1000; // 30 minutes

/**
 * Interface pour les données de devise
 */
interface CurrencyData {
  code: string;
  name: string;
  symbol: string;
  rate_to_xof: number;
  decimals: number;
  rate_fixed?: boolean;
}

/**
 * Interface pour les données de géolocalisation
 */
interface GeoData {
  country: string;
  continent?: string;
  currency?: string;
  source?: string;
  ip?: string;
}

/**
 * Fonction pour obtenir les données de géolocalisation depuis l'API
 * Mise en cache pour éviter les appels répétés
 */
const getUserGeoData = async (): Promise<GeoData> => {
  try {
    // Vérifier si les données de géolocalisation sont en cache
    const cachedGeoData = getCachedData<GeoData>('user_geo_location', {
      storage: 'both',
      priority: 'high'
    });
    
    if (cachedGeoData) {
      console.log("Utilisation des données de géolocalisation en cache");
      return cachedGeoData;
    }
    
    // Récupérer la session utilisateur
    const { data: authData } = await supabase.auth.getSession();
    
    // Appeler notre API de géolocalisation qui extrait les données Supabase
    const response = await fetch('/api/geo-location');
    const data = await response.json();

    // Si l'utilisateur est connecté, enregistrer sa localisation
    if (authData.session?.user?.id && data.country) {
      // Vérifier si une mise à jour du profil est vraiment nécessaire
      const lastUpdateKey = `last_geo_update_${authData.session.user.id}`;
      const lastUpdate = localStorage.getItem(lastUpdateKey);
      const now = Date.now();
      
      // Mettre à jour les informations de géolocalisation au maximum une fois par jour
      if (!lastUpdate || (now - parseInt(lastUpdate)) > 24 * 60 * 60 * 1000) {
      await supabase
        .from('profiles')
        .update({ 
          country: data.country,
          continent: data.continent || 'AF',
          last_geo_detection: new Date().toISOString()
        })
        .eq('id', authData.session.user.id);
          
        localStorage.setItem(lastUpdateKey, now.toString());
      }
    }
    
    const geoData = { 
      country: data.country || 'SN',
      continent: data.continent || 'AF',
      currency: data.currency || null,
      source: data.source || 'geo_api'
    };
    
    // Mettre en cache pour les prochains appels
    setCachedData('user_geo_location', geoData, {
      expiry: 24 * 60 * 60 * 1000, // 24 heures
      storage: 'both',
      priority: 'high'
    });
    
    return geoData;
  } catch (error) {
    console.error("Erreur de géolocalisation:", error);
    return { country: 'SN', source: 'default' }; // Valeur par défaut
  }
};

// Devise par défaut quand aucune autre n'est disponible
const DEFAULT_CURRENCY: CurrencyData = {
  code: 'XOF',
  name: 'Franc CFA UEMOA',
  symbol: '₣',
  rate_to_xof: 1,
  decimals: 0,
  rate_fixed: false
};

/**
 * Fonction pour obtenir les détails d'une devise à partir de son code
 */
const getCurrencyDetails = (currencyCode: string): CurrencyData => {
  // Vérifier d'abord dans nos constantes
  const info = CURRENCY.info[currencyCode as keyof typeof CURRENCY.info];
  const rate = CURRENCY.rates[currencyCode as keyof typeof CURRENCY.rates];
  
  if (info && rate !== undefined) {
    // Les taux fixes sont: EUR, XAF (par rapport au XOF)
    const isFixedRate = ['EUR', 'XAF'].includes(currencyCode);
    
    return {
      code: currencyCode,
      name: info.name,
      symbol: info.symbol,
      rate_to_xof: rate,
      decimals: info.decimals,
      rate_fixed: isFixedRate
    };
  }
  
  // Si la devise n'est pas dans nos constantes, chercher dans le fichier currencies.json
  // Nous devons retourner la devise par défaut car la fonction synchrone ne peut pas attendre le résultat asynchrone
  console.log(`Devise ${currencyCode} non trouvée dans les constantes, sera chargée depuis currencies.json`);
  return DEFAULT_CURRENCY;
};

/**
 * Récupérer les détails d'une devise depuis le fichier JSON avec mise en cache
 */
const fetchCurrencyFromJson = async (currencyCode: string): Promise<CurrencyData> => {
  try {
    // Vérifier si les détails de la devise sont déjà en cache
    const cacheKey = `currency_details_${currencyCode}`;
    const cachedCurrency = getCachedData<CurrencyData>(cacheKey, {
      storage: 'both',
      priority: 'high'
    });
    
    if (cachedCurrency) {
      console.log(`Utilisation des détails de devise en cache pour ${currencyCode}`);
      return cachedCurrency;
    }
    
    const response = await fetch('/data/currencies.json');
    const currencies: CurrencyData[] = await response.json();
    
    const currency = currencies.find(c => c.code === currencyCode);
    
    if (currency) {
      // Mettre en cache pour les prochains appels
      setCachedData(cacheKey, currency, {
        expiry: 24 * 60 * 60 * 1000, // 24 heures
        storage: 'both',
        priority: 'high'
      });
      
      return currency;
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails de la devise ${currencyCode}:`, error);
  }
  
  // Devise non trouvée, utiliser XOF par défaut
  return DEFAULT_CURRENCY;
};

/**
 * Options pour le hook useCurrency
 */
interface UseCurrencyOptions {
  /**
   * Désactiver la détection automatique et forcer une devise
   */
  forceCurrency?: string;
  
  /**
   * Désactiver le cache local storage
   */
  disableCache?: boolean;
}

/**
 * Résultat du hook useCurrency
 */
interface UseCurrencyResult {
  loading: boolean;
  currency: CurrencyData;
  formatAmount: (amount: number) => string;
  convertToLocalCurrency: (amountInXOF: number) => number;
  convertToXOF: (amountInLocalCurrency: number) => number;
  convertAmount: (amountInXOF: number) => number;
  getUserCountry: () => string | null;
  updateUserCurrencyPreference: (currencyCode: string) => Promise<void>;
}

/**
 * Clé pour le stockage local de la devise
 */
const CURRENCY_STORAGE_KEY = 'vynal_currency_preference';

// Variables pour la gestion des requêtes de mise à jour
const pendingCurrencyUpdates = new Map<string, number>();

/**
 * Hook useCurrency pour gérer les conversions de devises
 * 
 * @param options Options du hook
 * @returns Informations sur la devise et fonctions de conversion
 */
export default function useCurrency(options: UseCurrencyOptions = {}): UseCurrencyResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [currency, setCurrency] = useState<CurrencyData>(DEFAULT_CURRENCY);
  
  // Utiliser une référence pour suivre si une requête est déjà en cours
  const pendingRequestRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);
  const initialized = useRef<boolean>(false);

  /**
   * Fonction pour mettre à jour la préférence de devise de l'utilisateur
   * avec optimisation MAXIMALE pour réduire les appels API
   */
  const updateUserCurrencyPreference = useCallback(async (currencyCode: string) => {
    try {
      setLoading(true);
      
      // Vérifier si la devise a réellement changé
      if (currency.code === currencyCode) {
        console.log(`La devise ${currencyCode} est déjà active, pas de mise à jour nécessaire`);
        setLoading(false);
        return;
      }
      
      // Récupérer les détails de la devise, d'abord dans les constantes
      let currencyDetails = getCurrencyDetails(currencyCode);
      
      // Si la devise n'était pas dans les constantes (devise par défaut), chercher dans le fichier JSON
      if (currencyDetails.code === 'XOF' && currencyCode !== 'XOF') {
        currencyDetails = await fetchCurrencyFromJson(currencyCode);
      }
      
      // Mettre à jour le state local
      setCurrency(currencyDetails);
      
      // Enregistrer la préférence dans le localStorage
      if (typeof window !== 'undefined' && !options.disableCache) {
        localStorage.setItem(CURRENCY_STORAGE_KEY, currencyCode);
      }
      
      // Mettre en cache globalement avec cache INFINI (pas d'expiration)
      setCachedData(CURRENCY_CACHE_KEY, currencyDetails, {
        expiry: 365 * 24 * 60 * 60 * 1000, // 1 an (pratiquement infini)
        storage: 'both',
        priority: 'high'
      });
      
      // Si l'utilisateur est connecté, mise à jour BD seulement si c'est un changement explicite
      const { data: authData } = await supabase.auth.getSession();
      if (authData.session?.user?.id) {
        const userId = authData.session.user.id;
        
        // Enregistrer dans le localStorage pour éviter des mises à jour futures inutiles
        const userCurrencyKey = `user_currency_preference_${userId}`;
        localStorage.setItem(userCurrencyKey, currencyCode);
        
        // Mise à jour en base de données (seulement si c'est un changement explicite)
        console.log(`Mise à jour de la devise en base de données pour l'utilisateur ${userId}: ${currencyCode}`);
        await supabase
          .from('profiles')
          .update({ 
            currency_preference: currencyCode,
            is_currency_manually_set: true,
            last_currency_rates_update: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        // Mettre en cache les préférences pour cet utilisateur (cache INFINI)
        setCachedData(`${CURRENCY_PROFILES_CACHE_KEY}${userId}`, {
          currency_preference: currencyCode,
          is_currency_manually_set: true,
          last_update: new Date().toISOString()
        }, {
          expiry: 365 * 24 * 60 * 60 * 1000, // 1 an (pratiquement infini)
          storage: 'both',
          priority: 'high'
        });
        
        // Déclencher l'événement de changement de devise
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('vynal_currency_changed', {
            detail: { currencyCode, timestamp: Date.now() },
            bubbles: true
          });
          window.dispatchEvent(event);
        }
        
        console.log(`Préférence de devise mise à jour: ${currencyCode}`);
      }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la préférence de devise:`, error);
    } finally {
      setLoading(false);
    }
  }, [currency.code, options.disableCache]);

  // Détection et configuration de la devise
  useEffect(() => {
    // Éviter les exécutions multiples
    if (initialized.current) return;
    initialized.current = true;
    
    const detectAndSetCurrency = async () => {
      setLoading(true);
      
      try {
        // Vérifier d'abord le cache global - OPTIMISÉ : cache sans expiration
        const cachedCurrency = getCachedData<CurrencyData>(CURRENCY_CACHE_KEY, {
          storage: 'both',
          priority: 'high'
        });
        
        if (cachedCurrency) {
          console.log(`Utilisation de la devise en cache: ${cachedCurrency.code}`);
          setCurrency(cachedCurrency);
          setLoading(false);
          
          // Validation en arrière-plan uniquement si forceRefresh ou à intervalles très longs (une fois par session)
          // au lieu d'une validation systématique
          const lastValidation = localStorage.getItem('vynal_currency_last_validation');
          const now = Date.now();
          if (!lastValidation || (now - parseInt(lastValidation)) > 24 * 60 * 60 * 1000) { // Une fois par jour max
            validateAndUpdateCurrency(false).then(() => {
              localStorage.setItem('vynal_currency_last_validation', now.toString());
              console.log("Validation des taux de change effectuée en arrière-plan");
            });
          }
          
          return;
        }
        
        // Si une devise est forcée via les options, l'utiliser
        if (options.forceCurrency) {
          // Récupérer les détails de la devise, d'abord dans les constantes
          let currencyDetails = getCurrencyDetails(options.forceCurrency);
          
          // Si la devise n'était pas dans les constantes (devise par défaut), chercher dans le fichier JSON
          if (currencyDetails.code === 'XOF' && options.forceCurrency !== 'XOF') {
            currencyDetails = await fetchCurrencyFromJson(options.forceCurrency);
          }
          
          setCurrency(currencyDetails);
          setLoading(false);
          return;
        }
        
        // Vérifier si une requête est déjà en cours
        if (pendingRequestRef.current) {
          console.log("Une requête de devise est déjà en cours, en attente...");
          return;
        }
        
        // Vérifier si la dernière requête est assez récente pour être réutilisée
        const now = Date.now();
        if (now - lastFetchTimeRef.current < CURRENCY_FETCH_INTERVAL) {
          console.log("Dernière requête de devise assez récente, pas besoin de refaire une demande");
          setLoading(false);
          return;
        }
        
        // Marquer qu'une requête est en cours
        pendingRequestRef.current = true;
        
        // Récupérer la session pour vérifier si l'utilisateur est connecté
        const { data: authData } = await supabase.auth.getSession();
        
        // Vérifier si l'utilisateur est connecté et a une préférence de devise enregistrée
        if (authData.session?.user?.id) {
          const userId = authData.session.user.id;
          
          // Optimisation maximale: D'abord vérifier le stockage local pour éviter les requêtes BD
          const userCurrencyKey = `user_currency_preference_${userId}`;
          const storedUserCurrency = localStorage.getItem(userCurrencyKey);
          
          if (storedUserCurrency) {
            console.log(`Utilisation de la devise de l'utilisateur depuis le localStorage: ${storedUserCurrency}`);
            
            // Récupérer les détails de la devise
            let currencyDetails = getCurrencyDetails(storedUserCurrency);
            
            // Si la devise n'était pas dans les constantes, chercher dans le fichier JSON
            if (currencyDetails.code === 'XOF' && storedUserCurrency !== 'XOF') {
              currencyDetails = await fetchCurrencyFromJson(storedUserCurrency);
            }
            
            setCurrency(currencyDetails);
            
            // Mettre en cache global avec durée de vie pratiquement infinie
            setCachedData(CURRENCY_CACHE_KEY, currencyDetails, {
              expiry: 365 * 24 * 60 * 60 * 1000, // 1 an (pratiquement infini)
              storage: 'both',
              priority: 'high'
            });
            
            // Enregistrer dans le localStorage
            if (typeof window !== 'undefined' && !options.disableCache) {
              localStorage.setItem(CURRENCY_STORAGE_KEY, storedUserCurrency);
            }
            
            setLoading(false);
            pendingRequestRef.current = false;
            lastFetchTimeRef.current = now;
            return;
          }
          
          // Vérifier d'abord le cache des préférences utilisateur
          const cacheKey = `${CURRENCY_PROFILES_CACHE_KEY}${userId}`;
          const cachedUserPrefs = getCachedData<any>(cacheKey, {
            storage: 'both',
            priority: 'high'
          });
          
          if (cachedUserPrefs && cachedUserPrefs.currency_preference) {
            console.log(`Utilisation des préférences utilisateur en cache: ${cachedUserPrefs.currency_preference}`);
            
            // Récupérer les détails de la devise
            let currencyDetails = getCurrencyDetails(cachedUserPrefs.currency_preference);
            
            // Si la devise n'était pas dans les constantes, chercher dans le fichier JSON
            if (currencyDetails.code === 'XOF' && cachedUserPrefs.currency_preference !== 'XOF') {
              currencyDetails = await fetchCurrencyFromJson(cachedUserPrefs.currency_preference);
            }
            
            setCurrency(currencyDetails);
            setUserCountry(cachedUserPrefs.country || null);
            
            // Enregistrer aussi dans le localStorage pour la prochaine fois
            localStorage.setItem(userCurrencyKey, cachedUserPrefs.currency_preference);
            
            // Mettre en cache global
            setCachedData(CURRENCY_CACHE_KEY, currencyDetails, {
              expiry: 365 * 24 * 60 * 60 * 1000, // 1 an (pratiquement infini)
              storage: 'both',
              priority: 'high'
            });
            
            setLoading(false);
            pendingRequestRef.current = false;
            lastFetchTimeRef.current = now;
            return;
          }
          
          // DERNIÈRE OPTION SEULEMENT: Requête à la base de données (limitée à une seule fois)
          // Utiliser une clé de session pour s'assurer qu'on ne fait cette requête qu'une fois par session
          const dbRequestKey = `currency_db_request_${userId}`;
          const dbRequestDone = sessionStorage.getItem(dbRequestKey);
          
          if (!dbRequestDone) {
            console.log("Requête unique à la BD pour obtenir les préférences de devise de l'utilisateur");
            // Marquer que la requête a été faite pour cette session
            sessionStorage.setItem(dbRequestKey, 'true');
            
            // Si pas en cache, requête à la base de données
            const { data: userData, error } = await supabase
              .from('profiles')
              .select('currency_preference, country, is_currency_manually_set')
              .eq('id', userId)
              .single();
            
            if (error) {
              console.error("Erreur lors de la récupération des préférences utilisateur:", error);
            } else if (userData) {
              // Mettre en cache pour les futures requêtes (cache infini)
              setCachedData(cacheKey, userData, {
                expiry: 365 * 24 * 60 * 60 * 1000, // 1 an (pratiquement infini)
                storage: 'both',
                priority: 'high'
              });
              
              // Si l'utilisateur a explicitement choisi une devise, l'utiliser en priorité
              if (userData.is_currency_manually_set && userData.currency_preference) {
                console.log(`Utilisation de la devise spécifiée par l'utilisateur: ${userData.currency_preference}`);
                // Récupérer les détails de la devise, d'abord dans les constantes
                let currencyDetails = getCurrencyDetails(userData.currency_preference);
                
                // Si la devise n'était pas dans les constantes (devise par défaut), chercher dans le fichier JSON
                if (currencyDetails.code === 'XOF' && userData.currency_preference !== 'XOF') {
                  currencyDetails = await fetchCurrencyFromJson(userData.currency_preference);
                }
                
                setCurrency(currencyDetails);
                setUserCountry(userData.country || null);
                
                // Enregistrer dans le localStorage pour les prochaines fois
                localStorage.setItem(userCurrencyKey, userData.currency_preference);
                
                // Mettre en cache global
                setCachedData(CURRENCY_CACHE_KEY, currencyDetails, {
                  expiry: 365 * 24 * 60 * 60 * 1000, // 1 an (pratiquement infini)
                  storage: 'both',
                  priority: 'high'
                });
                
                // Enregistrer dans le localStorage
                if (typeof window !== 'undefined' && !options.disableCache) {
                  localStorage.setItem(CURRENCY_STORAGE_KEY, userData.currency_preference);
                }
                
                setLoading(false);
                pendingRequestRef.current = false;
                lastFetchTimeRef.current = now;
                return;
              }
              
              // Sinon, utiliser le pays s'il est disponible
              if (userData.country) {
                setUserCountry(userData.country);
              }
            }
          } else {
            console.log("Requête à la BD déjà effectuée dans cette session, utilisation des données locales uniquement");
          }
        }
        
        // Essayer de récupérer la devise depuis le localStorage (sauf si désactivé par les options)
        if (typeof window !== 'undefined' && !options.disableCache) {
          const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
          if (storedCurrency) {
            console.log(`Utilisation de la devise stockée localement: ${storedCurrency}`);
            // Récupérer les détails de la devise, d'abord dans les constantes
            let currencyDetails = getCurrencyDetails(storedCurrency);
            
            // Si la devise n'était pas dans les constantes (devise par défaut), chercher dans le fichier JSON
            if (currencyDetails.code === 'XOF' && storedCurrency !== 'XOF') {
              currencyDetails = await fetchCurrencyFromJson(storedCurrency);
            }
            
            setCurrency(currencyDetails);
            
            // Mettre en cache global
            setCachedData(CURRENCY_CACHE_KEY, currencyDetails, {
              expiry: CACHE_EXPIRY.USER_DATA,
              storage: 'both',
              priority: 'high'
            });
            
            setLoading(false);
            pendingRequestRef.current = false;
            lastFetchTimeRef.current = now;
            return;
          }
        }
        
        // Sinon, détection automatique basée sur l'IP/localisation
        // Essayer de détecter via la géolocalisation (mise en cache)
        const geoData = await getUserGeoData();
        
        if (geoData && geoData.country) {
          setUserCountry(geoData.country);
          
          // Détecter la devise basée sur le pays
          const detectedCurrency = detectCurrency(geoData.country);
          console.log(`Devise détectée automatiquement: ${detectedCurrency} (pays: ${geoData.country})`);
          
          // Récupérer les détails de la devise détectée
          let currencyDetails = getCurrencyDetails(detectedCurrency);
          
          // Si la devise n'était pas dans les constantes, chercher dans le fichier JSON
          if (currencyDetails.code === 'XOF' && detectedCurrency !== 'XOF') {
            currencyDetails = await fetchCurrencyFromJson(detectedCurrency);
          }
          
          setCurrency(currencyDetails);
          
          // Mettre en cache global
          setCachedData(CURRENCY_CACHE_KEY, currencyDetails, {
            expiry: CACHE_EXPIRY.USER_DATA,
            storage: 'both',
            priority: 'high'
          });
          
          // Enregistrer dans le localStorage
          if (typeof window !== 'undefined' && !options.disableCache) {
            localStorage.setItem(CURRENCY_STORAGE_KEY, detectedCurrency);
          }
        } else {
          // Si tout échoue, utiliser la devise par défaut (XOF)
          console.log("Aucune méthode de détection disponible, utilisation de XOF par défaut");
          setCurrency(DEFAULT_CURRENCY);
        }

      } catch (error) {
        console.error("Erreur lors de la détection de devise:", error);
        // En cas d'erreur, on utilise XOF par défaut
        setCurrency(DEFAULT_CURRENCY);
      } finally {
        setLoading(false);
        pendingRequestRef.current = false;
        lastFetchTimeRef.current = Date.now();
      }
    };
    
    detectAndSetCurrency();
  }, [options.forceCurrency, options.disableCache]);
  
  /**
   * Convertit un montant de XOF vers la devise locale
   */
  const convertToLocalCurrency = useCallback((amountInXOF: number): number => {
    if (!amountInXOF || isNaN(amountInXOF)) return 0;
    if (currency.code === 'XOF') return amountInXOF;
    
    // Multiplication car rate_to_xof est le taux de XOF vers la devise
    return Number((amountInXOF * currency.rate_to_xof).toFixed(currency.decimals));
  }, [currency]);
  
  /**
   * Convertit un montant de la devise locale vers XOF
   */
  const convertToXOF = useCallback((amountInLocalCurrency: number): number => {
    if (!amountInLocalCurrency || isNaN(amountInLocalCurrency)) return 0;
    if (currency.code === 'XOF') return amountInLocalCurrency;
    
    // Division car rate_to_xof est le taux de XOF vers la devise
    return Math.round(amountInLocalCurrency / currency.rate_to_xof);
  }, [currency]);
  
  /**
   * Formate un montant selon la devise actuelle
   */
  const formatAmount = useCallback((amount: number): string => {
    if (isNaN(amount)) return `${currency.symbol || ''}0`;
    
    // Convertir d'abord le montant dans la devise locale
    const convertedAmount = convertToLocalCurrency(amount);
    
    // Formater selon la locale appropriée et les décimales de la devise
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    }).format(convertedAmount);
    
    // Ajouter le symbole de la devise selon sa position habituelle
    return `${currency.symbol || ''}${formattedAmount}`;
  }, [currency, convertToLocalCurrency]);
  
  /**
   * Récupère le pays de l'utilisateur
   */
  const getUserCountry = useCallback((): string | null => {
    return userCountry;
  }, [userCountry]);
  
  // Retourner les fonctions et données de devise
  const result = useMemo(() => ({
    loading,
    currency,
    formatAmount,
    convertToLocalCurrency,
    convertToXOF,
    convertAmount: convertToLocalCurrency,
    getUserCountry,
    updateUserCurrencyPreference
  }), [
    loading,
    currency,
    formatAmount,
    convertToLocalCurrency,
    convertToXOF,
    getUserCountry,
    updateUserCurrencyPreference
  ]);
  
  return result;
}

// Fonction pour obtenir la localisation depuis les headers Supabase
export function getLocationFromSupabaseRequest(req: NextApiRequest): {
  countryCode: string | null;
  continent: string | null;
} {
  // Priorité au header Cloudflare standard
  const countryCode = req.headers['cf-ipcountry'] as string || null;
  
  // Extraire plus d'informations si disponibles dans cf-data (pour Supabase/Cloudflare)
  let continent = null;
  const cfData = req.headers['cf-data'] ? 
    JSON.parse(req.headers['cf-data'] as string) : null;
    
  if (cfData?.continent) {
    continent = cfData.continent;
  }
  
  return { countryCode, continent };
}

// Extension de notre fonction detectCurrency
export function detectCurrencyFromRequest(req: NextApiRequest, userPreference?: string): string {
  const { countryCode } = getLocationFromSupabaseRequest(req);
  return detectCurrency(countryCode, userPreference);
}