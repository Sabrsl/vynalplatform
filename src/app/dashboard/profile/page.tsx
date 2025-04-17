"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { UserCircle, Loader2, Upload } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    full_name: "",
    bio: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      setProfile({
        username: data.username || "",
        full_name: data.full_name || "",
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
      });
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) throw error;
      alert("Profil mis à jour avec succès!");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      alert("Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
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
      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));

      // Save to database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user?.id);

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

  if (loading) {
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

      <div className="grid md:grid-cols-12 gap-6 md:gap-8">
        <Card className="md:col-span-4 p-4 sm:p-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url}
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
              <h2 className="text-xl font-bold truncate">{profile.full_name || "Votre nom"}</h2>
              <p className="text-muted-foreground truncate">
                @{profile.username || "username"}
              </p>
              <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {user?.user_metadata?.role === "freelance" ? "Freelance" : "Client"}
              </div>
            </div>

            <div className="w-full mb-4">
              <h3 className="font-semibold mb-2">À propos</h3>
              <p className="text-sm text-gray-600 break-words">
                {profile.bio || "Aucune biographie renseignée"}
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
                    value={profile.full_name}
                    onChange={handleChange}
                    placeholder="Votre nom complet"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    name="username"
                    value={profile.username}
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
                    value={profile.bio}
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