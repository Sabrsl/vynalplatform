"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { getCachedData, setCachedData, CACHE_EXPIRY, CACHE_KEYS } from '@/lib/optimizations';
import { AlertTriangle, Search, UserCheck, RefreshCw, User, Mail, Calendar, Shield, PencilLine, Eye, X, Loader2, BarChart3, CheckCircle2 } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Info } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Type pour les utilisateurs
interface UserData {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  role: 'client' | 'freelance' | 'admin' | null;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
  is_active?: boolean;
  is_suspended?: boolean;
}

// Formater la date en format français
const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

export default function AdminUsersPage() {
  const { isAdmin, loading } = useUser();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'settings'>('profile');
  const [copySuccess, setCopySuccess] = useState(false);
  const [suspendingUser, setSuspendingUser] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: false,
    marketingCommunications: false
  });
  const usersPerPage = 15;

  // Fonction pour copier l'email
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Erreur lors de la copie:', err);
      });
  };

  // Charger les utilisateurs
  const fetchUsers = useCallback(async (forceFetch = false) => {
    try {
      setLoadingUsers(true);
      
      // Vérifier d'abord le cache si on ne force pas le rechargement
      if (!forceFetch) {
        const cachedUsers = getCachedData<UserData[]>(CACHE_KEYS.ADMIN_USERS_LIST);
        if (cachedUsers && Array.isArray(cachedUsers) && cachedUsers.length > 0) {
          setUsers(cachedUsers);
          setLoadingUsers(false);
          return;
        }
      }
      
      // Si pas de cache ou forceFetch, charger depuis l'API
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Vérifier que les données sont bien un tableau
      if (!data || !Array.isArray(data)) {
        throw new Error('Format de données invalide');
      }
      
      setUsers(data as UserData[]);
      
      // Mettre en cache les données pour une durée maximale (invalidation manuelle)
      setCachedData(
        CACHE_KEYS.ADMIN_USERS_LIST, 
        data as UserData[], 
        { expiry: CACHE_EXPIRY.LONG, priority: 'high' }
      );
    } catch (err: any) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError(err.message);
      setUsers([]); // Initialiser à un tableau vide en cas d'erreur
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Charger les paramètres de notification d'un utilisateur
  const loadUserNotificationSettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('email_notifications, marketing_communications')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // L'utilisateur n'a pas encore de paramètres, utiliser des valeurs par défaut
          setNotificationSettings({
            emailNotifications: false,
            marketingCommunications: false
          });
        } else {
          console.error('Erreur lors du chargement des paramètres:', error);
        }
        return;
      }
      
      // Mettre à jour l'état avec les paramètres récupérés
      if (data) {
        setNotificationSettings({
          emailNotifications: data.email_notifications || false,
          marketingCommunications: data.marketing_communications || false
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres de notification:', err);
    }
  };

  // Mettre à jour les paramètres de notification
  const updateNotificationSetting = async (userId: string, setting: 'email_notifications' | 'marketing_communications', value: boolean) => {
    try {
      // Vérifier si l'utilisateur a déjà des paramètres
      const { data: existingSettings, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      let updateError;
      
      if (existingSettings) {
        // Mettre à jour les paramètres existants
        const { error } = await supabase
          .from('user_settings')
          .update({ [setting]: value, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
          
        updateError = error;
      } else {
        // Créer de nouveaux paramètres
        const { error } = await supabase
          .from('user_settings')
          .insert({ 
            user_id: userId, 
            [setting]: value,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        updateError = error;
      }
      
      if (updateError) throw updateError;
      
      // Mettre à jour l'état local
      setNotificationSettings(prev => ({
        ...prev,
        [setting === 'email_notifications' ? 'emailNotifications' : 'marketingCommunications']: value
      }));
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour des paramètres:', err);
    }
  };

  // Suspendre un utilisateur
  const suspendUser = async (userId: string) => {
    try {
      setSuspendingUser(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Mettre à jour l'état local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, is_suspended: true, updated_at: new Date().toISOString() } : user
        )
      );
      
      // Si l'utilisateur est actuellement affiché dans le modal, mettre à jour ses infos
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({
          ...currentUser,
          is_suspended: true,
          updated_at: new Date().toISOString()
        });
      }
      
      toast.success(`L'utilisateur a été suspendu avec succès.`);
      
    } catch (err: any) {
      console.error('Erreur lors de la suspension de l\'utilisateur:', err);
      toast.error(`Erreur lors de la suspension: ${err.message}`);
    } finally {
      setSuspendingUser(false);
    }
  };

  // Désactiver un utilisateur
  const deactivateUser = async (userId: string) => {
    try {
      setDeactivatingUser(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Mettre à jour l'état local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, is_active: false, updated_at: new Date().toISOString() } : user
        )
      );
      
      // Si l'utilisateur est actuellement affiché dans le modal, mettre à jour ses infos
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({
          ...currentUser,
          is_active: false,
          updated_at: new Date().toISOString()
        });
      }
      
      toast.success(`L'utilisateur a été désactivé avec succès.`);
      
    } catch (err: any) {
      console.error('Erreur lors de la désactivation de l\'utilisateur:', err);
      toast.error(`Erreur lors de la désactivation: ${err.message}`);
    } finally {
      setDeactivatingUser(false);
    }
  };

  // Changer le rôle d'un utilisateur
  const changeUserRole = async (userId: string, newRole: 'client' | 'freelance' | 'admin') => {
    try {
      setUpdatingUser(userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Mettre à jour l'état local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole, updated_at: new Date().toISOString() } : user
        )
      );
      
      // Si l'utilisateur est actuellement affiché dans le modal, mettre à jour ses infos
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({
          ...currentUser,
          role: newRole,
          updated_at: new Date().toISOString()
        });
      }
      
      toast.success(`Le rôle de l'utilisateur a été mis à jour en ${newRole}.`);
      
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du rôle:', err);
      toast.error(`Erreur lors de la mise à jour du rôle: ${err.message}`);
    } finally {
      setUpdatingUser(null);
    }
  };

  // Ajouter une fonction pour mettre à jour le nom d'utilisateur
  const updateUsername = async (userId: string, newUsername: string) => {
    try {
      setUpdatingUser(userId);
      
      // Vérifier si le nom d'utilisateur est déjà pris
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', newUsername)
        .neq('id', userId)
        .single();
        
      if (existingUser) {
        toast.error('Ce nom d\'utilisateur est déjà pris.');
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          username: newUsername,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Mettre à jour l'état local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, username: newUsername, updated_at: new Date().toISOString() } : user
        )
      );
      
      // Si l'utilisateur est actuellement affiché dans le modal, mettre à jour ses infos
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({
          ...currentUser,
          username: newUsername,
          updated_at: new Date().toISOString()
        });
      }
      
      toast.success(`Le nom d'utilisateur a été mis à jour avec succès.`);
      
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du nom d\'utilisateur:', err);
      toast.error(`Erreur lors de la mise à jour: ${err.message}`);
    } finally {
      setUpdatingUser(null);
    }
  };

  // Initialisation et chargement des données
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);
  
  // Fonction pour forcer le rafraîchissement des données
  const handleRefresh = () => {
    fetchUsers(true);
  };

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = users.filter(user => 
    (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.role?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Fonction pour ouvrir le modal de détails d'un utilisateur
  const openUserDetails = (user: UserData) => {
    if (showUserDetails) {
      setShowUserDetails(false);
      setTimeout(() => {
        setCurrentUser(user);
        setShowUserDetails(true);
        // Charger les paramètres de notification
        loadUserNotificationSettings(user.id);
      }, 100);
    } else {
      setCurrentUser(user);
      setShowUserDetails(true);
      // Charger les paramètres de notification
      loadUserNotificationSettings(user.id);
    }
  };

  // Fonction pour fermer le modal de détails
  const closeUserDetails = () => {
    setShowUserDetails(false);
    setTimeout(() => {
      setCurrentUser(null);
    }, 300);
  };

  // Fonction pour obtenir le badge de rôle avec le bon style
  const getRoleBadge = (role: string | null) => {
    if (!role) return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300 text-[10px]">
        Non défini
      </Badge>
    );

    switch (role) {
      case 'admin':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-[10px]">
            <Shield className="h-2.5 w-2.5 mr-0.5" />
            Admin
          </Badge>
        );
      case 'freelance':
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-[10px]">
            <UserCheck className="h-2.5 w-2.5 mr-0.5" />
            Freelance
          </Badge>
        );
      case 'client':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px]">
            <User className="h-2.5 w-2.5 mr-0.5" />
            Client
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300 text-[10px]">
            {role}
          </Badge>
        );
    }
  };

  // Si l'utilisateur n'est pas administrateur ou que les données sont en cours de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 sm:p-4">
        <h1 className="text-sm font-bold mb-3 text-gray-800 dark:text-vynal-text-primary">Gestion des utilisateurs</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-300 p-2 rounded-md flex items-center gap-2 text-xs">
          <AlertTriangle className="h-4 w-4" />
          <span>Erreur: {error}</span>
        </div>
        <button 
          onClick={handleRefresh}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white dark:bg-vynal-accent-primary/80 dark:hover:bg-vynal-accent-primary px-3 py-1 rounded-md flex items-center gap-1 text-xs"
        >
          <RefreshCw className="h-3 w-3" />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Administration - Utilisateurs</h1>
          <p className="text-[9px] text-gray-600 dark:text-gray-400 mt-0.5">
            Gestion et surveillance des utilisateurs de la plateforme
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-medium text-gray-700 dark:text-gray-300">Total utilisateurs:</span>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 text-[9px]">
              {users.length}
            </Badge>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchUsers(true)}
            disabled={loadingUsers}
            className="flex items-center gap-1 h-6 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`h-2.5 w-2.5 ${loadingUsers ? 'animate-spin' : ''}`} />
            <span className="text-[9px]">Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-2.5 w-2.5 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Rechercher un utilisateur..."
              className="pl-9 w-full h-6 text-[9px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'profile' | 'activity' | 'settings')}
          >
            <SelectTrigger className="w-full sm:w-[220px] h-6 text-[9px]">
              <SelectValue placeholder="Filtrer par rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[9px]">Tous les rôles</SelectItem>
              <SelectItem value="client" className="text-[9px]">Clients</SelectItem>
              <SelectItem value="freelance" className="text-[9px]">Freelances</SelectItem>
              <SelectItem value="admin" className="text-[9px]">Administrateurs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loadingUsers ? (
          Array(6).fill(0).map((_, index) => (
            <div key={`skeleton-${index}`} className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="text-center py-6">
            <Info className="h-6 w-6 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun utilisateur trouvé</h3>
            <p className="mt-0.5 text-[10px] text-gray-600 dark:text-gray-400">
              Aucun utilisateur ne correspond à vos critères de recherche.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-2 text-[10px] h-7 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800" 
              onClick={() => {
                setSearchTerm('');
                setActiveTab('profile');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map(user => (
              <div 
                key={user.id}
                className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                  user.is_suspended 
                    ? 'bg-red-50/50 dark:bg-red-900/10'
                    : !user.is_active
                      ? 'bg-yellow-50/50 dark:bg-yellow-900/10'
                      : ''
                }`}
                onClick={() => openUserDetails(user)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden relative">
                      {user.avatar_url ? (
                        <Image 
                          src={user.avatar_url} 
                          alt={user.username || ''} 
                          className="object-cover" 
                          fill
                          sizes="32px"
                          unoptimized={user.avatar_url.startsWith('data:')}
                        />
                      ) : (
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-gray-900 dark:text-white">
                          {user.full_name || user.username || 'Utilisateur sans nom'}
                        </span>
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-[9px] text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {user.is_suspended ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-[9px]">
                          Suspendu
                        </Badge>
                      ) : !user.is_active ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 text-[9px]">
                          Inactif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-[9px]">
                          Actif
                        </Badge>
                      )}
                    </div>
                    <div className="text-[8px] text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="h-2 w-2" />
                      {formatDate(user.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de détails utilisateur */}
      {showUserDetails && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeUserDetails}>
          <div 
            className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-xl mx-2 sm:mx-0 max-h-[90vh] overflow-auto p-4 sm:p-6 relative" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton de fermeture */}
            <button 
              onClick={closeUserDetails}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </button>
            
            {/* En-tête */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-vynal-purple-secondary/20 flex items-center justify-center overflow-hidden border-2 border-vynal-accent-primary/30 relative">
                  {currentUser.avatar_url ? (
                    <Image 
                      src={currentUser.avatar_url} 
                      alt={currentUser.username || ''} 
                      className="object-cover" 
                      fill
                      sizes="56px"
                      unoptimized={currentUser.avatar_url.startsWith('data:')}
                    />
                  ) : (
                    <User className="h-7 w-7 text-gray-500 dark:text-vynal-text-secondary" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold">{currentUser.full_name || currentUser.username || 'Utilisateur'}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(currentUser.role)}
                    <span className="text-xs text-gray-500 dark:text-vynal-text-secondary/80">
                      {currentUser.id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800/50 px-2 py-1 rounded text-xs text-gray-700 dark:text-gray-300">
                  {new Date(currentUser.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between bg-gray-50 dark:bg-gray-800/30 p-2 rounded-md text-xs gap-2">
                <div className="flex flex-col gap-1 text-gray-500 dark:text-vynal-text-secondary/80">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Inscrit le {formatDate(currentUser.created_at)}
                  </span>
                  {currentUser.updated_at !== currentUser.created_at && (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Mis à jour le {formatDate(currentUser.updated_at)}
                    </span>
                  )}
                </div>
                
                <div>
                  <span className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                    ID: {currentUser.id}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Contenu */}
            <div className="space-y-4">
              {/* Onglets */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-4">
                  <button 
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === 'profile' 
                        ? 'border-vynal-accent-primary text-vynal-accent-primary' 
                        : 'border-transparent text-gray-500 dark:text-vynal-text-secondary hover:text-gray-700 dark:hover:text-vynal-text-primary'
                    }`}
                    onClick={() => setActiveTab('profile')}
                  >
                    Profil
                  </button>
                  <button 
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === 'activity' 
                        ? 'border-vynal-accent-primary text-vynal-accent-primary' 
                        : 'border-transparent text-gray-500 dark:text-vynal-text-secondary hover:text-gray-700 dark:hover:text-vynal-text-primary'
                    }`}
                    onClick={() => setActiveTab('activity')}
                  >
                    Activité
                  </button>
                  <button 
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === 'settings' 
                        ? 'border-vynal-accent-primary text-vynal-accent-primary' 
                        : 'border-transparent text-gray-500 dark:text-vynal-text-secondary hover:text-gray-700 dark:hover:text-vynal-text-primary'
                    }`}
                    onClick={() => setActiveTab('settings')}
                  >
                    Paramètres
                  </button>
                </div>
              </div>
              
              {/* Contenu de l'onglet Profil */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  {/* Informations de contact */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-vynal-accent-primary/70" />
                      Informations de contact
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">Adresse email</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs break-all">{currentUser.email || 'Non renseignée'}</p>
                          {currentUser.email && (
                            <button 
                              onClick={() => copyToClipboard(currentUser.email || '')}
                              className={`p-1 rounded transition-colors ${
                                copySuccess 
                                  ? 'text-green-500 bg-green-50 dark:bg-green-900/20' 
                                  : 'text-vynal-accent-primary/70 hover:text-vynal-accent-primary hover:bg-vynal-accent-primary/10'
                              }`}
                              title={copySuccess ? "Copié!" : "Copier l'email"}
                            >
                              {copySuccess ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <PencilLine className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">Nom d'utilisateur</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs">{currentUser.username ? `@${currentUser.username}` : 'Non renseigné'}</p>
                          <button 
                            onClick={() => {
                              const newUsername = prompt('Entrez le nouveau nom d\'utilisateur:', currentUser.username || '');
                              if (newUsername && newUsername !== currentUser.username) {
                                updateUsername(currentUser.id, newUsername);
                              }
                            }}
                            className="p-1 rounded transition-colors text-vynal-accent-primary/70 hover:text-vynal-accent-primary hover:bg-vynal-accent-primary/10"
                            title="Modifier le nom d'utilisateur"
                          >
                            <PencilLine className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Statistiques */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold flex items-center gap-1">
                      <BarChart3 className="h-3.5 w-3.5 text-vynal-accent-primary/70" />
                      Statistiques
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                        <span className="text-gray-500 dark:text-vynal-text-secondary/80 mb-1">Commandes</span>
                        <span className="text-lg font-semibold">0</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                        <span className="text-gray-500 dark:text-vynal-text-secondary/80 mb-1">Services</span>
                        <span className="text-lg font-semibold">0</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                        <span className="text-gray-500 dark:text-vynal-text-secondary/80 mb-1">Litiges</span>
                        <span className="text-lg font-semibold">0</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                        <span className="text-gray-500 dark:text-vynal-text-secondary/80 mb-1">Jours</span>
                        <span className="text-lg font-semibold">{Math.ceil((new Date().getTime() - new Date(currentUser.created_at).getTime()) / (1000 * 60 * 60 * 24))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Contenu de l'onglet Activité */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xs font-semibold mb-2">Historique des connexions</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-vynal-text-secondary">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        <div className="flex-1">Dernière connexion aujourd'hui</div>
                        <div className="text-[10px]">IP: 192.168.1.xxx</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-vynal-text-secondary">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                        <div className="flex-1">Connexion il y a 2 jours</div>
                        <div className="text-[10px]">IP: 192.168.1.xxx</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xs font-semibold mb-2">Activités récentes</h3>
                    <div className="text-xs text-gray-500 dark:text-vynal-text-secondary text-center p-3">
                      Aucune activité récente à afficher
                    </div>
                  </div>
                </div>
              )}
              
              {/* Contenu de l'onglet Paramètres */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  {/* Actions utilisateur */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-vynal-accent-primary/70" />
                      Actions administratives
                    </h3>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3 text-gray-500" />
                            <span className="text-xs font-medium">Modifier le rôle</span>
                          </div>
                          
                          <Select
                            value={currentUser.role || "non-défini"}
                            onValueChange={(value) => {
                              if (value !== "non-défini") {
                                changeUserRole(currentUser.id, value as 'client' | 'freelance' | 'admin');
                              }
                            }}
                            disabled={updatingUser === currentUser.id}
                          >
                            <SelectTrigger className="h-7 w-32 text-xs border-gray-300 dark:border-vynal-purple-secondary/30 bg-white dark:bg-vynal-purple-darkest/50 dark:text-vynal-text-primary">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="non-défini" disabled>Sélectionner...</SelectItem>
                              <SelectItem value="client">Client</SelectItem>
                              <SelectItem value="freelance">Freelance</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          className="bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-800/30 p-2 rounded-md flex items-center justify-center gap-1 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                          onClick={() => suspendUser(currentUser.id)}
                          disabled={suspendingUser || deactivatingUser}
                        >
                          {suspendingUser ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Traitement...
                            </>
                          ) : (
                            <>
                              <PencilLine className="h-3 w-3" />
                              Suspendre
                            </>
                          )}
                        </button>
                        <button 
                          className="bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800/30 p-2 rounded-md flex items-center justify-center gap-1 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          onClick={() => deactivateUser(currentUser.id)}
                          disabled={suspendingUser || deactivatingUser}
                        >
                          {deactivatingUser ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Traitement...
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3" />
                              Désactiver
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xs font-semibold mb-2">Paramètres de notification</h3>
                    <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-xs">Envoyer des notifications par email</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => {
                          updateNotificationSetting(currentUser.id, 'email_notifications', e.target.checked);
                        }}
                        className="h-3 w-3"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2">
                      <span className="text-xs">Autoriser les communications marketing</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.marketingCommunications}
                        onChange={(e) => {
                          updateNotificationSetting(currentUser.id, 'marketing_communications', e.target.checked);
                        }}
                        className="h-3 w-3"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Pied de page */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-2">
              <div className="text-xs text-gray-500 dark:text-vynal-text-secondary/80 flex items-center">
                <span className="animate-pulse mr-1 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                Utilisateur actuellement en ligne
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={closeUserDetails}
                  size="sm"
                  className="text-xs"
                >
                  Fermer
                </Button>
                <Button 
                  variant="default"
                  size="sm"
                  className="text-xs bg-vynal-accent-primary hover:bg-vynal-accent-primary/90"
                  onClick={() => window.location.href = `mailto:${currentUser.email}`}
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Contacter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 