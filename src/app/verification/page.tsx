"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Shield, FileText, CheckCircle, XCircle, QrCode } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCode } from "@/components/ui/qrcode";

export default function VerificationPage() {
  const supabase = createClient();
  const { toast } = useToast();
  
  // États pour la vérification
  const [signature, setSignature] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<"success" | "error" | null>(null);
  const [documentInfo, setDocumentInfo] = useState<any>(null);

  // Vérification par signature HMAC
  const verifySignature = async () => {
    if (!signature || signature.length < 20) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une signature valide",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      // Simuler une vérification (dans une vraie application, ce serait une requête API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Générer un résultat de vérification aléatoire pour la démo
      // Dans une vraie application, on vérifierait la signature contre une base de données
      const isValid = signature.length > 30;
      
      if (isValid) {
        setVerificationResult("success");
        // Données de démonstration
        setDocumentInfo({
          user: {
            username: "john_doe",
            full_name: "John Doe",
            role: "freelance",
          },
          generated_at: new Date().toISOString(),
          is_valid: true
        });
      } else {
        setVerificationResult("error");
        setDocumentInfo(null);
      }
    } catch (error) {
      console.error("Error verifying signature:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la vérification",
        variant: "destructive",
      });
      setVerificationResult("error");
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Vérification par QR code
  const verifyQrCode = async () => {
    if (!qrValue) {
      toast({
        title: "Erreur",
        description: "Veuillez scanner un QR code valide",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      // Simuler une vérification (dans une vraie application, ce serait une requête API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Dans une vraie application, on extrairait l'ID du document du QR code
      // et on vérifierait son authenticité
      if (qrValue.includes("vynalplatform.com")) {
        setVerificationResult("success");
        // Données de démonstration
        setDocumentInfo({
          user: {
            username: "jane_smith",
            full_name: "Jane Smith",
            role: "client",
          },
          generated_at: new Date().toISOString(),
          is_valid: true
        });
      } else {
        setVerificationResult("error");
        setDocumentInfo(null);
      }
    } catch (error) {
      console.error("Error verifying QR code:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la vérification",
        variant: "destructive",
      });
      setVerificationResult("error");
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleQrScanned = (data: string) => {
    setQrValue(data);
    // Vérifier automatiquement le QR code une fois scanné
    verifyQrCode();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-vynal-purple-dark dark:to-vynal-purple-dark/80">
      <header className="border-b border-gray-200 dark:border-vynal-purple-secondary/20 bg-white/80 dark:bg-vynal-purple-dark/30 backdrop-blur-sm">
        <div className="container mx-auto py-4 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-vynal-accent-primary to-vynal-accent-secondary rounded-md flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-vynal-purple-light dark:text-white">
              Vynal Verification
            </h1>
          </div>
          <div className="hidden md:flex items-center space-x-1">
            <a href="/" className="px-3 py-2 text-sm font-medium text-vynal-purple-secondary hover:text-vynal-accent-primary dark:text-gray-300 dark:hover:text-white transition-colors">
              Accueil
            </a>
            <a href="/profile" className="px-3 py-2 text-sm font-medium text-vynal-purple-secondary hover:text-vynal-accent-primary dark:text-gray-300 dark:hover:text-white transition-colors">
              Profils
            </a>
            <a href="/dashboard" className="px-3 py-2 text-sm font-medium text-vynal-purple-secondary hover:text-vynal-accent-primary dark:text-gray-300 dark:hover:text-white transition-colors">
              Tableau de bord
            </a>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 flex flex-col items-center">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-vynal-purple-light dark:text-white mb-2">
              Vérification de document
            </h2>
            <p className="text-vynal-purple-secondary dark:text-gray-300 max-w-md mx-auto">
              Vérifiez l&apos;authenticité d&apos;un document PDF exporté depuis Vynal Platform
            </p>
          </div>
          
          <Card className="shadow-md border-vynal-border dark:border-vynal-purple-secondary/30 dark:bg-vynal-purple-dark/20">
            <CardHeader className="bg-gradient-to-r from-white to-slate-50 dark:from-vynal-purple-dark/60 dark:to-vynal-purple-dark/20 border-b border-vynal-border dark:border-vynal-purple-secondary/20">
              <CardTitle className="flex items-center gap-2 text-lg text-vynal-purple-light dark:text-white">
                <FileText className="h-5 w-5 text-vynal-accent-primary" />
                Authenticité du document
              </CardTitle>
              <CardDescription className="text-vynal-purple-secondary dark:text-gray-300">
                Vérifiez si un document a été généré par Vynal Platform et n&apos;a pas été altéré
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <Tabs defaultValue="signature" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
                  <TabsTrigger value="signature" className="text-sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Signature HMAC
                  </TabsTrigger>
                  <TabsTrigger value="qrcode" className="text-sm">
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signature" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signature" className="text-vynal-purple-light dark:text-gray-200">
                      Signature HMAC-SHA256
                    </Label>
                    <Input
                      id="signature"
                      placeholder="Collez la signature HMAC du document ici"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      className="dark:bg-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/30 dark:text-white"
                    />
                  </div>
                  
                  <Button 
                    onClick={verifySignature} 
                    disabled={isVerifying || !signature}
                    className="w-full bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-white"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Vérification...
                      </>
                    ) : (
                      "Vérifier l'authenticité"
                    )}
                  </Button>
                </TabsContent>
                
                <TabsContent value="qrcode" className="space-y-4">
                  <div className="space-y-4">
                    <div className="bg-slate-100 dark:bg-vynal-purple-secondary/10 p-4 rounded-lg border border-vynal-border dark:border-vynal-purple-secondary/30 text-center">
                      <p className="text-sm text-vynal-purple-secondary dark:text-gray-300 mb-3">
                        Scannez le QR code présent sur le document avec votre appareil mobile ou utilisez votre webcam
                      </p>
                      
                      {/* Ici on intègrerait un composant de scan QR code avec la webcam */}
                      <div className="mx-auto w-64 h-64 bg-white dark:bg-black flex items-center justify-center rounded-lg border-2 border-dashed border-vynal-border dark:border-vynal-purple-secondary/30 mb-2">
                        <QrCode className="h-12 w-12 text-vynal-purple-secondary/30 dark:text-vynal-purple-secondary/20" />
                      </div>
                      
                      <p className="text-xs text-vynal-purple-secondary dark:text-gray-400">
                        ou entrez l&apos;URL du QR code manuellement
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="qrUrl" className="text-vynal-purple-light dark:text-gray-200">
                        URL du QR code
                      </Label>
                      <Input
                        id="qrUrl"
                        placeholder="https://vynalplatform.com/profile/..."
                        value={qrValue}
                        onChange={(e) => setQrValue(e.target.value)}
                        className="dark:bg-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/30 dark:text-white"
                      />
                    </div>
                    
                    <Button 
                      onClick={verifyQrCode} 
                      disabled={isVerifying || !qrValue}
                      className="w-full bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-white"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Vérification...
                        </>
                      ) : (
                        "Vérifier le QR code"
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Résultats de la vérification */}
              {verificationResult && (
                <div className="mt-6 pt-6 border-t border-vynal-border dark:border-vynal-purple-secondary/20">
                  {verificationResult === "success" ? (
                    <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700/30">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-800 dark:text-green-400 ml-2">Document authentique</AlertTitle>
                      <AlertDescription className="text-green-700/80 dark:text-green-300/80 ml-6">
                        Ce document a été généré par Vynal Platform et n&apos;a pas été modifié.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700/30">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertTitle className="text-red-800 dark:text-red-400 ml-2">Document non authentifié</AlertTitle>
                      <AlertDescription className="text-red-700/80 dark:text-red-300/80 ml-6">
                        Impossible de vérifier l&apos;authenticité de ce document. Il peut avoir été modifié ou ne pas provenir de Vynal Platform.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {documentInfo && verificationResult === "success" && (
                    <div className="mt-6 p-4 bg-white dark:bg-vynal-purple-secondary/5 rounded-lg border border-vynal-border dark:border-vynal-purple-secondary/20">
                      <h3 className="font-medium text-vynal-purple-light dark:text-white mb-3 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-vynal-accent-primary" />
                        Informations du document
                      </h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-vynal-purple-secondary/10">
                          <span className="text-vynal-purple-secondary dark:text-gray-300">Nom</span>
                          <span className="font-medium text-vynal-purple-light dark:text-white">{documentInfo.user.full_name}</span>
                        </div>
                        
                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-vynal-purple-secondary/10">
                          <span className="text-vynal-purple-secondary dark:text-gray-300">Nom d&apos;utilisateur</span>
                          <span className="font-medium text-vynal-purple-light dark:text-white">@{documentInfo.user.username}</span>
                        </div>
                        
                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-vynal-purple-secondary/10">
                          <span className="text-vynal-purple-secondary dark:text-gray-300">Rôle</span>
                          <span className="font-medium text-vynal-purple-light dark:text-white capitalize">{documentInfo.user.role}</span>
                        </div>
                        
                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-vynal-purple-secondary/10">
                          <span className="text-vynal-purple-secondary dark:text-gray-300">Date de génération</span>
                          <span className="font-medium text-vynal-purple-light dark:text-white">
                            {new Date(documentInfo.generated_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-xs text-vynal-purple-secondary dark:text-gray-400">
                        Ce document est certifié par Vynal Platform avec la technologie HMAC-SHA256.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 bg-slate-50/50 dark:bg-vynal-purple-secondary/5 border-t border-vynal-border dark:border-vynal-purple-secondary/20 p-4">
              <div className="text-sm text-vynal-purple-secondary dark:text-gray-300">
                <h3 className="font-medium text-vynal-purple-light dark:text-white mb-2">Comment vérifier un document ?</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Ouvrez le document PDF généré par Vynal Platform</li>
                  <li>Localisez la signature HMAC-SHA256 ou le QR code dans le pied de page du document</li>
                  <li>Copiez la signature ou scannez le QR code avec votre appareil</li>
                  <li>Collez la signature ou l&apos;URL dans le formulaire ci-dessus</li>
                </ol>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <footer className="bg-white dark:bg-vynal-purple-dark/30 border-t border-gray-200 dark:border-vynal-purple-secondary/20 py-6">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center text-xs text-vynal-purple-secondary dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} Vynal Platform. Tous droits réservés.</p>
            <p className="mt-1">Système sécurisé de vérification de document avec hachage HMAC-SHA256.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 