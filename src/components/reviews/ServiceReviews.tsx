import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReviewReplyComponent from './ReviewReply';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

type Review = {
  id: string;
  created_at: string;
  rating: number;
  comment: string;
  client_id: string;
  freelance_id: string;
  service_id: string;
  client: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
};

type ServiceReviewsProps = {
  serviceId: string;
  initialReviews?: Review[]; // Ajout de la possibilité de passer des reviews directement
};

const ServiceReviews = ({ serviceId, initialReviews }: ServiceReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [loading, setLoading] = useState(!initialReviews);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  useEffect(() => {
    // Si des reviews initiales sont fournies, on calcule la note moyenne et on ne fait pas de requête Supabase
    if (initialReviews && initialReviews.length > 0) {
      const totalRating = initialReviews.reduce((sum, review) => sum + review.rating, 0);
      setAverageRating(parseFloat((totalRating / initialReviews.length).toFixed(1)));
      setLoading(false);
      return;
    }

    // Sinon, on procède à la requête Supabase
    const fetchReviews = async () => {
      if (!serviceId) return;
      
      setLoading(true);
      try {
        const { data, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            client:client_id (username, full_name, avatar_url)
          `)
          .eq('service_id', serviceId)
          .order('created_at', { ascending: false });
        
        if (reviewsError) {
          console.error('Erreur lors du chargement des avis:', reviewsError);
          setError('Impossible de charger les avis pour ce service');
          return;
        }
        
        if (data) {
          setReviews(data);
          
          // Calculer la note moyenne
          if (data.length > 0) {
            const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
            setAverageRating(parseFloat((totalRating / data.length).toFixed(1)));
          }
        }
      } catch (err) {
        console.error('Erreur inattendue:', err);
        setError('Une erreur est survenue lors du chargement des avis');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [serviceId, initialReviews]);

  // Fonction pour formatter une date
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return 'Date invalide';
    
    // Options pour le formatage
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    
    return new Intl.DateTimeFormat('fr-FR', options).format(date);
  };

  // Afficher les étoiles
  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-3 w-3 ${star <= rating ? "text-vynal-accent-primary fill-vynal-accent-primary" : "text-vynal-purple-secondary/50 fill-transparent"}`} 
          />
        ))}
      </div>
    );
  };

  // Filtrer les avis positifs et négatifs
  const positiveReviews = reviews.filter((review) => review.rating >= 4);
  const negativeReviews = reviews.filter((review) => review.rating < 4);

  if (loading) {
    return (
      <div className="py-4">
        <h2 className="text-xs sm:text-sm font-medium text-vynal-title mb-2 flex items-center">
          <MessageSquare className="h-3 w-3 mr-1 text-vynal-accent-primary" />
          Avis clients
        </h2>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl bg-vynal-purple-secondary/30" />
          <Skeleton className="h-32 w-full rounded-xl bg-vynal-purple-secondary/30" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4">
        <h2 className="text-xs sm:text-sm font-medium text-vynal-title mb-2 flex items-center">
          <MessageSquare className="h-3 w-3 mr-1 text-vynal-accent-primary" />
          Avis clients
        </h2>
        <Card className="backdrop-blur-md bg-vynal-purple-dark/90 border-vynal-purple-secondary/40 rounded-xl">
          <CardContent className="p-3 text-center text-vynal-text-secondary text-sm">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si pas d'avis, afficher un message
  if (reviews.length === 0) {
    return (
      <div className="py-4">
        <h2 className="text-xs sm:text-sm font-medium text-vynal-title mb-2 flex items-center">
          <MessageSquare className="h-3 w-3 mr-1 text-vynal-accent-primary" />
          Avis clients
        </h2>
        <Card className={cn(
          "rounded-xl",
          isDarkMode 
            ? "backdrop-blur-md bg-vynal-purple-dark/90 border-vynal-purple-secondary/40"
            : "bg-white border-gray-200"
        )}>
          <CardContent className={cn(
            "p-5 lg:p-4 text-center text-xs",
            isDarkMode ? "text-vynal-text-secondary" : "text-gray-500"
          )}>
            Ce service n'a pas encore d'avis.
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderReviewsList = (reviewsList: Review[]) => {
    if (!reviewsList.length) {
      return (
        <div className="text-center py-4">
          <p className="text-vynal-text-secondary">Aucun avis disponible</p>
        </div>
      );
    }

    return (
      <div className="space-y-5 lg:space-y-4">
        {reviewsList.map((review) => (
          <Card key={review.id} className="backdrop-blur-md bg-vynal-purple-dark/90 border-vynal-purple-secondary/40 rounded-lg overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-vynal-purple-secondary/30">
                  <AvatarImage src={review.client?.avatar_url || undefined} />
                  <AvatarFallback className="bg-vynal-accent-primary text-vynal-purple-dark text-[8px] sm:text-[10px]">
                    {(review.client?.username || review.client?.full_name || 'C')
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-[10px] sm:text-xs text-vynal-text-primary">
                        {review.client?.full_name || review.client?.username || "Client"}
                      </p>
                      <div className="flex items-center mt-0.5">
                        {renderStars(review.rating)}
                        <span className="text-[8px] sm:text-[9px] text-vynal-text-secondary ml-1">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="mt-1.5 text-[8px] sm:text-[10px] text-vynal-text-secondary leading-relaxed">
                    {review.comment || "Aucun commentaire"}
                  </p>
                  
                  {/* Composant de réponse à l'avis */}
                  <ReviewReplyComponent 
                    reviewId={review.id} 
                    freelanceId={review.freelance_id} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs sm:text-sm font-medium text-vynal-title mb-2 flex items-center">
          <MessageSquare className="h-3 w-3 mr-1 text-vynal-accent-primary" />
          Avis clients ({reviews.length})
        </h2>
        
        <div className="flex items-center gap-2">
          {renderStars(averageRating)}
          <span className="text-vynal-text-primary font-medium ml-1">{averageRating.toFixed(1)}</span>
        </div>
      </div>

      <Tabs defaultValue="tous" className="w-full">
        <div className="flex justify-center mb-4">
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
          {renderReviewsList(reviews)}
        </TabsContent>
        
        <TabsContent value="positifs" className="space-y-4">
          {renderReviewsList(positiveReviews)}
        </TabsContent>
        
        <TabsContent value="negatifs" className="space-y-4">
          {renderReviewsList(negativeReviews)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceReviews; 