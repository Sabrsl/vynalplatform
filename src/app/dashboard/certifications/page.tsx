"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useCertifications, Certification as CertificationType } from "@/hooks/useCertifications";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Award, AlertCircle, CheckCircle, Loader, 
  FileText, Lock, Star, Clock, Calendar,
  CheckCircle2, XCircle, ExternalLink,
  Upload, Download, AlertTriangle
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Obtenir l'icône selon le type de certification
const getCertificationIcon = (type: string) => {
  switch (type) {
    case "code":
      return <FileText className="h-5 w-5" />;
    case "palette":
      return <Award className="h-5 w-5" />;
    case "shield":
      return <Lock className="h-5 w-5" />;
    case "briefcase":
      return <Calendar className="h-5 w-5" />;
    default:
      return <Award className="h-5 w-5" />;
  }
};

// Obtenir la couleur selon le statut
const getStatusColor = (status: string) => {
  switch (status) {
    case "verified":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30";
    case "expired":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30";
    case "locked":
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/30";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/30";
  }
};

// Obtenir un message selon le statut
const getStatusMessage = (status: string) => {
  switch (status) {
    case "verified":
      return "Certification vérifiée et active";
    case "pending":
      return "En attente de vérification";
    case "expired":
      return "Cette certification a expiré";
    case "locked":
      return "Passez l'examen pour débloquer cette certification";
    default:
      return "";
  }
};

// Obtenir l'icône selon le statut
const getStatusIcon = (status: string) => {
  switch (status) {
    case "verified":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    case "pending":
      return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    case "expired":
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    case "locked":
      return <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    default:
      return <Award className="h-4 w-4" />;
  }
};

// Formatage de date
const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};

const STATUS_ICONS = {
  verified: <CheckCircle className="h-5 w-5 text-green-500" />,
  pending: <Clock className="h-5 w-5 text-amber-500" />,
  expired: <AlertTriangle className="h-5 w-5 text-red-500" />,
  locked: <Lock className="h-5 w-5 text-slate-400" />
};

const STATUS_BADGES = {
  verified: <Badge variant="success">Vérifié</Badge>,
  pending: <Badge variant="warning">En attente</Badge>,
  expired: <Badge variant="destructive">Expiré</Badge>,
  locked: <Badge variant="outline">Verrouillé</Badge>
};

const STATUS_ACTIONS = {
  verified: [
    { label: "Voir le document", icon: <FileText className="h-4 w-4 mr-2" />, variant: "outline" as const },
    { label: "Télécharger", icon: <Download className="h-4 w-4 mr-2" />, variant: "outline" as const }
  ],
  pending: [
    { label: "Voir le document", icon: <FileText className="h-4 w-4 mr-2" />, variant: "outline" as const }
  ],
  expired: [
    { label: "Soumettre à nouveau", icon: <Upload className="h-4 w-4 mr-2" />, variant: "default" as const }
  ],
  locked: [
    { label: "Soumettre", icon: <Upload className="h-4 w-4 mr-2" />, variant: "default" as const }
  ]
};

