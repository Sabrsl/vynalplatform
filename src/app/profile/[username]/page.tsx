"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUser, UserProfile } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserCircle, 
  Loader2, 
  Upload, 
  Mail, 
  Check, 
  AlertCircle, 
  Lock, 
  Calendar, 
  Shield,
  Info,
  Phone,
  Share2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ProfileQRShare } from "@/components/profile/ProfileQRShare";
import Image from "next/image";
import { ProfilePageSkeleton } from "@/components/skeletons/ProfilePageSkeleton";
import { CertificationBadge } from "@/components/ui/certification-badge";

// Composant pour les messages d'alerte
const AlertMessage = memo(({ 
  type, 
  message 
}: { 
  type: 'success' | 'error', 
  message: string | null 
}) => {
  if (!message) return null;
  
  return type === 'success' ? (
    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2 mx-4">
      <Check className="h-5 w-5 flex-shrink-0" />
      {message}
    </div>
  ) : (
    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2 mx-4">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      {message}
    </div>
  );
});

AlertMessage.displayName = 'AlertMessage';

// Composant pour l'avatar avec fonctionnalité d'upload
const ProfileAvatar = memo(({ 
  avatarUrl, 
  uploading, 
  onUpload, 
  profileData,
  baseUrl
}: { 
  avatarUrl: string, 
  uploading: boolean, 
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>,
  profileData: any,
  baseUrl: string
}) => {
  return (
    <div className="relative inline-block">
      {avatarUrl ? (
        <Image 
          src={avatarUrl}
          alt="Avatar"
          width={128}
          height={128}
          className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-vynal-purple-dark/90 shadow-md"
        />
      ) : (
        <div className="w-32 h-32 rounded-full bg-white dark:bg-vynal-purple-dark flex items-center justify-center border-4 border-white dark:border-vynal-purple-dark/90 shadow-md">
          <UserCircle className="w-20 h-20 text-gray-300 dark:text-gray-600" />
        </div>
      )}
      
      <div className="absolute -bottom-2 -right-2 flex items-center space-x-2">
        <ProfileQRShare 
          profileData={profileData} 
          baseUrl={baseUrl}
        />
        
        <label 
          htmlFor="avatar-upload" 
          className="bg-vynal-accent-primary dark:bg-vynal-accent-primary p-2 rounded-full cursor-pointer text-white hover:bg-vynal-accent-secondary dark:hover:bg-vynal-accent-secondary transition-colors shadow-sm"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          <span className="sr-only">Télécharger avatar</span>
        </label>
      </div>
      
      <input
        id="avatar-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onUpload}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
});

ProfileAvatar.displayName = 'ProfileAvatar';

// Composant pour les informations de profil
const ProfileInfo = memo(({ 
  fullName, 
  username, 
  email, 
  phone, 
  createdAt, 
  bio, 
  isCertified, 
  certificationType 
}: { 
  fullName: string, 
  username: string, 
  email: string,
  phone: string, 
  createdAt: string | null, 
  bio: string,
  isCertified?: boolean,
  certificationType?: 'standard' | 'premium' | 'expert' | null
}) => {
  // Formater la date pour l'affichage
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="pt-20 pb-6 px-6">
      <div className="text-center mb-6">
        <h2 className="text-base sm:text-lg font-bold truncate text-vynal-purple-light dark:text-vynal-text-primary">
          {fullName || "Votre nom"}
        </h2>
        <p className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary font-medium truncate flex items-center justify-center gap-1">
          {username ? (
            <>@{username}</>
          ) : (
            <>Nom d'utilisateur non défini</>
          )}
        </p>
        
        {/* Affichage du badge de certification */}
        {isCertified && certificationType && (
          <div className="mt-2 flex items-center justify-center">
            <CertificationBadge 
              type={certificationType} 
              size="md"
              showLabel
            />
  </div>
        )}
        
        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] sm:text-xs text-vynal-accent-primary dark:text-vynal-accent-secondary">
          <Share2 className="h-3 w-3" />
          <span>Utilisez le bouton en haut à droite pour partager votre profil</span>
            </div>
          </div>
          
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary flex items-center gap-2">
            <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-vynal-accent-primary" />
            Email
          </h3>
          <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary break-all">
            {email}
          </p>
        </div>
        
        {phone && (
          <div className="space-y-2">
            <h3 className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary flex items-center gap-2">
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-vynal-accent-primary" />
              Téléphone
            </h3>
            <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">
              {phone}
            </p>
            </div>
          )}
          
        <div className="space-y-2">
          <h3 className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary flex items-center gap-2">
            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-vynal-accent-primary" />
            Membre depuis
          </h3>
          <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">
            {formatDate(createdAt)}
          </p>
        </div>

        <div className="pt-2">
          <h3 className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2">
            À propos
          </h3>
          <p className="text-[8px] sm:text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary/70">
            {bio || "Aucune biographie renseignée"}
          </p>
        </div>
      </div>
    </div>
  );
});

