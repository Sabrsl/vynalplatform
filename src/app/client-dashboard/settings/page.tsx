"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Bell, Lock, Globe, Moon, Sun, Loader2, RefreshCw, AlertTriangle, Trash, Database } from "lucide-react";
import { ClientDashboardPageSkeleton } from "@/components/skeletons/ClientDashboardPageSkeleton";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useLastRefresh } from "@/hooks/useLastRefresh";
import { invalidateAllClientCache } from "@/lib/optimizations/client-cache";
import { toast } from "sonner";
import CurrencySelector from "@/components/settings/CurrencySelector";
import { refreshPriceComponents, clearCurrencyCache, validatePaymentCurrency } from "@/lib/utils/currency-updater";
import CacheClearConfirmationDialog from "@/components/modals/CacheClearConfirmationDialog";

interface SettingsState {
  theme: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    orderUpdates: boolean;
    messages: boolean;
    marketing: boolean;
  };
  security: {
    twoFactor: boolean;
  };
}

const languageOptions = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" }
];

export default function ClientSettingsPage() {
  const { user } = useAuth();
  const { profile, updateProfile, refreshProfile, isRefreshing } = useUser();
  const { theme, setTheme } = useTheme();
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
  const [settings, setSettings] = useState<SettingsState>({
    theme: "system",
    language: "fr",
    notifications: {
      email: true,
      push: true,
      orderUpdates: true,
      messages: true,
      marketing: false
    },
    security: {
      twoFactor: false
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Charger les paramètres depuis le profil utilisateur
  useEffect(() => {
    if (profile) {
      const userSettings = profile.user_settings as SettingsState;
      if (userSettings) {
        setSettings(userSettings);
        setTheme(userSettings.theme);
      }
      setIsLoading(false);
    }
  }, [profile, setTheme]);

  // Rafraîchir les paramètres
  const handleRefresh = async () => {
    if (!user) return;
    
    // Invalider le cache du profil
    invalidateAllClientCache(user.id);
    
    // Rafraîchir le profil
    await refreshProfile();
    updateLastRefresh();
    
    toast.success("Paramètres actualisés", {
      duration: 3000,
      position: "top-center",
    });
  };

  // Sauvegarder les paramètres dans la base de données
  const saveSettings = useCallback(async (newSettings: SettingsState) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_settings: newSettings })
        .eq('id', user.id);

      if (error) throw error;
      
      // Invalider le cache après la mise à jour
      invalidateAllClientCache(user.id);
      
      // Mettre à jour la référence de dernier rafraîchissement
      updateLastRefresh();
      
      toast.success("Paramètres sauvegardés", {
        duration: 3000,
        position: "top-center",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      toast.error("Erreur lors de la sauvegarde", {
        duration: 3000,
        position: "top-center",
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, updateLastRefresh]);

  const handleThemeChange = useCallback(async (value: string) => {
    const newSettings = { ...settings, theme: value };
    setSettings(newSettings);
    setTheme(value);
    await saveSettings(newSettings);
  }, [settings, saveSettings, setTheme]);

  const handleLanguageChange = useCallback(async (value: string) => {
    const newSettings = { ...settings, language: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const toggleNotification = useCallback(async (key: keyof typeof settings.notifications) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const toggleSecurity = useCallback(async (key: keyof typeof settings.security) => {
    const newSettings = {
      ...settings,
      security: {
        ...settings.security,
        [key]: !settings.security[key]
      }
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Rafraîchir tout le dashboard lorsque la devise est changée
  const handleCurrencyChange = useCallback(() => {
    // Invalider le cache du profile et des données pour forcer la mise à jour
    if (user) {
      // Invalider tous les caches associés à cet utilisateur
      invalidateAllClientCache(user.id);
    }
    
    // Rafraîchir les composants qui affichent des prix
    refreshPriceComponents();
    
    // Mettre à jour la référence de dernier rafraîchissement
    updateLastRefresh();
    
    // Forcer la mise à jour des données du tableau de bord
    try {
      // Déclencher un événement pour forcer le rafraîchissement des données
      const refreshEvent = new CustomEvent('force-dashboard-refresh', {
        detail: { timestamp: Date.now(), source: 'currency-change' },
        bubbles: true
      });
      window.dispatchEvent(refreshEvent);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du tableau de bord:", error);
    }
    
    // Afficher un message pour l'utilisateur
    toast.success(
      <div className="space-y-1">
        <p className="font-medium">Paramètres de devise mis à jour</p>
        <p className="text-xs opacity-90">Tous les prix sont désormais affichés dans la devise choisie</p>
      </div>,
      { duration: 4000 }
    );
  }, [user, updateLastRefresh]);

  // Fonction pour effacer totalement le cache de l'utilisateur
  const handleClearCache = useCallback(async () => {
    if (!user) return;
    
    try {
      // Invalider tous les caches associés à cet utilisateur
      invalidateAllClientCache(user.id);
      
      // Effacer également le cache de devise
      clearCurrencyCache();
      
      // Forcer la mise à jour des données
      const refreshEvent = new CustomEvent('force-dashboard-refresh', {
        detail: { timestamp: Date.now(), source: 'cache-clear' },
        bubbles: true
      });
      window.dispatchEvent(refreshEvent);
      
      // Mettre à jour la référence de dernier rafraîchissement
      updateLastRefresh();
      
      toast.success("Cache effacé avec succès", {
        duration: 3000,
        position: "top-center",
      });
    } catch (error) {
      console.error('Erreur lors de l\'effacement du cache:', error);
      toast.error("Erreur lors de l'effacement du cache", {
        duration: 3000,
        position: "top-center",
      });
    }
  }, [user, updateLastRefresh]);

  // Classes de style harmonisées avec les autres pages
  const mainCardClasses = "bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 shadow-sm rounded-lg transition-all duration-200";
  const titleClasses = "text-slate-800 dark:text-vynal-text-primary";
  const subtitleClasses = "text-slate-600 dark:text-vynal-text-secondary";
  const labelClasses = "text-[10px] sm:text-xs text-slate-700 dark:text-vynal-text-primary";
  const descriptionClasses = "text-[8px] sm:text-[10px] text-slate-500 dark:text-vynal-text-secondary";
  const selectClasses = "bg-white/40 dark:bg-slate-800/40 border-slate-200/30 dark:border-slate-700/30 text-slate-800 dark:text-vynal-text-primary focus:ring-1 focus:ring-slate-300/50 dark:focus:ring-slate-600/50";

  // Mémoriser les composants des menus déroulants
  const themeSelect = useMemo(() => (
    <Select value={settings.theme} onValueChange={handleThemeChange}>
      <SelectTrigger className={`w-[180px] text-[10px] sm:text-xs ${selectClasses}`}>
        <SelectValue>
          {settings.theme === "light" ? (
            <div className="flex items-center">
              <Sun className="mr-2 h-3 w-3 text-amber-500" />
              <span className="text-slate-700 dark:text-slate-300">Clair</span>
            </div>
          ) : settings.theme === "dark" ? (
            <div className="flex items-center">
              <Moon className="mr-2 h-3 w-3 text-indigo-400" />
              <span className="text-slate-700 dark:text-slate-300">Sombre</span>
            </div>
          ) : (
            <span className="text-slate-700 dark:text-slate-300">Système</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light" className="text-[10px] sm:text-xs">
          <div className="flex items-center">
            <Sun className="mr-2 h-3 w-3 text-amber-500" />
            <span className="text-slate-700 dark:text-slate-300">Clair</span>
          </div>
        </SelectItem>
        <SelectItem value="dark" className="text-[10px] sm:text-xs">
          <div className="flex items-center">
            <Moon className="mr-2 h-3 w-3 text-indigo-400" />
            <span className="text-slate-700 dark:text-slate-300">Sombre</span>
          </div>
        </SelectItem>
        <SelectItem value="system" className="text-[10px] sm:text-xs">
          <span className="text-slate-700 dark:text-slate-300">Système</span>
        </SelectItem>
      </SelectContent>
    </Select>
  ), [settings.theme, handleThemeChange, selectClasses]);

  const languageSelect = useMemo(() => (
    <div className="flex items-center justify-between w-[180px] text-[10px] sm:text-xs">
      <span className={subtitleClasses}>
        {settings.language === "fr" ? "Français" : "English"}
      </span>
      <span className="text-[8px] sm:text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
        Bientôt disponible
      </span>
    </div>
  ), [settings.language, subtitleClasses]);

  if (isLoading) {
    return <ClientDashboardPageSkeleton />;
  }

  return (
    <div className="container max-w-screen-lg mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-vynal-primary dark:text-vynal-text-primary">
            Paramètres
          </h1>
          <p className="text-sm text-slate-600 dark:text-vynal-text-secondary">
            Configurez votre expérience sur la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 text-xs"
          >
            {isRefreshing ? (
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-2" />
            )}
            Actualiser
          </Button>
          <p className="text-[10px] text-slate-500 dark:text-vynal-text-secondary">
            {getLastRefreshText()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sélecteur de devise avec information sur les taux */}
        <div className="col-span-1">
          <CurrencySelector className="mb-4" onSuccess={handleCurrencyChange} />
          
          <Card className={cn(mainCardClasses, "bg-amber-50/30 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-700/30 mt-4")}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs font-medium text-amber-700 dark:text-amber-400">
                    Information sur les taux de change
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-amber-600/90 dark:text-amber-300/80">
                    Les taux de change sont mis à jour périodiquement. Dans le cadre des transactions,
                    le taux en vigueur au moment du paiement sera appliqué.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Thème */}
        <Card className={mainCardClasses}>
          <CardHeader className="p-4 pb-0">
            <CardTitle className={`flex items-center gap-2 ${titleClasses}`}>
              <Moon className="h-4 w-4 text-vynal-secondary" />
              <span className="text-sm">Thème</span>
            </CardTitle>
            <p className={`text-xs ${subtitleClasses}`}>
              Choisissez l'apparence de l'interface
            </p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="theme-select" 
                className={`text-sm font-normal ${labelClasses}`}
              >
                Choisir le thème
              </Label>
              {themeSelect}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className={mainCardClasses}>
          <CardHeader className="p-4 border-b border-slate-200/10 dark:border-slate-700/10">
            <CardTitle className={`text-base sm:text-lg md:text-base flex items-center ${titleClasses}`}>
              <Bell className="mr-2 h-4 w-4 text-vynal-accent-primary" />
              Notifications
            </CardTitle>
            <CardDescription className={`text-[10px] sm:text-xs ${subtitleClasses}`}>
              Gérez vos préférences de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className={labelClasses}>Notifications par email</Label>
                <p className={descriptionClasses}>
                  Recevoir des notifications par email
                </p>
              </div>
              <Switch
                checked={settings.notifications.email}
                onCheckedChange={() => toggleNotification("email")}
                className="data-[state=checked]:bg-vynal-accent-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className={labelClasses}>Notifications push</Label>
                <p className={descriptionClasses}>
                  Recevoir des notifications push
                </p>
              </div>
              <Switch
                checked={settings.notifications.push}
                onCheckedChange={() => toggleNotification("push")}
                className="data-[state=checked]:bg-vynal-accent-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className={labelClasses}>Mises à jour des commandes</Label>
                <p className={descriptionClasses}>
                  Recevoir des notifications sur l'état des commandes
                </p>
              </div>
              <Switch
                checked={settings.notifications.orderUpdates}
                onCheckedChange={() => toggleNotification("orderUpdates")}
                className="data-[state=checked]:bg-vynal-accent-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className={labelClasses}>Messages</Label>
                <p className={descriptionClasses}>
                  Recevoir des notifications pour les nouveaux messages
                </p>
              </div>
              <Switch
                checked={settings.notifications.messages}
                onCheckedChange={() => toggleNotification("messages")}
                className="data-[state=checked]:bg-vynal-accent-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className={labelClasses}>Marketing</Label>
                <p className={descriptionClasses}>
                  Recevoir des offres promotionnelles
                </p>
              </div>
              <Switch
                checked={settings.notifications.marketing}
                onCheckedChange={() => toggleNotification("marketing")}
                className="data-[state=checked]:bg-vynal-accent-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card className={mainCardClasses}>
          <CardHeader className="p-4 border-b border-slate-200/10 dark:border-slate-700/10">
            <CardTitle className={`text-base sm:text-lg md:text-base flex items-center ${titleClasses}`}>
              <Lock className="mr-2 h-4 w-4 text-vynal-accent-primary" />
              Sécurité
            </CardTitle>
            <CardDescription className={`text-[10px] sm:text-xs ${subtitleClasses} flex items-center`}>
              <span className="text-[8px] sm:text-[10px] bg-slate-100/50 dark:bg-slate-800/30 px-1.5 py-0.5 rounded-full">
                Bientôt disponible
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between opacity-50">
              <div className="space-y-0.5">
                <Label className={labelClasses}>Double authentification</Label>
                <p className={descriptionClasses}>
                  Ajouter une couche de sécurité supplémentaire
                </p>
              </div>
              <Switch
                checked={false}
                disabled
                className="data-[state=checked]:bg-vynal-accent-primary"
              />
            </div>

            <div className="flex items-center justify-between opacity-50">
              <div className="space-y-0.5">
                <Label className={labelClasses}>Changer le mot de passe</Label>
                <p className={descriptionClasses}>
                  Modifier votre mot de passe actuel
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled
                className="text-[8px] sm:text-[10px] h-8 border-slate-200/20 dark:border-slate-700/20"
              >
                Modifier
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ajout d'une carte pour l'effacement du cache en bas de page */}
      <Card className={cn(mainCardClasses, "mt-8")}>
        <CardHeader className="p-3 border-b border-slate-200/10 dark:border-slate-700/10">
          <CardTitle className={`text-sm sm:text-base md:text-sm flex items-center ${titleClasses}`}>
            <Database className="mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500" />
            Maintenance du cache
          </CardTitle>
          <CardDescription className={`text-[8px] sm:text-[9px] ${subtitleClasses}`}>
            Gestion des données mises en cache sur votre appareil
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          <div className="text-[9px] text-slate-700 dark:text-vynal-text-secondary">
            <p className="mb-2">
              Le cache stocke temporairement des données sur votre appareil pour améliorer les performances de navigation.
            </p>
            <div className="p-2.5 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-700/20 rounded-md mb-3">
              <p className="text-[8px] text-amber-700 dark:text-amber-400/80 flex items-start">
                <AlertTriangle className="h-3 w-3 mr-2 shrink-0 mt-0.5" />
                <span>L'effacement du cache peut être utile en cas d'affichage incorrect ou de problèmes de performances.</span>
              </p>
            </div>
          </div>
          <CacheClearConfirmationDialog 
            onConfirm={handleClearCache} 
            userType="client"
          />
        </CardContent>
      </Card>
    </div>
  );
}