"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  CheckCircle2,
  Info,
  Search,
  RefreshCw,
  Eye,
  XCircle,
  ArrowUpDown,
  Clock,
  X,
  Loader2,
  SearchX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@supabase/supabase-js';
import { Alert, fetchAlerts, fetchFilteredAlerts, updateAlertStatus, runSystemChecks, generateTestAlerts } from './api';
import { getAlerts } from './actions';
import AlertDetailModal from './AlertDetailModal';
import { toast, Toaster } from 'sonner';
import { getCachedData, setCachedData, CACHE_EXPIRY, CACHE_KEYS } from '@/lib/optimizations';
import { AlertStatus } from '@/utils/alertService';

// Fonction pour formater la date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Fonction pour obtenir l'icône selon le type d'alerte
const getAlertIcon = (type: string) => {
  switch (type) {
    case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'info': return <Info className="h-4 w-4 text-blue-500" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

// Fonction pour obtenir la couleur du badge selon le statut
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active': 
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">Actif</Badge>;
    case 'investigating': 
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">En cours d'investigation</Badge>;
    case 'resolved': 
      return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Résolu</Badge>;
    default: 
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Fonction pour obtenir la couleur du badge selon la priorité
const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high': 
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">Haute</Badge>;
    case 'medium': 
      return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">Moyenne</Badge>;
    case 'low': 
      return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Basse</Badge>;
    default: 
      return <Badge variant="outline">{priority}</Badge>;
  }
};

