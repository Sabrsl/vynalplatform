"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Package, 
  Database,
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
  FileText,
  CreditCard,
  Ban
} from 'lucide-react';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  
  // État pour la barre latérale
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Gestion de la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Redirection si l'utilisateur n'est pas administrateur
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    if (isMobileView) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    }
  };
  
  const sidebarWidth = isMobileView
    ? mobileSidebarOpen ? 'w-64' : 'w-0'
    : sidebarCollapsed && !sidebarHovered
    ? 'w-16'
    : 'w-64';
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vynal-accent-primary"></div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return null; // La redirection sera gérée par useEffect
  }
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-vynal-purple-dark">
      {/* Barre de navigation mobile */}
      {isMobileView && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="text-sm font-semibold">Administration</div>
          <button 
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
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
          className={`${isMobileView ? 'fixed inset-y-0 left-0 w-64 z-30' : ''} ${sidebarWidth} bg-slate-800 dark:bg-slate-900 text-white transition-all duration-300 ease-in-out ${isMobileView ? '' : 'shrink-0'}`}
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
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            ) : (
              <button 
                onClick={toggleSidebar}
                className="text-slate-400 hover:text-white p-1"
              >
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            )}
          </div>
          <Separator className="bg-slate-700 dark:bg-slate-800" />
          <nav className="px-3 py-4">
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/admin-dashboard" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors ${
                    pathname === "/admin-dashboard" ? "bg-slate-700/80 dark:bg-slate-800/80 text-white" : "text-slate-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Tableau de bord</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin-dashboard/users" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors ${
                    pathname === "/admin-dashboard/users" || pathname?.startsWith("/admin-dashboard/users/") ? "bg-slate-700/80 dark:bg-slate-800/80 text-white" : "text-slate-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <Users className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Utilisateurs</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin-dashboard/orders" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors ${
                    pathname === "/admin-dashboard/orders" || pathname?.startsWith("/admin-dashboard/orders/") ? "bg-slate-700/80 dark:bg-slate-800/80 text-white" : "text-slate-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <Package className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Commandes</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin-dashboard/cancellations" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors ${
                    pathname === "/admin-dashboard/cancellations" ? "bg-slate-700/80 dark:bg-slate-800/80 text-white" : "text-slate-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <Ban className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Annulations</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin-dashboard/services" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors ${
                    pathname === "/admin-dashboard/services" || pathname?.startsWith("/admin-dashboard/services/") ? "bg-slate-700/80 dark:bg-slate-800/80 text-white" : "text-slate-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <FileText className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Services</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin-dashboard/disputes" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors ${
                    pathname === "/admin-dashboard/disputes" || pathname?.startsWith("/admin-dashboard/disputes/") ? "bg-slate-700/80 dark:bg-slate-800/80 text-white" : "text-slate-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Litiges</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin-dashboard/payments" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors ${
                    pathname === "/admin-dashboard/payments" || pathname?.startsWith("/admin-dashboard/payments/") ? "bg-slate-700/80 dark:bg-slate-800/80 text-white" : "text-slate-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Paiements</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin-dashboard/database" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors ${
                    pathname === "/admin-dashboard/database" ? "bg-slate-700/80 dark:bg-slate-800/80 text-white" : "text-slate-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <Database className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Base de données</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin-dashboard/settings" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors ${
                    pathname === "/admin-dashboard/settings" ? "bg-slate-700/80 dark:bg-slate-800/80 text-white" : "text-slate-300"
                  }`}
                  onClick={() => isMobileView && setMobileSidebarOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span className={sidebarCollapsed && !sidebarHovered && !isMobileView ? 'hidden' : 'block'}>Paramètres</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 