ProfileInfo.displayName = 'ProfileInfo';

// Composant pour le champ de nom d'utilisateur
const UsernameField = memo(({ 
  username, 
  isSet, 
  onChange 
}: { 
  username: string, 
  isSet: boolean, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void 
}) => {
  return (
    <div className="grid gap-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="username" className="text-[10px] sm:text-xs text-vynal-purple-light dark:text-vynal-text-primary">
          Nom d'utilisateur
        </Label>
        {isSet && (
          <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 gap-1">
            <Lock size={12} />
            Non modifiable
          </div>
        )}
      </div>
      
      <div className="relative">
        <Input
          id="username"
          name="username"
          value={username}
          onChange={onChange}
          placeholder="votre_username"
          className={`border-vynal-border dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/10 text-xs sm:text-sm ${isSet ? 'bg-gray-50 dark:bg-vynal-purple-secondary/5 cursor-not-allowed' : ''}`}
          disabled={isSet}
        />
        {isSet && (
          <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
            <Lock size={16} className="text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>
      
      <div className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/70 flex flex-col gap-1">
        <p>Ce nom sera visible par les autres utilisateurs</p>
        {!isSet ? (
          <p className="text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
            <AlertCircle size={12} className="flex-shrink-0" />
            <span>
              Une fois défini, le nom d'utilisateur ne pourra plus être modifié sans l'aide du support
            </span>
          </p>
        ) : (
          <p className="text-vynal-accent-secondary dark:text-vynal-accent-primary flex items-center gap-1 mt-1">
            <Info size={12} className="flex-shrink-0" />
            <span className="text-[10px] sm:text-xs">
              Pour modifier votre nom d'utilisateur, veuillez contacter le support
            </span>
          </p>
        )}
      </div>
    </div>
  );
});

UsernameField.displayName = 'UsernameField';

// Composant pour le formulaire d'édition
const ProfileEditForm = memo(({ 
  profile, 
  usernameIsSet, 
  onChange, 
  onSubmit, 
  saving 
}: { 
  profile: {
    username: string;
    full_name: string;
    bio: string;
    phone: string;
  };
  usernameIsSet: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="full_name" className="text-[10px] sm:text-xs text-vynal-purple-light dark:text-vynal-text-primary">
            Nom complet
          </Label>
          <Input
            id="full_name"
            name="full_name"
            value={profile.full_name}
            onChange={onChange}
            placeholder="Votre nom complet"
            className="border-vynal-border dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/10 text-xs sm:text-sm"
          />
          <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/70">
            Votre nom réel tel qu'il apparaîtra sur votre profil
          </p>
        </div>
        
        <UsernameField 
          username={profile.username}
          isSet={usernameIsSet}
          onChange={onChange}
        />

        <div className="grid gap-2">
          <Label htmlFor="phone" className="text-[10px] sm:text-xs text-vynal-purple-light dark:text-vynal-text-primary">
            Téléphone
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={profile.phone}
            onChange={onChange}
            placeholder="+221 77 123 45 67"
            className="border-vynal-border dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/10 text-xs sm:text-sm"
          />
          <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/70">
            Votre numéro de téléphone (facultatif)
          </p>
            </div>

        <div className="grid gap-2">
          <Label htmlFor="bio" className="text-[10px] sm:text-xs text-vynal-purple-light dark:text-vynal-text-primary">
            Biographie
          </Label>
          <Textarea
            id="bio"
            name="bio"
            value={profile.bio}
            onChange={onChange}
            placeholder="Parlez un peu de vous..."
            rows={4}
            maxLength={150}
            className="border-vynal-border dark:border-vynal-purple-secondary/40 dark:bg-vynal-purple-secondary/10 resize-none text-xs sm:text-sm"
          />
          <p className="text-[8px] sm:text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary/70">
            Une courte description pour vous présenter aux autres utilisateurs (150 caractères max)
          </p>
            </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            disabled={saving}
            className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer les modifications"
            )}
          </Button>
        </div>
    </div>
    </form>
  );
});

