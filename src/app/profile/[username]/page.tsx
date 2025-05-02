"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { MessageSquare, Star, UserCircle, ArrowLeft, Briefcase, Calendar } from "lucide-react";
import { useFreelancerRating } from "@/hooks/useFreelancerRating";
import Link from "next/link";
import ServiceCard from "@/components/services/ServiceCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ReviewReplyComponent from '@/components/reviews/ReviewReply';
import Image from 'next/image';
import { CertificationBadge } from "@/components/ui/certification-badge";
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
  is_certified?: boolean;
  certification_type?: 'standard' | 'premium' | 'expert' | null;
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

// Données mockées pour les avis (à utiliser pendant le développement)
const MOCK_REVIEWS: Review[] = [
  {
    id: "review-1",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    rating: 5,
    comment: "Excellent travail ! Le logo est exactement ce que je recherchais. Communication parfaite et livraison rapide.",
    client_id: "client-2",
    order_id: "order-past-1",
    service_id: "service-1",
    client: {
      username: "sarahb",
      full_name: "Sarah Blanc",
      avatar_url: "/avatars/sarah.jpg"
    },
    services: {
      title: "Création de logo professionnel",
      slug: "creation-logo-professionnel"
    }
  },
  {
    id: "review-2",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    rating: 4,
    comment: "Très bon travail. La première proposition n'était pas tout à fait ce que je voulais mais les ajustements ont été parfaits.",
    client_id: "client-3",
    order_id: "order-past-2",
    service_id: "service-2",
    client: {
      username: "thomasv",
      full_name: "Thomas Vidal",
      avatar_url: "/avatars/thomas.jpg"
    },
    services: {
      title: "Design de flyer promotionnel",
      slug: "design-flyer-promotionnel"
    }
  },
  {
    id: "review-3",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    rating: 5,
    comment: "Article très bien écrit et optimisé pour le SEO. Je recommande vivement !",
    client_id: "client-4",
    order_id: "order-past-3",
    service_id: "service-3",
    client: {
      username: "carole_m",
      full_name: "Carole Mercier",
      avatar_url: "/avatars/carole.jpg"
    },
    services: {
      title: "Rédaction SEO optimisée",
      slug: "redaction-seo-optimisee"
    }
  },
  {
    id: "review-4",
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    rating: 3,
    comment: "Le site web fonctionne correctement mais le design pourrait être amélioré. Délai de livraison respecté.",
    client_id: "client-5",
    order_id: "order-past-4",
    service_id: "service-4",
    client: {
      username: "pierre_d",
      full_name: "Pierre Durand",
      avatar_url: "/avatars/pierre.jpg"
    },
    services: {
      title: "Création de site web vitrine",
      slug: "creation-site-web-vitrine"
    }
  },
  {
    id: "review-5",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    rating: 2,
    comment: "Travail décevant. Le résultat final ne correspond pas du tout à ce qui était présenté dans le service.",
    client_id: "client-6",
    order_id: "order-past-5",
    service_id: "service-5",
    client: {
      username: "julien_m",
      full_name: "Julien Martin",
      avatar_url: "/avatars/julien.jpg"
    },
    services: {
      title: "Montage vidéo promotionnel",
      slug: "montage-video-promotionnel"
    }
  },
  {
    id: "review-6",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    rating: 5,
    comment: "Service impeccable ! Communication claire, processus transparent et résultat au-delà de mes attentes.",
    client_id: "client-7",
    order_id: "order-past-6",
    service_id: "service-6",
    client: {
      username: "sophie_l",
      full_name: "Sophie Laurent",
      avatar_url: "/avatars/sophie.jpg"
    },
    services: {
      title: "Traduction anglais-français",
      slug: "traduction-anglais-francais"
    }
  }
];

// Composant pour l'affichage des étoiles mémorisé
const StarRating = memo(({ rating, size = "small" }: { rating: number, size?: string }) => {
  const starSize = size === "small" ? "h-3 w-3" : size === "medium" ? "h-4 w-4" : "h-5 w-5";
  
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
});

StarRating.displayName = 'StarRating';

// Composant pour les badges d'info mémorisé
const InfoBadge = memo(({ icon: Icon, text }: { icon: React.ElementType, text: string }) => (
  <div className="flex items-center px-3 py-1 rounded-full bg-vynal-purple-secondary/30 text-vynal-text-primary text-xs border border-vynal-purple-secondary/20">
    <Icon className="h-3 w-3 mr-1.5 text-vynal-accent-primary" />
    {text}
  </div>
));

InfoBadge.displayName = 'InfoBadge';

