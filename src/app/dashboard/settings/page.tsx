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
  UserCog,
  Mail,
  Lock,
  CreditCard,
  Bell,
  Eye,
  EyeOff,
  Building,
  MapPin,
  Phone,
  Globe,
  PenSquare,
  Copy,
  Link,
  Plus,
  Trash,
  ChevronRight,
  Check,
  X,
  ChevronDown,
  AlertCircle,
  Save,
  Upload,
  Crown,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import { 
  ServiceData, 
  OrderData, 
  ReviewData,
  generateServicesSection,
  generateSkillsSection,
  generateOrdersSection,
  generateReviewsSection
} from "./pdfGenerator";
import { QRCode } from "@/components/ui/qrcode";
import { signDocument } from "@/utils/document-signing";
import { Loader } from "@/components/ui/loader";
import { SettingsPageSkeleton } from "@/components/skeletons/SettingsPageSkeleton";

// Définir une interface pour le profil utilisateur
interface UserProfile {
  id: string;
  phone_number?: string;
  two_factor_enabled?: boolean;
  last_data_download?: string;
  last_profile_pdf_download?: string;
  [key: string]: any; // Pour les autres propriétés qui pourraient exister
}

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, signOut } = useAuth();
  const { profile, loading: isUserLoading } = useUser();
  
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
  const [blockRemainingDays, setBlockRemainingDays] = useState(0);
  const [pdfBlockRemainingDays, setPdfBlockRemainingDays] = useState(0);
  
  // Référence au formulaire de confirmation de suppression
  const deleteInputRef = useRef<HTMLInputElement>(null);
  // Référence au conteneur de profil pour le PDF
  const profilePdfRef = useRef<HTMLDivElement>(null);

  // Chargement du profil utilisateur et vérification du blocage de téléchargement
  useEffect(() => {
    let isMounted = true;
    
    const fetchProfile = async () => {
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
        
        if (isMounted) {
          setUserProfile(data);
          if (data.phone_number) {
            setPhoneNumber(data.phone_number);
          }
          
          // Récupérer les paramètres expérimentaux
          setBetaAccess(data.beta_access || false);
          setNewDesigns(data.new_designs || false);
          setAiSuggestions(data.ai_suggestions || false);
          
          // Vérification du blocage pour les données
          if (data.last_data_download) {
            const lastDownload = new Date(data.last_data_download);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - lastDownload.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 30) {
              setBlockRemainingDays(30 - diffDays);
            } else {
              setBlockRemainingDays(0);
            }
          }
          
          // Vérification du blocage pour le PDF du profil
          if (data.last_profile_pdf_download) {
            const lastPdfDownload = new Date(data.last_profile_pdf_download);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - lastPdfDownload.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 30) {
              setPdfBlockRemainingDays(30 - diffDays);
            } else {
              setPdfBlockRemainingDays(0);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre profil. Veuillez réessayer.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchProfile();
    
    return () => {
      isMounted = false;
    };
  }, [authUser, supabase, toast]);

  // Display skeleton while loading
  if (isLoading || isUserLoading) {
    return <SettingsPageSkeleton />;
  }

  // Fonction pour convertir un objet en CSV
  const convertToCSV = (data: any[], fields: string[]) => {
    // Filtrer les champs pour enlever les IDs Supabase
    const safeFields = fields.filter(field => !field.includes("id"));
    
    const header = safeFields.join(',') + '\n';
    const rows = data.map(item => {
      return safeFields.map(field => {
        // Gérer les valeurs null ou undefined
        if (item[field] === null || item[field] === undefined) return '';
        // Échapper les virgules et les sauts de ligne
        const value = String(item[field]).replace(/"/g, '""');
        return `"${value}"`;
      }).join(',');
    }).join('\n');
    
    return header + rows;
  };

  // Fonction pour supprimer les données sensibles
  const sanitizeData = (data: any) => {
    if (!data) return null;
    
    // Créer une copie pour ne pas modifier l'original
    const sanitized = { ...data };
    
    // Supprimer tous les champs contenant "id" ou identifiants sensibles
    Object.keys(sanitized).forEach(key => {
      if (key.includes("id") || key === "auth_id" || key === "user_id" || key === "uuid") {
        delete sanitized[key];
      }
    });
    
    return sanitized;
  };

  // Récupération des commandes
  const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
        .from("orders")
          .select("*")
        .eq("user_id", authUser?.id);
        
        if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  };
  
  // Récupération des conversations
  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`id.in.(select conversation_id from conversation_participants where participant_id = ${authUser?.id})`);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  };
  
  // Récupération des transactions
  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", authUser?.id);
        
      if (error) throw error;
      return data || [];
      } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  };
  
  // Gestion du téléchargement des données
  const handleDataDownload = async () => {
    // Vérification du blocage
    if (blockRemainingDays > 0) {
      toast({
        title: "Demande trop fréquente",
        description: `Vous pourrez télécharger vos données dans ${blockRemainingDays} jour${blockRemainingDays > 1 ? 's' : ''}.`,
        variant: "destructive",
      });
      return;
    }
    
    setDownloadingData(true);
    
    try {
      // Récupération des données
      const orders = await fetchOrders().catch(() => []);
      const conversations = await fetchConversations().catch(() => []);
      const transactions = await fetchTransactions().catch(() => []);
      
      // Création des données à exporter
      const userData = {
        profile: sanitizeData(userProfile),
        email: authUser?.email,
        lastUpdated: new Date().toISOString()
      };
      
      // Conversion en CSV
      const ordersCSV = convertToCSV(orders, ["status", "amount", "created_at", "completed_at"]);
      const conversationsCSV = convertToCSV(conversations, ["created_at", "last_message_at"]);
      const transactionsCSV = convertToCSV(transactions, ["type", "amount", "status", "created_at"]);
      
      // Préparation des blobs
      const userDataBlob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const ordersBlob = new Blob([ordersCSV], { type: 'text/csv;charset=utf-8;' });
      const conversationsBlob = new Blob([conversationsCSV], { type: 'text/csv;charset=utf-8;' });
      const transactionsBlob = new Blob([transactionsCSV], { type: 'text/csv;charset=utf-8;' });
      
      try {
        // Création du ZIP
        const JSZipModule = await import('jszip');
        const JSZip = JSZipModule.default;
        const zip = new JSZip();
        
        // Ajout des fichiers
        zip.file("mon-profil.json", userDataBlob);
        zip.file("mes-commandes.csv", ordersBlob);
        zip.file("mes-conversations.csv", conversationsBlob);
        zip.file("mes-transactions.csv", transactionsBlob);
        
        // Génération du ZIP
        const zipContent = await zip.generateAsync({ type: "blob" });
        
        // Format de date pour le nom de fichier
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const formattedDate = `${day}_${month}_${year}`;
        
        // Téléchargement
        const zipUrl = URL.createObjectURL(zipContent);
        const downloadLink = document.createElement('a');
        downloadLink.href = zipUrl;
        downloadLink.download = `mes_donnees_vynalplatform_${formattedDate}.zip`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Mise à jour de la date de téléchargement en DB
        const now = new Date().toISOString();
        const { error } = await supabase
        .from("profiles")
          .update({ last_data_download: now })
          .eq("id", authUser?.id);
          
        if (error) {
          console.error("Erreur lors de la mise à jour de la date:", error);
        } else {
          // Mise à jour du profil local
          setUserProfile(prev => {
            if (!prev) return null;
            return { ...prev, last_data_download: now };
          });
          
          // Mise à jour du blocage
          setBlockRemainingDays(30);
      
      toast({
            title: "Téléchargement terminé",
            description: "Toutes vos données ont été téléchargées avec succès.",
          });
        }
      } catch (zipError) {
        console.error("Erreur lors de la création du ZIP:", zipError);
        toast({
          title: "Erreur",
          description: "Impossible de créer l'archive ZIP. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
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
    // Vérification du blocage
    if (pdfBlockRemainingDays > 0) {
      toast({
        title: "Demande trop fréquente",
        description: `Vous pourrez exporter votre profil dans ${pdfBlockRemainingDays} jour${pdfBlockRemainingDays > 1 ? 's' : ''}.`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      setExportingPdf(true);
      
      // Importation dynamique des bibliothèques nécessaires
      const [jsPDFModule, html2canvasModule, CryptoJSModule, QRCodeModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
        import('crypto-js'),
        import('qrcode')
      ]);
      
      const jsPDF = jsPDFModule.default;
      const html2canvas = html2canvasModule.default;
      const CryptoJS = CryptoJSModule.default;
      const QRCode = QRCodeModule.default;
      
      // Récupération des données complètes du profil
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser?.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Récupération des commandes
      let ordersData: OrderData[] = [];
      try {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", authUser?.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (data) ordersData = data;
    } catch (error) {
        console.error("Erreur lors de la récupération des commandes:", error);
      }
      
      // Récupération des avis
      let reviewsData: ReviewData[] = [];
      try {
        const { data } = await supabase
          .from("reviews")
          .select("*")
          .eq(profile?.role === 'freelance' ? "freelance_id" : "client_id", authUser?.id)
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (data) reviewsData = data;
      } catch (error) {
        console.error("Erreur lors de la récupération des avis:", error);
      }
      
      // Si c'est un freelance, récupérer ses services
      let servicesData: ServiceData[] = [];
      if (profile?.role === 'freelance') {
        try {
          const { data } = await supabase
            .from("services")
            .select("*")
            .eq("user_id", authUser?.id)
            .order('created_at', { ascending: false })
            .limit(3);
            
          if (data) servicesData = data;
    } catch (error) {
          console.error("Erreur lors de la récupération des services:", error);
        }
      }
      
      // Créer une structure de données pour le document
      const documentData = {
        profile: {
          id: authUser?.id,
          email: authUser?.email,
          username: profile?.username,
          full_name: profileData?.full_name,
          role: profile?.role,
          bio: profileData?.bio,
          skills: profileData?.skills,
          created_at: profileData?.created_at,
          rating: profileData?.rating,
          completed_orders: profileData?.completed_orders
        },
        services: servicesData && servicesData.length > 0 ? servicesData.map(service => ({
          title: service.title,
          price: service.price,
          delivery_time: service.delivery_time
        })) : [],
        orders: ordersData && ordersData.length > 0 ? ordersData.map(order => ({
          status: order.status,
          amount: order.amount,
          created_at: order.created_at
        })) : [],
        exportInfo: {
          date: new Date().toISOString(),
          platform: 'Vynal Platform',
          version: '1.0'
        }
      };
      
      // Générer la signature HMAC pour le document
      const hmacSignature = signDocument(documentData);
      
      // URL du profil et domaine de la plateforme
      const platformDomain = "https://vynalplatform.com";
      const profileUrl = `${platformDomain}/profile/${profile?.username || authUser?.id}`;
      const verificationUrl = `${platformDomain}/verification`;
      
      // Date formatée pour le nom de fichier
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const formattedDate = `${day}_${month}_${year}`;
      const formattedDateTime = `${day}/${month}/${year} à ${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
      
      // Génération dynamique du HTML pour le PDF
      const tempDiv = document.createElement('div');
      tempDiv.className = 'pdf-container';
      tempDiv.innerHTML = `
        <div style="width: 210mm; padding: 0; font-family: 'Helvetica', sans-serif; color: #333; position: relative;">
          <!-- Bannière supérieure avec dégradé -->
          <div style="height: 35mm; background: linear-gradient(135deg, #7656ED 0%, #5926b9 50%, #11064F 100%); position: relative; overflow: hidden; margin-bottom: 15mm;">
            <!-- Cercles décoratifs -->
            <div style="position: absolute; width: 60mm; height: 60mm; border-radius: 50%; background: rgba(255,255,255,0.1); top: -20mm; right: -20mm;"></div>
            <div style="position: absolute; width: 30mm; height: 30mm; border-radius: 50%; background: rgba(255,255,255,0.05); bottom: -10mm; left: 40mm;"></div>
            
            <!-- Contenu de la bannière -->
            <div style="position: relative; z-index: 2; display: flex; justify-content: space-between; padding: 15mm;">
              <div>
                <h1 style="font-size: 28pt; margin: 0; color: white; font-weight: 800;">${profileData?.full_name || 'Nom non spécifié'}</h1>
                ${profile?.username ? `<p style="margin: 2mm 0 0; font-size: 13pt; color: rgba(255,255,255,0.85);">@${profile.username}</p>` : ''}
                <p style="margin: 1mm 0 0; font-size: 11pt; color: rgba(255,255,255,0.7); font-weight: 500;">${profile?.role === 'freelance' ? 'Freelance' : 'Client'}</p>
              </div>
              <div style="text-align: right; background: rgba(255,255,255,0.15); padding: 3mm; border-radius: 2mm;">
                <img src="${platformDomain}/img/logo-vynal.png" alt="Vynal" style="height: 12mm; margin-bottom: 2mm;" />
                <p style="margin: 0; font-size: 7pt; color: rgba(255,255,255,0.9);">PROFIL CERTIFIÉ</p>
              </div>
            </div>
          </div>
          
          <!-- Corps du document avec design moderne -->
          <div style="padding: 0 15mm;">
            <!-- Photo de profil en médaillon -->
            <div style="position: absolute; top: 32mm; left: 15mm; width: 35mm; height: 35mm; border-radius: 50%; background-color: white; overflow: hidden; border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
              ${profileData?.avatar_url 
                ? `<img src="${profileData.avatar_url}" alt="Photo de profil" style="width: 100%; height: 100%; object-fit: cover;">`
                : `<div style="width: 100%; height: 100%; background-color: #e6e6f5; display: flex; align-items: center; justify-content: center; font-size: 32pt; color: #7656ED; font-weight: bold;">${profileData?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}</div>`
              }
            </div>
            
            <!-- Section présentation avec carte élégante -->
            <div style="margin-bottom: 8mm; margin-top: 25mm; box-shadow: 0 5px 15px rgba(0,0,0,0.08); border-radius: 3mm; overflow: hidden;">
              <div style="padding: 2mm 5mm; background: linear-gradient(90deg, #7656ED 0%, #5926b9 100%); color: white;">
                <h2 style="font-size: 14pt; margin: 3mm 0; font-weight: 600;">PRÉSENTATION</h2>
              </div>
              <div style="padding: 5mm; background-color: white;">
                <p style="margin: 0; font-size: 10pt; line-height: 1.5; color: #444;">${profileData?.bio || 'Aucune biographie renseignée'}</p>
              </div>
            </div>
            
            <!-- 2 colonnes avec design moderne -->
            <div style="display: flex; margin-bottom: 8mm; gap: 8mm;">
              <!-- Statistiques -->
              <div style="flex: 1; box-shadow: 0 5px 15px rgba(0,0,0,0.08); border-radius: 3mm; overflow: hidden;">
                <div style="padding: 2mm 5mm; background: linear-gradient(90deg, #5926b9 0%, #11064F 100%); color: white;">
                  <h2 style="font-size: 14pt; margin: 3mm 0; font-weight: 600;">STATISTIQUES</h2>
                </div>
                <div style="padding: 5mm; background-color: white;">
                  <div style="font-size: 10pt; line-height: 1.6;">
                    <div style="display: flex; align-items: center; margin-bottom: 3mm;">
                      <div style="width: 5mm; height: 5mm; border-radius: 50%; background-color: #7656ED; margin-right: 3mm;"></div>
                      <p style="margin: 0;"><strong>Membre depuis:</strong> ${new Date(profileData?.created_at || Date.now()).toLocaleDateString()}</p>
                    </div>
                    ${profileData?.completed_orders ? `
                    <div style="display: flex; align-items: center; margin-bottom: 3mm;">
                      <div style="width: 5mm; height: 5mm; border-radius: 50%; background-color: #7656ED; margin-right: 3mm;"></div>
                      <p style="margin: 0;"><strong>Commandes complétées:</strong> ${profileData.completed_orders}</p>
                    </div>` : ''}
                    ${profileData?.rating ? `
                    <div style="display: flex; align-items: center;">
                      <div style="width: 5mm; height: 5mm; border-radius: 50%; background-color: #7656ED; margin-right: 3mm;"></div>
                      <p style="margin: 0;"><strong>Note moyenne:</strong> ${profileData.rating.toFixed(1)}/5 ${'★'.repeat(Math.round(profileData.rating))}${'☆'.repeat(5 - Math.round(profileData.rating))}</p>
                    </div>` : ''}
                  </div>
                </div>
              </div>
              
              <!-- Contact -->
              <div style="flex: 1; box-shadow: 0 5px 15px rgba(0,0,0,0.08); border-radius: 3mm; overflow: hidden;">
                <div style="padding: 2mm 5mm; background: linear-gradient(90deg, #5926b9 0%, #11064F 100%); color: white;">
                  <h2 style="font-size: 14pt; margin: 3mm 0; font-weight: 600;">CONTACT</h2>
                </div>
                <div style="padding: 5mm; background-color: white;">
                  <div style="font-size: 10pt; line-height: 1.6;">
                    <div style="display: flex; align-items: center; margin-bottom: 3mm;">
                      <div style="width: 5mm; height: 5mm; border-radius: 50%; background-color: #7656ED; margin-right: 3mm;"></div>
                      <p style="margin: 0;"><strong>Email:</strong> ${authUser?.email || 'Non spécifié'}</p>
                    </div>
                    ${profileData?.phone_number ? `
                    <div style="display: flex; align-items: center; margin-bottom: 3mm;">
                      <div style="width: 5mm; height: 5mm; border-radius: 50%; background-color: #7656ED; margin-right: 3mm;"></div>
                      <p style="margin: 0;"><strong>Téléphone:</strong> ${profileData.phone_number}</p>
                    </div>` : ''}
                    <div style="display: flex; align-items: center;">
                      <div style="width: 5mm; height: 5mm; border-radius: 50%; background-color: #7656ED; margin-right: 3mm;"></div>
                      <p style="margin: 0;"><strong>Profil en ligne:</strong> <a href="${profileUrl}" style="color: #7656ED; text-decoration: none;">${profileUrl}</a></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Sections compétences/services/commandes avec design moderne -->
            ${profile?.role === 'freelance' && profileData?.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0 ? `
            <div style="margin-bottom: 8mm; box-shadow: 0 5px 15px rgba(0,0,0,0.08); border-radius: 3mm; overflow: hidden;">
              <div style="padding: 2mm 5mm; background: linear-gradient(90deg, #7656ED 0%, #5926b9 100%); color: white;">
                <h2 style="font-size: 14pt; margin: 3mm 0; font-weight: 600;">COMPÉTENCES</h2>
              </div>
              <div style="padding: 5mm; background-color: white;">
                <div style="display: flex; flex-wrap: wrap; gap: 2mm;">
                  ${profileData.skills.map((skill: string) => 
                    `<span style="padding: 2mm 3mm; background-color: rgba(118, 86, 237, 0.1); border-radius: 2mm; font-size: 9pt; color: #7656ED; font-weight: 500;">${skill}</span>`
                  ).join('')}
                </div>
              </div>
            </div>` : ''}
            
            ${profile?.role === 'freelance' && servicesData.length > 0 ? `
            <div style="margin-bottom: 8mm; box-shadow: 0 5px 15px rgba(0,0,0,0.08); border-radius: 3mm; overflow: hidden;">
              <div style="padding: 2mm 5mm; background: linear-gradient(90deg, #7656ED 0%, #5926b9 100%); color: white;">
                <h2 style="font-size: 14pt; margin: 3mm 0; font-weight: 600;">SERVICES PROPOSÉS</h2>
              </div>
              <div style="padding: 5mm; background-color: white;">
                <div style="display: flex; flex-direction: column; gap: 5mm;">
                  ${servicesData.map(service => `
                    <div style="padding: 5mm; background-color: rgba(118, 86, 237, 0.05); border-radius: 2mm; border-left: 3px solid #7656ED;">
                      <h3 style="font-size: 12pt; margin: 0 0 3mm; color: #333;">${service.title}</h3>
                      <p style="margin: 0 0 3mm; font-size: 9pt; color: #555; line-height: 1.4;">${service.description.substring(0, 100)}${service.description.length > 100 ? '...' : ''}</p>
                      <div style="display: flex; justify-content: space-between; font-size: 9pt; font-weight: 500;">
                        <span style="padding: 1mm 3mm; background-color: #7656ED; color: white; border-radius: 2mm;">${service.price}€</span>
                        <span style="padding: 1mm 3mm; background-color: rgba(118, 86, 237, 0.2); color: #333; border-radius: 2mm;">Délai: ${service.delivery_time} jour${service.delivery_time > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>` : ''}
            
            ${ordersData && ordersData.length > 0 ? `
            <div style="margin-bottom: 8mm; box-shadow: 0 5px 15px rgba(0,0,0,0.08); border-radius: 3mm; overflow: hidden;">
              <div style="padding: 2mm 5mm; background: linear-gradient(90deg, #5926b9 0%, #11064F 100%); color: white;">
                <h2 style="font-size: 14pt; margin: 3mm 0; font-weight: 600;">COMMANDES RÉCENTES</h2>
              </div>
              <div style="padding: 0; background-color: white;">
                <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                  <thead>
                    <tr style="background-color: rgba(118, 86, 237, 0.1); text-align: left;">
                      <th style="padding: 3mm; color: #333; font-weight: 600;">Service</th>
                      <th style="padding: 3mm; color: #333; font-weight: 600;">Date</th>
                      <th style="padding: 3mm; color: #333; font-weight: 600;">Statut</th>
                      <th style="padding: 3mm; color: #333; font-weight: 600;">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ordersData.map((order, index) => `
                      <tr style="background-color: ${index % 2 === 0 ? 'white' : 'rgba(118, 86, 237, 0.02)'};">
                        <td style="padding: 3mm;">${order.service_title || 'Service #' + order.service_id}</td>
                        <td style="padding: 3mm;">${new Date(order.created_at).toLocaleDateString()}</td>
                        <td style="padding: 3mm;">
                          <span style="
                            padding: 1mm 2mm; 
                            border-radius: 2mm; 
                            font-size: 8pt;
                            white-space: nowrap;
                            font-weight: 500;
                            background-color: ${
                              order.status === 'completed' ? 'rgba(76, 175, 80, 0.2)' : 
                              order.status === 'in_progress' ? 'rgba(33, 150, 243, 0.2)' : 
                              order.status === 'cancelled' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(158, 158, 158, 0.2)'
                            };
                            color: ${
                              order.status === 'completed' ? '#2E7D32' : 
                              order.status === 'in_progress' ? '#0D47A1' : 
                              order.status === 'cancelled' ? '#B71C1C' : '#424242'
                            };
                          ">
                            ${
                              order.status === 'completed' ? 'Terminé' : 
                              order.status === 'in_progress' ? 'En cours' : 
                              order.status === 'cancelled' ? 'Annulé' : 'En attente'
                            }
                          </span>
                        </td>
                        <td style="padding: 3mm; font-weight: 500;">${order.amount}€</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>` : ''}
            
            ${reviewsData && reviewsData.length > 0 ? `
            <div style="margin-bottom: 8mm; box-shadow: 0 5px 15px rgba(0,0,0,0.08); border-radius: 3mm; overflow: hidden;">
              <div style="padding: 2mm 5mm; background: linear-gradient(90deg, #7656ED 0%, #5926b9 100%); color: white;">
                <h2 style="font-size: 14pt; margin: 3mm 0; font-weight: 600;">AVIS CLIENTS</h2>
              </div>
              <div style="padding: 5mm; background-color: white;">
                <div style="display: flex; flex-direction: column; gap: 5mm;">
                  ${reviewsData.map(review => `
                    <div style="position: relative; padding: 5mm; background-color: #f9f9f9; border-radius: 2mm; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                      <div style="position: absolute; top: 5mm; right: 5mm; font-size: 10pt; color: #FFD700;">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                      </div>
                      <p style="margin: 0 0 3mm; font-size: 10pt; font-style: italic; color: #444; line-height: 1.5;">
                        "${review.comment}"
                      </p>
                      <div style="display: flex; justify-content: flex-end; align-items: center;">
                        <div style="width: 5mm; height: 5mm; border-radius: 50%; background-color: #7656ED; margin-right: 2mm;"></div>
                        <p style="margin: 0; font-size: 9pt; color: #666; font-weight: 500;">
                          ${review.reviewer_name || 'Anonyme'} - ${new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>` : ''}
            
            <!-- Pied de page avec QR Code, date et signature HMAC -->
            <div style="margin-top: 15mm; padding-top: 5mm; border-top: 1px solid rgba(118, 86, 237, 0.2);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="max-width: 65%;">
                  <p style="margin: 0 0 2mm; font-size: 9pt; color: #333; font-weight: 600;">DOCUMENT CERTIFIÉ HMAC-SHA256</p>
                  <p style="margin: 0 0 2mm; font-size: 8pt; color: #666;">Généré le ${formattedDateTime}</p>
                  <p style="margin: 0; font-size: 7pt; color: #999; word-break: break-all;">${hmacSignature}</p>
                </div>
                <div style="text-align: right;">
                  <div id="qrcode" style="width: 25mm; height: 25mm; padding: 2mm; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 2mm;"></div>
                  <p style="margin: 2mm 0 0; font-size: 7pt; color: #666; text-align: center;">Scannez pour vérifier</p>
                </div>
              </div>
              <p style="margin: 7mm 0 5mm; font-size: 7pt; color: #777; text-align: center; background-color: rgba(118, 86, 237, 0.05); padding: 2mm; border-radius: 2mm;">
                Ce document a été généré par Vynal Platform. Sa validité peut être vérifiée en ligne à l'adresse ${verificationUrl}
              </p>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      // Ajout du QR code
      const qrCodeCanvas = document.createElement('canvas');
      qrCodeCanvas.width = 100;
      qrCodeCanvas.height = 100;
      const qrCodeContainer = tempDiv.querySelector('#qrcode');
      if (qrCodeContainer) {
        qrCodeContainer.appendChild(qrCodeCanvas);
        await QRCode.toCanvas(qrCodeCanvas, profileUrl, {
          width: 100,
          margin: 1,
          color: {
            dark: '#7656ED',
            light: '#FFFFFF'
          }
        });
      }
      
      // Conversion en canvas puis en PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      // Nettoyage du DOM
      document.body.removeChild(tempDiv);
      
      // Création du PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Ajout d'une page supplémentaire avec les informations de certification
      pdf.addPage();
      pdf.setFontSize(20);
      pdf.setTextColor(118, 86, 237); // #7656ED
      pdf.text('CERTIFICAT D\'AUTHENTICITÉ', 105, 30, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(51, 51, 51); // #333333
      pdf.text('Ce document a été généré et certifié par Vynal Platform', 105, 45, { align: 'center' });
      
      // Design moderne pour les informations
      pdf.setFillColor(245, 245, 250);
      pdf.roundedRect(20, 60, 170, 70, 3, 3, 'F');
      
      pdf.setFontSize(12);
      pdf.setTextColor(118, 86, 237); 
      pdf.text('Informations de certification', 105, 75, { align: 'center' });
      
      // Icônes stylisées avec cercles colorés
      const drawColorDot = (x: number, y: number, color: string) => {
        pdf.setFillColor(color);
        pdf.circle(x, y, 2, 'F');
      };
      
      drawColorDot(30, 90, '#7656ED');
      pdf.text('Date de génération: ' + formattedDateTime, 40, 90);
      
      drawColorDot(30, 100, '#7656ED');
      pdf.text('Identifiant utilisateur: ' + (authUser?.id?.substring(0, 8) + '...'), 40, 100);
      
      drawColorDot(30, 110, '#7656ED');
      pdf.text('Nom d\'utilisateur: ' + (profile?.username || 'Non spécifié'), 40, 110);
      
      drawColorDot(30, 120, '#7656ED');
      pdf.text('Email: ' + authUser?.email, 40, 120);
      
      // Cadre décoratif pour la signature
      pdf.setDrawColor(118, 86, 237);
      pdf.setFillColor(250, 250, 255);
      pdf.roundedRect(20, 145, 170, 50, 3, 3, 'FD');
      
      pdf.setFontSize(11);
      pdf.setTextColor(118, 86, 237);
      pdf.text('Signature HMAC-SHA256', 105, 155, { align: 'center' });
      
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      const signatureLines = [];
      let tempLine = '';
      const maxWidth = 150;
      
      for (let i = 0; i < hmacSignature.length; i++) {
        tempLine += hmacSignature[i];
        
        if (pdf.getTextWidth(tempLine) > maxWidth || i === hmacSignature.length - 1) {
          signatureLines.push(tempLine);
          tempLine = '';
        }
      }
      
      signatureLines.forEach((line, index) => {
        pdf.text(line, 105, 165 + (index * 5), { align: 'center' });
      });
      
      // Instructions de vérification avec design moderne
      pdf.setFillColor(239, 246, 255);
      pdf.roundedRect(20, 210, 170, 40, 3, 3, 'F');
      
      pdf.setFontSize(11);
      pdf.setTextColor(33, 150, 243);
      pdf.text('Instructions de vérification', 105, 220, { align: 'center' });
      
      pdf.setFontSize(9);
      pdf.setTextColor(68, 68, 68);
      pdf.text('1. Visitez ' + verificationUrl, 40, 230);
      pdf.text('2. Scannez le QR code ou saisissez la signature HMAC-SHA256', 40, 237);
      pdf.text('3. Vérifiez que les informations correspondent à ce document', 40, 244);
      
      // Pied de page avec avertissement
      pdf.setFillColor(253, 237, 237);
      pdf.roundedRect(20, 260, 170, 20, 3, 3, 'F');
      
      pdf.setFontSize(8);
      pdf.setTextColor(244, 67, 54);
      pdf.text('Ce document est valable uniquement avec sa signature HMAC-SHA256 intacte.', 105, 270, { align: 'center' });
      pdf.text('Toute modification invalide automatiquement la certification.', 105, 275, { align: 'center' });
      
      // Téléchargement du PDF
      pdf.save(`profil_${profile?.username || authUser?.id}_${formattedDate}.pdf`);
      
      // Mise à jour de la date de dernière génération de PDF
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({ last_profile_pdf_download: now })
        .eq("id", authUser?.id);
        
      if (error) {
        console.error("Erreur lors de la mise à jour de la date d'export PDF:", error);
      } else {
        // Mise à jour du profil local
        setUserProfile(prev => {
          if (!prev) return null;
          return { ...prev, last_profile_pdf_download: now };
        });
        
        // Mise à jour du blocage
        setPdfBlockRemainingDays(30);
      
      toast({
        title: "Export terminé",
          description: "Votre profil a été exporté en PDF avec certification HMAC.",
      });
      }
    } catch (error) {
      console.error("Erreur lors de l'export du profil:", error);
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
                            <Loader size="xs" variant="primary" className="mr-2" />
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
                          <Loader size="xs" variant="primary" className="mr-2" />
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
                              <Loader size="xs" variant="primary" className="mr-2" />
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
                              <Loader size="xs" variant="primary" className="mr-2" />
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
                            <Loader size="xs" variant="primary" className="mr-2" />
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
                  <div className="p-1.5 rounded-md bg-vynal-accent-secondary/10 dark:bg-vynal-accent-secondary/20">
                    <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-vynal-accent-secondary dark:text-vynal-accent-secondary" />
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
                  
                  <div className="text-xs flex items-start gap-1.5 p-2 rounded-md bg-vynal-accent-secondary/5 dark:bg-vynal-purple-secondary/5 border border-vynal-accent-secondary/10 dark:border-vynal-purple-secondary/10">
                    <AlertTriangle className="h-3 w-3 text-vynal-accent-secondary dark:text-vynal-accent-secondary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-vynal-purple-dark dark:text-vynal-text-primary font-medium">Info :</span>
                      <span className="ml-1 text-vynal-purple-secondary dark:text-vynal-text-secondary/90">
                        Limité à une demande tous les 30 jours.
                        {pdfBlockRemainingDays > 0 ? (
                          <span className="ml-1 text-vynal-accent-secondary dark:text-vynal-accent-secondary">
                            Prochaine demande possible dans {pdfBlockRemainingDays} jour{pdfBlockRemainingDays > 1 ? 's' : ''}.
                          </span>
                        ) : userProfile?.last_profile_pdf_download && (
                          <span className="ml-1 text-vynal-accent-secondary dark:text-vynal-accent-secondary">
                            Dernière : {new Date(userProfile.last_profile_pdf_download).toLocaleDateString()}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary mt-3">
                    Le PDF de votre profil inclura :
                  </p>
                  <ul className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary list-disc pl-4 space-y-1">
                    <li>Vos informations personnelles et professionnelles</li>
                    <li>Vos compétences et services (pour les freelances)</li>
                    <li>Historique des commandes récentes</li>
                    <li>Avis et témoignages reçus</li>
                    <li>QR code pour accéder directement à votre profil en ligne</li>
                  </ul>
                  
                <Button
                    variant="outline"
                    onClick={handleProfileExport}
                    disabled={exportingPdf || pdfBlockRemainingDays > 0}
                    className={`w-full sm:w-auto text-xs border-vynal-border bg-white hover:bg-slate-50 dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/5 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10 mt-2 ${
                      pdfBlockRemainingDays > 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {exportingPdf ? (
                      <>
                        <Loader size="xs" variant="primary" className="mr-2" />
                        Génération du PDF...
                    </>
                    ) : pdfBlockRemainingDays > 0 ? (
                      <>
                        <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                        Indisponible pour {pdfBlockRemainingDays} jour{pdfBlockRemainingDays > 1 ? 's' : ''}
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
                  <div className="text-xs flex items-start gap-1.5 p-2 rounded-md bg-vynal-accent-primary/5 dark:bg-vynal-purple-secondary/5 border border-vynal-accent-primary/10 dark:border-vynal-purple-secondary/10">
                    <AlertTriangle className="h-3 w-3 text-vynal-accent-primary dark:text-vynal-accent-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-vynal-purple-dark dark:text-vynal-text-primary font-medium">Info :</span>
                      <span className="ml-1 text-vynal-purple-secondary dark:text-vynal-text-secondary/90">
                        Limité à une demande tous les 30 jours.
                        {blockRemainingDays > 0 ? (
                          <span className="ml-1 text-vynal-accent-primary dark:text-vynal-accent-primary">
                            Prochaine demande possible dans {blockRemainingDays} jour{blockRemainingDays > 1 ? 's' : ''}.
                          </span>
                        ) : userProfile?.last_data_download && (
                          <span className="ml-1 text-vynal-accent-primary dark:text-vynal-accent-primary">
                            Dernière : {new Date(userProfile.last_data_download).toLocaleDateString()}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary mt-3">
                    Le fichier ZIP téléchargé contiendra :
                  </p>
                  <ul className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary list-disc pl-4 space-y-1">
                    <li>Votre profil (JSON)</li>
                    <li>Vos commandes (CSV)</li>
                    <li>Vos conversations (CSV)</li>
                    <li>Vos transactions (CSV)</li>
                  </ul>

                  <Button
                    variant="outline"
                    onClick={handleDataDownload}
                    disabled={downloadingData || blockRemainingDays > 0}
                    className={`w-full sm:w-auto text-xs border-vynal-border bg-white hover:bg-slate-50 dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/5 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10 mt-2 ${
                      blockRemainingDays > 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {downloadingData ? (
                      <>
                        <Loader size="xs" variant="primary" className="mr-2" />
                        Téléchargement...
                      </>
                    ) : blockRemainingDays > 0 ? (
                      <>
                        <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                        Indisponible pour {blockRemainingDays} jour{blockRemainingDays > 1 ? 's' : ''}
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-3.5 w-3.5" />
                        Télécharger toutes les données
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