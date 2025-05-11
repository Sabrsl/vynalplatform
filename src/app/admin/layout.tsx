"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { getCachedData, setCachedData, CACHE_EXPIRY, CACHE_KEYS } from '@/lib/optimizations';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Package, 
  AlertCircle, 
  MessageSquare,
  Settings,
  Shield,
  AlertTriangle,
  Info,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  PackageOpen,
  Wallet,
  CreditCard,
  KeyRound,
  User,
  Laptop,
  Mail,
  FileQuestion
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import AlertService from "@/utils/alertService";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, profile, loading } = useUser();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [bypassAdminCheck, setBypassAdminCheck] = useState(true); // Désactiver temporairement la vérification
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  
  // État pour la barre latérale rétractable
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Fonction pour définir l'utilisateur actuel comme admin
  const setUserAsAdmin = async () => {
    try {
      if (!user) return;
      
      setError(null);
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) {
        setError(`Erreur lors de la mise à jour du rôle : ${error.message}`);
      } else {
        alert('Rôle mis à jour avec succès. La page va être rechargée.');
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fonction pour basculer l'état de la barre latérale
  const toggleSidebar = () => {
    if (isMobileView) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Détermine la largeur effective de la barre latérale
  const sidebarWidth = isMobileView 
    ? mobileSidebarOpen ? "translate-x-0" : "-translate-x-full" 
    : sidebarCollapsed && !sidebarHovered ? "w-16" : "w-64";

  // Détection de la taille d'écran
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    // Vérifier au chargement initial
    checkScreenSize();

    // Ajouter un event listener pour les changements de taille d'écran
    window.addEventListener('resize', checkScreenSize);

    // Nettoyage
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fermer automatiquement la sidebar mobile lors du changement de page
  useEffect(() => {
    if (isMobileView) {
      setMobileSidebarOpen(false);
    }
  }, [pathname, isMobileView]);

  // Redirection des utilisateurs non-admin vers le dashboard
  useEffect(() => {
    if (!loading && !isAdmin && !bypassAdminCheck) {
      router.push('/dashboard');
    }
  }, [loading, isAdmin, bypassAdminCheck, router]);

  useEffect(() => {
    // Charger le nombre d'alertes actives
    const fetchAlertCount = async () => {
      try {
        // Vérifier s'il y a un cache récent pour éviter les requêtes fréquentes
        const cachedCount = getCachedData<number>(CACHE_KEYS.ADMIN_ALERTS);
        
        // Si on a des données en cache, les utiliser
        if (cachedCount !== null) {
          setActiveAlertsCount(cachedCount);
          return;
        }
        
        // Sinon, charger depuis l'API
        const count = await AlertService.getActiveAlertsCount();
        setActiveAlertsCount(count);
        
        // Mettre en cache le résultat pour 12 heures
        setCachedData(CACHE_KEYS.ADMIN_ALERTS, count, { 
          expiry: CACHE_EXPIRY.HOURS_12,
          priority: 'medium'
        });
      } catch (error) {
        console.error("Erreur lors du chargement du nombre d'alertes:", error);
      }
    };

    fetchAlertCount();
    // Rafraîchir le compteur toutes les 12 heures
    const intervalId = setInterval(fetchAlertCount, CACHE_EXPIRY.HOURS_12);

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-vynal-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-transparent text-gray-800 dark:text-vynal-text-primary">
      {/* Bannière d'avertissement si l'utilisateur n'est pas admin */}
      {!isAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700/30 p-3">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">
                <span className="font-semibold">Accès temporaire :</span> Vous n'êtes pas administrateur mais le contrôle est temporairement désactivé pour faciliter le débogage.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={setUserAsAdmin}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-vynal-accent-primary/80 dark:hover:bg-vynal-accent-primary text-white px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1"
              >
                <Shield className="h-3 w-3" />
                Définir comme Admin
              </button>
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="bg-gray-600 hover:bg-gray-700 dark:bg-vynal-purple-secondary/50 dark:hover:bg-vynal-purple-secondary/80 text-white px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1"
              >
                <Info className="h-3 w-3" />
                {showDebugInfo ? 'Masquer les infos' : 'Afficher les infos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Informations de débogage */}
      {showDebugInfo && (
        <div className="bg-gray-50 dark:bg-vynal-purple-secondary/10 border-b border-gray-200 dark:border-vynal-purple-secondary/20 p-3">
          <div className="container mx-auto">
            <h3 className="font-medium mb-2 text-xs">Informations de débogage :</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="font-medium">ID utilisateur :</span> {user?.id || 'Non connecté'}
              </div>
              <div>
                <span className="font-medium">Email :</span> {user?.email || 'N/A'}
              </div>
              <div>
                <span className="font-medium">isAdmin :</span> {isAdmin ? 'Oui' : 'Non'}
              </div>
              <div>
                <span className="font-medium">Rôle dans le profil :</span> {profile?.role || 'Non défini'}
              </div>
              <div>
                <span className="font-medium">Rôle dans user_metadata :</span> {user?.user_metadata?.role || 'Non défini'}
              </div>
            </div>
            {error && (
              <div className="mt-2 text-red-600 dark:text-red-400 text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barre de navigation mobile */}
      {isMobileView && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="text-sm font-semibold">Admin Panel</div>
          <button 
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
        </div>
      )}

      <div className="flex flex-1 relative">
        {/* Overlay pour mobile */}
        {isMobileView && mobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden" 
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        
        {/* Sidebar */}
        <aside 
          className={`${isMobileView ? 'fixed inset-y-0 left-0 w-64 z-30' : ''} ${sidebarWidth} bg-gray-800 dark:bg-gray-900 text-white transition-all duration-300 ease-in-out ${isMobileView ? '' : 'shrink-0'}`}
          onMouseEnter={() => !isMobileView && setSidebarHovered(true)}
          onMouseLeave={() => !isMobileView && setSidebarHovered(false)}
        >
          <div className="flex items-center justify-between p-4 h-14">
            <h2 className={`text-sm font-bold text-white ${sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}`}>
              Administration
            </h2>
            {isMobileView ? (
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            ) : (
              <button 
                onClick={toggleSidebar}
                className="text-gray-400 hover:text-white p-1"
              >
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            )}
          </div>
          <Separator className="bg-gray-700 dark:bg-gray-800" />
          <nav className="px-3 py-4">
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/admin" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                    pathname === "/admin" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Tableau de bord</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/users" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                    pathname === "/admin/users" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <Users className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Utilisateurs</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/validations" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                    pathname === "/admin/validations" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <CheckSquare className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Validations</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/services"
                  className={cn(
                    "flex items-center gap-x-2 text-slate-600 dark:text-slate-400 font-medium text-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded px-3 py-2 w-full",
                    pathname?.includes("/admin/services")
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      : ""
                  )}
                >
                  <PackageOpen className="h-4 w-4 text-indigo-500" />
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/withdrawals"
                  className={cn(
                    "flex items-center gap-x-2 text-slate-600 dark:text-slate-400 font-medium text-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded px-3 py-2 w-full",
                    pathname?.includes("/admin/withdrawals")
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      : ""
                  )}
                >
                  <Wallet className="h-4 w-4 text-indigo-500" />
                  Retraits
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/tools"
                  className={cn(
                    "flex items-center gap-x-2 text-slate-600 dark:text-slate-400 font-medium text-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded px-3 py-2 w-full",
                    pathname?.includes("/admin/tools")
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      : ""
                  )}
                >
                  <Settings className="h-4 w-4 text-indigo-500" />
                  Outils
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/alerts" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                    pathname === "/admin/alerts" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <AlertCircle className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Alertes</span>
                  {activeAlertsCount > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs">
                      {activeAlertsCount}
                    </Badge>
                  )}
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/messaging" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                    pathname === "/admin/messaging" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Messagerie</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/settings" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                    pathname === "/admin/settings" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Paramètres</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/debug" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                    pathname === "/admin/debug" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <Info className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Débogage</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 