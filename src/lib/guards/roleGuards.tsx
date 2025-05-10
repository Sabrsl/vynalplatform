"use client";

import { ReactNode, useEffect, useState, useCallback, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { FREELANCE_ROUTES, CLIENT_ROUTES } from "@/config/routes";

// Composant de base pour les écrans de chargement
const LoadingScreen = memo(({ message }: { message: string }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-vynal-accent-primary mx-auto mb-4" />
      <p className="text-vynal-purple-light dark:text-vynal-text-primary">
        {message}
      </p>
    </div>
  </div>
));
LoadingScreen.displayName = 'LoadingScreen';

// Hook unifié pour la vérification des rôles
function useRoleVerification() {
  const auth = useAuth();
  const userProfile = useUser();
  const [roleVerified, setRoleVerified] = useState(false);
  
  // Vérifier si les données utilisateur sont chargées
  const isLoading = auth.loading || userProfile.loading;
  
  // Détermine le rôle en combinant les sources
  const userRole = useMemo(() => {
    // Priorité 1: Métadonnées utilisateur (plus rapide)
    if (auth.user?.user_metadata?.role) {
      return auth.user.user_metadata.role;
    }
    
    // Priorité 2: Profil utilisateur (plus fiable)
    if (userProfile.profile?.role) {
      return userProfile.profile.role;
    }
    
    // Par défaut: null si on ne peut pas déterminer
    return null;
  }, [auth.user?.user_metadata?.role, userProfile.profile?.role]);
  
  // Valeurs dérivées pour les différents rôles
  const isFreelance = userRole === 'freelance';
  const isClient = userRole === 'client';
  const isAdmin = userRole === 'admin';
  
  // Synchroniser les rôles si nécessaire
  useEffect(() => {
    if (auth.user?.id && userProfile.profile && !isLoading) {
      const metadataRole = auth.user.user_metadata?.role;
      const profileRole = userProfile.profile.role;
      
      // Vérifier s'il y a incohérence et synchroniser
      if ((metadataRole && !profileRole) || 
          (!metadataRole && profileRole) || 
          (metadataRole && profileRole && metadataRole !== profileRole)) {
        
        auth.syncUserRole(auth.user.id, metadataRole, profileRole)
          .then(() => {
            // Marquer que le rôle a été vérifié après synchronisation
            setRoleVerified(true);
          });
      } else {
        // Si pas d'incohérence, marquer comme vérifié
        setRoleVerified(true);
      }
    }
  }, [auth, userProfile, isLoading]);
  
  return {
    userRole,
    isFreelance,
    isClient,
    isAdmin,
    isLoading,
    isAuthenticated: auth.isAuthenticated,
    roleVerified
  };
}

// Garde pour les pages freelance
export const FreelanceGuard = memo(({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { isFreelance, isLoading, isAuthenticated, roleVerified } = useRoleVerification();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Effectuer la redirection si nécessaire
  useEffect(() => {
    // Attendre que le chargement soit terminé et le rôle vérifié
    if (!isLoading && roleVerified) {
      // Si l'utilisateur n'est pas authentifié, rediriger vers la connexion
      if (!isAuthenticated) {
        setIsRedirecting(true);
        toast({
          title: "Authentification requise",
          description: "Veuillez vous connecter pour accéder à cette page."
        });
        router.push('/auth/login');
        return;
      }
      
      // Si l'utilisateur est authentifié mais n'est pas freelance, rediriger
      if (isAuthenticated && !isFreelance) {
        setIsRedirecting(true);
        toast({
          title: "Accès limité",
          description: "Cette section est réservée aux freelances. Redirection vers votre espace client..."
        });
        
        // Rediriger vers le dashboard client
        setTimeout(() => {
          router.push(CLIENT_ROUTES.DASHBOARD);
        }, 300);
      }
    }
  }, [isLoading, roleVerified, isAuthenticated, isFreelance, router, toast]);
  
  // Afficher un écran de chargement si nécessaire
  if (isLoading || isRedirecting || (roleVerified && !isFreelance && isAuthenticated)) {
    return <LoadingScreen message="Vérification des accès..." />;
  }
  
  // Si tout est OK, afficher le contenu
  return <>{children}</>;
});
FreelanceGuard.displayName = 'FreelanceGuard';

// Garde pour les pages client
export const ClientGuard = memo(({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { isClient, isLoading, isAuthenticated, roleVerified } = useRoleVerification();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Effectuer la redirection si nécessaire
  useEffect(() => {
    // Attendre que le chargement soit terminé et le rôle vérifié
    if (!isLoading && roleVerified) {
      // Si l'utilisateur n'est pas authentifié, rediriger vers la connexion
      if (!isAuthenticated) {
        setIsRedirecting(true);
        toast({
          title: "Authentification requise",
          description: "Veuillez vous connecter pour accéder à cette page."
        });
        router.push('/auth/login');
        return;
      }
      
      // Si l'utilisateur est authentifié mais n'est pas client, rediriger
      if (isAuthenticated && !isClient) {
        setIsRedirecting(true);
        toast({
          title: "Accès limité",
          description: "Cette section est réservée aux clients. Redirection vers votre espace freelance..."
        });
        
        // Rediriger vers le dashboard freelance
        setTimeout(() => {
          router.push(FREELANCE_ROUTES.DASHBOARD);
        }, 300);
      }
    }
  }, [isLoading, roleVerified, isAuthenticated, isClient, router, toast]);
  
  // Afficher un écran de chargement si nécessaire
  if (isLoading || isRedirecting || (roleVerified && !isClient && isAuthenticated)) {
    return <LoadingScreen message="Vérification des accès..." />;
  }
  
  // Si tout est OK, afficher le contenu
  return <>{children}</>;
});
ClientGuard.displayName = 'ClientGuard';

/**
 * Fonction utilitaire pour déterminer si un chemin est une route freelance
 */
export function isFreelanceRoute(pathname: string | null, freelanceRoutes: string[]): boolean {
  if (!pathname) return false;
  
  return freelanceRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Fonction utilitaire pour déterminer si un chemin est une route client
 */
export function isClientRoute(pathname: string | null, clientRoutes: string[]): boolean {
  if (!pathname) return false;
  
  return clientRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
} 