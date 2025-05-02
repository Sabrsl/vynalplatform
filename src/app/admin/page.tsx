"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import Link from 'next/link';
import { AlertTriangle, Users, Shield, BarChart3, FileText, PieChart, TrendingUp } from 'lucide-react';

// Types locaux
interface AdminStats {
  usersCount: number;
  clientsCount: number;
  freelancesCount: number;
  adminsCount: number;
  ordersCount: number;
  servicesCount: number;
  disputesCount: number;
}

export default function AdminDashboard() {
  const { isAdmin, loading } = useUser();
  const [stats, setStats] = useState<AdminStats>({
    usersCount: 0,
    clientsCount: 0,
    freelancesCount: 0,
    adminsCount: 0,
    ordersCount: 0,
    servicesCount: 0,
    disputesCount: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les statistiques
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        
        // Utilisateurs par rôle
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('role', { count: 'exact' });
          
        if (usersError) throw usersError;
        
        const usersCount = usersData?.length || 0;
        const clientsCount = usersData?.filter(u => u.role === 'client').length || 0;
        const freelancesCount = usersData?.filter(u => u.role === 'freelance').length || 0;
        const adminsCount = usersData?.filter(u => u.role === 'admin').length || 0;
        
        // Commandes
        const { count: ordersCount, error: ordersError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
          
        if (ordersError) throw ordersError;
        
        // Services
        const { count: servicesCount, error: servicesError } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true });
          
        if (servicesError) throw servicesError;
        
        // Litiges
        const { count: disputesCount, error: disputesError } = await supabase
          .from('disputes')
          .select('*', { count: 'exact', head: true });
          
        if (disputesError) throw disputesError;
        
        setStats({
          usersCount: usersCount || 0,
          clientsCount,
          freelancesCount,
          adminsCount,
          ordersCount: ordersCount || 0,
          servicesCount: servicesCount || 0,
          disputesCount: disputesCount || 0
        });
        
      } catch (err: any) {
        console.error('Erreur lors du chargement des statistiques:', err);
        setError(err.message);
      } finally {
        setLoadingStats(false);
      }
    };
    
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  if (loading || loadingStats) {
    return (
      <div className="p-4">
        <h1 className="text-sm font-bold mb-4 text-gray-800 dark:text-vynal-text-primary">Tableau de bord Admin</h1>
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          <div className="h-24 bg-vynal-purple-secondary/30 rounded-lg"></div>
          <div className="h-24 bg-vynal-purple-secondary/30 rounded-lg"></div>
          <div className="h-24 bg-vynal-purple-secondary/30 rounded-lg"></div>
          <div className="h-24 bg-vynal-purple-secondary/30 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-sm font-bold mb-3 text-gray-800 dark:text-vynal-text-primary">Tableau de bord Admin</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-300 p-3 rounded-lg flex items-center gap-2 text-xs">
          <AlertTriangle className="h-4 w-4" />
          <span>Erreur lors du chargement des données: {error}</span>
        </div>
        <div className="mt-3">
          <Link 
            href="/admin/debug" 
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-vynal-accent-primary/80 dark:hover:bg-vynal-accent-primary px-3 py-1.5 rounded-lg inline-block text-xs"
          >
            Aller à la page de débogage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 text-gray-800 dark:text-vynal-text-primary">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-sm font-bold">Tableau de bord Admin</h1>
        <Link 
          href="/admin/debug" 
          className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-vynal-accent-primary/80 dark:hover:bg-vynal-accent-primary px-3 py-1 rounded-lg text-xs"
        >
          Page de débogage
        </Link>
      </div>
      
      {/* Bento grid layout - optimisé pour mobile et desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-min">
        {/* Carte utilisateurs principales - grande sur mobile et desktop */}
        <div className="col-span-2 row-span-1 md:row-span-2">
          <StatCard
            title="Utilisateurs"
            value={stats.usersCount}
            icon={<Users className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
            color="blue"
            height="h-full"
          />
        </div>
        
        {/* Carte clients */}
        <div className="col-span-1 row-span-1">
          <StatCard
            title="Clients"
            value={stats.clientsCount}
            icon={<Users className="h-5 w-5 text-green-500 dark:text-green-400" />}
            color="green"
            subtext={`${Math.round((stats.clientsCount / stats.usersCount) * 100) || 0}%`}
          />
        </div>
        
        {/* Carte freelances */}
        <div className="col-span-1 row-span-1">
          <StatCard
            title="Freelances"
            value={stats.freelancesCount}
            icon={<Users className="h-5 w-5 text-purple-500 dark:text-purple-400" />}
            color="purple"
            subtext={`${Math.round((stats.freelancesCount / stats.usersCount) * 100) || 0}%`}
          />
        </div>
        
        {/* Carte commandes */}
        <div className="col-span-1 row-span-1">
          <StatCard
            title="Commandes"
            value={stats.ordersCount}
            icon={<FileText className="h-5 w-5 text-amber-500 dark:text-amber-400" />}
            color="amber"
          />
        </div>
        
        {/* Carte services */}
        <div className="col-span-1 row-span-1">
          <StatCard
            title="Services"
            value={stats.servicesCount}
            icon={<PieChart className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />}
            color="cyan"
          />
        </div>
        
        {/* Carte litiges - large sur mobile */}
        <div className="col-span-2 row-span-1">
          <StatCard
            title="Litiges"
            value={stats.disputesCount}
            icon={<TrendingUp className="h-5 w-5 text-rose-500 dark:text-rose-400" />}
            color="rose"
            subtext={stats.ordersCount > 0 ? `${Math.round((stats.disputesCount / stats.ordersCount) * 100) || 0}% des commandes` : ''}
          />
        </div>
        
        {/* Carte administrateurs */}
        <div className="col-span-1 md:col-span-1 row-span-1">
          <StatCard
            title="Administrateurs"
            value={stats.adminsCount}
            icon={<Shield className="h-5 w-5 text-red-500 dark:text-red-400" />}
            color="red"
            subtext={`${Math.round((stats.adminsCount / stats.usersCount) * 100) || 0}%`}
          />
        </div>
        
        {/* Carte répartition - grande sur mobile, plus grande sur desktop */}
        <div className="col-span-2 md:col-span-3 row-span-1">
          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700/30 p-4 rounded-lg h-full shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs font-medium text-gray-600 dark:text-vynal-text-secondary mb-2">Répartition des utilisateurs</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs">Clients: {stats.clientsCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-xs">Freelances: {stats.freelancesCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs">Admins: {stats.adminsCount}</span>
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-vynal-text-secondary/80">Total: {stats.usersCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant de carte statistique
function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  subtext,
  height = ''
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: 'blue' | 'green' | 'purple' | 'red' | 'amber' | 'cyan' | 'rose'; 
  subtext?: string; 
  height?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-gray-800 dark:bg-blue-900/20 dark:border-blue-700/30 dark:text-vynal-text-primary',
    green: 'bg-green-50 border-green-200 text-gray-800 dark:bg-green-900/20 dark:border-green-700/30 dark:text-vynal-text-primary',
    purple: 'bg-purple-50 border-purple-200 text-gray-800 dark:bg-purple-900/20 dark:border-purple-700/30 dark:text-vynal-text-primary',
    red: 'bg-red-50 border-red-200 text-gray-800 dark:bg-red-900/20 dark:border-red-700/30 dark:text-vynal-text-primary',
    amber: 'bg-amber-50 border-amber-200 text-gray-800 dark:bg-amber-900/20 dark:border-amber-700/30 dark:text-vynal-text-primary',
    cyan: 'bg-cyan-50 border-cyan-200 text-gray-800 dark:bg-cyan-900/20 dark:border-cyan-700/30 dark:text-vynal-text-primary',
    rose: 'bg-rose-50 border-rose-200 text-gray-800 dark:bg-rose-900/20 dark:border-rose-700/30 dark:text-vynal-text-primary',
  };

  return (
    <div className={`${colorClasses[color]} ${height} border p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs font-medium text-gray-600 dark:text-vynal-text-secondary">{title}</h3>
          <p className="text-base font-bold mt-1">{value.toLocaleString()}</p>
          {subtext && <p className="text-xs text-gray-500 dark:text-vynal-text-secondary/80 mt-1">{subtext}</p>}
        </div>
        <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
} 