export default function AlertsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const itemsPerPage = 20;

  // Fonction pour recharger les alertes
  const reloadAlerts = useCallback(async (forceFetch = false) => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer les alertes depuis le cache
      const cachedAlerts = getCachedData<Alert[]>(CACHE_KEYS.ADMIN_ALERTS);
      
      // Vérifier que cachedAlerts est un tableau valide
      if (Array.isArray(cachedAlerts) && cachedAlerts.length > 0 && 
          cachedAlerts.every(item => 
            typeof item === 'object' && 
            item !== null && 
            'id' in item && 
            'title' in item && 
            'description' in item && 
            'status' in item
          )) {
        setAlerts(cachedAlerts);
        
        // Récupérer les méta-informations de pagination
        const paginationInfo = getCachedData<{ totalPages: number, total: number }>(`${CACHE_KEYS.ADMIN_ALERTS}_pagination`);
        if (paginationInfo && typeof paginationInfo === 'object' && 
            'totalPages' in paginationInfo && 'total' in paginationInfo) {
          setTotalPages(paginationInfo.totalPages);
          setTotalAlerts(paginationInfo.total);
        } else {
          setTotalPages(1);
          setTotalAlerts(cachedAlerts.length);
        }
      } else {
        // Si pas de données en cache, initialiser avec un tableau vide
        setAlerts([]);
        setTotalPages(1);
        setTotalAlerts(0);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des alertes:', err);
      setError('Erreur lors du chargement des alertes');
      setAlerts([]);
      setTotalPages(1);
      setTotalAlerts(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour forcer le rafraîchissement des alertes
  const handleForceRefresh = () => {
    // Forcer le rafraîchissement des données
    reloadAlerts(true);
    
    // Invalider explicitement le cache
    setCachedData(
      CACHE_KEYS.ADMIN_ALERTS,
      null,
      { expiry: 0 } // Expiration immédiate = invalidation
    );
    
    // Invalider aussi le cache de pagination
    setCachedData(
      `${CACHE_KEYS.ADMIN_ALERTS}_pagination`,
      null,
      { expiry: 0 }
    );
    
    toast.success('Données actualisées');
  };
  
  // Fonction pour invalider le cache des alertes
  const invalidateAlertsCache = () => {
    // Invalider le cache des alertes
    setCachedData(
      CACHE_KEYS.ADMIN_ALERTS,
      null,
      { expiry: 0 }
    );
    
    // Invalider aussi le cache de pagination
    setCachedData(
      `${CACHE_KEYS.ADMIN_ALERTS}_pagination`,
      null,
      { expiry: 0 }
    );
    
    // Émettre un événement pour informer les autres composants
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vynal:alerts-updated'));
      window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { 
        detail: { key: CACHE_KEYS.ADMIN_ALERTS }
      }));
    }
  };

  // Écouter les événements de mise à jour des alertes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleAlertsUpdated = () => {
        console.log('Alertes mises à jour, rafraîchissement des données...');
        reloadAlerts(true);
      };
      
      // Ajouter l'écouteur d'événements
      window.addEventListener('vynal:alerts-updated', handleAlertsUpdated);
      window.addEventListener('vynal:cache-invalidated', (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.key === CACHE_KEYS.ADMIN_ALERTS) {
          handleAlertsUpdated();
        }
      });
      
      // Nettoyer l'écouteur lors du démontage
      return () => {
        window.removeEventListener('vynal:alerts-updated', handleAlertsUpdated);
        window.removeEventListener('vynal:cache-invalidated', (event) => {});
      };
    }
  }, [reloadAlerts]);

  // Charger les alertes depuis l'API
  useEffect(() => {
    reloadAlerts();
  }, [reloadAlerts]);

  // Fonction pour marquer une alerte comme résolue
  const markAsResolved = async (id: string): Promise<boolean> => {
    try {
      // Mettre à jour le cache local
      const cachedAlerts = getCachedData<Alert[]>(CACHE_KEYS.ADMIN_ALERTS) || [];
      const updatedAlerts = cachedAlerts.map(alert => 
        alert.id === id ? { ...alert, status: 'resolved' as AlertStatus } : alert
      );
      
      setCachedData(CACHE_KEYS.ADMIN_ALERTS, updatedAlerts, { expiry: CACHE_EXPIRY.LONG, priority: 'high' });
      setAlerts(updatedAlerts);
      
      toast.success('Alerte marquée comme résolue');
      return true;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    }
  };

  // Fonction pour marquer une alerte comme en cours d'investigation
  const markAsInvestigating = async (id: string): Promise<boolean> => {
    try {
      // Mettre à jour le cache local
      const cachedAlerts = getCachedData<Alert[]>(CACHE_KEYS.ADMIN_ALERTS) || [];
      const updatedAlerts = cachedAlerts.map(alert => 
        alert.id === id ? { ...alert, status: 'investigating' as AlertStatus } : alert
      );
      
      setCachedData(CACHE_KEYS.ADMIN_ALERTS, updatedAlerts, { expiry: CACHE_EXPIRY.LONG, priority: 'high' });
      setAlerts(updatedAlerts);
      
      toast.success('Alerte marquée comme en cours d\'investigation');
      return true;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    }
  };

  // Fonction pour générer des alertes de test (en développement)
  const handleGenerateTestAlerts = async () => {
    toast.info('La génération de tests est désactivée');
  };

  // Fonction pour exécuter les vérifications système
  const handleRunSystemChecks = async () => {
    toast.info('Les vérifications système sont désactivées');
  };

  // Filtrer les alertes selon les critères
  const filteredAlerts = Array.isArray(alerts) ? alerts.filter(alert => {
    const matchesSearch = 
      searchTerm === '' || 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      activeTab === 'all' || 
      (activeTab === 'active' && alert.status === 'active') ||
      (activeTab === 'investigating' && alert.status === 'investigating') ||
      (activeTab === 'resolved' && alert.status === 'resolved');

    return matchesSearch && matchesStatus;
  }) : [];

  // Fonction pour fermer le modal
  const closeAlertDetails = () => {
    // Fermer le modal proprement
    setShowDetailsDialog(false);
    // Réinitialiser l'alerte courante seulement après la fermeture du modal
    setTimeout(() => {
      setCurrentAlert(null);
    }, 300);
  };

  // Fonction pour ouvrir le modal de détails d'une alerte
  const openAlertDetails = (alert: Alert) => {
    // S'assurer que le modal est fermé avant de l'ouvrir à nouveau
    // pour éviter les problèmes de clignotement
    if (showDetailsDialog) {
      setShowDetailsDialog(false);
      // Utiliser setTimeout pour laisser le temps au modal de se fermer complètement
      setTimeout(() => {
        setCurrentAlert(alert);
        setShowDetailsDialog(true);
      }, 100);
    } else {
      setCurrentAlert(alert);
      setShowDetailsDialog(true);
    }
  };

  const handleFilter = (type: string | null, status: string | null) => {
    setFilterType(type);
    setFilterStatus(status);
    setCurrentPage(1); // Reset to first page when applying filters
  };

  const handleClearFilters = () => {
    setFilterType(null);
    setFilterStatus(null);
    setSearchTerm('');
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Administration - Alertes</h1>
          <p className="text-[9px] text-gray-600 dark:text-gray-400 mt-0.5">
            Gestion et surveillance des alertes système
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-500">Actives</p>
                <p className="text-sm font-bold text-red-500">{Array.isArray(alerts) ? alerts.filter(a => a.status === 'active').length : 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">En investigation</p>
                <p className="text-sm font-bold text-blue-500">{Array.isArray(alerts) ? alerts.filter(a => a.status === 'investigating').length : 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Résolues</p>
                <p className="text-sm font-bold text-green-500">{Array.isArray(alerts) ? alerts.filter(a => a.status === 'resolved').length : 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toaster pour les notifications */}
      <Toaster position="top-right" />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Rechercher par titre, description..."
            className="pl-10 py-2 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="hidden sm:inline-block text-[9px] text-gray-500 dark:text-vynal-text-secondary">
            {Array.isArray(filteredAlerts) ? filteredAlerts.filter(a => a.status === 'active').length : 0} alerte(s) active(s)
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[9px]"
            onClick={handleForceRefresh}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Actualiser
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[9px] bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
            onClick={handleRunSystemChecks}
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Vérification système
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-[9px] bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400"
              onClick={handleGenerateTestAlerts}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Générer des tests
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="space-y-3">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex gap-1 text-xs flex-1">
            <Bell className="h-3 w-3" />
            <span>Toutes ({Array.isArray(alerts) ? alerts.length : 0})</span>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex gap-1 text-xs flex-1">
            <AlertCircle className="h-3 w-3" />
            <span>Actives ({Array.isArray(alerts) ? alerts.filter(a => a.status === 'active').length : 0})</span>
          </TabsTrigger>
          <TabsTrigger value="investigating" className="flex gap-1 text-xs flex-1">
            <Clock className="h-3 w-3" />
            <span>En investigation ({Array.isArray(alerts) ? alerts.filter(a => a.status === 'investigating').length : 0})</span>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex gap-1 text-xs flex-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Résolues ({Array.isArray(alerts) ? alerts.filter(a => a.status === 'resolved').length : 0})</span>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Liste des alertes</CardTitle>
            <CardDescription className="text-xs">
              {Array.isArray(filteredAlerts) ? filteredAlerts.length : 0} alerte(s) {activeTab !== 'all' ? activeTab : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-xs">Type</TableHead>
                    <TableHead className="text-xs">Titre</TableHead>
                    <TableHead className="w-[140px] text-xs">
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px] text-xs">Source</TableHead>
                    <TableHead className="w-[130px] text-xs">Priorité</TableHead>
                    <TableHead className="w-[160px] text-xs">Statut</TableHead>
                    <TableHead className="text-right w-[100px] text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          <span className="ml-2 text-xs">Chargement...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert) => (
                      <TableRow 
                        key={alert.id} 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        onClick={() => openAlertDetails(alert)}
                      >
                        <TableCell className="w-[50px]">
                          {alert.type === 'error' ? <AlertCircle className="h-3 w-3 text-red-500" /> : 
                                    alert.type === 'warning' ? <AlertTriangle className="h-3 w-3 text-amber-500" /> : 
                           <Info className="h-3 w-3 text-blue-500" />}
                        </TableCell>
                        <TableCell className="font-medium text-xs">{alert.title}</TableCell>
                        <TableCell className="text-xs">{formatDate(alert.timestamp)}</TableCell>
                        <TableCell className="text-xs">
                          <span className="capitalize">{alert.source}</span>
                        </TableCell>
                        <TableCell className="text-xs">{getPriorityBadge(alert.priority)}</TableCell>
                        <TableCell className="text-xs">{getStatusBadge(alert.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAlertDetails(alert);
                              }}
                              title="Voir les détails"
                            >
                              <Eye className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                              <span className="sr-only">Détails</span>
                            </Button>
                            {alert.status !== 'resolved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsResolved(alert.id);
                                }}
                                title="Marquer comme résolu"
                              >
                                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                                <span className="sr-only">Marquer comme résolu</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-xs">
                        Aucune alerte trouvée.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Tabs>

      {/* Modal de détails d'alerte */}
      <AlertDetailModal
        isOpen={showDetailsDialog}
        onClose={closeAlertDetails}
        alert={currentAlert}
        onMarkAsResolved={markAsResolved}
        onMarkAsInvestigating={markAsInvestigating}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Affichage de <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalAlerts)}
                </span>{" "}
                sur <span className="font-medium">{totalAlerts}</span> alertes
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-l-md"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
              <Button 
                  variant="outline"
                size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
              >
                  <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                  variant="outline"
                size="sm"
                  className="rounded-r-md"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
              >
                  <ChevronsRight className="h-4 w-4" />
              </Button>
              </nav>
            </div>
          </div>
        </div>
            )}
    </div>
  );
} 