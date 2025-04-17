"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Star, UserCircle, ArrowLeft, Briefcase, Calendar } from "lucide-react";
import { useFreelancerRating } from "@/hooks/useFreelancerRating";
import Link from "next/link";
import ServiceCard from "@/components/services/ServiceCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
/* Imports générant des erreurs - à créer plus tard
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FreelanceProfile } from '@/components/profile/FreelanceProfile';
import { ClientProfile } from '@/components/profile/ClientProfile';
import { createClient } from '@/utils/supabase/server';
import { getFreelanceProfile } from '@/lib/queries/profile';
import { LoadingView } from '@/components/shared/LoadingView';
*/

// Type pour le profil du vendeur et ses services
type ProfileData = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  email?: string;
  created_at?: string;
};

// Type pour les avis
type Review = {
  id: string;
  created_at: string;
  rating: number;
  comment: string;
  client_id: string;
  order_id: string;
  service_id: string;
  client: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  services: {
    title: string;
    slug: string;
  };
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Récupérer la note moyenne du vendeur
  const { averageRating, reviewCount } = useFreelancerRating(profile?.id);
  
  // Charger les informations du profil
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) {
        setError("Profil introuvable");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Récupérer le profil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username)
          .single();
        
        if (profileError) {
          setError("Profil introuvable");
          setLoading(false);
          return;
        }

        setProfile(profileData);
        
        // Si c'est un freelance, récupérer ses services
        if (profileData.role === "freelance") {
          const { data: servicesData } = await supabase
            .from("services")
            .select(`
              *,
              profiles:freelance_id (*),
              categories (*)
            `)
            .eq("freelance_id", profileData.id)
            .eq("active", true)
            .order("created_at", { ascending: false });
          
          setServices(servicesData || []);
          
          // Récupérer les avis
          const { data: reviewsData } = await supabase
            .from("reviews")
            .select(`
              *,
              client:client_id (username, full_name, avatar_url),
              services:service_id (title, slug)
            `)
            .eq("freelance_id", profileData.id)
            .order("created_at", { ascending: false });
          
          setReviews(reviewsData || []);
        }
        
        setError(null);
      } catch (err) {
        console.error("Erreur:", err);
        setError("Une erreur est survenue lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [username]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-vynal-purple-dark">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-12 w-12 text-vynal-accent-primary mb-4" />
          <p className="text-vynal-text-secondary text-sm">Chargement du profil...</p>
        </div>
      </div>
    );
  }
  
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-vynal-purple-dark py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="backdrop-blur-md bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 shadow-lg shadow-vynal-accent-secondary/20 rounded-xl">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-vynal-purple-secondary/30 flex items-center justify-center mb-6">
                <UserCircle className="h-8 w-8 text-vynal-accent-primary" />
              </div>
              <h2 className="text-2xl font-medium text-vynal-text-primary mb-4">Profil non disponible</h2>
              <p className="text-vynal-text-secondary text-center mb-8 leading-relaxed">
                {error || "Ce profil n'existe pas ou n'est pas accessible pour le moment."}
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="group border-vynal-purple-secondary/50 bg-vynal-purple-secondary/30 text-vynal-text-primary hover:bg-vynal-purple-secondary/50 hover:text-vynal-text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Préparation des données du profil
  const fullName = profile.full_name || profile.username || "Utilisateur";
  const username_display = profile.username || '';
  const isFreelance = profile.role === "freelance";
  const joinDate = profile.created_at ? formatDate(profile.created_at) : "Date inconnue";
  
  // Filtrer les avis positifs et négatifs
  const positiveReviews = reviews.filter(review => review.rating >= 4);
  const negativeReviews = reviews.filter(review => review.rating < 4);
  
  // Afficher les étoiles
  const renderStars = (rating: number, size = "small") => {
    const starSize = size === "small" ? "h-3 w-3" : "h-5 w-5";
    
    return (
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`${starSize} ${star <= rating ? "text-vynal-accent-primary fill-vynal-accent-primary" : "text-vynal-purple-secondary/50 fill-transparent"}`} 
          />
        ))}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-vynal-purple-dark">
      {/* Bannière du profil */}
      <div className="h-48 md:h-64 bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-vynal-accent-secondary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-vynal-accent-primary/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative">
        {/* Photo de profil et info principale */}
        <div className="flex flex-col items-center -mt-16 md:-mt-20 mb-8">
          <div className="relative mb-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={fullName}
                className="w-32 h-32 rounded-full object-cover border-4 border-vynal-purple-dark shadow-lg shadow-vynal-accent-secondary/20"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-vynal-purple-secondary/30 flex items-center justify-center border-4 border-vynal-purple-dark shadow-lg shadow-vynal-accent-secondary/20">
                <UserCircle className="h-16 w-16 text-vynal-accent-primary" />
              </div>
            )}
            
            {isFreelance && (
              <Badge className="absolute bottom-1 right-1 bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark">
                Freelance
              </Badge>
            )}
          </div>
          
          <h1 className="text-2xl md:text-3xl font-semibold text-vynal-text-primary mb-2">{fullName}</h1>
          
          {username_display && (
            <p className="text-vynal-text-secondary mb-3">@{username_display}</p>
          )}
          
          {/* Note moyenne et nombre d'avis */}
          {isFreelance && (
            <div className="flex items-center mb-5">
              {renderStars(averageRating, "medium")}
              <span className="text-vynal-text-secondary ml-2">
                {averageRating > 0 
                  ? `${averageRating.toFixed(1)} (${reviewCount} avis)` 
                  : "Aucun avis"}
              </span>
            </div>
          )}
          
          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <Button className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium transition-all">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter
            </Button>
            
            {isFreelance && (
              <Button variant="outline" className="border-vynal-purple-secondary/50 bg-vynal-purple-secondary/30 text-vynal-text-primary hover:bg-vynal-purple-secondary/50 hover:text-vynal-text-primary transition-colors">
                <Briefcase className="h-4 w-4 mr-2" />
                Voir tous les services
              </Button>
            )}
          </div>
          
          {/* Badges et infos */}
          <div className="flex flex-wrap gap-3 justify-center items-center mb-8">
            <div className="flex items-center px-3 py-1 rounded-full bg-vynal-purple-secondary/30 text-vynal-text-primary text-sm border border-vynal-purple-secondary/20">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-vynal-accent-primary" />
              Membre depuis {joinDate}
            </div>
            
            {isFreelance && (
              <div className="flex items-center px-3 py-1 rounded-full bg-vynal-purple-secondary/30 text-vynal-text-primary text-sm border border-vynal-purple-secondary/20">
                <Briefcase className="h-3.5 w-3.5 mr-1.5 text-vynal-accent-primary" />
                {services.length} service{services.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
        
        {/* Bio et informations principales */}
        {profile.bio && (
          <Card className="max-w-3xl mx-auto mb-12 backdrop-blur-md bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20">
            <CardContent className="p-8">
              <h2 className="text-xl text-vynal-text-primary mb-4 font-medium">À propos</h2>
              <p className="text-vynal-text-secondary leading-relaxed">{profile.bio}</p>
            </CardContent>
          </Card>
        )}
        
        {/* Services (si freelance) */}
        {isFreelance && services.length > 0 && (
          <div className="max-w-7xl mx-auto mb-16">
            <h2 className="text-2xl text-vynal-text-primary mb-6 font-medium text-center">Services proposés</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Link 
                  key={service.id}
                  href={`/services/${service.slug || service.id}`}
                  className="block h-full transition-transform duration-300 hover:scale-[1.02]"
                >
                  <ServiceCard service={service} className="h-full" />
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Avis (si freelance et a des avis) */}
        {isFreelance && reviews.length > 0 && (
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl text-vynal-text-primary mb-6 font-medium text-center">Avis clients</h2>
            
            <Tabs defaultValue="tous" className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="bg-vynal-purple-secondary/30 border border-vynal-purple-secondary/30">
                  <TabsTrigger value="tous" className="data-[state=active]:bg-vynal-accent-primary data-[state=active]:text-vynal-purple-dark">
                    Tous ({reviews.length})
                  </TabsTrigger>
                  <TabsTrigger value="positifs" className="data-[state=active]:bg-vynal-accent-primary data-[state=active]:text-vynal-purple-dark">
                    Positifs ({positiveReviews.length})
                  </TabsTrigger>
                  <TabsTrigger value="negatifs" className="data-[state=active]:bg-vynal-accent-primary data-[state=active]:text-vynal-purple-dark">
                    Négatifs ({negativeReviews.length})
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="tous" className="space-y-4">
                {reviews.length > 0 ? renderReviews(reviews) : (
                  <div className="text-center py-8">
                    <p className="text-vynal-text-secondary">Aucun avis disponible</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="positifs" className="space-y-4">
                {positiveReviews.length > 0 ? renderReviews(positiveReviews) : (
                  <div className="text-center py-8">
                    <p className="text-vynal-text-secondary">Aucun avis positif disponible</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="negatifs" className="space-y-4">
                {negativeReviews.length > 0 ? renderReviews(negativeReviews) : (
                  <div className="text-center py-8">
                    <p className="text-vynal-text-secondary">Aucun avis négatif disponible</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
  
  // Fonction pour rendre les avis
  function renderReviews(reviewsList: Review[]) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviewsList.slice(0, 6).map((review) => (
          <Card key={review.id} className="backdrop-blur-md bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 border border-vynal-purple-secondary/30">
                  <AvatarImage src={review.client?.avatar_url || undefined} />
                  <AvatarFallback className="bg-vynal-accent-primary text-vynal-purple-dark">
                    {(review.client?.username || review.client?.full_name || 'C')
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm text-vynal-text-primary">
                        {review.client?.full_name || review.client?.username || "Client"}
                      </p>
                      <div className="flex items-center mt-1">
                        {renderStars(review.rating)}
                        <span className="text-xs text-vynal-text-secondary ml-2">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="mt-2 text-sm text-vynal-text-secondary leading-relaxed">
                    {review.comment || "Aucun commentaire"}
                  </p>
                  
                  {review.services && (
                    <div className="mt-2 text-xs font-medium">
                      <Link 
                        href={`/services/${review.services.slug || review.service_id}`}
                        className="text-vynal-accent-primary hover:underline"
                      >
                        Service: {review.services.title || "Service"}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
} 