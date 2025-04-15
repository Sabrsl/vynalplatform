"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronRight, 
  Clock, 
  User, 
  Star, 
  Calendar, 
  ShoppingCart, 
  Shield, 
  FileText,
  Heart,
  Share2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useServices, ServiceWithFreelanceAndCategories } from '@/hooks/useServices';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;
  const [service, setService] = useState<ServiceWithFreelanceAndCategories | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getServiceBySlug } = useServices();
  
  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      
      const { service, error } = await getServiceBySlug(slug);
      
      if (error) {
        setError(error);
        setService(null);
      } else {
        setService(service);
        setError(null);
      }
      
      setLoading(false);
    };
    
    if (slug) {
      fetchService();
    }
  }, [slug, getServiceBySlug]);

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-500">Chargement du service...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error || !service) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow-sm flex items-start">
          <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold mb-2">Service non trouvé</h2>
            <p className="mb-4">{error || "Ce service n'existe pas ou a été supprimé."}</p>
            <Link href="/services">
              <Button variant="outline">Retour aux services</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur est le freelance qui a créé ce service
  const isOwnService = user?.id === service.freelance_id;
  
  // Récupérer les informations du freelance
  const freelance = service.profiles;
  
  // Récupérer la catégorie et la sous-catégorie
  const category = service.categories;
  const subcategory = service.subcategories;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Fil d'Ariane */}
      <div className="flex items-center text-sm mb-6">
        <Link href="/" className="text-gray-500 hover:text-gray-700">
          Accueil
        </Link>
        <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
        <Link href="/services" className="text-gray-500 hover:text-gray-700">
          Services
        </Link>
        <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
        <Link 
          href={`/services?category=${category.slug}`} 
          className="text-gray-500 hover:text-gray-700"
        >
          {category.name}
        </Link>
        {subcategory && (
          <>
            <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            <Link 
              href={`/services?category=${category.slug}&subcategory=${subcategory.slug}`} 
              className="text-gray-500 hover:text-gray-700"
            >
              {subcategory.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
        <span className="text-indigo-600 font-medium truncate">{service.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Partie gauche: informations principales du service */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-4">{service.title}</h1>
          
          <div className="flex items-center mb-6">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={freelance.avatar_url || undefined} alt={freelance.username || ''} />
                <AvatarFallback>
                  {(freelance.username || freelance.full_name || 'UN')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-gray-700">
                {freelance.full_name || freelance.username || 'Freelance'}
              </span>
            </div>
            <div className="flex items-center ml-auto">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className="text-gray-700">Nouveau</span>
            </div>
          </div>
          
          {/* Placeholder pour l'image du service */}
          <div className="bg-gray-200 w-full h-80 rounded-lg mb-6 relative overflow-hidden">
            {/* Si on a une image pour le service plus tard */}
            {/* <Image
              src={service.image_url || '/images/placeholder-service.jpg'}
              alt={service.title}
              fill
              className="object-cover"
            /> */}
          </div>
          
          {/* Description du service */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Description</h2>
            <div className="prose max-w-none">
              <p>{service.description}</p>
            </div>
          </div>
        </div>
        
        {/* Partie droite: résumé et actions */}
        <div>
          <Card className="sticky top-8">
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-indigo-700 mb-2">
                  {formatPrice(service.price)} FCFA
                </h3>
                
                <div className="flex items-center mb-4">
                  <Clock className="h-4 w-4 text-gray-500 mr-2" />
                  <span>Délai de livraison: {service.delivery_time} jours</span>
                </div>
                
                <div className="space-y-4">
                  {!isOwnService ? (
                    <Button className="w-full" size="lg">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Commander maintenant
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" variant="outline" onClick={() => router.push(`/dashboard/services/edit/${service.id}`)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Modifier ce service
                    </Button>
                  )}
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Heart className="h-4 w-4 mr-2" />
                      Favoris
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Ce service inclut :</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Shield className="h-4 w-4 text-indigo-600 mr-2 mt-0.5" />
                    <span className="text-sm">Garantie de satisfaction</span>
                  </li>
                  <li className="flex items-start">
                    <Calendar className="h-4 w-4 text-indigo-600 mr-2 mt-0.5" />
                    <span className="text-sm">Délai de livraison de {service.delivery_time} jours</span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="h-4 w-4 text-indigo-600 mr-2 mt-0.5" />
                    <span className="text-sm">Livrable finalisé</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 