"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star, UserCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { useFreelancerRating } from "@/hooks/useFreelancerRating";
import Link from "next/link";
import ServiceCard from "@/components/services/ServiceCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import ReviewReplyComponent from '@/components/reviews/ReviewReply';
import { Loader } from "@/components/ui/loader";
import Image from 'next/image';
import MessagingDialog from "@/components/messaging/MessagingDialog";

// Type pour le profil du vendeur et ses services
type ProfileData = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  email?: string;
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

export default function VendorProfileByIdPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;
  
  const [vendor, setVendor] = useState<ProfileData | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Récupérer la note moyenne du vendeur
  const { averageRating, reviewCount } = useFreelancerRating(vendor?.id);
  
  // Charger les informations du vendeur par ID
  useEffect(() => {
    const fetchVendorData = async () => {
      if (!userId) {
        setError("Vendeur introuvable");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Récupérer le profil du vendeur par ID
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .eq("role", "freelance")
          .single();
        
        if (profileError) {
          console.error("Erreur lors du chargement du profil:", profileError);
          setError("Vendeur introuvable");
          return;
        }
        
        // Récupérer les services du vendeur
        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select(`
            *,
            profiles:freelance_id (*),
            categories (*),
            subcategories (*)
          `)
          .eq("freelance_id", profileData.id)
          .eq("active", true)
          .order("created_at", { ascending: false });
        
        if (servicesError) {
          console.error("Erreur lors du chargement des services:", servicesError);
        }
        
        setVendor(profileData);
        setServices(servicesData || []);
        setError(null);
        
        // Une fois le profil récupéré, charger les avis
        if (profileData?.id) {
          await fetchReviews(profileData.id);
        }
      } catch (err) {
        console.error("Erreur:", err);
        setError("Une erreur est survenue lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendorData();
  }, [userId]);
  
  // Fonction pour récupérer les avis
  const fetchReviews = async (vendorId: string) => {
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          client:client_id (username, full_name, avatar_url),
          services:service_id (title, slug)
        `)
        .eq("freelance_id", vendorId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      setReviews(data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des avis:", err);
    } finally {
      setLoadingReviews(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" variant="primary" showText={true} />
      </div>
    );
  }
  
  if (error || !vendor) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="bg-white border-red-100 rounded-xl shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2 text-red-600">Profil non trouvé</h2>
            <p className="mb-4 text-gray-600">Le profil de ce vendeur n'a pas été trouvé ou n'est pas accessible.</p>
            <Button variant="outline" onClick={() => router.push('/services')}>
              Retour aux services
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Identifier le vendeur pour l'affichage
  const vendorName = vendor.full_name || vendor.username || "Vendeur";
  const vendorUsername = vendor.username || `ID: ${vendor.id.substring(0, 8)}`;
  
  // Filtrer les avis positifs et négatifs
  const positiveReviews = reviews.filter(review => review.rating >= 4);
  const negativeReviews = reviews.filter(review => review.rating < 4);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profil principal */}
        <div className="md:col-span-4">
          <Card className="bg-white/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-vynal-text-primary">Profil du vendeur</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  {vendor.avatar_url ? (
                    <Image 
                      src={vendor.avatar_url}
                      alt={vendorName}
                      className="w-24 h-24 rounded-full object-cover border border-slate-200 dark:border-slate-700/30"
                      width={96}
                      height={96}
                      unoptimized
                    />
                  ) : (
                    <UserCircle className="w-24 h-24 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                
                <div className="text-center mb-4 w-full">
                  <h1 className="text-xl font-bold text-slate-800 dark:text-vynal-text-primary">{vendorName}</h1>
                  <p className="text-slate-600 dark:text-vynal-text-secondary">@{vendorUsername}</p>
                  
                  <div className="mt-2 inline-block px-3 py-1 bg-vynal-accent-primary/10 dark:bg-vynal-accent-primary/10 text-vynal-accent-primary border border-vynal-accent-primary/20 dark:border-vynal-accent-primary/20 rounded-full text-xs font-medium hover:bg-vynal-accent-primary/15 dark:hover:bg-vynal-accent-primary/20 hover:border-vynal-accent-primary/30 dark:hover:border-vynal-accent-primary/40 transition-all duration-200">
                    Vendeur certifié
                  </div>
                  
                  <div className="flex items-center justify-center mt-3">
                    <div className="flex space-x-0.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = star <= Math.floor(averageRating);
                        const isPartiallyFilled = !isFilled && star === Math.ceil(averageRating);
                        const fillPercentage = isPartiallyFilled 
                          ? Math.round((averageRating % 1) * 100) 
                          : 0;
                        
                        return (
                          <div key={star} className="relative">
                            <Star className="h-4 w-4 text-slate-200 dark:text-slate-700 fill-slate-200 dark:fill-slate-700" />
                            
                            {(isFilled || isPartiallyFilled) && (
                              <div 
                                className="absolute inset-0 overflow-hidden" 
                                style={{ 
                                  width: isFilled ? '100%' : `${fillPercentage}%` 
                                }}
                              >
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-sm ml-2 text-slate-600 dark:text-vynal-text-secondary">
                      {averageRating > 0 
                        ? `${averageRating.toFixed(1)} (${reviewCount} avis)` 
                        : "Aucun avis"}
                    </span>
                  </div>
                </div>
                
                {/* Biographie */}
                {vendor.bio && (
                  <div className="w-full mb-6">
                    <h3 className="font-semibold mb-2">À propos</h3>
                    <p className="text-sm text-gray-600 break-words">
                      {vendor.bio}
                    </p>
                  </div>
                )}
                
                <div className="w-full mb-6">
                  
                  {loadingReviews ? (
                    <div className="flex justify-center mt-2">
                      <Loader size="sm" variant="primary" />
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                      <Tabs defaultValue="positifs" className="w-full">
                        <TabsList className="w-full grid grid-cols-2 mb-3 text-xs">
                          <TabsTrigger value="positifs">
                            <div className="flex flex-col items-center">
                              <div className="flex items-center">
                                <ThumbsUp className="h-3 w-3 text-emerald-500 mr-1" />
                                <span>Avis positifs</span>
                              </div>
                              <span className="text-[10px] text-gray-500 mt-0.5">({positiveReviews.length})</span>
                            </div>
                          </TabsTrigger>
                          <TabsTrigger value="negatifs">
                            <div className="flex flex-col items-center">
                              <div className="flex items-center">
                                <ThumbsDown className="h-3 w-3 text-red-500 mr-1" />
                                <span>Avis négatifs</span>
                              </div>
                              <span className="text-[10px] text-gray-500 mt-0.5">({negativeReviews.length})</span>
                            </div>
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="positifs">
                          {positiveReviews.length > 0 ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                              {positiveReviews.slice(0, 3).map((review) => (
                                <Card key={review.id} className="p-3 border border-gray-100">
                                  <div className="flex items-start space-x-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={review.client?.avatar_url || undefined} />
                                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                                        {(review.client?.username || review.client?.full_name || 'CL')
                                          .split(' ')
                                          .map(n => n[0])
                                          .join('')
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-sm">
                                      <div className="flex justify-between items-start">
                                        <p className="font-medium text-xs">
                                          {review.client?.full_name || review.client?.username || "Client"}
                                        </p>
                                      </div>
                                      <div className="flex items-center mt-0.5 mb-1">
                                        <div className="flex space-x-0.5 mr-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star 
                                              key={star} 
                                              className={`h-3 w-3 ${star <= review.rating ? "text-amber-500 fill-amber-500" : "text-gray-200 fill-gray-200"}`} 
                                            />
                                          ))}
                                        </div>
                                      </div>
                                      <p className="text-xs text-gray-700">{review.comment || "Aucun commentaire"}</p>
                                      
                                      {/* Ajouter le composant de réponse à l'avis */}
                                      <ReviewReplyComponent reviewId={review.id} freelanceId={vendor.id} />
                                    </div>
                                  </div>
                                </Card>
                              ))}
                              {positiveReviews.length > 3 && (
                                <div className="text-center pt-1">
                                  <p className="text-xs text-indigo-600 hover:underline cursor-pointer">
                                    Voir tous les avis positifs ({positiveReviews.length})
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <p className="text-xs text-gray-500">Aucun avis positif</p>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="negatifs">
                          {negativeReviews.length > 0 ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                              {negativeReviews.slice(0, 3).map((review) => (
                                <Card key={review.id} className="p-3 border border-gray-100">
                                  <div className="flex items-start space-x-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={review.client?.avatar_url || undefined} />
                                      <AvatarFallback className="bg-red-100 text-red-700 text-xs">
                                        {(review.client?.username || review.client?.full_name || 'CL')
                                          .split(' ')
                                          .map(n => n[0])
                                          .join('')
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-sm">
                                      <div className="flex justify-between items-start">
                                        <p className="font-medium text-xs">
                                          {review.client?.full_name || review.client?.username || "Client"}
                                        </p>
                                      </div>
                                      <div className="flex items-center mt-0.5 mb-1">
                                        <div className="flex space-x-0.5 mr-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star 
                                              key={star} 
                                              className={`h-3 w-3 ${star <= review.rating ? "text-amber-500 fill-amber-500" : "text-gray-200 fill-gray-200"}`} 
                                            />
                                          ))}
                                        </div>
                                      </div>
                                      <p className="text-xs text-gray-700">{review.comment || "Aucun commentaire"}</p>
                                      
                                      {/* Ajouter le composant de réponse à l'avis */}
                                      <ReviewReplyComponent reviewId={review.id} freelanceId={vendor.id} />
                                    </div>
                                  </div>
                                </Card>
                              ))}
                              {negativeReviews.length > 3 && (
                                <div className="text-center pt-1">
                                  <p className="text-xs text-indigo-600 hover:underline cursor-pointer">
                                    Voir tous les avis négatifs ({negativeReviews.length})
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <p className="text-xs text-gray-500">Aucun avis négatif</p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </div>
                
                {/* Bouton de contact */}
                <div className="w-full mt-4">
                  <MessagingDialog 
                    freelanceId={vendor.id}
                    freelanceName={vendorName}
                    buttonVariant="default"
                    className="w-full text-white bg-gradient-to-r from-[#FF66B2] to-[#FF66B2]/80 hover:from-[#FF66B2]/90 hover:to-[#FF66B2] text-white shadow-md transition-all dark:from-pink-400 dark:to-pink-600 dark:hover:from-pink-500 dark:hover:to-pink-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Services et avis */}
        <div className="md:col-span-8">
          <Tabs defaultValue="services" className="space-y-6">
            <TabsList className="bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30">
              <TabsTrigger 
                value="services"
                className="data-[state=active]:bg-vynal-accent-primary/10 data-[state=active]:text-vynal-accent-primary data-[state=active]:border-vynal-accent-primary/20"
              >
                Services
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="data-[state=active]:bg-vynal-accent-primary/10 data-[state=active]:text-vynal-accent-primary data-[state=active]:border-vynal-accent-primary/20"
              >
                Avis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-4">
              {services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <ServiceCard 
                      key={service.id} 
                      service={service}
                      className="bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30 hover:border-slate-300 dark:hover:border-slate-700/50 transition-all duration-200"
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30">
                  <CardContent className="p-6 text-center">
                    <p className="text-slate-600 dark:text-vynal-text-secondary">
                      Aucun service disponible pour le moment
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              {loadingReviews ? (
                <div className="flex justify-center p-6">
                  <Loader size="md" variant="primary" />
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {/* Avis positifs */}
                  {positiveReviews.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-slate-800 dark:text-vynal-text-primary flex items-center">
                        <ThumbsUp className="w-4 h-4 mr-2 text-emerald-500" />
                        Avis positifs ({positiveReviews.length})
                      </h3>
                      {positiveReviews.slice(0, 3).map((review) => (
                        <Card key={review.id} className="bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700/30">
                                <AvatarImage src={review.client.avatar_url || undefined} />
                                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {review.client.full_name?.[0] || review.client.username?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-slate-800 dark:text-vynal-text-primary">
                                    {review.client.full_name || review.client.username}
                                  </p>
                                  <span className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                                    {formatDate(review.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-vynal-text-secondary mt-1">
                                  {review.comment}
                                </p>
                                <div className="mt-2">
                                  <ReviewReplyComponent reviewId={review.id} freelanceId={vendor.id} />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Avis négatifs */}
                  {negativeReviews.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-slate-800 dark:text-vynal-text-primary flex items-center">
                        <ThumbsDown className="w-4 h-4 mr-2 text-red-500" />
                        Avis négatifs ({negativeReviews.length})
                      </h3>
                      {negativeReviews.slice(0, 3).map((review) => (
                        <Card key={review.id} className="bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700/30">
                                <AvatarImage src={review.client.avatar_url || undefined} />
                                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {review.client.full_name?.[0] || review.client.username?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-slate-800 dark:text-vynal-text-primary">
                                    {review.client.full_name || review.client.username}
                                  </p>
                                  <span className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                                    {formatDate(review.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-vynal-text-secondary mt-1">
                                  {review.comment}
                                </p>
                                <div className="mt-2">
                                  <ReviewReplyComponent reviewId={review.id} freelanceId={vendor.id} />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Card className="bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30">
                  <CardContent className="p-6 text-center">
                    <p className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                      Aucun avis pour le moment
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 