"use client";

import { ReactNode, useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

// Constantes pour améliorer la maintenabilité
const REDIRECT_PATHS = {
  FREELANCE_FALLBACK: "/dashboard/payments",
  CLIENT_FALLBACK: "/dashboard/wallet",
  LOGIN: "/auth/login",
};

const TOAST_MESSAGES = {
  FREELANCE_ONLY: {
    title: "Accès limité",
    description: "Cette section est réservée aux freelances. Redirection vers votre espace client..."
  },
  CLIENT_ONLY: {
    title: "Accès limité",
    description: "Cette section est réservée aux clients. Redirection vers votre espace freelance..."
  },
  AUTH_REQUIRED: {
    title: "Authentification requise",
    description: "Veuillez vous connecter pour accéder à cette page."
  }
};

/**
 * Options pour les guards de rôle
 */
interface RoleGuardOptions {
  /** Message à afficher pendant la redirection */
  redirectMessage?: string;
  /** Message de toast à afficher */
  toastMessage?: {
    title: string;
    description: string;
  };
  /** Délai avant redirection (ms) */
  redirectDelay?: number;
  /** Chemin de redirection */
  redirectPath: string;
  /** Si true, garde les connexions socket pendant la redirection */
  preserveConnections?: boolean;
}

/**
 * Hook optimisé pour la gestion des gardes de rôle
 * Utilise le cache et minimise les re-rendus
 */
export function useRoleGuard(shouldAccess: boolean, options: RoleGuardOptions) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { loading: userLoading } = useUser();
  const [redirecting, setRedirecting] = useState(false);
  const [accessVerified, setAccessVerified] = useState(false);

  // Valeurs par défaut
  const redirectMessage = options.redirectMessage || "Redirection en cours...";
  const redirectDelay = options.redirectDelay || 300;
  
  // Fonction mémorisée pour gérer la redirection
  const handleRedirection = useCallback(() => {
    if (redirecting) return; // Éviter les redirections multiples
    
    setRedirecting(true);
    
    // Afficher un toast si configuré
    if (options.toastMessage) {
      toast({
        title: options.toastMessage.title,
        description: options.toastMessage.description,
        duration: 3000,
      });
    }
    
    // Rediriger avec un délai pour permettre au toast de s'afficher
    setTimeout(() => {
      router.push(options.redirectPath);
    }, redirectDelay);
  }, [redirecting, options.toastMessage, options.redirectPath, toast, router, redirectDelay]);

  // Vérification d'accès optimisée
  useEffect(() => {
    // Attendre que les données d'authentification soient chargées
    if (authLoading || userLoading) return;
    
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      setRedirecting(true);
      
      toast({
        title: TOAST_MESSAGES.AUTH_REQUIRED.title,
        description: TOAST_MESSAGES.AUTH_REQUIRED.description,
        duration: 3000,
      });
      
      router.push(REDIRECT_PATHS.LOGIN);
      return;
    }
    
    // Vérifier le rôle seulement si les données sont chargées
    if (!authLoading && !userLoading && !shouldAccess) {
      handleRedirection();
    } else if (!authLoading && !userLoading) {
      // L'accès est vérifié et autorisé
      setAccessVerified(true);
    }
  }, [shouldAccess, user, authLoading, userLoading, router, handleRedirection, toast]);

  // Renvoyer un état indiquant si la garde est en train de rediriger
  return {
    isRedirecting: redirecting || (!shouldAccess && !authLoading && !userLoading && !!user),
    isLoading: authLoading || userLoading,
    redirectMessage,
    accessVerified
  };
}

// Composant de base pour les écrans de chargement/redirection - mémorisé pour optimiser les performances
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

/**
 * Composant de garde pour protéger les routes accessibles uniquement aux freelances
 * Optimisé pour les performances et la robustesse
 */
export const FreelanceGuard = memo(({ children }: { children: ReactNode }) => {
  const { isFreelance, loading: profileLoading } = useUser();
  
  // Log de débogage
  console.log("[FreelanceGuard] Vérification d'accès:", { 
    isFreelance, 
    profileLoading 
  });
  
  const { isRedirecting, isLoading, redirectMessage } = useRoleGuard(
    // Uniquement vérifier isFreelance si les données du profil sont chargées
    profileLoading ? true : isFreelance, 
    {
      redirectPath: REDIRECT_PATHS.CLIENT_FALLBACK,
      toastMessage: TOAST_MESSAGES.FREELANCE_ONLY,
      preserveConnections: true // Évite de fermer les connexions socket pendant la redirection
    }
  );

  // Afficher un indicateur de chargement pendant la redirection ou le chargement
  if (isRedirecting || isLoading) {
    console.log("[FreelanceGuard] Redirection en cours");
    return <LoadingScreen message={redirectMessage} />;
  }

  // Si tout est OK, afficher le contenu
  console.log("[FreelanceGuard] Accès autorisé");
  return <>{children}</>;
});
FreelanceGuard.displayName = 'FreelanceGuard';

/**
 * Composant de garde pour protéger les routes accessibles uniquement aux clients
 * Optimisé pour les performances et la robustesse
 */
export const ClientGuard = memo(({ children }: { children: ReactNode }) => {
  const { isFreelance, loading: profileLoading } = useUser();
  const { isRedirecting, isLoading, redirectMessage } = useRoleGuard(
    // Seulement vérifier !isFreelance quand profileLoading est false
    profileLoading ? true : !isFreelance, 
    {
      redirectPath: REDIRECT_PATHS.FREELANCE_FALLBACK,
      toastMessage: TOAST_MESSAGES.CLIENT_ONLY,
      preserveConnections: true // Évite de fermer les connexions socket pendant la redirection
    }
  );

  // Afficher un indicateur de chargement pendant la redirection ou le chargement
  if (isRedirecting || isLoading) {
    return <LoadingScreen message={redirectMessage} />;
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