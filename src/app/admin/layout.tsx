"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
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
  FileQuestion,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import AlertService from "@/utils/alertService";
import { AdminGuard } from '@/lib/guards/roleGuards';
import { useLogout } from '@/hooks/useLogout';
import { FREELANCE_ROUTES, CLIENT_ROUTES } from '@/config/routes';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, profile, loading: profileLoading } = useUser();
  const { logout } = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // État pour la barre latérale rétractable
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  // Gestion de la déconnexion
  const handleSignOut = () => {
    logout();
  };

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

  // Initialiser l'état une fois l'utilisateur chargé
  useEffect(() => {
    if (!authLoading && !profileLoading && !isInitialized) {
      setIsInitialized(true);
    }
  }, [authLoading, profileLoading, isInitialized]);

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

  // Afficher un loader pendant le chargement
  if (authLoading || profileLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 h-8 w-8 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary dark:border-vynal-accent-primary"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Chargement de l'interface admin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="flex flex-col min-h-screen bg-white dark:bg-transparent text-gray-800 dark:text-vynal-text-primary">
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
              <h2 className={`text-[9px] font-bold text-white ${sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}`}>
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
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-[9px] hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                      pathname === "/admin" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                    }`}
                    onClick={() => isMobileView && setMobileSidebarOpen(false)}
                  >
                    <LayoutDashboard className="h-3 w-3" />
                    <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Tableau de bord</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/users" 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-[9px] hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                      pathname === "/admin/users" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                    }`}
                    onClick={() => isMobileView && setMobileSidebarOpen(false)}
                  >
                    <Users className="h-3 w-3" />
                    <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Utilisateurs</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/validations" 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-[9px] hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                      pathname === "/admin/validations" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                    }`}
                    onClick={() => isMobileView && setMobileSidebarOpen(false)}
                  >
                    <CheckSquare className="h-3 w-3" />
                    <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Validations</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/cache-invalidations" 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-[9px] hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                      pathname === "/admin/cache-invalidations" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                    }`}
                    onClick={() => isMobileView && setMobileSidebarOpen(false)}
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Invalidations</span>
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
                    <PackageOpen className="h-3 w-3 text-indigo-500" />
                    Services
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/withdrawals" 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-[9px] hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                      pathname === "/admin/withdrawals" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                    }`}
                    onClick={() => isMobileView && setMobileSidebarOpen(false)}
                  >
                    <Wallet className="h-3 w-3" />
                    <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Retraits</span>
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
                    <Settings className="h-3 w-3 text-indigo-500" />
                    Outils
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/alerts" 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-[9px] hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                      pathname === "/admin/alerts" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                    }`}
                    onClick={() => isMobileView && setMobileSidebarOpen(false)}
                  >
                    <AlertCircle className="h-3 w-3" />
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
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-[9px] hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                      pathname === "/admin/messaging" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                    }`}
                    onClick={() => isMobileView && setMobileSidebarOpen(false)}
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Messagerie</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/settings" 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-[9px] hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                      pathname === "/admin/settings" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                    }`}
                    onClick={() => isMobileView && setMobileSidebarOpen(false)}
                  >
                    <Settings className="h-3 w-3" />
                    <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Paramètres</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/notifications" 
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-[9px] hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors ${
                      pathname === "/admin/notifications" ? "bg-gray-700/80 dark:bg-gray-800/80 text-white" : "text-gray-300"
                    }`}
                    onClick={() => isMobileView && setMobileSidebarOpen(false)}
                  >
                    <Bell className="h-3 w-3" />
                    <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Notifications</span>
                  </Link>
                </li>
                
                {/* Déconnexion */}
                <li className="mt-8">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-[9px] hover:bg-red-600/30 transition-colors text-red-300 w-full"
                  >
                    <LogOut className="h-3 w-3" />
                    <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Déconnexion</span>
                  </button>
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
    </AdminGuard>
  );
} 