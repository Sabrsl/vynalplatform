'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { 
  isDashboardPath, 
  getRedirectUrl 
} from '@/config/dashboard-config';
import { Loader } from "@/components/ui/loader";

interface DashboardContainerProps {
  children: React.ReactNode;
}

/**
 * Container pour gérer l'accès aux tableaux de bord
 * 
 * Ce composant:
 * 1. Vérifie si l'utilisateur a les droits d'accès
 * 2. Redirige vers le bon dashboard en fonction du rôle
 * 3. Affiche un loader pendant le chargement
 */
export default function DashboardContainer({ children }: DashboardContainerProps) {
  const { profile, isClient, isFreelance, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // Déterminer si l'utilisateur est sur le bon type de dashboard - mémorisé pour éviter les recalculs
  const { shouldBeOnClientDashboard, shouldRedirect, redirectUrl } = useMemo(() => {
    // Si l'utilisateur est en cours de chargement ou n'existe pas, ne rien calculer
    if (loading || !profile) {
      return {
        shouldBeOnClientDashboard: false,
        shouldRedirect: false,
        redirectUrl: null
      };
    }

    // Si l'utilisateur n'est ni client ni freelance, rediriger vers l'accueil
    if (!isClient && !isFreelance) {
      return {
        shouldBeOnClientDashboard: false,
        shouldRedirect: true,
        redirectUrl: '/'
      };
    }
    
    // Déterminer le type de dashboard
    const isClientOnly = isClient && !isFreelance;
    
    // Vérifier si redirection nécessaire
    const needsRedirect = !isDashboardPath(pathname || '', isClientOnly);
    
    return {
      shouldBeOnClientDashboard: isClientOnly,
      shouldRedirect: needsRedirect,
      redirectUrl: needsRedirect ? getRedirectUrl(isClientOnly) : null
    };
  }, [profile, isClient, isFreelance, loading, pathname]);

  // Fonction de redirection mémorisée
  const handleRedirect = useCallback(() => {
    if (redirectUrl) {
      router.push(redirectUrl);
    }
  }, [router, redirectUrl]);

  // Effet optimisé avec dépendances précises
  useEffect(() => {
    if (shouldRedirect) {
      handleRedirect();
    }
  }, [shouldRedirect, handleRedirect]);

  // Afficher un loader pendant le chargement du profil utilisateur
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader 
          size="lg" 
          variant="primary" 
          showText={true} 
          text="Chargement de votre tableau de bord..."
        />
      </div>
    );
  }

  // Si l'utilisateur n'est pas autorisé, ne rien afficher pendant la redirection
  if (!profile || (!isClient && !isFreelance)) {
    return null;
  }

  // Afficher le contenu du dashboard
  return <>{children}</>;
} 