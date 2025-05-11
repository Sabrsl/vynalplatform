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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Switch, 
} from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
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
  AlertCircle
} from 'lucide-react';
import { getCachedData, setCachedData, CACHE_EXPIRY, CACHE_KEYS } from '@/lib/optimizations';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
}

export default function SettingsPage() {
  const { toast } = useToast();
  // Paramètres généraux
  const [siteName, setSiteName] = useState('Vynal Platform');
  const [siteDescription, setSiteDescription] = useState('Plateforme de services freelance');
  const [contactEmail, setContactEmail] = useState('contact@vynal.com');
  const [supportEmail, setSupportEmail] = useState('support@vynal.com');
  
  // Paramètres de commission
  const [commissionFreelance, setCommissionFreelance] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(5);
  const [maxOrderValue, setMaxOrderValue] = useState(10000);
  
  // Paramètres des emails
  const [welcomeEmailEnabled, setWelcomeEmailEnabled] = useState(true);
  const [orderConfirmationEnabled, setOrderConfirmationEnabled] = useState(true);
  const [serviceApprovalEnabled, setServiceApprovalEnabled] = useState(true);
  
  // Paramètres de maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Le site est actuellement en maintenance. Veuillez réessayer plus tard.');
  
  // Paramètres de sécurité
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [passwordExpiryDays, setPasswordExpiryDays] = useState(90);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  
  const [loading, setLoading] = useState(true);

  // Charger les paramètres depuis la base de données (simulé avec cache)
  const fetchSettings = useCallback(async (forceFetch = false) => {
    try {
      setLoading(true);
      
      // Vérifier s'il y a un cache récent (sauf si forceFetch est true)
      if (!forceFetch) {
        const cachedSettings = getCachedData<SystemSettings>(CACHE_KEYS.ADMIN_SYSTEM_CONFIG);
        if (cachedSettings) {
          setSiteName(cachedSettings.siteName);
          setSiteDescription(cachedSettings.siteDescription);
          setContactEmail(cachedSettings.contactEmail);
          setSupportEmail(cachedSettings.supportEmail);
          setCommissionFreelance(cachedSettings.commissionFreelance);
          setMinOrderValue(cachedSettings.minOrderValue);
          setMaxOrderValue(cachedSettings.maxOrderValue);
          setWelcomeEmailEnabled(cachedSettings.welcomeEmailEnabled);
          setOrderConfirmationEnabled(cachedSettings.orderConfirmationEnabled);
          setServiceApprovalEnabled(cachedSettings.serviceApprovalEnabled);
          setMaintenanceMode(cachedSettings.maintenanceMode);
          setMaintenanceMessage(cachedSettings.maintenanceMessage);
          setTwoFactorAuth(cachedSettings.twoFactorAuth);
          setPasswordExpiryDays(cachedSettings.passwordExpiryDays);
          setMaxLoginAttempts(cachedSettings.maxLoginAttempts);
          setLoading(false);
          return;
        }
      }
      
      // Ici, on simulerait un appel à Supabase pour récupérer les paramètres réels
      // Pour l'exemple, on utilise les valeurs par défaut
      
      // En production, on ferait quelque chose comme:
      // const { data, error } = await supabase.from('system_settings').select('*').single();
      
      // Simuler un délai pour l'exemple
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
        maxLoginAttempts
      };
      
      setCachedData(
        CACHE_KEYS.ADMIN_SYSTEM_CONFIG, 
        settings, 
        { expiry: CACHE_EXPIRY.DAY, priority: 'high' }
      );
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres du système",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [siteName, siteDescription, contactEmail, supportEmail, commissionFreelance, minOrderValue, maxOrderValue, welcomeEmailEnabled, orderConfirmationEnabled, serviceApprovalEnabled, maintenanceMode, maintenanceMessage, twoFactorAuth, passwordExpiryDays, maxLoginAttempts, toast]);
  
  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    fetchSettings(true);
    toast({
      title: "Actualisation",
      description: "Les paramètres ont été actualisés"
    });
  };
  
  // Charger les paramètres au démarrage
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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
        maxLoginAttempts
      };
      
      setCachedData(
        CACHE_KEYS.ADMIN_SYSTEM_CONFIG, 
        settings, 
        { expiry: CACHE_EXPIRY.DAY, priority: 'high' }
      );
      
      setLoading(false);
      toast({
        title: "Succès",
        description: `Paramètres ${category} enregistrés avec succès`
      });
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-sm font-bold mb-2 text-gray-800 dark:text-vynal-text-primary">Paramètres administrateur</h1>
          <p className="text-xs text-gray-500 dark:text-vynal-text-secondary">
            Configurez les paramètres globaux de la plateforme.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1 text-xs"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Chargement...' : 'Actualiser'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-3">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-1 text-xs">
            <Settings className="h-3 w-3" />
            <span>Général</span>
          </TabsTrigger>
          <TabsTrigger value="commission" className="flex items-center gap-1 text-xs">
            <Percent className="h-3 w-3" />
            <span>Commission</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-1 text-xs">
            <Mail className="h-3 w-3" />
            <span>Emails</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-1 text-xs">
            <RefreshCw className="h-3 w-3" />
            <span>Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1 text-xs">
            <Shield className="h-3 w-3" />
            <span>Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="admin-roles" className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            <span>Rôles Administrateur</span>
          </TabsTrigger>
        </TabsList>

        {/* Section des paramètres généraux */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Paramètres généraux</CardTitle>
              <CardDescription className="text-xs">
                Configurez les informations de base de la plateforme.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="site-name" className="text-xs">Nom du site</Label>
                  <Input 
                    id="site-name" 
                    value={siteName} 
                    onChange={(e) => setSiteName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="site-description" className="text-xs">Description du site</Label>
                  <Textarea 
                    id="site-description" 
                    value={siteDescription} 
                    onChange={(e) => setSiteDescription(e.target.value)}
                    className="text-xs"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="contact-email" className="text-xs">Email de contact</Label>
                  <Input 
                    id="contact-email" 
                    type="email" 
                    value={contactEmail} 
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="support-email" className="text-xs">Email de support</Label>
                  <Input 
                    id="support-email" 
                    type="email" 
                    value={supportEmail} 
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => saveSettings('general')} size="sm" className="text-xs">
                <Save className="h-3 w-3 mr-1" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres de commission */}
        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Paramètres de commission</CardTitle>
              <CardDescription className="text-xs">
                Configurez les paramètres de commission appliqués aux transactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="commission-rate" className="text-xs">Taux de commission (%)</Label>
                  <span className="text-xs text-gray-500 dark:text-vynal-text-secondary">Pourcentage prélevé sur chaque transaction</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    id="commission-rate" 
                    type="number"
                    min="0"
                    max="100"
                    value={commissionFreelance} 
                    onChange={(e) => setCommissionFreelance(Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                  <span className="text-xs font-medium">%</span>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="min-order" className="text-xs">Valeur minimale de commande (€)</Label>
                <Input 
                  id="min-order" 
                  type="number"
                  min="0"
                  value={minOrderValue} 
                  onChange={(e) => setMinOrderValue(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="max-order" className="text-xs">Valeur maximale de commande (€)</Label>
                <Input 
                  id="max-order" 
                  type="number"
                  min="0"
                  value={maxOrderValue} 
                  onChange={(e) => setMaxOrderValue(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-xs text-gray-500 dark:text-vynal-text-secondary">
                Dernière modification: 28/11/2023
              </div>
              <Button onClick={() => saveSettings('commission')} size="sm" className="text-xs">
                <Save className="h-3 w-3 mr-1" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres d'emails */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Paramètres d'emails</CardTitle>
              <CardDescription className="text-xs">
                Configurez les notifications par email envoyées aux utilisateurs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Email de bienvenue</Label>
                    <p className="text-xs text-gray-500 dark:text-vynal-text-secondary">
                      Envoyer un email de bienvenue aux nouveaux utilisateurs
                    </p>
                  </div>
                  <Switch 
                    checked={welcomeEmailEnabled} 
                    onCheckedChange={setWelcomeEmailEnabled} 
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Confirmation de commande</Label>
                    <p className="text-xs text-gray-500 dark:text-vynal-text-secondary">
                      Envoyer un email de confirmation pour chaque commande
                    </p>
                  </div>
                  <Switch 
                    checked={orderConfirmationEnabled} 
                    onCheckedChange={setOrderConfirmationEnabled} 
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Approbation de service</Label>
                    <p className="text-xs text-gray-500 dark:text-vynal-text-secondary">
                      Envoyer un email au freelance lorsqu'un service est approuvé ou rejeté
                    </p>
                  </div>
                  <Switch 
                    checked={serviceApprovalEnabled} 
                    onCheckedChange={setServiceApprovalEnabled} 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => saveSettings('email')} size="sm" className="text-xs">
                <Save className="h-3 w-3 mr-1" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres de maintenance */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Maintenance du site</CardTitle>
              <CardDescription className="text-xs">
                Activez le mode maintenance pour empêcher l'accès au site pendant les travaux.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Mode maintenance</Label>
                    <p className="text-xs text-gray-500 dark:text-vynal-text-secondary">
                      Activer le mode maintenance (seuls les administrateurs pourront accéder au site)
                    </p>
                  </div>
                  <Switch 
                    checked={maintenanceMode} 
                    onCheckedChange={setMaintenanceMode} 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="maintenance-message" className="text-xs">Message de maintenance</Label>
                  <Textarea 
                    id="maintenance-message" 
                    value={maintenanceMessage} 
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    disabled={!maintenanceMode}
                    className="text-xs"
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label className="text-xs">Actions de maintenance</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" className="justify-start text-xs">
                      <Database className="h-3 w-3 mr-1" />
                      Sauvegarder la base de données
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Télécharger les logs
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-start text-red-500 hover:text-red-600 text-xs">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Vider le cache
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-sm">Êtes-vous sûr ?</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs">
                            Cette action va effacer toutes les données en cache. Les performances du site peuvent être temporairement ralenties.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-xs">Annuler</AlertDialogCancel>
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
              <Button onClick={() => saveSettings('maintenance')} size="sm" className="text-xs">
                <Save className="h-3 w-3 mr-1" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres de sécurité */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Paramètres de sécurité</CardTitle>
              <CardDescription className="text-xs">
                Configurez les options de sécurité et d'authentification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Authentification à deux facteurs</Label>
                    <p className="text-xs text-gray-500 dark:text-vynal-text-secondary">
                      Exiger l'authentification à deux facteurs pour tous les administrateurs
                    </p>
                  </div>
                  <Switch 
                    checked={twoFactorAuth} 
                    onCheckedChange={setTwoFactorAuth} 
                  />
                </div>
                
                <Separator />
                
                <div className="grid gap-2">
                  <Label htmlFor="password-expiry" className="text-xs">Expiration des mots de passe (jours)</Label>
                  <Input 
                    id="password-expiry" 
                    type="number"
                    min="0"
                    value={passwordExpiryDays} 
                    onChange={(e) => setPasswordExpiryDays(Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                  <p className="text-xs text-gray-500 dark:text-vynal-text-secondary">
                    0 = pas d'expiration
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="login-attempts" className="text-xs">Tentatives de connexion max.</Label>
                  <Input 
                    id="login-attempts" 
                    type="number"
                    min="1"
                    value={maxLoginAttempts} 
                    onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label className="text-xs">Actions de sécurité</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-start text-xs">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Réinitialiser les sessions
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-sm">Réinitialiser toutes les sessions ?</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs">
                            Cette action déconnectera tous les utilisateurs. Ils devront se reconnecter.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-xs">Annuler</AlertDialogCancel>
                          <AlertDialogAction className="text-xs">
                            Continuer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-start text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Débloquer les comptes
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-sm">Débloquer tous les comptes ?</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs">
                            Cette action débloquera tous les comptes utilisateurs verrouillés suite à de multiples tentatives de connexion échouées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-xs">Annuler</AlertDialogCancel>
                          <AlertDialogAction className="text-xs">
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
              <div className="text-xs text-gray-500 dark:text-vynal-text-secondary">
                Dernière modification: 25/11/2023
              </div>
              <Button onClick={() => saveSettings('security')} size="sm" className="text-xs">
                <Save className="h-3 w-3 mr-1" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres de gestion des rôles */}
        <TabsContent value="admin-roles">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Gestion des Rôles Administrateur</CardTitle>
              <CardDescription className="text-xs">Promouvez ou rétrogradez les utilisateurs au rôle d'administrateur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="user-email" className="text-xs">Email de l'utilisateur</Label>
                  <div className="flex gap-2">
                    <Input id="user-email" type="email" placeholder="email@exemple.com" className="flex-1 h-8 text-xs" />
                    <Button variant="secondary" size="sm" className="text-xs">Rechercher</Button>
                  </div>
                </div>

                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-xs">Utilisateur trouvé</p>
                      <div className="text-xs text-gray-500 dark:text-vynal-text-secondary">
                        <p>Nom: Jean Dupont</p>
                        <p>Email: jean.dupont@exemple.com</p>
                        <p>Rôle actuel: Utilisateur</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="text-xs">Promouvoir en admin</Button>
                      <Button variant="outline" disabled size="sm" className="text-xs">Rétrograder</Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-xs">Liste des administrateurs actuels</p>
                    <Button variant="outline" size="sm" className="text-xs">Actualiser</Button>
                  </div>
                  
                  <div className="space-y-2">
                    {[1, 2].map((item) => (
                      <div key={item} className="rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Users className="h-3 w-3 text-gray-500 dark:text-vynal-text-secondary" />
                            <div>
                              <p className="font-medium text-xs">Admin {item}</p>
                              <p className="text-xs text-gray-500 dark:text-vynal-text-secondary">admin{item}@vynal.com</p>
                            </div>
                          </div>
                          <Button variant="destructive" size="sm" className="text-xs">Rétrograder</Button>
                        </div>
                      </div>
                    ))}
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