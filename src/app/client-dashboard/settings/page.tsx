"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Bell, Lock, Globe, Moon, Sun, Loader2, RefreshCw } from "lucide-react";
import { ClientDashboardPageSkeleton } from "@/components/skeletons/ClientDashboardPageSkeleton";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useLastRefresh } from "@/hooks/useLastRefresh";
import { invalidateAllClientCache } from "@/lib/optimizations/client-cache";
import { toast } from "sonner";

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
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className={`text-base sm:text-lg md:text-xl font-bold ${titleClasses} flex items-center`}>
              <Settings className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
              Paramètres
            </h1>
            <p className={`text-[10px] sm:text-xs ${subtitleClasses}`}>
              Personnalisez votre expérience sur la plateforme
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {isSaving && (
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-vynal-accent-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                Enregistrement en cours...
              </div>
            )}
            
            {/* Bouton de rafraîchissement */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isRefreshing || isSaving}
              className="text-gray-600 dark:text-gray-400 hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary flex items-center gap-1 text-xs"
            >
              {isRefreshing ? (
                <Loader2 className="h-3 w-3 animate-spin text-vynal-accent-primary" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">{isRefreshing ? 'Actualisation...' : getLastRefreshText()}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Préférences */}
        <Card className={mainCardClasses}>
          <CardHeader className="p-4 border-b border-slate-200/10 dark:border-slate-700/10">
            <CardTitle className={`text-base sm:text-lg md:text-base flex items-center ${titleClasses}`}>
              <Globe className="mr-2 h-4 w-4 text-vynal-accent-primary" />
              Préférences
            </CardTitle>
            <CardDescription className={`text-[10px] sm:text-xs ${subtitleClasses}`}>
              Personnalisez l'apparence et la langue de l'interface
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className={labelClasses}>Thème</Label>
                <p className={descriptionClasses}>
                  Choisissez le thème de l'interface
                </p>
              </div>
              {themeSelect}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className={labelClasses}>Langue</Label>
                <p className={descriptionClasses}>
                  Choisissez la langue de l'interface
                </p>
              </div>
              {languageSelect}
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
    </div>
  );
}