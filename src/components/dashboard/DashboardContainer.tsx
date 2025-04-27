'use client';

import React, { useEffect } from 'react';
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

  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (loading || !profile) return;

    // Si l'utilisateur n'est ni client ni freelance, rediriger vers l'accueil
    if (!isClient && !isFreelance) {
      router.push('/');
      return;
    }
    
    // Vérifier si l'utilisateur est sur le bon type de dashboard
    const shouldBeOnClientDashboard = isClient && !isFreelance;
    
    if (!isDashboardPath(pathname, shouldBeOnClientDashboard)) {
      // Rediriger vers le bon dashboard
      router.push(getRedirectUrl(shouldBeOnClientDashboard));
    }
  }, [profile, isClient, isFreelance, loading, router, pathname]);

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