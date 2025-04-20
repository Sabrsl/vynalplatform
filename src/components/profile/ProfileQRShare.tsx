"use client";

import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { 
  Share2, 
  Download, 
  Link as LinkIcon,
  QrCode 
} from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  TelegramIcon,
  EmailIcon,
} from "react-share";

interface ProfileQRShareProps {
  profileData: {
    username: string;
    full_name: string;
    bio: string;
    avatar_url: string;
    phone?: string;
  };
  baseUrl: string;
}

export function ProfileQRShare({ profileData, baseUrl }: ProfileQRShareProps) {
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string>("");
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrWithLogo, setQrWithLogo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Vérifier si le profil est complet pour télécharger le QR code
  const isProfileComplete = 
    profileData.username && 
    profileData.full_name && 
    profileData.bio && 
    profileData.avatar_url;

  // Générer le QR code simple
  useEffect(() => {
    if (profileData.username) {
      const url = `${baseUrl}/profile/${profileData.username}`;
      setProfileUrl(url);
      
      QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
          dark: '#5926b9',
          light: '#ffffff'
        },
        width: 300
      })
        .then((dataUrl: string) => {
          setQrDataUrl(dataUrl);
        })
        .catch((err: Error) => {
          console.error("Erreur lors de la génération du QR code:", err);
        });
    }
  }, [profileData.username, baseUrl]);

  // Générer le QR code avec logo
  const generateQRWithLogo = async () => {
    if (!qrDataUrl || !profileData.avatar_url || !isProfileComplete) return;
    
    setIsGenerating(true);
    
    try {
      // Créer un canevas pour le QR code avec haute résolution pour meilleure qualité
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Impossible de créer le contexte canvas");
      
      // Paramétrer le canevas avec haute résolution
      const scale = 4; // Haute qualité (x4)
      canvas.width = 400 * scale;
      canvas.height = 400 * scale;
      ctx.scale(scale, scale);
      
      // Créer un dégradé ultra-moderne pour l'arrière-plan
      const gradient = ctx.createRadialGradient(200, 200, 50, 200, 200, 300);
      gradient.addColorStop(0, "#7928CA");
      gradient.addColorStop(0.6, "#5926b9");
      gradient.addColorStop(1, "#11064F");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 400);
      
      // Ajouter un effet d'éclairage
      const glow = ctx.createRadialGradient(200, 200, 0, 200, 200, 400);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.3)");
      glow.addColorStop(0.5, "rgba(255, 255, 255, 0)");
      glow.addColorStop(1, "rgba(121, 40, 202, 0.1)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 400, 400);
      
      // Dessiner un cadre intérieur pour le QR code
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(35, 35, 330, 330, 20);
      ctx.fill();
      
      // Effet d'ombre pour le cadre blanc
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Charger l'image du QR code
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      
      await new Promise((resolve) => {
        qrImg.onload = resolve;
      });
      
      // Réinitialiser l'ombre avant de dessiner le QR code
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      
      // Dessiner le QR code
      ctx.drawImage(qrImg, 50, 50, 300, 300);
      
      // Créer un cercle brillant au milieu
      const centerGlow = ctx.createRadialGradient(200, 200, 0, 200, 200, 60);
      centerGlow.addColorStop(0, "rgba(255, 255, 255, 1)");
      centerGlow.addColorStop(0.7, "rgba(255, 255, 255, 0.8)");
      centerGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = centerGlow;
      ctx.beginPath();
      ctx.arc(200, 200, 48, 0, Math.PI * 2);
      ctx.fill();
      
      // Charger et ajouter la photo de profil au centre
      const avatarImg = new Image();
      avatarImg.crossOrigin = "anonymous";
      avatarImg.src = profileData.avatar_url;
      
      await new Promise((resolve) => {
        avatarImg.onload = resolve;
      });
      
      // Créer un canevas de masque circulaire pour l'avatar
      const avatarCanvas = document.createElement('canvas');
      avatarCanvas.width = 90;
      avatarCanvas.height = 90;
      const avatarCtx = avatarCanvas.getContext('2d');
      
      if (!avatarCtx) throw new Error("Impossible de créer le contexte canvas pour l'avatar");
      
      // Dessiner l'avatar en cercle avec ombre intérieure
      avatarCtx.save();
      avatarCtx.beginPath();
      avatarCtx.arc(45, 45, 45, 0, Math.PI * 2);
      avatarCtx.closePath();
      avatarCtx.clip();
      
      // Ajouter une ombre intérieure
      avatarCtx.shadowColor = "rgba(0, 0, 0, 0.4)";
      avatarCtx.shadowBlur = 10;
      avatarCtx.shadowOffsetX = 0;
      avatarCtx.shadowOffsetY = 0;
      avatarCtx.drawImage(avatarImg, 0, 0, 90, 90);
      avatarCtx.restore();
      
      // Ajouter l'avatar circulaire au QR code
      ctx.drawImage(avatarCanvas, 155, 155, 90, 90);
      
      // Ajouter un cercle de bordure premium
      ctx.strokeStyle = "#7928CA";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(200, 200, 47, 0, Math.PI * 2);
      ctx.stroke();
      
      // Ajouter un anneau lumineux autour de la photo
      const ringGlow = ctx.createRadialGradient(200, 200, 44, 200, 200, 55);
      ringGlow.addColorStop(0, "rgba(121, 40, 202, 0)");
      ringGlow.addColorStop(0.5, "rgba(121, 40, 202, 0.7)");
      ringGlow.addColorStop(1, "rgba(121, 40, 202, 0)");
      ctx.fillStyle = ringGlow;
      ctx.beginPath();
      ctx.arc(200, 200, 55, 0, Math.PI * 2);
      ctx.fill();
      
      // Charger le logo Vynal Platform 
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = "/assets/logo/logo_vynal_platform_simple.webp";
      
      await new Promise((resolve) => {
        logoImg.onload = resolve;
      });
      
      // Ajouter le logo Vynal Platform en bas à droite de façon élégante
      const logoSize = 35; // Taille réduite pour le logo
      
      // Dessiner un cercle blanc en arrière-plan pour le logo
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(330, 330, logoSize/2 + 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Dessiner le logo sans le déformer en respectant son ratio
      ctx.save();
      ctx.beginPath();
      ctx.arc(330, 330, logoSize/2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      // Calculer le ratio pour éviter la déformation
      const logoRatio = logoImg.width / logoImg.height;
      let drawWidth = logoSize;
      let drawHeight = logoSize;
      let offsetX = 0;
      let offsetY = 0;
      
      if (logoRatio > 1) {
        // Image plus large que haute
        drawHeight = drawWidth / logoRatio;
        offsetY = (logoSize - drawHeight) / 2;
      } else {
        // Image plus haute que large
        drawWidth = drawHeight * logoRatio;
        offsetX = (logoSize - drawWidth) / 2;
      }
      
      ctx.drawImage(
        logoImg, 
        330 - logoSize/2 + offsetX, 
        330 - logoSize/2 + offsetY, 
        drawWidth, 
        drawHeight
      );
      ctx.restore();
      
      // Ajouter un cercle de bordure autour du logo avec effet de lueur
      ctx.strokeStyle = "#7928CA";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(330, 330, logoSize/2 + 2, 0, Math.PI * 2);
      ctx.stroke();
      
      // Ajouter un effet de halo subtil autour du logo
      const logoGlow = ctx.createRadialGradient(330, 330, logoSize/2, 330, 330, logoSize);
      logoGlow.addColorStop(0, "rgba(255, 255, 255, 0.4)");
      logoGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = logoGlow;
      ctx.beginPath();
      ctx.arc(330, 330, logoSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Convertir le canevas en URL de données
      const finalQrUrl = canvas.toDataURL("image/png");
      setQrWithLogo(finalQrUrl);
      
    } catch (error) {
      console.error("Erreur lors de la génération du QR code avec logo:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le QR code personnalisé haute définition.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Télécharger le QR code
  const downloadQRCode = () => {
    if (!qrWithLogo) return;
    
    const link = document.createElement('a');
    link.href = qrWithLogo;
    link.download = `${profileData.username}-vynal-platform-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Téléchargement réussi",
      description: "Votre QR code personnalisé a été téléchargé.",
    });
  };

  // Copier le lien vers le presse-papiers
  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileUrl)
      .then(() => {
        toast({
          title: "Lien copié",
          description: "Le lien de votre profil a été copié dans le presse-papiers.",
        });
      })
      .catch(() => {
        toast({
          title: "Erreur",
          description: "Impossible de copier le lien.",
          variant: "destructive",
        });
      });
  };

  // Générer le QR code avec logo lorsque le dialogue est ouvert
  useEffect(() => {
    if (showQRDialog && isProfileComplete && !qrWithLogo) {
      generateQRWithLogo();
    }
  }, [showQRDialog, isProfileComplete, qrWithLogo]);

  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-9 w-9 bg-white dark:bg-vynal-accent-primary border-2 border-vynal-accent-primary dark:border-white hover:bg-vynal-accent-primary/10 hover:border-vynal-accent-secondary dark:hover:bg-vynal-accent-secondary dark:hover:border-white shadow-md"
          >
            <Share2 className="h-4 w-4 text-vynal-accent-primary dark:text-white" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
          <div className="space-y-2">
            <div className="text-sm font-medium pb-1 border-b border-vynal-border dark:border-vynal-purple-secondary/40 mb-2 text-vynal-purple-light dark:text-vynal-text-primary">
              Partager mon profil
            </div>
            
            <div className="grid grid-cols-5 gap-2 mb-3">
              <FacebookShareButton url={profileUrl}>
                <FacebookIcon size={32} round />
              </FacebookShareButton>
              
              <TwitterShareButton url={profileUrl} title={`Découvrez le profil de ${profileData.full_name} sur Vynal Platform`}>
                <TwitterIcon size={32} round />
              </TwitterShareButton>
              
              <WhatsappShareButton url={profileUrl} title={`Découvrez le profil de ${profileData.full_name} sur Vynal Platform`}>
                <WhatsappIcon size={32} round />
              </WhatsappShareButton>
              
              <TelegramShareButton url={profileUrl} title={`Découvrez le profil de ${profileData.full_name} sur Vynal Platform`}>
                <TelegramIcon size={32} round />
              </TelegramShareButton>
              
              <EmailShareButton url={profileUrl} subject={`Découvrez le profil de ${profileData.full_name} sur Vynal Platform`} body="Hey, je voulais partager ce profil avec toi :">
                <EmailIcon size={32} round />
              </EmailShareButton>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start text-xs h-8 border-vynal-border dark:border-vynal-purple-secondary/40"
                onClick={copyProfileLink}
              >
                <LinkIcon className="h-3.5 w-3.5 mr-2 text-vynal-accent-primary" />
                Copier le lien
              </Button>
              
              <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start text-xs h-8 border-vynal-border dark:border-vynal-purple-secondary/40"
                  >
                    <QrCode className="h-3.5 w-3.5 mr-2 text-vynal-accent-primary" />
                    QR Code de mon profil
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-vynal-purple-light dark:text-vynal-text-primary">QR Code de votre profil</DialogTitle>
                    <DialogDescription className="text-vynal-purple-secondary dark:text-vynal-text-secondary">
                      {isProfileComplete 
                        ? "Téléchargez ou partagez votre QR code personnalisé." 
                        : "Complétez votre profil pour télécharger un QR code personnalisé."}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="flex flex-col items-center justify-center py-4">
                    {isGenerating ? (
                      <div className="w-[300px] h-[300px] bg-gradient-to-br from-vynal-purple-light to-vynal-accent-primary/30 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-xl">
                        <div className="animate-pulse flex flex-col items-center justify-center">
                          <div className="animate-spin h-10 w-10 border-3 border-white border-t-transparent rounded-full mb-2"></div>
                          <span className="text-xs text-white font-medium">Création HD...</span>
                        </div>
                      </div>
                    ) : (
                      qrWithLogo ? (
                        <div className="relative group transform transition-all duration-500 hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-br from-vynal-accent-primary to-blue-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-40 transition-opacity"></div>
                          <img 
                            src={qrWithLogo} 
                            alt="QR Code personnalisé Vynal Platform" 
                            className="relative w-[300px] h-[300px] rounded-2xl shadow-2xl hover:shadow-vynal-accent-primary/20 transition-all duration-500 z-10" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl z-20"></div>
                        </div>
                      ) : isProfileComplete ? (
                        <div className="w-[300px] h-[300px] bg-gradient-to-br from-vynal-purple-light/50 to-vynal-accent-primary/30 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-xl">
                          <div className="text-sm text-white text-center px-4 opacity-90">
                            Impossible de générer le QR code. Veuillez réessayer.
                          </div>
                        </div>
                      ) : (
                        <div className="w-[300px] h-[300px] bg-gradient-to-br from-vynal-purple-light/50 to-vynal-accent-primary/30 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-xl">
                          <div className="text-sm text-white text-center px-4 opacity-90">
                            Complétez votre profil pour obtenir un QR code personnalisé.
                          </div>
                        </div>
                      )
                    )}
                    
                    {qrDataUrl && (
                      <div className="mt-4 flex gap-2">
                        {isProfileComplete && qrWithLogo && (
                          <Button 
                            onClick={downloadQRCode} 
                            className="text-xs bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-white"
                          >
                            <Download className="h-3.5 w-3.5 mr-2" />
                            Télécharger
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          onClick={copyProfileLink}
                          className="text-xs border-vynal-border dark:border-vynal-purple-secondary/40"
                        >
                          <LinkIcon className="h-3.5 w-3.5 mr-2" />
                          Copier le lien
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 