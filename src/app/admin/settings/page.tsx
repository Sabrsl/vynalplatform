"use client";

import React, { useState } from 'react';
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

export default function SettingsPage() {
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

  // Fonction de sauvegarde (simulée)
  const saveSettings = (category: string) => {
    console.log(`Saving ${category} settings...`);
    // Simuler un délai de sauvegarde
    setTimeout(() => {
      console.log(`${category} settings saved!`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres administrateur</h1>
        <p className="text-muted-foreground">
          Configurez les paramètres globaux de la plateforme.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Général</span>
          </TabsTrigger>
          <TabsTrigger value="commission" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            <span>Commission</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Emails</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="admin-roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Rôles Administrateur</span>
          </TabsTrigger>
        </TabsList>

        {/* Section des paramètres généraux */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>
                Configurez les informations de base de la plateforme.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="site-name">Nom du site</Label>
                  <Input 
                    id="site-name" 
                    value={siteName} 
                    onChange={(e) => setSiteName(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="site-description">Description du site</Label>
                  <Textarea 
                    id="site-description" 
                    value={siteDescription} 
                    onChange={(e) => setSiteDescription(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="contact-email">Email de contact</Label>
                  <Input 
                    id="contact-email" 
                    type="email" 
                    value={contactEmail} 
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="support-email">Email de support</Label>
                  <Input 
                    id="support-email" 
                    type="email" 
                    value={supportEmail} 
                    onChange={(e) => setSupportEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => saveSettings('general')}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres de commission */}
        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de commission</CardTitle>
              <CardDescription>
                Configurez les paramètres de commission appliqués aux transactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="commission-rate">Taux de commission (%)</Label>
                  <span className="text-xs text-muted-foreground">Pourcentage prélevé sur chaque transaction</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    id="commission-rate" 
                    type="number"
                    min="0"
                    max="100"
                    value={commissionFreelance} 
                    onChange={(e) => setCommissionFreelance(Number(e.target.value))}
                  />
                  <span className="text-sm font-medium">%</span>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="min-order">Valeur minimale de commande (€)</Label>
                <Input 
                  id="min-order" 
                  type="number"
                  min="0"
                  value={minOrderValue} 
                  onChange={(e) => setMinOrderValue(Number(e.target.value))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="max-order">Valeur maximale de commande (€)</Label>
                <Input 
                  id="max-order" 
                  type="number"
                  min="0"
                  value={maxOrderValue} 
                  onChange={(e) => setMaxOrderValue(Number(e.target.value))}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Dernière modification: 28/11/2023
              </div>
              <Button onClick={() => saveSettings('commission')}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres d'emails */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'emails</CardTitle>
              <CardDescription>
                Configurez les notifications par email envoyées aux utilisateurs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email de bienvenue</Label>
                    <p className="text-sm text-muted-foreground">
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
                    <Label>Confirmation de commande</Label>
                    <p className="text-sm text-muted-foreground">
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
                    <Label>Approbation de service</Label>
                    <p className="text-sm text-muted-foreground">
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
              <Button onClick={() => saveSettings('email')}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres de maintenance */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance du site</CardTitle>
              <CardDescription>
                Activez le mode maintenance pour empêcher l'accès au site pendant les travaux.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode maintenance</Label>
                    <p className="text-sm text-muted-foreground">
                      Activer le mode maintenance (seuls les administrateurs pourront accéder au site)
                    </p>
                  </div>
                  <Switch 
                    checked={maintenanceMode} 
                    onCheckedChange={setMaintenanceMode} 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="maintenance-message">Message de maintenance</Label>
                  <Textarea 
                    id="maintenance-message" 
                    value={maintenanceMessage} 
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    disabled={!maintenanceMode}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Actions de maintenance</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button variant="outline" className="justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      Sauvegarder la base de données
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Télécharger les logs
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="justify-start text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Vider le cache
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action va effacer toutes les données en cache. Les performances du site peuvent être temporairement ralenties.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-500 hover:bg-red-600">
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
              <Button onClick={() => saveSettings('maintenance')}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres de sécurité */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de sécurité</CardTitle>
              <CardDescription>
                Configurez les options de sécurité et d'authentification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Authentification à deux facteurs</Label>
                    <p className="text-sm text-muted-foreground">
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
                  <Label htmlFor="password-expiry">Expiration des mots de passe (jours)</Label>
                  <Input 
                    id="password-expiry" 
                    type="number"
                    min="0"
                    value={passwordExpiryDays} 
                    onChange={(e) => setPasswordExpiryDays(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    0 = pas d'expiration
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="login-attempts">Tentatives de connexion max.</Label>
                  <Input 
                    id="login-attempts" 
                    type="number"
                    min="1"
                    value={maxLoginAttempts} 
                    onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Actions de sécurité</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="justify-start">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Réinitialiser les sessions
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Réinitialiser toutes les sessions ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action déconnectera tous les utilisateurs. Ils devront se reconnecter.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction>
                            Continuer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="justify-start">
                          <Users className="h-4 w-4 mr-2" />
                          Débloquer les comptes
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Débloquer tous les comptes ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action débloquera tous les comptes utilisateurs verrouillés suite à de multiples tentatives de connexion échouées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction>
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
              <div className="text-sm text-muted-foreground">
                Dernière modification: 25/11/2023
              </div>
              <Button onClick={() => saveSettings('security')}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Section des paramètres de gestion des rôles */}
        <TabsContent value="admin-roles">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Rôles Administrateur</CardTitle>
              <CardDescription>Promouvez ou rétrogradez les utilisateurs au rôle d'administrateur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email de l'utilisateur</Label>
                  <div className="flex gap-2">
                    <Input id="user-email" type="email" placeholder="email@exemple.com" className="flex-1" />
                    <Button variant="secondary">Rechercher</Button>
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Utilisateur trouvé</p>
                      <div className="text-sm text-muted-foreground">
                        <p>Nom: Jean Dupont</p>
                        <p>Email: jean.dupont@exemple.com</p>
                        <p>Rôle actuel: Utilisateur</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button>Promouvoir en admin</Button>
                      <Button variant="outline" disabled>Rétrograder</Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Liste des administrateurs actuels</p>
                    <Button variant="outline" size="sm">Actualiser</Button>
                  </div>
                  
                  <div className="space-y-2">
                    {[1, 2].map((item) => (
                      <div key={item} className="rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Admin {item}</p>
                              <p className="text-sm text-muted-foreground">admin{item}@vynal.com</p>
                            </div>
                          </div>
                          <Button variant="destructive" size="sm">Rétrograder</Button>
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