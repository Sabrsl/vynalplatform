"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock,
  Info,
  Shield,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  SystemFeature,
  SystemIncident,
  FeatureStatus,
  IncidentStatus,
  IncidentSeverity,
  SystemStatus,
} from "@/types/system-status";
import SystemStatusService from "@/lib/services/systemStatusService";

// Composant pour afficher l'état du système (version publique)
export default function PublicStatusPage() {
  const [features, setFeatures] = useState<SystemFeature[]>([]);
  const [incidents, setIncidents] = useState<SystemIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<SystemFeature | null>(
    null,
  );
  const [selectedIncident, setSelectedIncident] =
    useState<SystemIncident | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FeatureStatus | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [buildDate, setBuildDate] = useState<string | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);

  // Fonction pour charger les données
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Utiliser l'API endpoint pour récupérer les données
      const response = await fetch("/api/status");

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }

      const data = await response.json();

      setFeatures(data.features);
      setIncidents([...data.active_incidents, ...data.resolved_incidents]);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les données au montage du composant
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    fetch("/version.json?_t=" + Date.now())
      .then((res) => res.json())
      .then((data) => {
        setAppVersion(data.version);
        setBuildDate(data.buildDate);
        setVersionError(null);
        console.log("Version récupérée :", data.version);
      })
      .catch((err) => {
        setAppVersion(null);
        setBuildDate(null);
        setVersionError("Erreur lors de la récupération de la version");
        console.error("Erreur version.json", err);
      });
  }, []);

  // Ouvrir le panneau de détails pour une fonctionnalité
  const handleFeatureClick = async (feature: SystemFeature) => {
    setSelectedFeature(feature);
    setLoading(true);

    try {
      // Récupérer les incidents liés à cette fonctionnalité
      const relatedIncidents =
        await SystemStatusService.getIncidentsByFeatureId(feature.id);

      // S'il y a des incidents, sélectionner le plus récent non résolu ou le plus récent résolu
      if (relatedIncidents.length > 0) {
        const activeIncidents = relatedIncidents.filter(
          (incident) => incident.status !== "resolved",
        );
        if (activeIncidents.length > 0) {
          setSelectedIncident(activeIncidents[0]);
        } else {
          setSelectedIncident(relatedIncidents[0]);
        }
      } else {
        setSelectedIncident(null);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des incidents liés:",
        error,
      );
    } finally {
      setLoading(false);
      setSheetOpen(true);
    }
  };

  // Obtenir le badge de statut pour une fonctionnalité
  const getStatusBadge = (status: FeatureStatus) => {
    switch (status) {
      case "functional":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-[10px] sm:text-[11px] py-0.5 px-2">
            <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
            Fonctionnel
          </Badge>
        );
      case "degraded":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 text-[10px] sm:text-[11px] py-0.5 px-2">
            <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
            Dégradé
          </Badge>
        );
      case "down":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-[10px] sm:text-[11px] py-0.5 px-2">
            <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
            En panne
          </Badge>
        );
      default:
        return null;
    }
  };

  // Obtenir le badge de statut pour un incident
  const getIncidentStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case "investigating":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
          >
            En cours d'investigation
          </Badge>
        );
      case "identified":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
          >
            Problème identifié
          </Badge>
        );
      case "monitoring":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
          >
            Surveillance en cours
          </Badge>
        );
      case "resolved":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
          >
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
      case "low":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
          >
            Faible
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
          >
            Moyenne
          </Badge>
        );
      case "high":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
          >
            Élevée
          </Badge>
        );
      case "critical":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          >
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
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Filtrer les fonctionnalités selon leur état
  const getFilteredFeatures = () => {
    if (!activeFilter) return features;
    return features.filter((feature) => feature.status === activeFilter);
  };

  // Calculer le statut général du système
  const getSystemStatus = (): SystemStatus => {
    const hasDown = features.some((f) => f.status === "down");
    const hasDegraded = features.some((f) => f.status === "degraded");

    if (hasDown) return "down";
    if (hasDegraded) return "degraded";
    return "functional";
  };

  // Trouver les incidents liés à une fonctionnalité
  const getFeatureIncidents = (featureId: string) => {
    return incidents.filter((incident) => incident.feature_id === featureId);
  };

  // Obtenir le nombre total d'incidents actifs
  const getActiveIncidentsCount = () => {
    return incidents.filter((incident) => incident.status !== "resolved")
      .length;
  };

  // Obtenir la dernière mise à jour
  const getLastUpdateTime = () => {
    if (features.length === 0) return null;

    // Trouver la date de mise à jour la plus récente
    return features.reduce((latest, feature) => {
      const featureDate = new Date(feature.last_updated).getTime();
      return featureDate > latest ? featureDate : latest;
    }, 0);
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Bannière de statut */}
      <div
        className={`w-full py-1.5 text-white text-center ${
          getSystemStatus() === "functional"
            ? "bg-green-600 dark:bg-green-700"
            : getSystemStatus() === "degraded"
              ? "bg-yellow-600 dark:bg-yellow-700"
              : "bg-red-500 dark:bg-red-700"
        }`}
      >
        {getSystemStatus() === "functional" && (
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="text-[10px] sm:text-xs font-medium">
              Tous les systèmes sont opérationnels
            </span>
          </div>
        )}
        {getSystemStatus() === "degraded" && (
          <div className="flex items-center justify-center gap-1.5">
            <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="text-[10px] sm:text-xs font-medium">
              Certains services rencontrent des problèmes
            </span>
          </div>
        )}
        {getSystemStatus() === "down" && (
          <div className="flex items-center justify-center gap-1.5">
            <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="text-[10px] sm:text-xs font-medium">
              Incidents majeurs en cours
            </span>
          </div>
        )}
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Statut du Système
            </h1>
            <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
              Dernière mise à jour:{" "}
              {getLastUpdateTime()
                ? formatDate(new Date(getLastUpdateTime()!).toISOString())
                : "Chargement..."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                Incidents actifs:
              </span>
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-[10px]"
              >
                {getActiveIncidentsCount()}
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1 h-7 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <RefreshCw
                className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
              />
              <span className="text-[10px]">Actualiser</span>
            </Button>
          </div>
        </div>

        <Tabs
          defaultValue="all"
          value={activeFilter === null ? "all" : activeFilter}
          onValueChange={(value) =>
            setActiveFilter(value === "all" ? null : (value as FeatureStatus))
          }
          className="w-full mb-3"
        >
          <TabsList className="mb-1.5 bg-gray-100/50 dark:bg-gray-800">
            <TabsTrigger
              value="all"
              className="flex items-center gap-1 text-[10px] h-7 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <Shield className="h-3 w-3" />
              Tout
            </TabsTrigger>
            <TabsTrigger
              value="functional"
              className="flex items-center gap-1 text-[10px] h-7 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <CheckCircle className="h-3 w-3" />
              Fonctionnel
            </TabsTrigger>
            <TabsTrigger
              value="degraded"
              className="flex items-center gap-1 text-[10px] h-7 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <AlertTriangle className="h-3 w-3" />
              Dégradé
            </TabsTrigger>
            <TabsTrigger
              value="down"
              className="flex items-center gap-1 text-[10px] h-7 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <AlertCircle className="h-3 w-3" />
              En panne
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading ? (
            Array(6)
              .fill(0)
              .map((_, index) => (
                <Card
                  key={`skeleton-${index}`}
                  className="cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                >
                  <CardHeader className="pb-1.5">
                    <Skeleton className="h-3.5 w-2/3 mb-1" />
                    <Skeleton className="h-2.5 w-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : getFilteredFeatures().length === 0 ? (
            <div className="col-span-3 text-center py-6">
              <Info className="h-6 w-6 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Aucun résultat trouvé
              </h3>
              <p className="mt-0.5 text-[10px] text-gray-600 dark:text-gray-400">
                Aucune fonctionnalité ne correspond à vos critères de recherche.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-[10px] h-7 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => setActiveFilter(null)}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            getFilteredFeatures().map((feature) => (
              <Card
                key={feature.id}
                className={`cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-gray-800 ${
                  feature.status === "down"
                    ? "border-red-300 dark:border-red-800/50"
                    : feature.status === "degraded"
                      ? "border-yellow-300 dark:border-yellow-800/50"
                      : "border-gray-200 dark:border-gray-800/50"
                }`}
                onClick={() => handleFeatureClick(feature)}
              >
                <CardHeader className="pb-1.5">
                  <CardTitle className="text-sm flex items-center justify-between text-gray-900 dark:text-white">
                    {feature.name}
                    {getFeatureIncidents(feature.id).some(
                      (inc) => inc.status !== "resolved",
                    ) && (
                      <Badge
                        variant="outline"
                        className="ml-2 bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-[8px] py-0 px-1"
                      >
                        Incident actif
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </CardDescription>
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
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-auto bg-white dark:bg-gray-900">
          {selectedFeature && (
            <>
              <SheetHeader className="mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSheetOpen(false)}
                      className="sm:hidden text-[10px] text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      ← Retour
                    </button>
                    <SheetTitle className="text-base text-gray-900 dark:text-white">
                      {selectedFeature.name}
                    </SheetTitle>
                  </div>
                  {getStatusBadge(selectedFeature.status)}
                </div>
                <SheetDescription className="text-[10px] text-gray-600 dark:text-gray-400">
                  {selectedFeature.description}
                </SheetDescription>
              </SheetHeader>

              <div className="mb-4">
                <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Informations
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5 text-[10px]">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="text-gray-600 dark:text-gray-400">
                      Type:
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedFeature.component_type}
                    </div>

                    <div className="text-gray-600 dark:text-gray-400">
                      Dernière mise à jour:
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedFeature.last_updated)}
                    </div>

                    <div className="text-gray-600 dark:text-gray-400">
                      Statut:
                    </div>
                    <div className="font-medium">
                      {getStatusBadge(selectedFeature.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Historique des incidents
                </h3>

                {getFeatureIncidents(selectedFeature.id).length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-[10px] text-center text-gray-600 dark:text-gray-400">
                    <Info className="h-3.5 w-3.5 mx-auto mb-1 opacity-70" />
                    Aucun incident récent pour cette fonctionnalité.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getFeatureIncidents(selectedFeature.id).map((incident) => (
                      <Card
                        key={incident.id}
                        className={`${
                          incident.status !== "resolved"
                            ? "border-red-200 dark:border-red-800/50"
                            : "border-gray-200 dark:border-gray-800"
                        } cursor-pointer hover:shadow-sm transition-shadow bg-white dark:bg-gray-800`}
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <CardHeader className="py-2 px-3">
                          <div className="flex justify-between items-start gap-1.5">
                            <CardTitle className="text-xs text-gray-900 dark:text-white">
                              {incident.title}
                            </CardTitle>
                            {getIncidentStatusBadge(incident.status)}
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-gray-600 dark:text-gray-400 mt-0.5">
                            <div className="flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              <span>
                                Début: {formatDate(incident.started_at)}
                              </span>
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
                  <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Détails de l'incident
                  </h3>
                  <Card className="bg-white dark:bg-gray-800">
                    <CardHeader className="pb-1.5">
                      <CardTitle className="text-xs text-gray-900 dark:text-white">
                        {selectedIncident.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {getIncidentStatusBadge(selectedIncident.status)}
                        {getSeverityBadge(selectedIncident.severity)}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-1.5">
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">
                        {selectedIncident.description}
                      </p>

                      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[9px] text-gray-600 dark:text-gray-400">
                        <div>Date de début:</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatDate(selectedIncident.started_at)}
                        </div>

                        {selectedIncident.resolved_at && (
                          <>
                            <div>Date de résolution:</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatDate(selectedIncident.resolved_at)}
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start pt-0">
                      <h4 className="text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Historique des mises à jour
                      </h4>
                      <ScrollArea className="h-40 w-full pr-3">
                        <div className="space-y-2">
                          {selectedIncident.updates.map((update, index) => (
                            <div key={update.id} className="relative pl-4 pb-3">
                              {index < selectedIncident.updates.length - 1 && (
                                <div className="absolute left-[7px] top-4 bottom-0 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
                              )}
                              <div className="flex items-start gap-2">
                                <div className="absolute left-0 top-0.5 h-[14px] w-[14px] rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center">
                                  <div
                                    className={`h-[6px] w-[6px] rounded-full ${
                                      update.status === "resolved"
                                        ? "bg-green-500 dark:bg-green-400"
                                        : update.status === "monitoring"
                                          ? "bg-yellow-500 dark:bg-yellow-400"
                                          : update.status === "identified"
                                            ? "bg-purple-500 dark:bg-purple-400"
                                            : "bg-blue-500 dark:bg-blue-400"
                                    }`}
                                  ></div>
                                </div>
                                <div>
                                  <div className="text-[9px] font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                                    {formatDate(update.created_at)}
                                    {getIncidentStatusBadge(update.status)}
                                  </div>
                                  <p className="mt-0.5 text-[10px] text-gray-600 dark:text-gray-400">
                                    {update.message}
                                  </p>
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

      {/* Pied de page */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <p className="text-[10px] text-gray-600 dark:text-gray-400">
            Vous pouvez signaler un problème à notre équipe de support à{" "}
            <a
              href="mailto:support@vynalplatform.com"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              support@vynalplatform.com
            </a>
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">
            Version de l'application :{" "}
            {appVersion ? appVersion : "Chargement..."}
            {buildDate &&
              ` (build ${new Date(buildDate).toLocaleString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })})`}
            {versionError && (
              <span className="text-red-500 ml-2">{versionError}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
