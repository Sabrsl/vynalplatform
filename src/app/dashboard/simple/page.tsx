"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useOptimizedDashboard } from "@/hooks/useDashboard";
import { NavigationLoadingState } from "@/app/providers";

/**
 * Version simplifiée du Dashboard sans spinners en cascade
 */
export default function SimpleDashboardPage() {
  const { user } = useAuth({ useCache: true });
  const { profile, isClient } = useUser({ useCache: true });
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    clientStats,
    freelanceStats,
    recentActivities,
    refreshDashboard,
    lastRefresh,
    getLastRefreshText
  } = useOptimizedDashboard();
  
  // Simuler un chargement simple avec un seul état
  useEffect(() => {
    // Indicateur de chargement pendant 1,5 seconde
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Si on est en chargement, afficher un seul spinner central
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-vynal-accent-primary rounded-full mb-4"></div>
        <p className="text-vynal-purple-dark dark:text-vynal-text-primary">Chargement du tableau de bord simplifié...</p>
      </div>
    );
  }

  // Compteur pour les activités
  const activityCount = recentActivities.length;
  
  // Totaux pour les statistiques selon le type d'utilisateur
  const totalStats = isClient 
    ? clientStats.activeOrders + clientStats.unreadMessages + clientStats.pendingDeliveries + clientStats.pendingReviews
    : freelanceStats.activeOrders + freelanceStats.unreadMessages + freelanceStats.pendingDeliveries + freelanceStats.servicesCount;

  // Nom d'utilisateur
  const userName = profile?.full_name || profile?.username || user?.user_metadata?.name || "Utilisateur";

  // Fonction de rafraîchissement simplifiée
  const handleRefresh = () => {
    setIsLoading(true);
    refreshDashboard();
    
    // Remettre à false après un délai fixe 
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-vynal-purple-darkest dark:text-vynal-text-primary">
            Tableau de bord simplifié
          </h1>
          <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">
            Bienvenue, {userName}
          </p>
        </div>
        
        <Button 
          size="sm" 
          onClick={handleRefresh}
          disabled={NavigationLoadingState.isNavigating}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualiser</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-2">Statistiques</h2>
          <div className="text-3xl font-bold text-vynal-accent-primary">
            {totalStats}
          </div>
          <p className="text-sm text-vynal-purple-secondary mt-1">
            {isClient ? "Total de vos activités client" : "Total de vos activités freelance"}
          </p>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-2">Activités récentes</h2>
          <div className="text-3xl font-bold text-vynal-accent-secondary">
            {activityCount}
          </div>
          <p className="text-sm text-vynal-purple-secondary mt-1">
            Activités enregistrées récemment
          </p>
        </Card>
      </div>
      
      <div className="text-center text-sm text-vynal-purple-secondary">
        Dernière mise à jour: {getLastRefreshText()}
      </div>
      
      <div className="mt-4 text-center">
        <Button variant="link" onClick={() => window.history.back()}>
          Retour au dashboard complet
        </Button>
      </div>
    </div>
  );
} 