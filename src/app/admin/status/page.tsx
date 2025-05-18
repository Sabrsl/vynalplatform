"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Clock, 
  Info, 
  Shield, 
  Plus,
  Filter,
  Search
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  SystemFeature, 
  SystemIncident, 
  IncidentUpdate, 
  FeatureStatus, 
  IncidentStatus, 
  IncidentSeverity,
  SystemStatus,
  ComponentType
} from '@/types/system-status';
import SystemStatusService from '@/lib/services/systemStatusService';
import IncidentUpdateForm from '@/components/admin/IncidentUpdateForm';
import { useToast } from "@/components/ui/use-toast";

// Composant pour afficher l'état du système
export default function AdminStatusPage() {
  const { toast } = useToast();
  const [features, setFeatures] = useState<SystemFeature[]>([]);
  const [incidents, setIncidents] = useState<SystemIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<SystemFeature | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<SystemIncident | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Filtres
  const [activeFilter, setActiveFilter] = useState<FeatureStatus | null>(null);
  const [componentFilter, setComponentFilter] = useState<ComponentType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // États pour les formulaires
  const [statusUpdateFormOpen, setStatusUpdateFormOpen] = useState(false);
  const [incidentUpdateFormOpen, setIncidentUpdateFormOpen] = useState(false);

  // Fonction pour charger les données
  const loadData = async () => {
    setRefreshing(true);
    try {
      // Utiliser les API endpoints spécifiques
      const featuresResponse = await fetch('/api/status/features');
      const incidentsResponse = await fetch('/api/status/incidents');
      
      if (!featuresResponse.ok || !incidentsResponse.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }
      
      const featuresData = await featuresResponse.json();
      const incidentsData = await incidentsResponse.json();
      
      console.log("Fonctionnalités chargées:", featuresData.length);
      console.log("Incidents chargés:", incidentsData.length);
      
      setFeatures(featuresData);
      setIncidents(incidentsData);
      
      toast({
        title: "Données actualisées",
        description: "Les informations ont été mises à jour avec succès.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données. Veuillez réessayer.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ouvrir le panneau de détails pour une fonctionnalité
  const handleFeatureClick = async (feature: SystemFeature) => {
    setSelectedFeature(feature);
    setLoading(true);
    
    try {
      // Récupérer les incidents liés à cette fonctionnalité
      const relatedIncidents = await SystemStatusService.getIncidentsByFeatureId(feature.id);
      
      // S'il y a des incidents, sélectionner le plus récent non résolu ou le plus récent résolu
      if (relatedIncidents.length > 0) {
        const activeIncidents = relatedIncidents.filter(incident => incident.status !== 'resolved');
        if (activeIncidents.length > 0) {
          setSelectedIncident(activeIncidents[0]); // Le plus récent incident actif
        } else {
          setSelectedIncident(relatedIncidents[0]); // Le plus récent incident résolu
        }
      } else {
        setSelectedIncident(null);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des incidents liés:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les incidents associés à cette fonctionnalité.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSheetOpen(true);
    }
  };

  // Obtenir le badge de statut pour une fonctionnalité
  const getStatusBadge = (status: FeatureStatus) => {
    switch (status) {
      case 'functional':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 flex items-center gap-1 text-[9px]">
            <CheckCircle className="w-3 h-3" />
            <span>Fonctionnelle</span>
          </Badge>
        );
      case 'degraded':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 flex items-center gap-1 text-[9px]">
            <AlertTriangle className="w-3 h-3" />
            <span>Dégradée</span>
          </Badge>
        );
      case 'down':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 flex items-center gap-1 text-[9px]">
            <AlertCircle className="w-3 h-3" />
            <span>En panne</span>
          </Badge>
        );
      default:
        return null;
    }
  };

  // Obtenir le badge de statut pour un incident
  const getIncidentStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'investigating':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 text-[9px]">
            En cours d'investigation
          </Badge>
        );
      case 'identified':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 text-[9px]">
            Problème identifié
          </Badge>
        );
      case 'monitoring':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 text-[9px]">
            Surveillance en cours
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-[9px]">
            Résolu
          </Badge>
        );
      default:
        return null;
    }
  };

  // Obtenir le badge de sévérité pour un incident
  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'low':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 text-[9px]">
            Faible
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 text-[9px]">
            Moyenne
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800 text-[9px]">
            Élevée
          </Badge>
        );
      case 'critical':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-[9px]">
            Critique
          </Badge>
        );
      default:
        return null;
    }
  };

  // Formatter une date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    }).format(date);
  };

  // Filtrer les fonctionnalités selon les critères
  const getFilteredFeatures = () => {
    let filtered = [...features];
    
    // Filtrer par statut
    if (activeFilter) {
      filtered = filtered.filter(feature => feature.status === activeFilter);
    }
    
    // Filtrer par type de composant
    if (componentFilter !== "all") {
      filtered = filtered.filter(feature => feature.component_type === componentFilter);
    }
    
    // Filtrer par texte de recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(feature => 
        feature.name.toLowerCase().includes(query) || 
        feature.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // Calculer le statut général du système
  const getSystemStatus = (): SystemStatus => {
    const hasDown = features.some(f => f.status === 'down');
    const hasDegraded = features.some(f => f.status === 'degraded');
    
    if (hasDown) return 'down';
    if (hasDegraded) return 'degraded';
    return 'functional';
  };

  // Trouver les incidents liés à une fonctionnalité
  const getFeatureIncidents = (featureId: string) => {
    return incidents.filter(incident => incident.feature_id === featureId);
  };
  
  // Fonction pour créer un nouvel incident
  const handleCreateIncident = () => {
    setIncidentUpdateFormOpen(true);
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Administration - Statut du Système</h1>
          <p className="text-[9px] text-gray-600 dark:text-gray-400 mt-0.5">
            Gestion et surveillance des composants du système
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Indicateur général du système */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-medium text-gray-700 dark:text-gray-300">Statut général:</span>
            {getSystemStatus() === 'functional' && (
              <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-[9px]">
                Tous les systèmes fonctionnels
              </Badge>
            )}
            {getSystemStatus() === 'degraded' && (
              <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 text-[9px]">
                Fonctionnalités dégradées
              </Badge>
            )}
            {getSystemStatus() === 'down' && (
              <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-[9px]">
                Incidents majeurs
              </Badge>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-1 h-7 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-[9px]">Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Rechercher une fonctionnalité..."
              className="pl-9 w-full h-7 text-[9px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select
            value={componentFilter}
            onValueChange={(value) => setComponentFilter(value as ComponentType | "all")}
          >
            <SelectTrigger className="w-full sm:w-[220px] h-7 text-[9px]">
              <SelectValue placeholder="Type de composant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[9px]">Tous les types</SelectItem>
              <SelectItem value="core" className="text-[9px]">Core</SelectItem>
              <SelectItem value="communication" className="text-[9px]">Communication</SelectItem>
              <SelectItem value="financial" className="text-[9px]">Financial</SelectItem>
              <SelectItem value="storage" className="text-[9px]">Storage</SelectItem>
              <SelectItem value="integration" className="text-[9px]">Integration</SelectItem>
              <SelectItem value="security" className="text-[9px]">Security</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Tabs 
          defaultValue="all" 
          value={activeFilter === null ? 'all' : activeFilter}
          onValueChange={(value) => setActiveFilter(value === 'all' ? null : value as FeatureStatus)}
          className="w-full"
        >
          <TabsList className="mb-1.5 bg-gray-100/50 dark:bg-gray-800">
            <TabsTrigger 
              value="all" 
              className="flex items-center gap-1 text-[9px] h-7 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <Shield className="h-3 w-3" />
              Tout
            </TabsTrigger>
            <TabsTrigger 
              value="functional" 
              className="flex items-center gap-1 text-[9px] h-7 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <CheckCircle className="h-3 w-3" />
              Fonctionnel
            </TabsTrigger>
            <TabsTrigger 
              value="degraded" 
              className="flex items-center gap-1 text-[9px] h-7 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <AlertTriangle className="h-3 w-3" />
              Dégradé
            </TabsTrigger>
            <TabsTrigger 
              value="down" 
              className="flex items-center gap-1 text-[9px] h-7 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <AlertCircle className="h-3 w-3" />
              En panne
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Liste des fonctionnalités */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          // Affichage des squelettes de chargement
          Array(6).fill(0).map((_, index) => (
            <Card key={`skeleton-${index}`} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-2/3 mb-1" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : getFilteredFeatures().length === 0 ? (
          // Message quand aucun résultat
          <div className="col-span-3 text-center py-12">
            <Info className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Aucun résultat trouvé</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Aucune fonctionnalité ne correspond à vos critères de recherche.
            </p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => {
                setActiveFilter(null);
                setComponentFilter("all");
                setSearchQuery("");
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          // Liste des fonctionnalités
          getFilteredFeatures().map(feature => (
            <Card 
              key={feature.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-gray-800 ${
                feature.status === 'down' 
                  ? 'border-red-300 dark:border-red-800/50'
                  : feature.status === 'degraded'
                    ? 'border-yellow-300 dark:border-yellow-800/50'
                    : 'border-gray-200 dark:border-gray-800/50'
              }`}
              onClick={() => handleFeatureClick(feature)}
            >
              <CardHeader className="pb-1.5">
                <CardTitle className="text-sm flex items-center justify-between text-gray-900 dark:text-white">
                  {feature.name}
                  {getFeatureIncidents(feature.id).some(inc => inc.status !== 'resolved') && (
                    <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-[9px]">
                      Incident actif
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-[9px] text-gray-600 dark:text-gray-400">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  {getStatusBadge(feature.status)}
                  <div className="text-[9px] text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDate(feature.last_updated)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Panneau latéral pour les détails */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-auto">
          {selectedFeature && (
            <>
              <SheetHeader className="mb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl">{selectedFeature.name}</SheetTitle>
                  {getStatusBadge(selectedFeature.status)}
                </div>
                <SheetDescription>
                  {selectedFeature.description}
                </SheetDescription>
              </SheetHeader>

              {/* Boutons d'actions */}
              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <Button 
                  onClick={() => setStatusUpdateFormOpen(true)} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Mettre à jour le statut
                </Button>
                
                {selectedIncident && selectedIncident.status !== 'resolved' ? (
                  <Button 
                    onClick={() => setIncidentUpdateFormOpen(true)} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Mettre à jour l'incident
                  </Button>
                ) : (
                  <Button 
                    onClick={handleCreateIncident} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Créer un incident
                  </Button>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Informations</h3>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-600 dark:text-gray-400">Type:</div>
                    <div className="font-medium">{selectedFeature.component_type}</div>
                    
                    <div className="text-gray-600 dark:text-gray-400">Dernière mise à jour:</div>
                    <div className="font-medium">{formatDate(selectedFeature.last_updated)}</div>
                    
                    <div className="text-gray-600 dark:text-gray-400">Statut:</div>
                    <div className="font-medium">{getStatusBadge(selectedFeature.status)}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Historique des incidents</h3>
                
                {getFeatureIncidents(selectedFeature.id).length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-center text-gray-500 dark:text-gray-400">
                    <Info className="h-5 w-5 mx-auto mb-1 opacity-70" />
                    Aucun incident récent pour cette fonctionnalité.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getFeatureIncidents(selectedFeature.id).map((incident) => (
                      <Card 
                        key={incident.id} 
                        className={`${
                          incident.status !== 'resolved' 
                            ? 'border-red-200 dark:border-red-800/50' 
                            : 'border-gray-200 dark:border-gray-800'
                        } cursor-pointer hover:shadow-sm transition-shadow`}
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <CardHeader className="py-3 px-4">
                          <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-base">{incident.title}</CardTitle>
                            {getIncidentStatusBadge(incident.status)}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Début: {formatDate(incident.started_at)}</span>
                            </div>
                            {getSeverityBadge(incident.severity)}
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {selectedIncident && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Détails de l'incident</h3>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{selectedIncident.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {getIncidentStatusBadge(selectedIncident.status)}
                        {getSeverityBadge(selectedIncident.severity)}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedIncident.description}</p>
                      
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <div>Date de début:</div>
                        <div className="font-medium">{formatDate(selectedIncident.started_at)}</div>
                        
                        {selectedIncident.resolved_at && (
                          <>
                            <div>Date de résolution:</div>
                            <div className="font-medium">{formatDate(selectedIncident.resolved_at)}</div>
                          </>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start pt-0">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Historique des mises à jour</h4>
                      <ScrollArea className="h-48 w-full pr-4">
                        <div className="space-y-3">
                          {selectedIncident.updates.map((update, index) => (
                            <div key={update.id} className="relative pl-5 pb-4">
                              {index < selectedIncident.updates.length - 1 && (
                                <div className="absolute left-[9px] top-5 bottom-0 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
                              )}
                              <div className="flex items-start gap-3">
                                <div className="absolute left-0 top-1 h-[18px] w-[18px] rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center">
                                  <div className={`h-[8px] w-[8px] rounded-full ${
                                    update.status === 'resolved' ? 'bg-green-500 dark:bg-green-400' :
                                    update.status === 'monitoring' ? 'bg-yellow-500 dark:bg-yellow-400' :
                                    update.status === 'identified' ? 'bg-purple-500 dark:bg-purple-400' :
                                    'bg-blue-500 dark:bg-blue-400'
                                  }`}></div>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    {formatDate(update.created_at)}
                                    {getIncidentStatusBadge(update.status)}
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{update.message}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Formulaires pour la mise à jour du statut et des incidents */}
      {(statusUpdateFormOpen || incidentUpdateFormOpen) && (
        <IncidentUpdateForm 
          incident={selectedIncident}
          feature={selectedFeature}
          isOpen={statusUpdateFormOpen || incidentUpdateFormOpen}
          onClose={() => {
            setStatusUpdateFormOpen(false);
            setIncidentUpdateFormOpen(false);
          }}
          onIncidentUpdated={() => {
            loadData();
            // Fermer les formulaires mais pas le panneau latéral
            setStatusUpdateFormOpen(false);
            setIncidentUpdateFormOpen(false);
          }}
        />
      )}
    </div>
  );
}