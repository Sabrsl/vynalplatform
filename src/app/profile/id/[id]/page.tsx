"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Star, UserCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { useFreelancerRating } from "@/hooks/useFreelancerRating";
import Link from "next/link";
import ServiceCard from "@/components/services/ServiceCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

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
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
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
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Profil du vendeur</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  {vendor.avatar_url ? (
                    <img 
                      src={vendor.avatar_url}
                      alt={vendorName}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-24 h-24 text-gray-300" />
                  )}
                </div>
                
                <div className="text-center mb-4 w-full">
                  <h1 className="text-xl font-bold">{vendorName}</h1>
                  <p className="text-gray-500">@{vendorUsername}</p>
                  
                  <div className="mt-2 inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
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
                            <Star className="h-4 w-4 text-gray-200 fill-gray-200" />
                            
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
                    <span className="text-sm ml-2 text-gray-600">
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
                    <div className="flex justify-center py-3">
                      <Loader2 className="animate-spin h-5 w-5 text-indigo-600" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Tabs defaultValue="positifs" className="w-full">
                        <TabsList className="w-full grid grid-cols-2 mb-3 text-xs">
                          <TabsTrigger value="positifs">
                            <div className="flex flex-col items-center">
                              <span>Avis positifs</span>
                              <span className="text-[10px] text-gray-500 mt-0.5">({positiveReviews.length})</span>
                            </div>
                          </TabsTrigger>
                          <TabsTrigger value="negatifs">
                            <div className="flex flex-col items-center">
                              <span>Avis négatifs</span>
                              <span className="text-[10px] text-gray-500 mt-0.5">({negativeReviews.length})</span>
                            </div>
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="positifs">
                          {positiveReviews.length > 0 ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
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
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
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
                <div className="w-full">
                  <Button variant="default" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contacter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Services et Avis du vendeur */}
        <div className="md:col-span-8">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Services proposés par {vendorName}</CardTitle>
            </CardHeader>
            <CardContent>
              {services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <Link 
                      key={service.id}
                      href={`/services/${service.slug}`}
                      className="block h-full transition-transform duration-300 hover:scale-[1.01]"
                    >
                      <ServiceCard service={service} className="h-full shadow-sm" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Ce vendeur n'a pas encore publié de services.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 