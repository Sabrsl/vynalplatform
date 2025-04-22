import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { getSupabaseServer } from "@/lib/supabase/server";
import ReviewReplyComponent from "@/components/reviews/ReviewReply";

// Type pour les avis
type Review = {
  id: string;
  created_at: string;
  rating: number;
  comment: string;
  client_id: string;
  order_id: string;
  service_id: string;
  freelance_id: string;
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

export default async function FreelanceReviewsPage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = getSupabaseServer();
  
  // Récupérer le profil du freelance par username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select()
    .eq("username", params.username)
    .eq("role", "freelance")
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Récupérer tous les avis
  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select(`
      *,
      client:client_id (username, full_name, avatar_url),
      services:service_id (title, slug)
    `)
    .eq("freelance_id", profile.id)
    .order("created_at", { ascending: false });

  if (reviewsError) {
    console.error("Erreur lors du chargement des avis:", reviewsError);
  }

  // Filtrer les avis positifs et négatifs
  const positiveReviews = reviews?.filter((review: Review) => review.rating >= 4) || [];
  const negativeReviews = reviews?.filter((review: Review) => review.rating < 4) || [];

  // Calcul de la note moyenne
  let averageRating = 0;
  if (reviews && reviews.length > 0) {
    averageRating = parseFloat((reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / reviews.length).toFixed(1));
  }

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

  // Fonction pour rendre les avis
  function renderReviewsList(reviewsList: Review[]) {
    if (!reviewsList.length) {
      return (
        <div className="text-center py-8">
          <p className="text-vynal-text-secondary">Aucun avis disponible</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {reviewsList.map((review) => (
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
                  
                  {/* Composant de réponse à l'avis */}
                  <ReviewReplyComponent reviewId={review.id} freelanceId={profile.id} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-vynal-purple-dark min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            asChild 
            variant="ghost" 
            className="text-vynal-accent-primary hover:bg-vynal-purple-secondary/20"
          >
            <Link href={`/profile/${params.username}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour au profil
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-vynal-text-primary">
              Avis pour {profile.full_name || profile.username}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="flex items-center">
                {renderStars(averageRating, "large")}
              </div>
              <span className="text-vynal-text-primary font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-vynal-text-secondary text-sm">({reviews?.length || 0} avis)</span>
            </div>
          </div>

          <Tabs defaultValue="tous" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="bg-vynal-purple-secondary/30 border border-vynal-purple-secondary/30">
                <TabsTrigger value="tous" className="data-[state=active]:bg-vynal-accent-primary data-[state=active]:text-vynal-purple-dark">
                  Tous ({reviews?.length || 0})
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
              {renderReviewsList(reviews || [])}
            </TabsContent>
            
            <TabsContent value="positifs" className="space-y-4">
              {renderReviewsList(positiveReviews)}
            </TabsContent>
            
            <TabsContent value="negatifs" className="space-y-4">
              {renderReviewsList(negativeReviews)}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 