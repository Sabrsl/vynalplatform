"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  AlertTriangle,
  Download, 
  FileDown, 
  FileText, 
  Loader2, 
  LockKeyhole, 
  LogOut, 
  Rocket, 
  Settings, 
  Shield, 
  Smartphone, 
  Sparkles, 
  ToggleLeft,
  ToggleRight,
  Trash2, 
  User, 
  UserCheck,
  UserCog
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Définir une interface pour le profil utilisateur
interface UserProfile {
  id: string;
  phone_number?: string;
  two_factor_enabled?: boolean;
  [key: string]: any; // Pour les autres propriétés qui pourraient exister
}

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, signOut } = useAuth();
  const { profile, isLoading: isUserLoading } = useUser();
  
  // États pour les paramètres de sécurité
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  
  // États pour les paramètres généraux
  const [betaAccess, setBetaAccess] = useState(false);
  const [newDesigns, setNewDesigns] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [downloadingData, setDownloadingData] = useState(false);
  
  // Référence au formulaire de confirmation de suppression
  const deleteInputRef = useRef<HTMLInputElement>(null);

  // Chargement du profil utilisateur
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) {
        setIsLoading(false);
          return;
        }
        
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        
        if (error) throw error;

        setUserProfile(data);
        if (data.phone_number) {
          setPhoneNumber(data.phone_number);
        }
        
        // Récupérer les paramètres expérimentaux
        setBetaAccess(data.beta_access || false);
        setNewDesigns(data.new_designs || false);
        setAiSuggestions(data.ai_suggestions || false);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre profil. Veuillez réessayer.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [authUser, supabase, toast]);

  // Demande d'un code de vérification
  const requestVerificationCode = async () => {
    try {
      setIsSendingCode(true);
      
      // Logique simulée pour l'envoi d'un code par SMS
      // Dans une application réelle, vous appelleriez une API pour envoyer un SMS
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCodeSent(true);
      toast({
        title: "Code envoyé",
        description: `Un code de vérification a été envoyé au ${phoneNumber}`,
      });
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le code de vérification. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  // Vérification du code
  const verifyCode = async () => {
    try {
      setIsVerifying(true);
      
      // Logique simulée pour la vérification du code
      // Dans une application réelle, vous appelleriez une API pour vérifier le code
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mise à jour du profil avec le numéro de téléphone et 2FA activé
      const { data, error } = await supabase
        .from("profiles")
        .update({
          phone_number: phoneNumber,
          two_factor_enabled: true,
        })
        .eq("id", authUser?.id)
        .select();

      if (error) throw error;

      setUserProfile(data[0]);
      setVerificationCode("");
      setCodeSent(false);
      
      toast({
        title: "Authentification à deux facteurs activée",
        description: "Votre compte est désormais sécurisé avec l'authentification à deux facteurs.",
      });
    } catch (error) {
      console.error("Error verifying code:", error);
      toast({
        title: "Erreur",
        description: "Code de vérification incorrect ou expiré. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Désactivation de l'authentification à deux facteurs
  const disable2FA = async () => {
    try {
      setIsDisabling2FA(true);
      
      // Désactivation de l'authentification à deux facteurs
      const { data, error } = await supabase
        .from("profiles")
        .update({
          two_factor_enabled: false,
        })
        .eq("id", authUser?.id)
        .select();

      if (error) throw error;

      setUserProfile(data[0]);
      
      toast({
        title: "Authentification à deux facteurs désactivée",
        description: "L'authentification à deux facteurs a été désactivée pour votre compte.",
      });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
        toast({
          title: "Erreur",
        description: "Impossible de désactiver l'authentification à deux facteurs. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsDisabling2FA(false);
    }
  };

  // Gestion du téléchargement des données
  const handleDataDownload = async () => {
    try {
      setDownloadingData(true);
      
      // Simulation du téléchargement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Téléchargement terminé",
        description: "Vos données ont été téléchargées avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger vos données. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setDownloadingData(false);
    }
  };

  // Génération d'un PDF du profil
  const handleProfileExport = async () => {
    try {
      setExportingPdf(true);
      
      // Simulation de l'export PDF
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Export terminé",
        description: "Votre profil a été exporté en PDF avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter votre profil. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setExportingPdf(false);
    }
  };

  // Mise à jour des paramètres expérimentaux
  const updateExperimentalSettings = async (setting: string, value: boolean) => {
    try {
      const updateData = {
        [setting]: value
      };
      
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", authUser?.id);

      if (error) throw error;
      
      toast({
        title: "Paramètres mis à jour",
        description: "Vos préférences ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error(`Error updating ${setting}:`, error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour vos paramètres. Veuillez réessayer.",
        variant: "destructive",
      });
      
      // Réinitialiser l'état en cas d'erreur
      if (setting === "beta_access") setBetaAccess(!value);
      if (setting === "new_designs") setNewDesigns(!value);
      if (setting === "ai_suggestions") setAiSuggestions(!value);
    }
  };

  // Suppression du compte
  const handleAccountDeletion = async () => {
    if (confirmDelete !== "SUPPRIMER") {
        toast({
        title: "Confirmation incorrecte",
        description: "Veuillez saisir SUPPRIMER pour confirmer la suppression de votre compte.",
        variant: "destructive",
        });
        return;
      }
      
    try {
      setIsDeleting(true);
      
      // Logique de suppression de compte simulée
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dans une application réelle, vous supprimeriez le compte Supabase ici
      
      await signOut();
      router.push("/");
      
      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès. Nous sommes désolés de vous voir partir.",
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer votre compte. Veuillez réessayer.",
        variant: "destructive",
      });
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Si les données sont en cours de chargement
  if (isLoading || isUserLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vynal-accent-primary" />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto scrollbar-hide bg-gray-50/50 dark:bg-transparent">
      <div className="p-2 sm:p-4 space-y-6 sm:space-y-8 pb-12 max-w-[1600px] mx-auto">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 rounded-full bg-gradient-to-tr from-vynal-accent-primary/40 to-vynal-accent-primary/20 shadow-sm dark:from-vynal-purple-secondary/30 dark:to-vynal-purple-secondary/20 flex-shrink-0">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary dark:text-vynal-accent-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
              Paramètres
            </h1>
          </div>
          <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80 ml-1">
            Gérez les paramètres de votre compte et vos préférences
          </p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4 p-1 bg-slate-100/80 dark:bg-vynal-purple-dark/30">
            <TabsTrigger 
              value="account" 
              className="data-[state=active]:bg-white data-[state=active]:text-vynal-accent-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-vynal-purple-dark dark:data-[state=active]:text-vynal-accent-primary"
            >
              <UserCog className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline text-xs">Compte</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="data-[state=active]:bg-white data-[state=active]:text-vynal-accent-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-vynal-purple-dark dark:data-[state=active]:text-vynal-accent-primary"
            >
              <Shield className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline text-xs">Sécurité</span>
            </TabsTrigger>
            <TabsTrigger 
              value="experimental"
              className="data-[state=active]:bg-white data-[state=active]:text-vynal-accent-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-vynal-purple-dark dark:data-[state=active]:text-vynal-accent-primary"
            >
              <Rocket className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline text-xs">Expérimental</span>
            </TabsTrigger>
            <TabsTrigger 
              value="data"
              className="data-[state=active]:bg-white data-[state=active]:text-vynal-accent-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-vynal-purple-dark dark:data-[state=active]:text-vynal-accent-primary"
            >
              <FileDown className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline text-xs">Données</span>
            </TabsTrigger>
        </TabsList>
        
          {/* Onglet compte */}
          <TabsContent value="account" className="space-y-4">
            <Card className="overflow-hidden border border-vynal-border dark:border-vynal-purple-secondary/40 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-white to-slate-50 dark:from-vynal-purple-dark/60 dark:to-vynal-purple-dark/20">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 rounded-md bg-vynal-accent-primary/10 text-vynal-accent-primary dark:bg-vynal-purple-secondary/30 dark:text-vynal-accent-primary">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <span className="text-vynal-purple-light dark:text-vynal-text-primary">Informations du compte</span>
              </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1">
                  Consultez et gérez les informations de base de votre compte.
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-6 py-4 sm:py-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-vynal-purple-light dark:text-vynal-text-primary">Nom</Label>
                  <Input 
                    id="name" 
                    value={profile?.full_name || ""} 
                    disabled 
                    className="bg-slate-50 border-vynal-border dark:bg-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/40 dark:text-vynal-text-secondary text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-vynal-purple-light dark:text-vynal-text-primary">Email</Label>
                  <Input 
                    id="email" 
                    value={authUser?.email || ""} 
                    disabled 
                    className="bg-slate-50 border-vynal-border dark:bg-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/40 dark:text-vynal-text-secondary text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm text-vynal-purple-light dark:text-vynal-text-primary">Nom d'utilisateur</Label>
                  <Input 
                    id="username" 
                    value={profile?.username || ""} 
                    disabled 
                    className="bg-slate-50 border-vynal-border dark:bg-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/40 dark:text-vynal-text-secondary text-sm" 
                  />
                  <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/70">
                    Votre nom d'utilisateur ne peut être modifié que par l'assistance.
                  </p>
                    </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-red-200/50 dark:border-red-800/20 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
              <CardHeader className="px-4 sm:px-6 py-3 bg-white dark:bg-vynal-purple-dark/20 border-b border-red-100/50 dark:border-red-800/10">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <div className="p-1 rounded-md bg-red-50 text-red-500/70 dark:bg-red-900/20 dark:text-red-400/70">
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </div>
                  <span className="text-red-500/80 dark:text-red-400/80 font-medium">Supprimer mon compte</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 py-3">
                <div className="text-xs text-red-500/70 dark:text-red-300/60 mb-3">
                  Cette action est irréversible. Toutes vos données personnelles seront supprimées.
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-xs h-7 px-2 border-red-200 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 dark:border-red-800/30 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
                  size="sm"
                >
                  <Trash2 className="h-3 w-3 mr-1.5" />
                  Supprimer mon compte
                </Button>
                
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogContent className="dark:bg-vynal-purple-dark dark:border-vynal-purple-secondary/40">
                    <DialogHeader>
                      <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        Supprimer définitivement votre compte ?
                      </DialogTitle>
                      <DialogDescription className="text-vynal-purple-secondary dark:text-vynal-text-secondary">
                        Cette action est irréversible. Veuillez saisir SUPPRIMER pour confirmer.
                      </DialogDescription>
                    </DialogHeader>
                <div className="space-y-4">
                    <Input
                        ref={deleteInputRef}
                        placeholder="Saisir SUPPRIMER"
                        value={confirmDelete}
                        onChange={(e) => setConfirmDelete(e.target.value)}
                        className="border-vynal-border dark:bg-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/40 dark:text-vynal-text-primary"
                      />
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setDeleteDialogOpen(false)}
                        className="text-xs border-vynal-border dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/10 dark:text-vynal-text-primary"
                      >
                        Annuler
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleAccountDeletion}
                        disabled={isDeleting || confirmDelete !== "SUPPRIMER"}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs dark:bg-red-800 dark:hover:bg-red-900"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Suppression...
                          </>
                        ) : (
                          "Supprimer définitivement"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet sécurité */}
          <TabsContent value="security" className="space-y-4">
            <Card className="overflow-hidden border border-vynal-border dark:border-vynal-purple-secondary/40 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-white to-slate-50 dark:from-vynal-purple-dark/60 dark:to-vynal-purple-dark/20">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 rounded-md bg-vynal-accent-primary/10 text-vynal-accent-primary dark:bg-vynal-purple-secondary/30 dark:text-vynal-accent-primary">
                    <LockKeyhole className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <span className="text-vynal-purple-light dark:text-vynal-text-primary">Authentification à deux facteurs (2FA)</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1">
                  {userProfile?.two_factor_enabled
                    ? "L'authentification à deux facteurs est activée pour votre compte."
                    : "Sécurisez votre compte avec l'authentification à deux facteurs."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-6 py-4 sm:py-5">
                {userProfile?.two_factor_enabled ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-vynal-border p-4 bg-slate-50/70 dark:border-vynal-purple-secondary/30 dark:bg-vynal-purple-secondary/10">
                      <div className="flex items-center space-x-4">
                        <div className="relative rounded-full bg-green-100 p-2 dark:bg-green-900/30">
                          <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Authentification à deux facteurs activée</p>
                          <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">
                            Votre compte est protégé par l'authentification à deux facteurs via SMS.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm text-vynal-purple-light dark:text-vynal-text-primary">Numéro de téléphone</Label>
                      <Input 
                        id="phone" 
                        value={phoneNumber} 
                        disabled 
                        className="bg-slate-50 border-vynal-border dark:bg-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/40 dark:text-vynal-text-secondary text-sm" 
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={disable2FA}
                      disabled={isDisabling2FA}
                      className="w-full sm:w-auto text-xs border-vynal-border bg-white hover:bg-slate-50 dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/5 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
                    >
                      {isDisabling2FA ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Désactivation...
                        </>
                      ) : (
                        "Désactiver l'authentification à deux facteurs"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm text-vynal-purple-light dark:text-vynal-text-primary">Numéro de téléphone</Label>
                      <Input
                        id="phone"
                        placeholder="+221 77 123 45 67"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="text-sm border-vynal-border dark:bg-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/40 dark:text-vynal-text-primary"
                      />
                      <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/70">
                        Nous vous enverrons un code de vérification par SMS.
                      </p>
                    </div>
                    
                    {codeSent && (
                      <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm text-vynal-purple-light dark:text-vynal-text-primary">Code de vérification</Label>
                        <Input
                          id="code"
                          placeholder="123456"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="text-sm border-vynal-border dark:bg-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/40 dark:text-vynal-text-primary"
                        />
                      </div>
                    )}

                    {codeSent ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="outline"
                          onClick={requestVerificationCode}
                          disabled={isSendingCode || !phoneNumber}
                          className="text-xs border-vynal-border bg-white hover:bg-slate-50 dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/5 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
                        >
                          {isSendingCode ? (
                            <>
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              Envoi...
                            </>
                          ) : (
                            "Renvoyer le code"
                          )}
                        </Button>
                        <Button
                          onClick={verifyCode}
                          disabled={isVerifying || !verificationCode}
                          className="w-full sm:w-auto text-xs bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-white"
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              Vérification...
                            </>
                          ) : (
                            "Vérifier et activer"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={requestVerificationCode}
                        disabled={isSendingCode || !phoneNumber}
                        className="w-full sm:w-auto text-xs bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-white"
                      >
                        {isSendingCode ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Envoi...
                          </>
                        ) : (
                          "Envoyer le code de vérification"
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-vynal-border dark:border-vynal-purple-secondary/40 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-white to-slate-50 dark:from-vynal-purple-dark/60 dark:to-vynal-purple-dark/20">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 rounded-md bg-vynal-accent-secondary/10 text-vynal-accent-secondary dark:bg-vynal-purple-secondary/30 dark:text-vynal-accent-secondary">
                    <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <span className="text-vynal-purple-light dark:text-vynal-text-primary">Sessions actives</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1">
                  Gérez vos sessions et déconnectez-vous des appareils.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 py-4 sm:py-5">
                <div className="space-y-4">
                  <div className="rounded-lg border border-vynal-border p-4 bg-slate-50/70 dark:border-vynal-purple-secondary/30 dark:bg-vynal-purple-secondary/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative rounded-full bg-vynal-accent-primary/10 p-2 dark:bg-vynal-purple-secondary/30">
                          <Smartphone className="h-4 w-4 text-vynal-accent-primary dark:text-vynal-accent-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Session courante</p>
                          <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">
                            Navigateur • {new Date().toLocaleString()}
                          </p>
                        </div>
                      </div>
                    <Button
                      variant="outline"
                        size="sm" 
                        onClick={signOut}
                        className="text-xs h-8 border-vynal-border bg-white hover:bg-slate-50 dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/5 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
                    >
                        Déconnexion
                    </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet expérimental */}
          <TabsContent value="experimental" className="space-y-4">
            <Card className="overflow-hidden border border-vynal-border dark:border-vynal-purple-secondary/40 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-white to-slate-50 dark:from-vynal-purple-dark/60 dark:to-vynal-purple-dark/20">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-500/20 to-amber-500/20 dark:from-vynal-accent-primary/20 dark:to-vynal-accent-secondary/20">
                    <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-vynal-accent-primary dark:text-vynal-accent-primary" />
                  </div>
                  <span className="text-vynal-purple-light dark:text-vynal-text-primary">Fonctionnalités expérimentales</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1">
                  Activez les fonctionnalités en version bêta et obtenez un accès anticipé aux nouvelles fonctionnalités.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 py-4 sm:py-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border border-vynal-border bg-slate-50/70 dark:border-vynal-purple-secondary/30 dark:bg-vynal-purple-secondary/10">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <div className="p-1.5 rounded-md bg-vynal-accent-primary/10 mr-2">
                          <Rocket className="h-3.5 w-3.5 text-vynal-accent-primary" />
                        </div>
                        <Label className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Accès bêta</Label>
                      </div>
                      <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary pl-7">
                        Obtenez un accès anticipé aux fonctionnalités non encore publiques.
                      </p>
                    </div>
                    <Switch
                      checked={betaAccess}
                      onCheckedChange={(value: boolean) => {
                        setBetaAccess(value);
                        updateExperimentalSettings("beta_access", value);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border border-vynal-border bg-slate-50/70 dark:border-vynal-purple-secondary/30 dark:bg-vynal-purple-secondary/10">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <div className="p-1.5 rounded-md bg-vynal-accent-secondary/10 mr-2">
                          <Sparkles className="h-3.5 w-3.5 text-vynal-accent-secondary" />
                        </div>
                        <Label className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Nouveaux designs</Label>
                      </div>
                      <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary pl-7">
                        Testez les nouvelles interfaces utilisateur avant leur déploiement officiel.
                      </p>
                    </div>
                    <Switch
                      checked={newDesigns}
                      onCheckedChange={(value: boolean) => {
                        setNewDesigns(value);
                        updateExperimentalSettings("new_designs", value);
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border border-vynal-border bg-slate-50/70 dark:border-vynal-purple-secondary/30 dark:bg-vynal-purple-secondary/10">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <div className="p-1.5 rounded-md bg-purple-400/10 mr-2 dark:bg-purple-500/20">
                          <Sparkles className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
                        </div>
                        <Label className="text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">Suggestions IA</Label>
                      </div>
                      <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary pl-7">
                        Recevez des recommandations personnalisées basées sur l'intelligence artificielle.
                      </p>
                    </div>
                    <Switch
                      checked={aiSuggestions}
                      onCheckedChange={(value: boolean) => {
                        setAiSuggestions(value);
                        updateExperimentalSettings("ai_suggestions", value);
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet données */}
          <TabsContent value="data" className="space-y-4">
            <Card className="overflow-hidden border border-vynal-border dark:border-vynal-purple-secondary/40 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-white to-slate-50 dark:from-vynal-purple-dark/60 dark:to-vynal-purple-dark/20">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 rounded-md bg-vynal-accent-primary/10 dark:bg-vynal-purple-secondary/30">
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-vynal-accent-primary dark:text-vynal-accent-primary" />
                  </div>
                  <span className="text-vynal-purple-light dark:text-vynal-text-primary">Téléchargement des données</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1">
                  Téléchargez une copie de vos données personnelles.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 py-4 sm:py-5">
                <div className="space-y-4">
                  <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">
                    Vous pouvez télécharger une copie complète de vos données personnelles, y compris votre profil, vos préférences et votre historique.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleDataDownload}
                    disabled={downloadingData}
                    className="w-full sm:w-auto text-xs border-vynal-border bg-white hover:bg-slate-50 dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/5 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
                  >
                    {downloadingData ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-3.5 w-3.5" />
                        Télécharger mes données
                      </>
                    )}
                  </Button>
                </div>
            </CardContent>
            </Card>

            <Card className="overflow-hidden border border-vynal-border dark:border-vynal-purple-secondary/40 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-white to-slate-50 dark:from-vynal-purple-dark/60 dark:to-vynal-purple-dark/20">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 rounded-md bg-vynal-accent-secondary/10 dark:bg-vynal-accent-secondary/20">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-vynal-accent-secondary dark:text-vynal-accent-secondary" />
                  </div>
                  <span className="text-vynal-purple-light dark:text-vynal-text-primary">Exporter le profil en PDF</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1">
                  Générez un document PDF de votre profil professionnel.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 py-4 sm:py-5">
                <div className="space-y-4">
                  <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">
                    Exportez votre profil professionnel au format PDF, idéal pour le partage ou l'impression.
                  </p>
                <Button
                    variant="outline"
                    onClick={handleProfileExport}
                    disabled={exportingPdf}
                    className="w-full sm:w-auto text-xs border-vynal-border bg-white hover:bg-slate-50 dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/5 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
                  >
                    {exportingPdf ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Génération du PDF...
                    </>
                  ) : (
                      <>
                        <FileText className="mr-2 h-3.5 w-3.5" />
                        Exporter en PDF
                      </>
                  )}
                </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
} 