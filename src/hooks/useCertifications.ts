import { useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

// Type pour les certifications
export interface Certification {
  id: string;
  title: string;
  issuer: string;
  description: string;
  status: 'verified' | 'pending' | 'expired' | 'locked';
  obtainedAt?: string;
  expiresAt?: string;
  level?: string;
  category: string;
  icon: string;
}

// Type pour l'état du hook
interface CertificationsState {
  certifications: Certification[];
  loading: boolean;
  error: Error | null;
  lastFetched: number | null;
}

// Types d'actions pour le reducer
type CertificationsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Certification[] }
  | { type: 'FETCH_ERROR'; payload: Error }
  | { type: 'RESET' };

// Données fictives pour la démo
const MOCK_CERTIFICATIONS: Certification[] = [
  {
    id: "cert-1",
    title: "Développeur Frontend Expert",
    issuer: "Vynal Skills",
    description: "Certification avancée prouvant votre maîtrise des technologies frontales modernes incluant React, TypeScript et les frameworks CSS modernes.",
    status: "verified",
    obtainedAt: "2023-09-15",
    expiresAt: "2025-09-15",
    level: "Expert",
    category: "développement",
    icon: "code"
  },
  {
    id: "cert-2",
    title: "Design UI/UX Professionnel",
    issuer: "Design Institute",
    description: "Atteste de votre capacité à créer des interfaces utilisateur modernes, accessibles et engageantes.",
    status: "pending",
    obtainedAt: "2023-11-20",
    category: "design",
    icon: "palette"
  },
  {
    id: "cert-3",
    title: "Expert en Cybersécurité",
    issuer: "Security Alliance",
    description: "Certification reconnue dans le domaine de la sécurité informatique et la protection des données.",
    status: "locked",
    category: "sécurité",
    icon: "shield"
  },
  {
    id: "cert-4",
    title: "Manageur de Projet Digital",
    issuer: "Project Management Institute",
    description: "Certification validant vos compétences en gestion de projets numériques, méthodes agiles et leadership d'équipe.",
    status: "expired",
    obtainedAt: "2021-05-10",
    expiresAt: "2023-05-10",
    level: "Intermédiaire",
    category: "gestion de projet",
    icon: "briefcase"
  }
];

// Cache global pour les certifications
const certificationsCache = new Map<string, {
  data: Certification[];
  timestamp: number;
}>();

// Durée de validité du cache (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// État initial pour le reducer
const initialState: CertificationsState = {
  certifications: [],
  loading: true,
  error: null,
  lastFetched: null
};

// Reducer pour gérer les états
const certificationsReducer = (state: CertificationsState, action: CertificationsAction): CertificationsState => {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'FETCH_SUCCESS':
      return {
        certifications: action.payload,
        loading: false,
        error: null,
        lastFetched: Date.now()
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

interface UseCertificationsResult {
  certifications: Certification[];
  loading: boolean;
  error: Error | null;
  refreshCertifications: () => void;
  isStale: boolean;
}

/**
 * Hook optimisé pour gérer les certifications d'un freelance
 * - Utilise useReducer pour une gestion d'état plus prévisible
 * - Implémente un système de cache pour éviter les requêtes inutiles
 * - Fournit des informations sur la fraîcheur des données
 */
export function useCertifications(userId?: string): UseCertificationsResult {
  const [state, dispatch] = useReducer(certificationsReducer, initialState);
  
  // Référence pour savoir si le composant est monté
  const isMountedRef = useRef(true);
  
  // Référence pour suivre les requêtes en cours
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Mémoiser l'ID utilisateur effectif
  const effectiveUserId = useMemo(() => userId || 'guest', [userId]);
  
  // Vérifier si les données sont périmées (plus de 5 minutes)
  const isStale = useMemo(() => {
    if (!state.lastFetched) return true;
    return Date.now() - state.lastFetched > CACHE_TTL;
  }, [state.lastFetched]);

  // Fonction optimisée pour récupérer les certifications
  const fetchCertifications = useCallback(async (forceRefresh = false) => {
    // Si pas d'ID utilisateur, on retourne des données vides
    if (!effectiveUserId) {
      dispatch({ type: 'FETCH_SUCCESS', payload: [] });
      return;
    }
    
    // Vérifier le cache si on ne force pas le rafraîchissement
    if (!forceRefresh) {
      const cached = certificationsCache.get(effectiveUserId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        dispatch({ type: 'FETCH_SUCCESS', payload: cached.data });
        return;
      }
    }
    
    // Annuler toute requête en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Créer un nouveau contrôleur d'annulation
    abortControllerRef.current = new AbortController();
    
    // Indiquer le début du chargement
    dispatch({ type: 'FETCH_START' });

    try {
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Pour la démo, on utilise les données fictives
      // Dans un environnement réel, on effectuerait une requête à Supabase:
      /* 
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', effectiveUserId)
        .abortSignal(abortControllerRef.current.signal);
      
      if (error) throw error;
      const certData = data || [];
      */
      
      const certData = MOCK_CERTIFICATIONS;
      
      // Mettre à jour le cache
      certificationsCache.set(effectiveUserId, {
        data: certData,
        timestamp: Date.now()
      });
      
      // Ne mettre à jour l'état que si le composant est toujours monté
      if (isMountedRef.current) {
        dispatch({ type: 'FETCH_SUCCESS', payload: certData });
      }
    } catch (err) {
      console.error('Erreur lors du chargement des certifications:', err);
      
      // Ne pas mettre à jour en cas d'erreur d'annulation
      if (err instanceof Error && err.name === 'AbortError') return;
      
      // Ne mettre à jour l'état que si le composant est toujours monté
      if (isMountedRef.current) {
        dispatch({ 
          type: 'FETCH_ERROR', 
          payload: err instanceof Error ? err : new Error('Une erreur est survenue lors du chargement des certifications')
        });
      }
    } finally {
      // Nettoyer le contrôleur d'annulation
      if (abortControllerRef.current?.signal.aborted) {
        abortControllerRef.current = null;
      }
    }
  }, [effectiveUserId]);

  // Fonction pour rafraîchir les certifications (force le rafraîchissement)
  const refreshCertifications = useCallback(() => {
    fetchCertifications(true);
  }, [fetchCertifications]);
  
  // Effet pour gérer le cycle de vie du composant
  useEffect(() => {
    isMountedRef.current = true;
    fetchCertifications();
    
    return () => {
      isMountedRef.current = false;
      
      // Annuler toute requête en cours à la destruction du composant
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchCertifications]);

  // Retourner un objet mémorisé pour éviter les reconstructions inutiles
  return useMemo(() => ({
    certifications: state.certifications,
    loading: state.loading,
    error: state.error,
    refreshCertifications,
    isStale
  }), [state.certifications, state.loading, state.error, refreshCertifications, isStale]);
} 