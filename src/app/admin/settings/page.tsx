"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Bell,
  Mail,
  Percent,
  Users,
  FileText,
  HelpCircle,
  Trash2,
  Database,
  BellRing,
  Lock,
  AlertCircle,
  BarChart3,
  Zap,
  Activity,
  LineChart,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  getCachedData,
  setCachedData,
  CACHE_EXPIRY,
  CACHE_KEYS,
} from "@/lib/optimizations";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Interface pour les métriques de performance
interface PerformanceMetrics {
  cacheHitRate: number;
  avgResponseTime: number;
  errorRate: number;
  totalRequests: number;
  memoryUsage: number;
  lastUpdated: string;
}

// Interface pour les alertes
interface Alert {
  id: string;
  title: string;
  description: string;
  type: "error" | "warning" | "info";
  timestamp: string;
  status: "active" | "investigating" | "resolved";
}

// Interface pour les paramètres
interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportEmail: string;
  commissionFreelance: number;
  minOrderValue: number;
  maxOrderValue: number;
  welcomeEmailEnabled: boolean;
  orderConfirmationEnabled: boolean;
  serviceApprovalEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  twoFactorAuth: boolean;
  passwordExpiryDays: number;
  maxLoginAttempts: number;
  alertNotificationsEnabled: boolean;
  systemStatsCollection: boolean;
  performanceMonitoring: boolean;
  errorReporting: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();
  // Paramètres généraux
  const [siteName, setSiteName] = useState("Vynal Platform");
  const [siteDescription, setSiteDescription] = useState(
    "Plateforme de services freelance",
  );
  const [contactEmail, setContactEmail] = useState("contact@vynal.com");
  const [supportEmail, setSupportEmail] = useState("support@vynal.com");

  // Paramètres de commission
  const [commissionFreelance, setCommissionFreelance] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(5);
  const [maxOrderValue, setMaxOrderValue] = useState(10000);

  // Paramètres des emails
  const [welcomeEmailEnabled, setWelcomeEmailEnabled] = useState(true);
  const [orderConfirmationEnabled, setOrderConfirmationEnabled] =
    useState(true);
  const [serviceApprovalEnabled, setServiceApprovalEnabled] = useState(true);

  // Paramètres de maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "Le site est actuellement en maintenance. Veuillez réessayer plus tard.",
  );

  // Paramètres de sécurité
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [passwordExpiryDays, setPasswordExpiryDays] = useState(90);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);

  // Nouveaux paramètres d'alertes
  const [alertNotificationsEnabled, setAlertNotificationsEnabled] =
    useState(true);
  const [errorThreshold, setErrorThreshold] = useState(10);
  const [warningThreshold, setWarningThreshold] = useState(5);
  const [notificationEmails, setNotificationEmails] =
    useState("alerts@vynal.com");

  // Nouveaux paramètres de performance
  const [systemStatsCollection, setSystemStatsCollection] = useState(true);
  const [performanceMonitoring, setPerformanceMonitoring] = useState(true);
  const [errorReporting, setErrorReporting] = useState(true);
  const [cacheTimeout, setCacheTimeout] = useState(60);
  const [maxCacheSize, setMaxCacheSize] = useState(100);

  const [loading, setLoading] = useState(true);

  // État pour la gestion des rôles d'administrateur
  const [adminSearch, setAdminSearch] = useState("");
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isDemoting, setIsDemoting] = useState(false);
  const [searchError, setSearchError] = useState("");

  // État pour les métriques de performance
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics>({
      cacheHitRate: 0,
      avgResponseTime: 0,
      errorRate: 0,
      totalRequests: 0,
      memoryUsage: 0,
      lastUpdated: "",
    });
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // État pour les alertes
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [sendingTestAlert, setSendingTestAlert] = useState(false);

  // Charger les paramètres depuis la base de données (simulé avec cache)
  const fetchSettings = useCallback(
    async (forceFetch = false) => {
      try {
        setLoading(true);

        // Vérifier s'il y a un cache récent (sauf si forceFetch est true)
        if (!forceFetch) {
          const cachedSettings = getCachedData<SystemSettings>(
            CACHE_KEYS.ADMIN_SYSTEM_CONFIG,
          );
          if (cachedSettings) {
            setSiteName(cachedSettings.siteName);
            setSiteDescription(cachedSettings.siteDescription);
            setContactEmail(cachedSettings.contactEmail);
            setSupportEmail(cachedSettings.supportEmail);
            setCommissionFreelance(cachedSettings.commissionFreelance);
            setMinOrderValue(cachedSettings.minOrderValue);
            setMaxOrderValue(cachedSettings.maxOrderValue);
            setWelcomeEmailEnabled(cachedSettings.welcomeEmailEnabled);
            setOrderConfirmationEnabled(
              cachedSettings.orderConfirmationEnabled,
            );
            setServiceApprovalEnabled(cachedSettings.serviceApprovalEnabled);
            setMaintenanceMode(cachedSettings.maintenanceMode);
            setMaintenanceMessage(cachedSettings.maintenanceMessage);
            setTwoFactorAuth(cachedSettings.twoFactorAuth);
            setPasswordExpiryDays(cachedSettings.passwordExpiryDays);
            setMaxLoginAttempts(cachedSettings.maxLoginAttempts);
            // Charger les nouveaux paramètres si disponibles
            if (cachedSettings.alertNotificationsEnabled !== undefined) {
              setAlertNotificationsEnabled(
                cachedSettings.alertNotificationsEnabled,
              );
            }
            if (cachedSettings.systemStatsCollection !== undefined) {
              setSystemStatsCollection(cachedSettings.systemStatsCollection);
            }
            if (cachedSettings.performanceMonitoring !== undefined) {
              setPerformanceMonitoring(cachedSettings.performanceMonitoring);
            }
            if (cachedSettings.errorReporting !== undefined) {
              setErrorReporting(cachedSettings.errorReporting);
            }
            setLoading(false);
            return;
          }
        }

        // Ici, on simulerait un appel à Supabase pour récupérer les paramètres réels
        // Pour l'exemple, on utilise les valeurs par défaut

        // En production, on ferait quelque chose comme:
        // const { data, error } = await supabase.from('system_settings').select('*').single();

        // Simuler un délai pour l'exemple
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mettre en cache les paramètres pour 24 heures (données très statiques)
        const settings: SystemSettings = {
          siteName,
          siteDescription,
          contactEmail,
          supportEmail,
          commissionFreelance,
          minOrderValue,
          maxOrderValue,
          welcomeEmailEnabled,
          orderConfirmationEnabled,
          serviceApprovalEnabled,
          maintenanceMode,
          maintenanceMessage,
          twoFactorAuth,
          passwordExpiryDays,
          maxLoginAttempts,
          alertNotificationsEnabled,
          systemStatsCollection,
          performanceMonitoring,
          errorReporting,
        };

        setCachedData(CACHE_KEYS.ADMIN_SYSTEM_CONFIG, settings, {
          expiry: CACHE_EXPIRY.DAY,
          priority: "high",
        });
      } catch (error) {
        console.error("Erreur lors du chargement des paramètres:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres du système",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      siteName,
      siteDescription,
      contactEmail,
      supportEmail,
      commissionFreelance,
      minOrderValue,
      maxOrderValue,
      welcomeEmailEnabled,
      orderConfirmationEnabled,
      serviceApprovalEnabled,
      maintenanceMode,
      maintenanceMessage,
      twoFactorAuth,
      passwordExpiryDays,
      maxLoginAttempts,
      alertNotificationsEnabled,
      systemStatsCollection,
      performanceMonitoring,
      errorReporting,
      toast,
    ],
  );

  // Charger la liste des administrateurs
  const fetchAdmins = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, email, avatar_url")
        .eq("role", "admin")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAdmins(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des administrateurs:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des administrateurs",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Rechercher un utilisateur
  const searchUser = async () => {
    if (!adminSearch.trim()) {
      setSearchError("Veuillez entrer un email");
      return;
    }

    setIsSearching(true);
    setFoundUser(null);
    setSearchError("");

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, email, role, avatar_url")
        .ilike("email", `%${adminSearch.trim()}%`)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          setSearchError("Aucun utilisateur trouvé avec cet email");
        } else {
          throw error;
        }
      } else if (data) {
        setFoundUser(data);
      }
    } catch (error) {
      console.error("Erreur lors de la recherche d'utilisateur:", error);
      setSearchError("Une erreur est survenue lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  };

  // Promouvoir un utilisateur en admin
  const promoteToAdmin = async (userId: string) => {
    setIsPromoting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: "admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'utilisateur a été promu au rôle d'administrateur",
      });

      // Rafraîchir la liste des admins
      fetchAdmins();

      // Mettre à jour l'utilisateur trouvé
      if (foundUser && foundUser.id === userId) {
        setFoundUser({
          ...foundUser,
          role: "admin",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la promotion de l'utilisateur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de promouvoir l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsPromoting(false);
    }
  };

  // Rétrograder un administrateur
  const demoteAdmin = async (userId: string) => {
    setIsDemoting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: "client",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'administrateur a été rétrogradé",
      });

      // Rafraîchir la liste des admins
      fetchAdmins();

      // Mettre à jour l'utilisateur trouvé
      if (foundUser && foundUser.id === userId) {
        setFoundUser({
          ...foundUser,
          role: "client",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la rétrogradation de l'admin:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rétrograder l'administrateur",
        variant: "destructive",
      });
    } finally {
      setIsDemoting(false);
    }
  };

  // Charger les métriques de performance
  const fetchPerformanceMetrics = useCallback(async () => {
    try {
      setLoadingMetrics(true);
      // Simulation de chargement de métriques (dans un vrai cas, ce serait un appel API)
      // En production, il faudrait implémenter une vraie API pour ces métriques

      // Ici, pour la démonstration, on génère des valeurs aléatoires
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const metrics: PerformanceMetrics = {
        cacheHitRate: Math.floor(Math.random() * 30) + 70, // 70-100%
        avgResponseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
        errorRate: Math.random() * 2, // 0-2%
        totalRequests: Math.floor(Math.random() * 10000) + 5000, // 5000-15000
        memoryUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
        lastUpdated: new Date().toISOString(),
      };

      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error("Erreur lors du chargement des métriques:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les métriques de performance",
        variant: "destructive",
      });
    } finally {
      setLoadingMetrics(false);
    }
  }, [toast]);

  // Charger les alertes récentes
  const fetchRecentAlerts = useCallback(async () => {
    try {
      setLoadingAlerts(true);

      // Simulation de chargement des alertes (dans un vrai cas, ce serait un appel API)
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Générer des alertes fictives pour la démonstration
      const mockAlerts: Alert[] = [
        {
          id: "1",
          title: "Erreur serveur",
          description: "Erreur 500 détectée sur plusieurs requêtes API",
          type: "error",
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 heure
          status: "resolved",
        },
        {
          id: "2",
          title: "Taux d'erreur élevé",
          description: "Le taux d'erreur des requêtes a dépassé le seuil de 2%",
          type: "warning",
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 heures
          status: "investigating",
        },
        {
          id: "3",
          title: "Performance dégradée",
          description: "Temps de réponse moyen supérieur à 300ms",
          type: "warning",
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 jour
          status: "resolved",
        },
      ];

      setRecentAlerts(mockAlerts);
    } catch (error) {
      console.error("Erreur lors du chargement des alertes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les alertes récentes",
        variant: "destructive",
      });
    } finally {
      setLoadingAlerts(false);
    }
  }, [toast]);

  // Envoyer une alerte test
  const sendTestAlert = async () => {
    try {
      setSendingTestAlert(true);

      // Simulation d'envoi d'alerte
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Créer une nouvelle alerte de test
      const newAlert: Alert = {
        id: Math.random().toString(36).substring(7),
        title: "Alerte de test",
        description:
          "Ceci est une alerte de test envoyée depuis le panneau d'administration",
        type: "info",
        timestamp: new Date().toISOString(),
        status: "active",
      };

      // Ajouter l'alerte à la liste
      setRecentAlerts([newAlert, ...recentAlerts]);

      toast({
        title: "Alerte test envoyée",
        description:
          "L'alerte de test a été envoyée avec succès aux destinataires configurés",
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'alerte test:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'alerte test",
        variant: "destructive",
      });
    } finally {
      setSendingTestAlert(false);
    }
  };

  // Vider le cache (simulation)
  const clearCache = () => {
    toast({
      title: "Cache vidé",
      description: "Le cache a été vidé avec succès",
    });

    // En production, il faudrait appeler une API pour vider le cache
    fetchPerformanceMetrics();
  };

  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    fetchSettings(true);
    fetchAdmins();
    fetchPerformanceMetrics();
    fetchRecentAlerts();
    toast({
      title: "Actualisation",
      description: "Les paramètres ont été actualisés",
    });
  };

  // Charger les paramètres au démarrage
  useEffect(() => {
    fetchSettings();
    fetchAdmins();
    fetchPerformanceMetrics();
    fetchRecentAlerts();
  }, [fetchSettings, fetchAdmins, fetchPerformanceMetrics, fetchRecentAlerts]);

  // Fonction de sauvegarde (simulée)
  const saveSettings = (category: string) => {
    setLoading(true);
    // Simuler un délai de sauvegarde
    setTimeout(() => {
      // Mise à jour du cache après sauvegarde
      const settings: SystemSettings = {
        siteName,
        siteDescription,
        contactEmail,
        supportEmail,
        commissionFreelance,
        minOrderValue,
        maxOrderValue,
        welcomeEmailEnabled,
        orderConfirmationEnabled,
        serviceApprovalEnabled,
        maintenanceMode,
        maintenanceMessage,
        twoFactorAuth,
        passwordExpiryDays,
        maxLoginAttempts,
        alertNotificationsEnabled,
        systemStatsCollection,
        performanceMonitoring,
        errorReporting,
      };

      setCachedData(CACHE_KEYS.ADMIN_SYSTEM_CONFIG, settings, {
        expiry: CACHE_EXPIRY.DAY,
        priority: "high",
      });

      setLoading(false);
      toast({
        title: "Succès",
        description: `Paramètres ${category} enregistrés avec succès`,
      });
    }, 1000);
  };

  // Fonction utilitaire pour formatter les valeurs
  const formatValue = (
    value: number,
    suffix: string = "",
    decimals: number = 0,
  ) => {
    return `${value.toFixed(decimals)}${suffix}`;
  };

  // Fonction pour déterminer la couleur d'un indicateur selon sa valeur
  const getMetricColor = (
    value: number,
    type: "cache" | "response" | "error",
  ) => {
    if (type === "cache") {
      if (value >= 90) return "text-green-500";
      if (value >= 70) return "text-amber-500";
      return "text-red-500";
    } else if (type === "response") {
      if (value <= 100) return "text-green-500";
      if (value <= 200) return "text-amber-500";
      return "text-red-500";
    } else if (type === "error") {
      if (value <= 0.5) return "text-green-500";
      if (value <= 1) return "text-amber-500";
      return "text-red-500";
    }
    return "";
  };

  // Obtenir la classe de couleur pour le type d'alerte
  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-500 bg-red-50 dark:bg-red-900/10";
      case "warning":
        return "text-amber-500 bg-amber-50 dark:bg-amber-900/10";
      case "info":
        return "text-blue-500 bg-blue-50 dark:bg-blue-900/10";
      default:
        return "text-gray-500 bg-gray-50 dark:bg-gray-900/10";
    }
  };

  // Obtenir la classe de couleur pour le statut d'alerte
  const getAlertStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-red-500";
      case "investigating":
        return "text-amber-500";
      case "resolved":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  // Obtenir l'icône pour le type d'alerte
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-3 w-3" />;
      case "warning":
        return <AlertTriangle className="h-3 w-3" />;
      case "info":
        return <Info className="h-3 w-3" />;
      default:
        return <HelpCircle className="h-3 w-3" />;
    }
  };

  // Formatter la date relative
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60)
      return `Il y a ${diffMins} min${diffMins > 1 ? "s" : ""}`;

    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24)
      return `Il y a ${diffHours} h${diffHours > 1 ? "s" : ""}`;

    const diffDays = Math.floor(diffMs / 86400000);
    return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-base font-bold text-slate-800 dark:text-vynal-text-primary">
            Administration - Paramètres
          </h1>
          <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary mt-0.5">
            Configuration des paramètres de la plateforme
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1 text-xs border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25 text-slate-700 dark:text-vynal-text-secondary"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Chargement..." : "Actualiser"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-3">
        <TabsList className="bg-white/25 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-700/20">
          <TabsTrigger
            value="general"
            className="flex items-center gap-1 text-xs text-slate-700 dark:text-vynal-text-secondary data-[state=active]:bg-white/30 dark:data-[state=active]:bg-slate-800/25"
          >
            <Settings className="h-3 w-3" />
            <span>Général</span>
          </TabsTrigger>
          <TabsTrigger
            value="commission"
            className="flex items-center gap-1 text-xs text-slate-700 dark:text-vynal-text-secondary data-[state=active]:bg-white/30 dark:data-[state=active]:bg-slate-800/25"
          >
            <Percent className="h-3 w-3" />
            <span>Commission</span>
          </TabsTrigger>
          <TabsTrigger
            value="email"
            className="flex items-center gap-1 text-xs text-slate-700 dark:text-vynal-text-secondary data-[state=active]:bg-white/30 dark:data-[state=active]:bg-slate-800/25"
          >
            <Mail className="h-3 w-3" />
            <span>Emails</span>
          </TabsTrigger>
          <TabsTrigger
            value="maintenance"
            className="flex items-center gap-1 text-xs text-slate-700 dark:text-vynal-text-secondary data-[state=active]:bg-white/30 dark:data-[state=active]:bg-slate-800/25"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Maintenance</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center gap-1 text-xs text-slate-700 dark:text-vynal-text-secondary data-[state=active]:bg-white/30 dark:data-[state=active]:bg-slate-800/25"
          >
            <Shield className="h-3 w-3" />
            <span>Sécurité</span>
          </TabsTrigger>
          <TabsTrigger
            value="alerts"
            className="flex items-center gap-1 text-xs text-slate-700 dark:text-vynal-text-secondary data-[state=active]:bg-white/30 dark:data-[state=active]:bg-slate-800/25"
          >
            <AlertCircle className="h-3 w-3" />
            <span>Alertes</span>
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="flex items-center gap-1 text-xs text-slate-700 dark:text-vynal-text-secondary data-[state=active]:bg-white/30 dark:data-[state=active]:bg-slate-800/25"
          >
            <Activity className="h-3 w-3" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger
            value="admin-roles"
            className="flex items-center gap-1 text-xs text-slate-700 dark:text-vynal-text-secondary data-[state=active]:bg-white/30 dark:data-[state=active]:bg-slate-800/25"
          >
            <Users className="h-3 w-3" />
            <span>Rôles Administrateur</span>
          </TabsTrigger>
        </TabsList>

        {/* Section des paramètres généraux */}
        <TabsContent value="general">
          <Card className="bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[9px] text-slate-800 dark:text-vynal-text-primary">
                Paramètres généraux
              </CardTitle>
              <CardDescription className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                Configurez les informations de base de la plateforme.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label
                    htmlFor="site-name"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Nom du site
                  </Label>
                  <Input
                    id="site-name"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                  />
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="site-description"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Description du site
                  </Label>
                  <Textarea
                    id="site-description"
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    className="text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                  />
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="contact-email"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Email de contact
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                  />
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="support-email"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Email de support
                  </Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => saveSettings("general")}
                size="sm"
                className="text-xs bg-vynal-accent-primary hover:bg-vynal-accent-primary/90"
              >
                <Save className="h-3 w-3 mr-1" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres de commission */}
        <TabsContent value="commission">
          <Card className="bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[9px] text-slate-800 dark:text-vynal-text-primary">
                Paramètres de commission
              </CardTitle>
              <CardDescription className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                Configurez les paramètres de commission appliqués aux
                transactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="commission-rate"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Taux de commission (%)
                  </Label>
                  <span className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                    Pourcentage prélevé sur chaque transaction
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="commission-rate"
                    type="number"
                    min="0"
                    max="100"
                    value={commissionFreelance}
                    onChange={(e) =>
                      setCommissionFreelance(Number(e.target.value))
                    }
                    className="h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                  />
                  <span className="text-[9px] font-medium text-slate-700 dark:text-vynal-text-secondary">
                    %
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="min-order"
                  className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                >
                  Valeur minimale de commande (€)
                </Label>
                <Input
                  id="min-order"
                  type="number"
                  min="0"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(Number(e.target.value))}
                  className="h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="max-order"
                  className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                >
                  Valeur maximale de commande (€)
                </Label>
                <Input
                  id="max-order"
                  type="number"
                  min="0"
                  value={maxOrderValue}
                  onChange={(e) => setMaxOrderValue(Number(e.target.value))}
                  className="h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                Dernière modification: 28/11/2023
              </div>
              <Button
                onClick={() => saveSettings("commission")}
                size="sm"
                className="text-xs bg-vynal-accent-primary hover:bg-vynal-accent-primary/90"
              >
                <Save className="h-3 w-3 mr-1" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres d'emails */}
        <TabsContent value="email">
          <Card className="bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[9px] text-slate-800 dark:text-vynal-text-primary">
                Paramètres d'emails
              </CardTitle>
              <CardDescription className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                Configurez les notifications par email envoyées aux
                utilisateurs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                      Email de bienvenue
                    </Label>
                    <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                      Envoyer un email de bienvenue aux nouveaux utilisateurs
                    </p>
                  </div>
                  <Switch
                    checked={welcomeEmailEnabled}
                    onCheckedChange={setWelcomeEmailEnabled}
                    className="data-[state=checked]:bg-vynal-accent-primary"
                  />
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                      Confirmation de commande
                    </Label>
                    <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                      Envoyer un email de confirmation pour chaque commande
                    </p>
                  </div>
                  <Switch
                    checked={orderConfirmationEnabled}
                    onCheckedChange={setOrderConfirmationEnabled}
                    className="data-[state=checked]:bg-vynal-accent-primary"
                  />
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                      Approbation de service
                    </Label>
                    <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                      Envoyer un email au freelance lorsqu'un service est
                      approuvé ou rejeté
                    </p>
                  </div>
                  <Switch
                    checked={serviceApprovalEnabled}
                    onCheckedChange={setServiceApprovalEnabled}
                    className="data-[state=checked]:bg-vynal-accent-primary"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => saveSettings("email")}
                size="sm"
                className="text-xs bg-vynal-accent-primary hover:bg-vynal-accent-primary/90"
              >
                <Save className="h-3 w-3 mr-1" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres de maintenance */}
        <TabsContent value="maintenance">
          <Card className="bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[9px] text-slate-800 dark:text-vynal-text-primary">
                Maintenance du site
              </CardTitle>
              <CardDescription className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                Activez le mode maintenance pour empêcher l'accès au site
                pendant les travaux.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                      Mode maintenance
                    </Label>
                    <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                      Activer le mode maintenance (seuls les administrateurs
                      pourront accéder au site)
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={setMaintenanceMode}
                    className="data-[state=checked]:bg-vynal-accent-primary"
                  />
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="maintenance-message"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Message de maintenance
                  </Label>
                  <Textarea
                    id="maintenance-message"
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    disabled={!maintenanceMode}
                    className="text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary disabled:opacity-50"
                  />
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                <div className="space-y-2">
                  <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                    Actions de maintenance
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs text-slate-700 dark:text-vynal-text-secondary border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
                    >
                      <Database className="h-3 w-3 mr-1" />
                      Sauvegarder la base de données
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs text-slate-700 dark:text-vynal-text-secondary border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Télécharger les logs
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start text-red-500 hover:bg-red-500/10 hover:text-red-600 text-xs border-slate-200 dark:border-slate-700/30"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Vider le cache
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 backdrop-blur-sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-sm text-slate-800 dark:text-vynal-text-primary">
                            Êtes-vous sûr ?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                            Cette action va effacer toutes les données en cache.
                            Les performances du site peuvent être temporairement
                            ralenties.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-xs border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25 text-slate-700 dark:text-vynal-text-secondary">
                            Annuler
                          </AlertDialogCancel>
                          <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-xs">
                            Continuer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => saveSettings("maintenance")}
                size="sm"
                className="text-xs bg-vynal-accent-primary hover:bg-vynal-accent-primary/90"
              >
                <Save className="h-3 w-3 mr-1" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres de sécurité */}
        <TabsContent value="security">
          <Card className="bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[9px] text-slate-800 dark:text-vynal-text-primary">
                Paramètres de sécurité
              </CardTitle>
              <CardDescription className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                Configurez les options de sécurité et d'authentification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                      Authentification à deux facteurs
                    </Label>
                    <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                      Exiger l'authentification à deux facteurs pour tous les
                      administrateurs
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorAuth}
                    onCheckedChange={setTwoFactorAuth}
                    className="data-[state=checked]:bg-vynal-accent-primary"
                  />
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                <div className="grid gap-2">
                  <Label
                    htmlFor="password-expiry"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Expiration des mots de passe (jours)
                  </Label>
                  <Input
                    id="password-expiry"
                    type="number"
                    min="0"
                    value={passwordExpiryDays}
                    onChange={(e) =>
                      setPasswordExpiryDays(Number(e.target.value))
                    }
                    className="h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                  />
                  <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                    0 = pas d'expiration
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="login-attempts"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Tentatives de connexion max.
                  </Label>
                  <Input
                    id="login-attempts"
                    type="number"
                    min="1"
                    value={maxLoginAttempts}
                    onChange={(e) =>
                      setMaxLoginAttempts(Number(e.target.value))
                    }
                    className="h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                  />
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                <div className="space-y-2">
                  <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                    Actions de sécurité
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start text-xs text-slate-700 dark:text-vynal-text-secondary border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Réinitialiser les sessions
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 backdrop-blur-sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-sm text-slate-800 dark:text-vynal-text-primary">
                            Réinitialiser toutes les sessions ?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                            Cette action déconnectera tous les utilisateurs. Ils
                            devront se reconnecter.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-xs border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25 text-slate-700 dark:text-vynal-text-secondary">
                            Annuler
                          </AlertDialogCancel>
                          <AlertDialogAction className="text-xs bg-vynal-accent-primary hover:bg-vynal-accent-primary/90">
                            Continuer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start text-xs text-slate-700 dark:text-vynal-text-secondary border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Débloquer les comptes
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 backdrop-blur-sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-sm text-slate-800 dark:text-vynal-text-primary">
                            Débloquer tous les comptes ?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                            Cette action débloquera tous les comptes
                            utilisateurs verrouillés suite à de multiples
                            tentatives de connexion échouées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-xs border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25 text-slate-700 dark:text-vynal-text-secondary">
                            Annuler
                          </AlertDialogCancel>
                          <AlertDialogAction className="text-xs bg-vynal-accent-primary hover:bg-vynal-accent-primary/90">
                            Continuer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                Dernière modification: 25/11/2023
              </div>
              <Button
                onClick={() => saveSettings("security")}
                size="sm"
                className="text-xs bg-vynal-accent-primary hover:bg-vynal-accent-primary/90"
              >
                <Save className="h-3 w-3 mr-1" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Nouvelle section des paramètres d'alertes */}
        <TabsContent value="alerts">
          <Card className="bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[9px] text-slate-800 dark:text-vynal-text-primary">
                Paramètres des alertes système
              </CardTitle>
              <CardDescription className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                Configurez les paramètres d'alerte et de notification pour la
                surveillance du système.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                      Notifications d'alertes
                    </Label>
                    <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                      Envoyer des notifications par email pour les alertes
                      système
                    </p>
                  </div>
                  <Switch
                    checked={alertNotificationsEnabled}
                    onCheckedChange={setAlertNotificationsEnabled}
                    className="data-[state=checked]:bg-vynal-accent-primary"
                  />
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                <div className="grid gap-2">
                  <Label
                    htmlFor="error-threshold"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Seuil d'alerte erreur
                  </Label>
                  <Input
                    id="error-threshold"
                    type="number"
                    min="1"
                    value={errorThreshold}
                    onChange={(e) => setErrorThreshold(Number(e.target.value))}
                    className="h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                    disabled={!alertNotificationsEnabled}
                  />
                  <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                    Nombre d'erreurs avant déclenchement d'une alerte critique
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="warning-threshold"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Seuil d'alerte avertissement
                  </Label>
                  <Input
                    id="warning-threshold"
                    type="number"
                    min="1"
                    value={warningThreshold}
                    onChange={(e) =>
                      setWarningThreshold(Number(e.target.value))
                    }
                    className="h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                    disabled={!alertNotificationsEnabled}
                  />
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="notification-emails"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Emails de notification
                  </Label>
                  <Input
                    id="notification-emails"
                    type="text"
                    value={notificationEmails}
                    onChange={(e) => setNotificationEmails(e.target.value)}
                    className="h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                    disabled={!alertNotificationsEnabled}
                    placeholder="Emails séparés par des virgules"
                  />
                  <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                    Liste des adresses email qui recevront les alertes système
                  </p>
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                {/* Historique des alertes récentes */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                      Alertes récentes
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[9px] flex items-center gap-1 text-slate-700 dark:text-vynal-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/25"
                      onClick={fetchRecentAlerts}
                      disabled={loadingAlerts}
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${loadingAlerts ? "animate-spin" : ""}`}
                      />
                      {loadingAlerts ? "Chargement..." : "Actualiser"}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-auto">
                    {recentAlerts.length === 0 ? (
                      <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary py-2 text-center">
                        Aucune alerte récente.
                      </p>
                    ) : (
                      recentAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`rounded-md p-2 ${getAlertTypeColor(alert.type)}`}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`mt-0.5 ${alert.type === "error" ? "text-red-500" : alert.type === "warning" ? "text-amber-500" : "text-blue-500"}`}
                            >
                              {getAlertTypeIcon(alert.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="text-[9px] font-medium truncate">
                                  {alert.title}
                                </p>
                                <span className="text-[9px] ml-2 shrink-0">
                                  {formatRelativeTime(alert.timestamp)}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-600 dark:text-gray-300 line-clamp-2">
                                {alert.description}
                              </p>
                              <div className="flex items-center mt-1">
                                <span
                                  className={`text-[9px] ${getAlertStatusColor(alert.status)}`}
                                >
                                  {alert.status.charAt(0).toUpperCase() +
                                    alert.status.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                <div className="space-y-2">
                  <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                    Actions d'alertes
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs text-slate-700 dark:text-vynal-text-secondary border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
                      disabled={!alertNotificationsEnabled || sendingTestAlert}
                      onClick={sendTestAlert}
                    >
                      {sendingTestAlert ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Bell className="h-3 w-3 mr-1" />
                      )}
                      {sendingTestAlert
                        ? "Envoi en cours..."
                        : "Envoyer alerte test"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs text-slate-700 dark:text-vynal-text-secondary border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Voir statistiques d'alertes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                Dernière alerte:{" "}
                {recentAlerts.length > 0
                  ? formatRelativeTime(recentAlerts[0].timestamp)
                  : "Jamais"}
              </div>
              <Button
                onClick={() => saveSettings("alerts")}
                size="sm"
                className="text-xs bg-vynal-accent-primary hover:bg-vynal-accent-primary/90"
              >
                <Save className="h-3 w-3 mr-1" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Nouvelle section des paramètres de performance */}
        <TabsContent value="performance">
          <Card className="bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[9px] text-slate-800 dark:text-vynal-text-primary">
                Paramètres de performance
              </CardTitle>
              <CardDescription className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                Configurez les paramètres de performance et de surveillance du
                système.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                      Collecte de statistiques système
                    </Label>
                    <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                      Collecter des statistiques sur l'utilisation du système
                    </p>
                  </div>
                  <Switch
                    checked={systemStatsCollection}
                    onCheckedChange={setSystemStatsCollection}
                    className="data-[state=checked]:bg-vynal-accent-primary"
                  />
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                      Surveillance des performances
                    </Label>
                    <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                      Surveiller les performances des requêtes et des pages
                    </p>
                  </div>
                  <Switch
                    checked={performanceMonitoring}
                    onCheckedChange={setPerformanceMonitoring}
                    className="data-[state=checked]:bg-vynal-accent-primary"
                  />
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                      Rapport d'erreurs
                    </Label>
                    <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                      Signaler automatiquement les erreurs critiques
                    </p>
                  </div>
                  <Switch
                    checked={errorReporting}
                    onCheckedChange={setErrorReporting}
                    className="data-[state=checked]:bg-vynal-accent-primary"
                  />
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                <div className="grid gap-2">
                  <Label
                    htmlFor="cache-timeout"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Durée du cache (minutes)
                  </Label>
                  <Input
                    id="cache-timeout"
                    type="number"
                    min="1"
                    value={cacheTimeout}
                    onChange={(e) => setCacheTimeout(Number(e.target.value))}
                    className="h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                  />
                  <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                    Durée de conservation des données en cache (minutes)
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="max-cache-size"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Taille max. du cache (MB)
                  </Label>
                  <Input
                    id="max-cache-size"
                    type="number"
                    min="10"
                    value={maxCacheSize}
                    onChange={(e) => setMaxCacheSize(Number(e.target.value))}
                    className="h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                  />
                </div>

                {/* Ajout des métriques actuelles */}
                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                      Métriques de performance actuelles
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[9px] flex items-center gap-1 text-slate-700 dark:text-vynal-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/25"
                      onClick={fetchPerformanceMetrics}
                      disabled={loadingMetrics}
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${loadingMetrics ? "animate-spin" : ""}`}
                      />
                      {loadingMetrics ? "Chargement..." : "Actualiser"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div className="bg-white/40 dark:bg-slate-800/40 p-2 rounded-md border border-slate-200 dark:border-slate-700/30">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                          Taux de cache
                        </span>
                        <span
                          className={`text-[9px] font-semibold ${getMetricColor(performanceMetrics.cacheHitRate, "cache")}`}
                        >
                          {formatValue(performanceMetrics.cacheHitRate, "%")}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-200 dark:bg-slate-700/50 rounded-full mt-1">
                        <div
                          className={`h-1 rounded-full ${performanceMetrics.cacheHitRate >= 90 ? "bg-green-500" : performanceMetrics.cacheHitRate >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{
                            width: `${performanceMetrics.cacheHitRate}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-white/40 dark:bg-slate-800/40 p-2 rounded-md border border-slate-200 dark:border-slate-700/30">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                          Temps de réponse
                        </span>
                        <span
                          className={`text-[9px] font-semibold ${getMetricColor(performanceMetrics.avgResponseTime, "response")}`}
                        >
                          {formatValue(
                            performanceMetrics.avgResponseTime,
                            "ms",
                          )}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-200 dark:bg-slate-700/50 rounded-full mt-1">
                        <div
                          className={`h-1 rounded-full ${performanceMetrics.avgResponseTime <= 100 ? "bg-green-500" : performanceMetrics.avgResponseTime <= 200 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{
                            width: `${Math.min(100, performanceMetrics.avgResponseTime / 3)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-white/40 dark:bg-slate-800/40 p-2 rounded-md border border-slate-200 dark:border-slate-700/30">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                          Taux d'erreur
                        </span>
                        <span
                          className={`text-[9px] font-semibold ${getMetricColor(performanceMetrics.errorRate, "error")}`}
                        >
                          {formatValue(performanceMetrics.errorRate, "%", 2)}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-200 dark:bg-slate-700/50 rounded-full mt-1">
                        <div
                          className={`h-1 rounded-full ${performanceMetrics.errorRate <= 0.5 ? "bg-green-500" : performanceMetrics.errorRate <= 1 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{
                            width: `${Math.min(100, performanceMetrics.errorRate * 50)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-white/40 dark:bg-slate-800/40 p-2 rounded-md border border-slate-200 dark:border-slate-700/30">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                          Requêtes
                        </span>
                        <span className="text-[9px] font-semibold text-slate-700 dark:text-vynal-text-primary">
                          {performanceMetrics.totalRequests.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/40 dark:bg-slate-800/40 p-2 rounded-md border border-slate-200 dark:border-slate-700/30">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                          Mémoire
                        </span>
                        <span className="text-[9px] font-semibold text-slate-700 dark:text-vynal-text-primary">
                          {formatValue(performanceMetrics.memoryUsage, "%")}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-200 dark:bg-slate-700/50 rounded-full mt-1">
                        <div
                          className={`h-1 rounded-full ${performanceMetrics.memoryUsage <= 50 ? "bg-green-500" : performanceMetrics.memoryUsage <= 75 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{
                            width: `${performanceMetrics.memoryUsage}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-white/40 dark:bg-slate-800/40 p-2 rounded-md border border-slate-200 dark:border-slate-700/30">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                          Dernière mise à jour
                        </span>
                        <span className="text-[9px] font-semibold text-slate-700 dark:text-vynal-text-primary">
                          {performanceMetrics.lastUpdated
                            ? new Date(
                                performanceMetrics.lastUpdated,
                              ).toLocaleTimeString()
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                <div className="space-y-2">
                  <Label className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
                    Actions de performance
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs text-slate-700 dark:text-vynal-text-secondary border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
                      onClick={clearCache}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Vider tous les caches
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs text-slate-700 dark:text-vynal-text-secondary border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
                    >
                      <LineChart className="h-3 w-3 mr-1" />
                      Voir rapport de performance
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs text-slate-700 dark:text-vynal-text-secondary border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Télécharger les logs
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                Performance actuelle:{" "}
                {performanceMetrics.avgResponseTime <= 100 &&
                performanceMetrics.cacheHitRate >= 90 &&
                performanceMetrics.errorRate <= 0.5
                  ? "Excellente"
                  : performanceMetrics.avgResponseTime <= 200 &&
                      performanceMetrics.cacheHitRate >= 70 &&
                      performanceMetrics.errorRate <= 1
                    ? "Bonne"
                    : "À améliorer"}
              </div>
              <Button
                onClick={() => saveSettings("performance")}
                size="sm"
                className="text-xs bg-vynal-accent-primary hover:bg-vynal-accent-primary/90"
              >
                <Save className="h-3 w-3 mr-1" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres de gestion des rôles */}
        <TabsContent value="admin-roles">
          <Card className="bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[9px] text-slate-800 dark:text-vynal-text-primary">
                Gestion des Rôles Administrateur
              </CardTitle>
              <CardDescription className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                Promouvez ou rétrogradez les utilisateurs au rôle
                d'administrateur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="user-email"
                    className="text-[9px] text-slate-700 dark:text-vynal-text-secondary"
                  >
                    Email de l'utilisateur
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="email@exemple.com"
                      className="flex-1 h-8 text-[9px] bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-secondary"
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          searchUser();
                        }
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-vynal-text-secondary"
                      onClick={searchUser}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        "Rechercher"
                      )}
                    </Button>
                  </div>
                  {searchError && (
                    <p className="text-[9px] text-red-500 mt-1">
                      {searchError}
                    </p>
                  )}
                </div>

                {foundUser && (
                  <div className="rounded-md border border-slate-200 dark:border-slate-700/30 bg-white/40 dark:bg-slate-800/40 p-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-[9px] text-slate-800 dark:text-vynal-text-primary">
                          Utilisateur trouvé
                        </p>
                        <div className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                          <p>
                            Nom:{" "}
                            {foundUser.full_name ||
                              foundUser.username ||
                              "Non défini"}
                          </p>
                          <p>Email: {foundUser.email}</p>
                          <p>Rôle actuel: {foundUser.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {foundUser.role !== "admin" ? (
                          <Button
                            size="sm"
                            className="text-xs bg-vynal-accent-primary hover:bg-vynal-accent-primary/90"
                            onClick={() => promoteToAdmin(foundUser.id)}
                            disabled={isPromoting}
                          >
                            {isPromoting ? (
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              "Promouvoir en admin"
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs"
                            onClick={() => demoteAdmin(foundUser.id)}
                            disabled={isDemoting}
                          >
                            {isDemoting ? (
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              "Rétrograder"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Separator className="bg-slate-200 dark:bg-slate-700/30" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[9px] text-slate-800 dark:text-vynal-text-primary">
                      Liste des administrateurs actuels
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-slate-700 dark:text-vynal-text-secondary border-slate-200 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/25"
                      onClick={fetchAdmins}
                    >
                      Actualiser
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {admins.length === 0 ? (
                      <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary py-2 text-center">
                        Aucun administrateur trouvé.
                      </p>
                    ) : (
                      admins.map((admin) => (
                        <div
                          key={admin.id}
                          className="rounded-md border border-slate-200 dark:border-slate-700/30 bg-white/40 dark:bg-slate-800/40 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Users className="h-3 w-3 text-slate-600 dark:text-vynal-text-secondary" />
                              <div>
                                <p className="font-medium text-[9px] text-slate-800 dark:text-vynal-text-primary">
                                  {admin.full_name || admin.username || "Admin"}
                                </p>
                                <p className="text-[9px] text-slate-600 dark:text-vynal-text-secondary">
                                  {admin.email}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs"
                              onClick={() => demoteAdmin(admin.id)}
                              disabled={isDemoting}
                            >
                              Rétrograder
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