// Composant principal
export default function CertificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Utilisez le hook pour obtenir les certifications
  const { certifications, loading, error, refreshCertifications } = useCertifications(profile?.id);

  useEffect(() => {
    // Rediriger si l'utilisateur n'est pas connecté
    if (!user) {
      router.push('/auth/login');
      return;
    }
  }, [user, router]);
  
  // Filtrer les certifications selon l'onglet actif
  const filteredCertifications = certifications.filter((cert: CertificationType) => {
    if (activeTab === "all") return true;
    return cert.status === activeTab;
  });
  
  // Statistiques
  const stats = {
    total: certifications.length,
    verified: certifications.filter((c: CertificationType) => c.status === "verified").length,
    pending: certifications.filter((c: CertificationType) => c.status === "pending").length,
    locked: certifications.filter((c: CertificationType) => c.status === "locked").length,
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300 text-sm animate-pulse">Chargement de vos certifications...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Certifications & Compétences</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos qualifications et valorisez votre expertise</p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={refreshCertifications}
          className="flex items-center gap-1"
        >
          <Loader size="sm" className="mr-1" /> 
          Actualiser
        </Button>
      </div>
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 dark:from-indigo-900/20 dark:to-transparent dark:border-indigo-900/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">Total certifications</p>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{stats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 dark:from-emerald-900/20 dark:to-transparent dark:border-emerald-900/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Certifications actives</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.verified}</p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 dark:from-amber-900/20 dark:to-transparent dark:border-amber-900/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">En attente</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.pending}</p>
            </div>
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-violet-50 to-white border border-violet-100 dark:from-violet-900/20 dark:to-transparent dark:border-violet-900/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-violet-600 dark:text-violet-400 mb-1">À débloquer</p>
              <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{stats.locked}</p>
            </div>
            <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
              <Lock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Onglets */}
      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md mb-6">
          <TabsTrigger value="all" className="flex-1">Toutes</TabsTrigger>
          <TabsTrigger value="verified" className="flex-1">Actives</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">En attente</TabsTrigger>
          <TabsTrigger value="locked" className="flex-1">À débloquer</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredCertifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-slate-100 p-3 mb-4 dark:bg-slate-800">
                  <Award className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-slate-700 dark:text-slate-300">Aucune certification trouvée</h3>
                <p className="text-slate-500 text-center max-w-md mb-6 dark:text-slate-400">
                  {activeTab === "all" 
                    ? "Vous n'avez pas encore de certifications. Commencez à obtenir des certifications pour valoriser votre profil."
                    : activeTab === "locked" 
                      ? "Explorez les certifications disponibles pour améliorer votre visibilité sur la plateforme."
                      : "Aucune certification dans cette catégorie pour le moment."}
                </p>
                <Button onClick={() => router.push("/certifications/explore")}>
                  Explorer les certifications
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCertifications.map((cert: CertificationType) => (
                <Card key={cert.id} className="overflow-hidden border shadow-sm">
                  <div className={`h-2 w-full ${
                    cert.status === 'verified' ? 'bg-emerald-500 dark:bg-emerald-600' :
                    cert.status === 'pending' ? 'bg-amber-500 dark:bg-amber-600' :
                    cert.status === 'expired' ? 'bg-red-500 dark:bg-red-600' :
                    'bg-slate-300 dark:bg-slate-700'
                  }`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{cert.title}</CardTitle>
                        <CardDescription>{cert.issuer}</CardDescription>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded-full border flex items-center gap-1 ${getStatusColor(cert.status)}`}>
                        {getStatusIcon(cert.status)}
                        <span>
                          {cert.status === 'verified' ? 'Vérifié' :
                           cert.status === 'pending' ? 'En attente' :
                           cert.status === 'expired' ? 'Expiré' : 'À débloquer'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{cert.description}</p>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {cert.obtainedAt && (
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-xs">Obtenue le</span>
                          <span className="font-medium">{formatDate(cert.obtainedAt)}</span>
                        </div>
                      )}
                      
                      {cert.expiresAt && (
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-xs">Expire le</span>
                          <span className="font-medium">{formatDate(cert.expiresAt)}</span>
                        </div>
                      )}
                      
                      {cert.level && (
                        <div className="mt-2">
                          <span className="text-slate-500 dark:text-slate-400 block text-xs">Niveau</span>
                          <div className="flex items-center">
                            <span className="font-medium mr-1">{cert.level}</span>
                            {cert.level === "Expert" && (
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <span className="text-slate-500 dark:text-slate-400 block text-xs">Catégorie</span>
                        <span className="capitalize font-medium">{cert.category}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                      {getStatusIcon(cert.status)}
                      <span className="ml-1">{getStatusMessage(cert.status)}</span>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      disabled={cert.status === "locked"}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {cert.status === "verified" || cert.status === "expired" ? "Voir le certificat" : 
                       cert.status === "pending" ? "Vérifier le statut" : "Débloquer"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Section explicative */}
      <div className="mt-8 bg-slate-50 dark:bg-slate-800/30 rounded-lg p-4 sm:p-6 border border-slate-200 dark:border-slate-700/50">
        <h2 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">À propos des certifications</h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
          Les certifications vous permettent de prouver vos compétences, d'augmenter votre visibilité et de gagner la confiance des clients potentiels.
          Les certifications vérifiées sont mises en avant sur votre profil.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div className="flex space-x-3">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-2 h-fit">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Certification vérifiée</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Compétence validée par des examens réalisés sur notre plateforme ou des certificats externes que nous avons vérifiés.</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2 h-fit">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">En attente de vérification</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Certificat soumis à notre équipe pour vérification. Le processus prend généralement 1-3 jours ouvrables.</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2 h-fit">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Certification expirée</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">La certification a dépassé sa date de validité. Vous pouvez la renouveler en passant à nouveau l'examen correspondant.</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-2 h-fit">
              <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Certification à débloquer</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Certification disponible mais que vous n'avez pas encore obtenue. Passez l'examen ou soumettez vos certificats externes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 