ProfileEditForm.displayName = 'ProfileEditForm';

// Composant principal
export default function ProfilePage() {
  const { user } = useAuth();
  const { profile: userProfile, updateProfile, loading: profileLoading, updateError: profileUpdateError } = useUser();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localProfile, setLocalProfile] = useState({
    username: "",
    full_name: "",
    bio: "",
    avatar_url: "",
    phone: "",
  });
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Base URL pour le partage
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vynal-platform.vercel.app';
  
  // Vérifier si le nom d'utilisateur a déjà été défini
  const usernameIsSet = Boolean(userProfile?.username && userProfile.username.trim() !== "");

  // Synchroniser les données du profil
  useEffect(() => {
    if (userProfile) {
      setLocalProfile({
        username: userProfile.username || "",
        full_name: userProfile.full_name || "",
        bio: userProfile.bio || "",
        avatar_url: userProfile.avatar_url || "",
        phone: userProfile.phone || "",
      });
    }
  }, [userProfile]);

  // Gérer les changements de formulaire
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalProfile((prev) => ({ ...prev, [name]: value }));
  }, []);
  
  // Soumettre le formulaire
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUpdateError(null);
    setUpdateMessage(null);
    
    try {
      // Nettoyer les valeurs
      const cleanUsername = localProfile.username?.trim() || "";
      const cleanFullName = localProfile.full_name?.trim() || "";
      const cleanBio = localProfile.bio?.trim() || "";
      const cleanPhone = localProfile.phone?.trim() || "";
      
      // Validation de base
      if (!usernameIsSet && !cleanUsername) {
        setUpdateError("Le nom d'utilisateur est requis et ne pourra plus être modifié ultérieurement.");
        setSaving(false);
        return;
      }

      // Validation de la longueur de la biographie
      if (cleanBio.length > 150) {
        setUpdateError("La biographie ne doit pas dépasser 150 caractères.");
        setSaving(false);
        return;
      }

      // Préparer les mises à jour avec les valeurs nettoyées
      const updates: Partial<UserProfile> = {
        full_name: cleanFullName,
        bio: cleanBio,
        avatar_url: localProfile.avatar_url,
        phone: cleanPhone,
        updated_at: new Date().toISOString(),
      };
      
      // Ajouter le nom d'utilisateur uniquement s'il n'a pas déjà été défini
      if (!usernameIsSet) {
        updates.username = cleanUsername;
      }
      
      const { success, error } = await updateProfile(updates);
      
      if (success) {
        toast({
          title: "Succès",
          description: "Profil mis à jour avec succès!",
          variant: "default",
        });
        setUpdateMessage("Profil mis à jour avec succès!");
      } else if (error) {
        console.error("Erreur lors de la mise à jour:", error);
        
        // Vérifier si error a une propriété code
        const errorObj = error as any;
        if (errorObj.code === '23505') {
          setUpdateError("Ce nom d'utilisateur est déjà utilisé. Veuillez en choisir un autre.");
        } else if (errorObj.code === '23502') {
          setUpdateError("Un champ obligatoire est manquant.");
        } else if (errorObj.code === '23503') {
          setUpdateError("Une référence invalide a été détectée.");
        } else {
          setUpdateError(errorObj.message || "Une erreur s'est produite lors de la mise à jour du profil.");
        }
      }
    } catch (error: any) {
      console.error("Erreur inattendue:", error);
      setUpdateError(error.message || "Une erreur inattendue s'est produite");
    } finally {
      setSaving(false);
      // Faire défiler vers le haut pour voir les messages d'erreur/succès
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [localProfile, usernameIsSet, updateProfile, toast]);

  // Gérer l'upload d'avatar
  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    // Vérifier que l'utilisateur est bien connecté
    if (!user || !user.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour uploader un avatar.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const file = e.target.files[0];
      
      // Vérifier la taille du fichier (max 5 MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("La taille de l'image ne doit pas dépasser 5 MB");
      }
      
      // Vérifier le type de fichier
      if (!file.type.match(/^image\/(jpeg|png|jpg|webp)$/)) {
        throw new Error("Format d'image non supporté. Utilisez JPG, PNG ou WebP");
      }
      
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}.${fileExt}`;
      const filePath = fileName;

      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Erreur lors de l'upload:", uploadError);
        
        // Messages d'erreur spécifiques par type d'erreur
        if (uploadError.message?.includes("row-level security")) {
          throw new Error("Problème de permission avec le bucket de stockage. Contactez l'administrateur.");
        }
        
        if (uploadError.message?.includes("not found") || (uploadError as any).statusCode === 404) {
          throw new Error("Le bucket 'avatars' n'existe pas. Contactez l'administrateur.");
        }
        
        if (uploadError.message?.includes("permission")) {
          throw new Error("Permission refusée pour le stockage. Contactez l'administrateur.");
        }
        
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      if (!data || !data.publicUrl) {
        throw new Error("Impossible d'obtenir l'URL publique de l'image");
      }
      
      // Update profile with avatar URL
      const avatarUrl = data.publicUrl;
      setLocalProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));

      // Save to database via updateProfile
      const { error: updateError } = await updateProfile({ avatar_url: avatarUrl });

      if (updateError) throw updateError;
      
      toast({
        title: "Succès",
        description: "Avatar mis à jour avec succès!",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Erreur lors du téléchargement de l'avatar:", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du téléchargement de l'avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [user, toast, updateProfile]);

  if (profileLoading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="px-0 py-4">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 px-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight mb-2 text-vynal-purple-light dark:text-vynal-text-primary">
            Mon profil
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gérez vos informations personnelles et préférences
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <Badge variant="outline" className="bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 flex items-center gap-1.5 px-3 py-1.5">
            <Shield size={14} />
            {userProfile?.role === "freelance" ? "Compte Freelance" : userProfile?.role === "admin" ? "Compte Admin" : "Compte Client"}
          </Badge>
        </div>
            </div>
            
      {/* Messages d'alerte */}
      <AlertMessage type="success" message={updateMessage} />
      <AlertMessage type="error" message={updateError} />

      <div className="grid md:grid-cols-12 gap-6 md:gap-6 px-4">
        {/* Carte de profil */}
        <Card className="md:col-span-4 p-0 overflow-hidden border-vynal-border dark:border-vynal-purple-secondary/40 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
          <div className="bg-gradient-to-r from-vynal-accent-primary/30 via-vynal-accent-secondary/20 to-transparent h-32 relative">
            {/* Bouton upload avatar */}
            <div className="absolute -bottom-16 left-6">
              <ProfileAvatar 
                avatarUrl={localProfile.avatar_url}
                uploading={uploading}
                onUpload={handleAvatarUpload}
                profileData={localProfile}
                baseUrl={baseUrl}
              />
            </div>
          </div>

          <ProfileInfo 
            fullName={localProfile.full_name}
            username={localProfile.username}
            email={user?.email || ""}
            phone={localProfile.phone}
            createdAt={userProfile?.created_at || null}
            bio={localProfile.bio}
            isCertified={userProfile?.is_certified ?? undefined}
            certificationType={userProfile?.certification_type as 'standard' | 'premium' | 'expert' | null}
          />
              </Card>
              
        {/* Formulaire d'édition */}
        <div className="md:col-span-8">
          <Card className="border-vynal-border dark:border-vynal-purple-secondary/40 shadow-sm bg-white dark:bg-vynal-purple-dark/20 p-6">
            <div className="flex items-center mb-6">
              <h2 className="text-base sm:text-lg font-bold text-vynal-purple-light dark:text-vynal-text-primary">
                Modifier vos informations
              </h2>
            </div>
            
            <ProfileEditForm 
              profile={localProfile}
              usernameIsSet={usernameIsSet}
              onChange={handleChange}
              onSubmit={handleSubmit}
              saving={saving}
            />
                </Card>
          </div>
      </div>
    </div>
  );
} 