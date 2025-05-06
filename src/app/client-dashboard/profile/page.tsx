"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { Loader2, User, Save, Camera, CheckCircle2 } from "lucide-react";
import { ClientDashboardPageSkeleton } from "@/components/skeletons/ClientDashboardPageSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ClientProfilePage() {
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    bio: "",
    avatar_url: ""
  });

  // Optimisation: Utiliser useEffect avec dépendances précises
  useEffect(() => {
    if (profile && user) {
      setFormData({
        full_name: profile.full_name || "",
        username: profile.username || "",
        email: user?.email || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || ""
      });
    }
  }, [profile, user]);

  // Optimisation: Utiliser useCallback pour les fonctions de gestion d'événements
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof typeof formData) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  // Optimisation: Utiliser useCallback pour éviter les re-rendus
  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setIsSaving(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      await updateProfile({ avatar_url: publicUrl });
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'avatar:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, updateProfile]);

  // Optimisation: Utiliser useCallback pour le gestionnaire de soumission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success("Profil mis à jour avec succès", {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        duration: 3000,
        position: "top-center",
        className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil", {
        position: "top-center",
        className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
      });
    } finally {
      setIsSaving(false);
    }
  }, [formData, updateProfile, isSaving]);

  // Calculer le fallback seulement quand nécessaire
  const avatarFallback = useMemo(() => {
    return formData.full_name?.charAt(0).toUpperCase() || "U";
  }, [formData.full_name]);

  // Optimisation: Retourner le squelette pendant le chargement
  if (loading) {
    return <ClientDashboardPageSkeleton />;
  }

  // Styles de classe extraits pour réutilisation et lisibilité
  const cardClasses = "bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 shadow-sm rounded-lg transition-all duration-200 hover:shadow-md";
  const inputClasses = "text-[10px] sm:text-xs bg-white/40 dark:bg-slate-800/40 border-slate-200/30 dark:border-slate-700/30 text-slate-900 dark:text-vynal-text-primary focus:ring-1 focus:ring-slate-300/50 dark:focus:ring-slate-600/50 transition-all duration-200";
  const buttonClasses = "text-[10px] sm:text-xs bg-vynal-accent-primary/90 hover:bg-vynal-accent-primary shadow-sm transition-all duration-200";

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-vynal-text-primary flex items-center">
            <User className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
            Profil
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-vynal-text-secondary">
            Gérez vos informations personnelles
          </p>
        </div>
      </div>

      {/* Utilisation de CSS Grid pour un meilleur rendu responsive */}
      <div className="grid gap-6">
        {/* Première carte - Photo de profil */}
        <Card className={cardClasses}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg md:text-xl flex items-center text-slate-900 dark:text-vynal-text-primary">
              <User className="mr-2 h-4 w-4 text-vynal-accent-primary" />
              Photo de profil
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs text-slate-600 dark:text-vynal-text-secondary">
              Mettez à jour votre photo de profil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden">
                <Avatar className="h-20 w-20 ring-1 ring-slate-200/50 dark:ring-slate-700/50 transition-all duration-300">
                  <AvatarImage 
                    src={formData.avatar_url || ""} 
                    alt={formData.full_name || "Profile"} 
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-900 dark:text-vynal-text-primary">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-white/70 dark:bg-slate-800/70 border-slate-200/40 dark:border-slate-700/40 shadow-sm transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-800/90"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  aria-label="Changer la photo de profil"
                >
                  <Camera className="h-3 w-3 text-slate-900 dark:text-vynal-text-primary" />
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] sm:text-xs text-slate-900 dark:text-vynal-text-primary">Photo de profil</Label>
                <p className="text-[8px] sm:text-[10px] text-slate-600 dark:text-vynal-text-secondary">
                  JPG, GIF ou PNG. Max 2MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deuxième carte - Informations personnelles */}
        <Card className={cardClasses}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg md:text-xl flex items-center text-slate-900 dark:text-vynal-text-primary">
              <User className="mr-2 h-4 w-4 text-vynal-accent-primary" />
              Informations personnelles
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs text-slate-600 dark:text-vynal-text-secondary">
              Mettez à jour vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Utilisation de fragments pour réduire les nœuds DOM */}
            <>
              <div className="grid gap-2">
                <Label htmlFor="full_name" className="text-[10px] sm:text-xs text-slate-900 dark:text-vynal-text-primary">Nom complet</Label>
                <Input
                  id="full_name"
                  className={inputClasses}
                  value={formData.full_name}
                  onChange={(e) => handleChange(e, 'full_name')}
                  disabled={!isEditing}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-[10px] sm:text-xs text-slate-900 dark:text-vynal-text-primary">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  className={inputClasses}
                  value={formData.username}
                  onChange={(e) => handleChange(e, 'username')}
                  disabled={true}
                />
                <p className="text-[8px] sm:text-[10px] text-amber-600 dark:text-amber-400">
                  Pour modifier votre nom d'utilisateur, veuillez contacter le support.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[10px] sm:text-xs text-slate-900 dark:text-vynal-text-primary">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className={inputClasses}
                  value={formData.email}
                  onChange={(e) => handleChange(e, 'email')}
                  disabled={!isEditing}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-[10px] sm:text-xs text-slate-900 dark:text-vynal-text-primary">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  className={inputClasses}
                  value={formData.phone}
                  onChange={(e) => handleChange(e, 'phone')}
                  disabled={!isEditing}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio" className="text-[10px] sm:text-xs text-slate-900 dark:text-vynal-text-primary">Bio</Label>
                <Textarea
                  id="bio"
                  className={inputClasses}
                  value={formData.bio}
                  onChange={(e) => handleChange(e, 'bio')}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
            </>
          </CardContent>
          <CardFooter className="flex justify-end">
            {isEditing ? (
              <Button
                className={cn(buttonClasses, "focus:ring-2 focus:ring-offset-1")}
                onClick={handleSubmit}
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-3 w-3" />
                    Enregistrer
                  </>
                )}
              </Button>
            ) : (
              <Button
                className={cn(buttonClasses, "focus:ring-2 focus:ring-offset-1")}
                onClick={() => setIsEditing(true)}
              >
                Modifier le profil
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}