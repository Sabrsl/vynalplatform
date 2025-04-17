"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Shield, Smartphone } from "lucide-react";

// Définir une interface pour le profil utilisateur
interface UserProfile {
  id: string;
  phone_number?: string;
  two_factor_enabled?: boolean;
  [key: string]: any; // Pour les autres propriétés qui pourraient exister
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    verificationCode: ""
  });
  const [codeRequested, setCodeRequested] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        setLoading(true);
        
        // Vérifier que l'utilisateur est connecté
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/auth/login");
          return;
        }
        
        // Charger le profil de l'utilisateur
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        setUserProfile(profile);
        
        // Préremplir le numéro de téléphone s'il existe
        if (profile.phone_number) {
          setFormData(prev => ({
            ...prev,
            phoneNumber: profile.phone_number
          }));
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les informations de votre profil",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadUserProfile();
  }, [router, supabase, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const requestVerificationCode = async () => {
    try {
      setVerifying(true);
      
      // Vérifier que le numéro de téléphone est valide
      const phoneRegex = /^\+[0-9]{10,15}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        toast({
          title: "Format invalide",
          description: "Le numéro de téléphone doit être au format international (ex: +33612345678)",
          variant: "destructive"
        });
        return;
      }
      
      // Envoyer le code de vérification
      const response = await fetch("/api/auth/sms-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        toast({
          title: "Erreur",
          description: result.message || "Impossible d'envoyer le code de vérification",
          variant: "destructive"
        });
        return;
      }
      
      setCodeRequested(true);
      toast({
        title: "Code envoyé",
        description: "Un code de vérification a été envoyé à votre numéro de téléphone"
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi du code:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du code de vérification",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const verifyCode = async () => {
    try {
      setVerifying(true);
      
      // Vérifier que le code est valide
      if (!/^\d{6}$/.test(formData.verificationCode)) {
        toast({
          title: "Format invalide",
          description: "Le code de vérification doit contenir 6 chiffres",
          variant: "destructive"
        });
        return;
      }
      
      // Vérifier le code
      const response = await fetch("/api/auth/sms-verification", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          code: formData.verificationCode
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        toast({
          title: "Erreur",
          description: result.message || "Code de vérification invalide",
          variant: "destructive"
        });
        return;
      }
      
      // Mettre à jour le profil local
      setUserProfile((prev: UserProfile | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          phone_number: formData.phoneNumber,
          two_factor_enabled: true
        };
      });
      
      setCodeRequested(false);
      setFormData(prev => ({
        ...prev,
        verificationCode: ""
      }));
      
      toast({
        title: "Vérification réussie",
        description: "La vérification en deux étapes a été activée pour votre compte"
      });
    } catch (error) {
      console.error("Erreur lors de la vérification du code:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la vérification du code",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const disableTwoFactor = async () => {
    try {
      setVerifying(true);
      
      // Désactiver la vérification à deux facteurs
      const response = await fetch("/api/auth/sms-verification", {
        method: "DELETE"
      });
      
      const result = await response.json();
      
      if (!result.success) {
        toast({
          title: "Erreur",
          description: result.message || "Impossible de désactiver la vérification en deux étapes",
          variant: "destructive"
        });
        return;
      }
      
      // Mettre à jour le profil local
      setUserProfile((prev: UserProfile | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          two_factor_enabled: false
        };
      });
      
      toast({
        title: "Désactivation réussie",
        description: "La vérification en deux étapes a été désactivée pour votre compte"
      });
    } catch (error) {
      console.error("Erreur lors de la désactivation de la 2FA:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la désactivation de la vérification en deux étapes",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Paramètres du compte</h1>
      
      <Tabs defaultValue="security" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Vérification en deux étapes
              </CardTitle>
              <CardDescription>
                Sécurisez votre compte avec une vérification supplémentaire par SMS à chaque connexion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userProfile?.two_factor_enabled ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    <div>
                      <p className="font-medium">Vérification en deux étapes activée</p>
                      <p className="text-sm">Numéro de téléphone: {userProfile.phone_number}</p>
                    </div>
                  </div>
                </div>
              ) : codeRequested ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">Code de vérification</Label>
                    <Input
                      id="verificationCode"
                      name="verificationCode"
                      placeholder="Entrez le code à 6 chiffres"
                      value={formData.verificationCode}
                      onChange={handleInputChange}
                      maxLength={6}
                    />
                    <p className="text-sm text-gray-500">
                      Un code a été envoyé au numéro {formData.phoneNumber}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={verifyCode} disabled={verifying}>
                      {verifying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Vérification...
                        </>
                      ) : (
                        "Vérifier le code"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCodeRequested(false)}
                      disabled={verifying}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      placeholder="+33612345678"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                    />
                    <p className="text-sm text-gray-500">
                      Format international requis (ex: +33612345678)
                    </p>
                  </div>
                  
                  <Button onClick={requestVerificationCode} disabled={verifying}>
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      "Activer la vérification en deux étapes"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
            {userProfile?.two_factor_enabled && (
              <CardFooter>
                <Button
                  variant="destructive"
                  onClick={disableTwoFactor}
                  disabled={verifying}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Désactivation...
                    </>
                  ) : (
                    "Désactiver la vérification en deux étapes"
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informations du profil</CardTitle>
              <CardDescription>
                Gérez vos informations personnelles et vos préférences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Cette section sera implémentée prochainement
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
              <CardDescription>
                Gérez les notifications que vous recevez
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Cette section sera implémentée prochainement
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 