// Composant pour une carte d'avis mémorisée
const ReviewCard = memo(({ review, profileId }: { review: Review, profileId: string }) => (
  <Card className="backdrop-blur-md bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl">
    <CardContent className="p-4">
      <div className="flex items-start gap-2">
        <Avatar className="h-8 w-8 border border-vynal-purple-secondary/30">
          <AvatarImage src={review.client?.avatar_url || undefined} />
          <AvatarFallback className="bg-vynal-accent-primary text-vynal-purple-dark text-xs">
            {(review.client?.username || review.client?.full_name || 'C')
              .charAt(0)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-xs text-vynal-text-primary">
                {review.client?.full_name || review.client?.username || "Client"}
              </p>
              <div className="flex items-center mt-0.5">
                <StarRating rating={review.rating} />
                <span className="text-[10px] text-vynal-text-secondary ml-2">
                  {formatDate(review.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          <p className="mt-2 text-xs text-vynal-text-secondary leading-relaxed line-clamp-3">
            {review.comment || "Aucun commentaire"}
          </p>
          
          {review.services && (
            <div className="mt-1.5 text-[10px] font-medium">
              <Link 
                href={`/services/${review.services.slug || review.service_id}`}
                className="text-vynal-accent-primary hover:underline"
              >
                Service: {review.services.title || "Service"}
              </Link>
            </div>
          )}
          
          {/* Ajouter le composant de réponse à l'avis */}
          {profileId && <ReviewReplyComponent reviewId={review.id} freelanceId={profileId} />}
        </div>
      </div>
    </CardContent>
  </Card>
));

ReviewCard.displayName = 'ReviewCard';

// Composant pour la section des avis
const ReviewsSection = memo(({ 
  reviews, 
  positiveReviews, 
  negativeReviews, 
  profileId,
  username
}: { 
  reviews: Review[], 
  positiveReviews: Review[], 
  negativeReviews: Review[], 
  profileId: string,
  username: string
}) => {
  const renderReviewsList = useCallback((reviewsList: Review[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {reviewsList.slice(0, 6).map((review) => (
        <ReviewCard key={review.id} review={review} profileId={profileId} />
      ))}
    </div>
  ), [profileId]);

  return (
    <div className="max-w-4xl mx-auto mb-12">
      <h2 className="text-xl text-vynal-text-primary mb-5 font-medium text-center">Avis clients</h2>
      
      <Tabs defaultValue="tous" className="w-full">
        <div className="flex justify-center mb-4">
          <TabsList className="bg-vynal-purple-secondary/30 border border-vynal-purple-secondary/30">
            <TabsTrigger value="tous" className="text-xs data-[state=active]:bg-vynal-accent-primary data-[state=active]:text-vynal-purple-dark">
              Tous ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="positifs" className="text-xs data-[state=active]:bg-vynal-accent-primary data-[state=active]:text-vynal-purple-dark">
              Positifs ({positiveReviews.length})
            </TabsTrigger>
            <TabsTrigger value="negatifs" className="text-xs data-[state=active]:bg-vynal-accent-primary data-[state=active]:text-vynal-purple-dark">
              Négatifs ({negativeReviews.length})
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="tous" className="space-y-3">
          {reviews.length > 0 ? renderReviewsList(reviews) : (
            <div className="text-center py-6">
              <p className="text-vynal-text-secondary text-sm">Aucun avis disponible</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="positifs" className="space-y-3">
          {positiveReviews.length > 0 ? renderReviewsList(positiveReviews) : (
            <div className="text-center py-6">
              <p className="text-vynal-text-secondary text-sm">Aucun avis positif disponible</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="negatifs" className="space-y-3">
          {negativeReviews.length > 0 ? renderReviewsList(negativeReviews) : (
            <div className="text-center py-6">
              <p className="text-vynal-text-secondary text-sm">Aucun avis négatif disponible</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {reviews.length > 6 && (
        <div className="text-center mt-6">
          <Button asChild variant="outline" className="border-vynal-accent-primary text-vynal-accent-primary hover:bg-vynal-accent-primary/10 text-xs h-8">
            <Link href={`/profile/${username}/reviews`}>
              Voir tous les avis ({reviews.length})
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
});

ReviewsSection.displayName = 'ReviewsSection';

// Composant pour les services du freelance
const ServicesSection = memo(({ services }: { services: any[] }) => (
  <div className="max-w-7xl mx-auto mb-12">
    <h2 className="text-xl text-vynal-text-primary mb-5 font-medium text-center">Services proposés</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
));

ServicesSection.displayName = 'ServicesSection';

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
  
  // Charger les informations du profil - optimisé avec useCallback
  const fetchProfileData = useCallback(async () => {
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
        .select("*, is_certified, certification_type")
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
        
        // Utiliser les données mockées pour les avis en développement
        setReviews(MOCK_REVIEWS);
      }
      
      setError(null);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Une erreur est survenue lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  }, [username]);
  
  // Chargement des données du profil
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);
  
  // Données dérivées mémorisées
  const {
    fullName,
    username_display,
    isFreelance,
    joinDate,
    positiveReviews,
    negativeReviews
  } = useMemo(() => {
    const fname = profile?.full_name || profile?.username || "Utilisateur";
    const uname = profile?.username || '';
    const isFreel = profile?.role === "freelance";
    const jDate = profile?.created_at ? formatDate(profile?.created_at) : "Date inconnue";
    
    // Filtrer les avis positifs et négatifs
    const posReviews = reviews.filter(review => review.rating >= 4);
    const negReviews = reviews.filter(review => review.rating < 4);
    
    return {
      fullName: fname,
      username_display: uname,
      isFreelance: isFreel,
      joinDate: jDate,
      positiveReviews: posReviews,
      negativeReviews: negReviews
    };
  }, [profile, reviews]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-vynal-purple-dark">
        <div className="flex flex-col items-center">
          <Loader size="lg" variant="primary" showText={true} />
        </div>
      </div>
    );
  }
  
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-vynal-purple-dark py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="backdrop-blur-md bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-vynal-purple-secondary/30 flex items-center justify-center mb-5">
                <UserCircle className="h-7 w-7 text-vynal-accent-primary" />
              </div>
              <h2 className="text-xl font-medium text-vynal-text-primary mb-3">Profil non disponible</h2>
              <p className="text-vynal-text-secondary text-center mb-6 leading-relaxed text-sm">
                {error || "Ce profil n'existe pas ou n'est pas accessible pour le moment."}
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="group border-vynal-purple-secondary/50 bg-vynal-purple-secondary/30 text-vynal-text-primary hover:bg-vynal-purple-secondary/50 hover:text-vynal-text-primary transition-colors text-sm"
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
  
  return (
    <div className="min-h-screen bg-vynal-purple-dark">
      {/* Bannière du profil */}
      <div className="h-40 md:h-56 bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-vynal-accent-secondary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-vynal-accent-primary/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative">
        {/* Photo de profil et info principale */}
        <div className="flex flex-col items-center -mt-14 md:-mt-16 mb-6">
          <div className="relative mb-3">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={fullName}
                className="w-28 h-28 rounded-full object-cover border-4 border-vynal-purple-dark"
                width={112}
                height={112}
                unoptimized
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-vynal-purple-secondary/30 flex items-center justify-center border-4 border-vynal-purple-dark">
                <UserCircle className="h-14 w-14 text-vynal-accent-primary" />
              </div>
            )}
            
            {isFreelance && (
              <Badge className="absolute bottom-1 right-1 bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark text-xs">
                Freelance
              </Badge>
            )}
          </div>
          
          <h1 className="text-xl md:text-2xl font-semibold text-vynal-text-primary mb-1">{fullName}</h1>
          
          {username_display && (
            <p className="text-vynal-text-secondary mb-2 text-sm">@{username_display}</p>
          )}
          
          {/* Badge de certification */}
          {profile.is_certified && profile.certification_type && (
            <div className="mb-3">
              <CertificationBadge 
                type={profile.certification_type} 
                size="md"
                showLabel
              />
            </div>
          )}
          
          {/* Note moyenne et nombre d'avis */}
          {isFreelance && (
            <div className="flex items-center mb-4">
              <StarRating rating={averageRating} size="medium" />
              <span className="text-sm text-vynal-text-secondary ml-2">
                {averageRating > 0 
                  ? `${averageRating.toFixed(1)} (${reviewCount} avis)` 
                  : "Aucun avis"}
              </span>
            </div>
          )}
          
          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-2 justify-center mb-5">
            <Button className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium transition-all text-xs h-9">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Contacter
            </Button>
            
            {isFreelance && (
              <Button variant="outline" className="border-vynal-purple-secondary/50 bg-vynal-purple-secondary/30 text-vynal-text-primary hover:bg-vynal-purple-secondary/50 hover:text-vynal-text-primary transition-colors text-xs h-9">
                <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                Voir tous les services
              </Button>
            )}
          </div>
          
          {/* Badges et infos */}
          <div className="flex flex-wrap gap-2 justify-center items-center mb-6">
            <InfoBadge 
              icon={Calendar} 
              text={`Membre depuis ${joinDate}`} 
            />
            
            {isFreelance && (
              <InfoBadge 
                icon={Briefcase} 
                text={`${services.length} service${services.length !== 1 ? 's' : ''}`} 
              />
            )}
          </div>
        </div>
        
        {/* Bio et informations principales */}
        {profile.bio && (
          <Card className="max-w-3xl mx-auto mb-10 backdrop-blur-md bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl">
            <CardContent className="p-6">
              <h2 className="text-lg text-vynal-text-primary mb-3 font-medium">À propos</h2>
              <p className="text-vynal-text-secondary leading-relaxed text-sm">{profile.bio}</p>
            </CardContent>
          </Card>
        )}
        
        {/* Services (si freelance) */}
        {isFreelance && services.length > 0 && (
          <ServicesSection services={services} />
        )}
        
        {/* Avis (si freelance et a des avis) */}
        {isFreelance && reviews.length > 0 && (
          <ReviewsSection 
            reviews={reviews} 
            positiveReviews={positiveReviews} 
            negativeReviews={negativeReviews} 
            profileId={profile.id}
            username={username_display}
          />
        )}
      </div>
    </div>
  );
} 