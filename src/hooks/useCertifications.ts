import { useState, useEffect, useCallback } from 'react';
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

interface UseCertificationsResult {
  certifications: Certification[];
  loading: boolean;
  error: Error | null;
  refreshCertifications: () => void;
}

/**
 * Hook pour gérer les certifications d'un freelance
 */
export function useCertifications(userId?: string): UseCertificationsResult {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fonction pour récupérer les certifications
  const fetchCertifications = useCallback(async () => {
    if (!userId) {
      setCertifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Pour la démo, on utilise les données fictives
      // Dans un environnement réel, on effectuerait une requête à Supabase:
      /* 
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      setCertifications(data || []);
      */
      
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 800));
      setCertifications(MOCK_CERTIFICATIONS);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue lors du chargement des certifications'));
      console.error('Erreur lors du chargement des certifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Charger les certifications au montage du composant
  useEffect(() => {
    fetchCertifications();
  }, [fetchCertifications]);

  // Fonction pour rafraîchir les certifications
  const refreshCertifications = useCallback(() => {
    fetchCertifications();
  }, [fetchCertifications]);

  return {
    certifications,
    loading,
    error,
    refreshCertifications
  };
} 