"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUser, Profile } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { UserCircle, Loader2, Upload } from "lucide-react";

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
  });
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setLocalProfile({
        username: userProfile.username || "",
        full_name: userProfile.full_name || "",
        bio: userProfile.bio || "",
        avatar_url: userProfile.avatar_url || "",
      });
    }
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUpdateError(null);
    
    try {
      // Nettoyer les valeurs
      const cleanUsername = localProfile.username?.trim() || "";
      const cleanFullName = localProfile.full_name?.trim() || "";
      const cleanBio = localProfile.bio?.trim() || "";
      
      // Validation de base
      if (!cleanUsername) {
        alert("Le nom d'utilisateur est requis");
        setSaving(false);
        return;
      }
      
      // Préparer les mises à jour avec les valeurs nettoyées
      const updates: Partial<Profile> = {
        username: cleanUsername,
        full_name: cleanFullName,
        bio: cleanBio,
        avatar_url: localProfile.avatar_url,
        updated_at: new Date().toISOString(),
      };
      
      const { success, data, error } = await updateProfile(updates);
      
      if (success) {
        setUpdateMessage("Profil mis à jour avec succès!");
        // La mise à jour du profil local est gérée par le hook useUser via le state userProfile
      } else if (error) {
        console.error("Erreur lors de la mise à jour:", error);
        
        // Afficher un message d'erreur spécifique en fonction du code d'erreur
        if (error.code === '23505') {
          setUpdateError("Ce nom d'utilisateur est déjà utilisé. Veuillez en choisir un autre.");
        } else if (error.code === '23502') {
          setUpdateError("Un champ obligatoire est manquant.");
        } else if (error.code === '23503') {
          setUpdateError("Une référence invalide a été détectée.");
        } else {
          setUpdateError(error.message || "Une erreur s'est produite lors de la mise à jour du profil.");
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
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    // Vérifier que l'utilisateur est bien connecté
    if (!user || !user.id) {
      alert("Vous devez être connecté pour uploader un avatar.");
      return;
    }

    try {
      setUploading(true);
      const file = e.target.files[0];
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
      
      alert("Avatar mis à jour avec succès!");
    } catch (error: any) {
      console.error("Erreur lors du téléchargement de l'avatar:", error);
      // Afficher un message d'erreur plus spécifique à l'utilisateur
      alert(error.message || "Erreur lors du téléchargement de l'avatar");
    } finally {
      setUploading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Mon profil</h1>
      <p className="text-muted-foreground mb-6 sm:mb-8">
        Gérez vos informations personnelles et préférences
      </p>

      {updateMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-800 rounded">
          {updateMessage}
        </div>
      )}

      {updateError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded">
          {updateError}
        </div>
      )}

      <div className="grid md:grid-cols-12 gap-6 md:gap-8">
        <Card className="md:col-span-4 p-4 sm:p-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {localProfile.avatar_url ? (
                <img 
                  src={localProfile.avatar_url}
                  alt="Avatar"
                  className="w-24 sm:w-32 h-24 sm:h-32 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="w-24 sm:w-32 h-24 sm:h-32 text-gray-300" />
              )}
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full cursor-pointer text-white hover:bg-indigo-700 transition-colors"
              >
                <Upload size={16} />
                <span className="sr-only">Télécharger avatar</span>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>

            <div className="text-center mb-4 w-full">
              <h2 className="text-xl font-bold truncate">{localProfile.full_name || "Votre nom"}</h2>
              <p className="text-muted-foreground truncate">
                @{localProfile.username || "username"}
              </p>
              <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {userProfile?.role === "freelance" ? "Freelance" : userProfile?.role === "admin" ? "Admin" : "Client"}
              </div>
            </div>

            <div className="w-full mb-4">
              <h3 className="font-semibold mb-2">À propos</h3>
              <p className="text-sm text-gray-600 break-words">
                {localProfile.bio || "Aucune biographie renseignée"}
              </p>
            </div>

            <div className="w-full">
              <h3 className="font-semibold mb-2">Coordonnées</h3>
              <div className="text-sm text-gray-600 break-words">
                <p>{user?.email}</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="md:col-span-8">
          <Card className="p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-6">Modifier vos informations</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Nom complet</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={localProfile.full_name}
                    onChange={handleChange}
                    placeholder="Votre nom complet"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    name="username"
                    value={localProfile.username}
                    onChange={handleChange}
                    placeholder="votre_username"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ce nom sera visible par les autres utilisateurs
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={localProfile.bio}
                    onChange={handleChange}
                    placeholder="Parlez un peu de vous..."
                    rows={4}
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
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
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
} 