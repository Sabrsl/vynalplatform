import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ChevronRight, 
  Clock, 
  Calendar, 
  FileText,
  Heart,
  Share2,
  User,
  Star,
  Shield,
  Package2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Tag,
  Image,
  MessageSquare,
  ShoppingBag,
  CreditCard,
  PackageCheck
} from "lucide-react";
import { ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ServiceCard from "@/components/services/ServiceCard";
import ServiceImageGallery from './ServiceImageGallery';
import { useFreelancerRating } from "@/hooks/useFreelancerRating";
import MessagingDialog from "@/components/messaging/MessagingDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/useUser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { OrderButton } from "@/components/orders/OrderButton";

// Animation variants
const animations = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  },
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
};

// Extension du type pour inclure les propriétés supplémentaires
interface ExtendedService extends ServiceWithFreelanceAndCategories {
  images?: string[];
}

interface ServiceViewProps {
  service: ExtendedService | null;
  loading?: boolean;
  error?: string | null;
  isFreelanceView?: boolean;
  relatedServices?: ServiceWithFreelanceAndCategories[];
  loadingRelated?: boolean;
  onBack?: () => void;
  onEdit?: () => void;
  className?: string;
}

/**
 * Composant de vue détaillée d'un service - réutilisable entre le tableau de bord et la page publique
 */
const ServiceView: React.FC<ServiceViewProps> = (props) => {
  try {
    // Extract props safely
    const {
      service,
      loading = false,
      error = null,
      isFreelanceView = false,
      relatedServices = [],
      loadingRelated = false,
      onBack,
      onEdit,
      className = ""
    } = props;
    
    const router = useRouter();
    
    // Récupération de la note moyenne du freelance
    const { averageRating, reviewCount } = useFreelancerRating(service?.profiles?.id);

    // Création de la liste d'étoiles de notation une seule fois
    const ratingStars = useMemo(() => {
      if (!averageRating) return null;
      
      return (
        <div className="flex space-x-0.5">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= Math.floor(averageRating);
            const isPartiallyFilled = !isFilled && star === Math.ceil(averageRating);
            const fillPercentage = isPartiallyFilled 
              ? Math.round((averageRating % 1) * 100) 
              : 0;
            
            return (
              <div key={star} className="relative">
                {/* Étoile de fond (grise) */}
                <Star className="h-3.5 w-3.5 text-gray-200 fill-gray-200" />
                
                {/* Étoile colorée (complète ou partielle) */}
                {(isFilled || isPartiallyFilled) && (
                  <div 
                    className="absolute inset-0 overflow-hidden" 
                    style={{ 
                      width: isFilled ? '100%' : `${fillPercentage}%` 
                    }}
                  >
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }, [averageRating]);

    // État de chargement - Composant optimisé avec Skeleton
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="w-full aspect-video rounded-lg" />
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <div className="space-y-2 mb-6">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card className="mb-4">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-1/2" />
                      <Skeleton className="h-8 w-1/2" />
                    </div>
                    <div className="space-y-2 pt-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // État d'erreur - Interface améliorée et plus informative
    if (error || !service) {
      return (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={animations.fadeIn}
          className={cn("container mx-auto px-4 py-12 bg-gray-50", className)}
        >
          <Card className="max-w-2xl mx-auto border-red-100 shadow-md overflow-hidden">
            <div className="bg-red-50 p-4 flex items-center space-x-3 border-b border-red-100">
              <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
              <h2 className="text-lg font-semibold text-red-700">Service non disponible</h2>
            </div>
            <CardContent className="p-6">
              <p className="mb-6 text-gray-600">{error || "Ce service n'existe pas ou a été supprimé."}</p>
              <div className="flex flex-wrap gap-2">
                {onBack ? (
                  <Button variant="outline" onClick={onBack} className="group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Retour
                  </Button>
                ) : (
                  <Link href="/services" className="group">
                    <Button variant="outline">
                      <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                      Retour aux services
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    // Si tout est OK, continuer avec le rendu du service
    try {
      // Vérifier si le service est un objet valide avant de le destructurer 
      if (!service || typeof service !== 'object') {
        console.error("Service invalide dans ServiceView:", service);
        throw new Error("Service invalide");
      }
      
      console.log("Service dans ServiceView:", service);
      console.log("Profiles dans service:", service.profiles);
      
      // Déstructuration des données du service avec valeurs par défaut
      const { 
        title = "Service sans titre", 
        description = "Aucune description disponible",
        price = 0,
        delivery_time = 1,
        created_at = new Date().toISOString(),
        profiles: freelance = {
          id: "",
          username: "utilisateur",
          full_name: "Utilisateur",
          avatar_url: null,
          bio: null
        },
        categories: category = {
          id: "",
          name: "Catégorie",
          slug: "categorie"
        },
        subcategories: subcategory = null
      } = service || {};

      console.log("Données du freelance après déstructuration:", freelance);

      // Extraction des initiales du freelance pour l'avatar
      const freelanceInitials = useMemo(() => {
        try {
          const nameSource = freelance.full_name || freelance.username || 'UN';
          return nameSource
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        } catch (err) {
          console.error("Erreur lors de l'extraction des initiales:", err);
          return "UN";
        }
      }, [freelance.full_name, freelance.username]);

      // Formattage de la description avec préservation des sauts de ligne
      const formattedDescription = useMemo(() => {
        try {
          if (!description) return "Aucune description disponible";
          
          return description.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < description.split('\n').length - 1 && <br />}
            </React.Fragment>
          ));
        } catch (err) {
          console.error("Erreur lors du formatage de la description:", err);
          return "Aucune description disponible";
        }
      }, [description]);

      // Filtrage des services connexes
      const filteredRelatedServices = useMemo(() => {
        // Vérifier que relatedServices est un tableau valide
        if (!Array.isArray(relatedServices) || relatedServices.length === 0) {
          return [];
        }
        
        try {
          return relatedServices
            .filter(rs => rs && rs.id && rs.id !== service.id)
            .slice(0, 3);
        } catch (err) {
          console.error("Erreur lors du filtrage des services connexes:", err);
          return [];
        }
      }, [relatedServices, service.id]);

      const user = useUser();
      const [showPaymentSteps, setShowPaymentSteps] = React.useState(false);

      return (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={animations.staggerContainer}
          className={cn("min-h-screen bg-gray-50 pb-8", className)}
        >
          {/* Bannière stylisée - uniquement visible en mode public */}
          {!isFreelanceView && (
            <div className="h-32 sm:h-48 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[url('/img/grid-pattern.svg')] bg-center"></div>
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500 opacity-20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400 opacity-20 rounded-full blur-3xl"></div>
            </div>
          )}
          
          <div className={cn(
            "container mx-auto px-3 sm:px-4 lg:px-6 relative",
            !isFreelanceView ? "-mt-16 sm:-mt-24" : ""
          )}>
            {/* Fil d'Ariane - version publique */}
            {!isFreelanceView && category && (
              <motion.nav 
                variants={animations.fadeIn}
                className="flex items-center text-xs sm:text-sm mb-3 sm:mb-4 bg-white rounded-lg shadow-sm p-2 border border-gray-100 overflow-x-auto whitespace-nowrap"
                aria-label="Fil d'Ariane"
              >
                <Link href="/" className="text-gray-500 hover:text-indigo-600 transition-colors">
                  Accueil
                </Link>
                <ChevronRight className="h-4 w-4 mx-2 text-gray-400 flex-shrink-0" aria-hidden="true" />
                <Link href="/services" className="text-gray-500 hover:text-indigo-600 transition-colors">
                  Services
                </Link>
                <ChevronRight className="h-4 w-4 mx-2 text-gray-400 flex-shrink-0" aria-hidden="true" />
                <Link 
                  href={`/services?category=${category.slug}`} 
                  className="text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  {category.name}
                </Link>
                {subcategory && (
                  <>
                    <ChevronRight className="h-4 w-4 mx-2 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    <Link 
                      href={`/services?category=${category.slug}&subcategory=${subcategory.slug}`} 
                      className="text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                      {subcategory.name}
                    </Link>
                  </>
                )}
                <ChevronRight className="h-4 w-4 mx-2 text-gray-400 flex-shrink-0" aria-hidden="true" />
                <span className="text-indigo-600 font-medium truncate">{title}</span>
              </motion.nav>
            )}

            {/* En-tête avec bouton de retour - version admin/dashboard */}
            {isFreelanceView && (
              <motion.div 
                variants={animations.fadeIn}
                className="flex items-center mb-4 pt-4"
              >
                {onBack && (
                  <Button 
                    variant="ghost" 
                    onClick={onBack} 
                    className="mr-4 group"
                    aria-label="Retour"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Retour
                  </Button>
                )}
                <h1 className="text-2xl font-bold text-gray-900">Détails du service</h1>
                
                {onEdit && (
                  <Button onClick={onEdit} className="ml-auto">
                    Modifier
                  </Button>
                )}
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Partie gauche: informations principales du service */}
              <motion.div 
                variants={animations.fadeInUp}
                className="lg:col-span-2"
              >
                {/* Galerie d'images du service */}
                <motion.div
                  variants={animations.fadeInUp}
                  className="mb-4"
                >
                  {service?.images && service.images.length > 0 ? (
                    <ServiceImageGallery
                      images={service.images}
                      altText={service.title}
                    />
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center shadow-inner">
                      <Image className="h-12 w-12 text-gray-400" aria-hidden="true" />
                      <p className="ml-2 text-gray-500">Aucune image disponible</p>
                    </div>
                  )}
                </motion.div>

                <Card className="overflow-hidden border-none shadow-md bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6">
                    {/* Statut du service - visible uniquement en mode admin */}
                    {isFreelanceView && service.active !== undefined && (
                      <div className="mb-4 flex justify-between items-center">
                        <Badge variant={service.active ? "default" : "secondary"} className={
                          service.active 
                            ? "bg-green-100 text-green-800 hover:bg-green-200" 
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }>
                          {service.active ? "Actif" : "Inactif"}
                        </Badge>
                        
                        <span className="text-xs text-gray-500">ID: {service.id}</span>
                      </div>
                    )}

                    {/* Titre du service */}
                    <div className="mb-3 sm:mb-4">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words" id="service-title">
                        {title}
                      </h1>
                    </div>
                    
                    {/* Informations principales */}
                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                        <div className="flex items-center">
                          <p className="text-xs text-gray-500 mr-1">Catégorie:</p>
                          <p className="text-xs font-medium truncate max-w-[120px]">{category?.name || 'Non spécifiée'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                        <div className="flex items-center">
                          <p className="text-xs text-gray-500 mr-1">Temps de livraison:</p>
                          <p className="text-xs font-medium">{delivery_time} jour{delivery_time > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                        <div className="flex items-center">
                          <p className="text-xs text-gray-500 mr-1">Créé le:</p>
                          <p className="text-xs font-medium">{formatDate(created_at)}</p>
                        </div>
                      </div>
                      
                      {subcategory && (
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                          <div className="flex items-center">
                            <p className="text-xs text-gray-500 mr-1">Sous-catégorie:</p>
                            <p className="text-xs font-medium truncate max-w-[120px]">{subcategory.name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Description du service */}
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold mb-2 text-gray-900">Description</h2>
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 shadow-inner">
                        <div className="text-gray-700 prose prose-sm max-w-none overflow-hidden break-words">
                          {formattedDescription}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Partie droite: prix, actions, et info freelance */}
              <motion.div 
                variants={animations.fadeInUp}
                className="lg:block"
              >
                <div className="lg:sticky lg:top-4 space-y-4">
                  {/* Carte de prix et actions */}
                  <Card className="shadow-md border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-gray-100">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {formatPrice(price)} FCFA
                      </h2>
                      <p className="text-xs text-gray-500">Prix final, sans frais supplémentaires</p>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3 mb-4">
                        <Button 
                          onClick={() => setShowPaymentSteps(true)}
                          className="w-full font-medium shadow-md bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all transform hover:scale-[1.02]"
                          aria-label="Commander ce service"
                        >
                          <ShoppingBag className="h-4 w-4 mr-2" aria-hidden="true" />
                          Commander ce service
                        </Button>
                        
                        <Dialog open={showPaymentSteps} onOpenChange={setShowPaymentSteps}>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Processus de commande</DialogTitle>
                              <DialogDescription>
                                Voici les étapes pour commander ce service
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                              <div className="space-y-4">
                                <div className="flex items-start">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-900">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="ml-4">
                                    <h3 className="text-sm font-medium">1. Spécifications du projet</h3>
                                    <p className="text-sm text-gray-500">Détaillez vos besoins et exigences pour ce service</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-900">
                                    <CreditCard className="h-4 w-4" />
                                  </div>
                                  <div className="ml-4">
                                    <h3 className="text-sm font-medium">2. Paiement sécurisé</h3>
                                    <p className="text-sm text-gray-500">Choisissez parmi plusieurs méthodes de paiement (carte, mobile money, etc.)</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-900">
                                    <MessageSquare className="h-4 w-4" />
                                  </div>
                                  <div className="ml-4">
                                    <h3 className="text-sm font-medium">3. Communication directe</h3>
                                    <p className="text-sm text-gray-500">Discutez avec le freelance pour affiner votre commande</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-900">
                                    <PackageCheck className="h-4 w-4" />
                                  </div>
                                  <div className="ml-4">
                                    <h3 className="text-sm font-medium">4. Livraison et validation</h3>
                                    <p className="text-sm text-gray-500">Recevez et validez le travail final du freelance</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <DialogFooter className="sm:justify-start">
                              <DialogClose asChild>
                                <Button type="button" variant="ghost">
                                  Annuler
                                </Button>
                              </DialogClose>
                              <OrderButton
                                serviceId={service.id}
                                variant="default"
                                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                              />
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" className="flex-1 text-xs" size="sm">
                            <Heart className="h-4 w-4 mr-1.5" aria-hidden="true" />
                            Favoris
                          </Button>
                          <Button variant="outline" className="flex-1 text-xs" size="sm">
                            <Share2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
                            Partager
                          </Button>
                        </div>
                      </div>
                      
                      {/* Garanties du service */}
                      <div className="border-t border-gray-100 pt-3">
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <Clock className="h-4 w-4 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                            <span className="text-gray-700 text-sm">Livraison en {delivery_time} jour{delivery_time > 1 ? 's' : ''}</span>
                          </li>
                          <li className="flex items-start">
                            <MessageSquare className="h-4 w-4 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                            <span className="text-gray-700 text-sm">Support personnalisé assuré</span>
                          </li>
                          <li className="flex flex-col">
                            <div className="flex items-start">
                              <Shield className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                              <span className="text-gray-700 text-sm">Paiement sécurisé</span>
                            </div>
                            <span className="text-gray-500 text-xs ml-6">Vos informations sont chiffrées par TLS</span>
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Informations sur le freelance */}
                  <Card className="shadow-md border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">À propos du vendeur</h3>
                    </div>
                    
                    <CardContent className="p-4">
                      {/* Vérifier la présence des données du freelance */}
                      {freelance && (
                        <>
                          <div className="flex items-center mb-3">
                            <Avatar className="h-12 w-12 mr-3 border border-gray-100 shadow-sm">
                              <AvatarImage 
                                src={freelance.avatar_url || undefined} 
                                alt={freelance.username || ''} 
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                                {freelanceInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                              <h3 className="font-semibold text-sm text-gray-900 truncate">
                                {freelance.full_name || freelance.username || 'Vendeur'}
                              </h3>
                              <p className="text-xs text-gray-500 truncate">@{freelance.username || 'username'}</p>
                              
                              {/* Affichage de la note moyenne */}
                              <div className="flex items-center mt-1">
                                {ratingStars}
                                <span className="text-xs ml-1.5 text-gray-600 font-medium">
                                  {averageRating > 0 
                                    ? `${averageRating.toFixed(1)} (${reviewCount})` 
                                    : "Aucun avis"}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Bio du vendeur si disponible */}
                          {freelance.bio && (
                            <div className="mb-3 bg-gray-50 p-2.5 rounded-md">
                              <h4 className="text-xs font-medium text-gray-700 mb-1">À propos du vendeur</h4>
                              <p className="text-xs text-gray-600 line-clamp-3">
                                {freelance.bio}
                              </p>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              {freelance.id && (
                                <MessagingDialog 
                                  freelanceId={freelance.id}
                                  freelanceName={freelance.full_name || freelance.username || 'Freelance'}
                                  buttonVariant="default"
                                  className="w-full text-xs"
                                  size="sm"
                                />
                              )}
                              
                              <Link 
                                href={
                                  user?.profile?.id === freelance.id
                                    ? "/dashboard/profile"
                                    : freelance.username 
                                      ? `/profile/${freelance.username}` 
                                      : freelance.id 
                                        ? `/profile/id/${freelance.id}` 
                                        : "#"
                                } 
                                className="w-full"
                              >
                                <Button variant="outline" className="w-full text-xs flex items-center justify-center" size="sm">
                                  <User className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                                  {user?.profile?.id === freelance.id ? "Mon profil" : "Voir profil"}
                                </Button>
                              </Link>
                            </div>
                            
                            {freelance.id && (
                              <Link 
                                href={
                                  user?.profile?.id === freelance.id
                                    ? "/dashboard/services"
                                    : `/services?freelancer=${freelance.id}`
                                } 
                                className="w-full block"
                              >
                                <Button variant="ghost" className="w-full text-xs group" size="sm">
                                  {user?.profile?.id === freelance.id 
                                    ? "Gérer mes services" 
                                    : "Voir tous ses services"}
                                  <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </>
                      )}
                      {!freelance && (
                        <div className="text-center p-2 text-gray-500 text-sm">
                          <p>Information du vendeur non disponible</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>
            
            {/* Services connexes - uniquement en mode public */}
            {!isFreelanceView && freelance?.id && Array.isArray(filteredRelatedServices) && (
              <motion.div
                variants={animations.fadeInUp}
                className="mt-8 sm:mt-10"
              >
                <div className="mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
                    <Package2 className="h-5 w-5 mr-2 text-indigo-600" aria-hidden="true" />
                    Autres services de {freelance.full_name || freelance.username}
                  </h2>
                  <p className="text-sm text-gray-500 ml-7">Découvrez d'autres services proposés par ce vendeur</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {loadingRelated ? (
                    // Skeletons pour les services en chargement
                    Array(3).fill(0).map((_, i) => (
                      <Card key={i} className="overflow-hidden h-64">
                        <div className="h-32 bg-gray-200 animate-pulse"></div>
                        <CardContent className="p-3">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-2" />
                          <Skeleton className="h-6 w-1/3 mt-4" />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    filteredRelatedServices.length > 0 ? (
                      filteredRelatedServices.map(relatedService => {
                        // Construire le chemin en utilisant le slug s'il existe, sinon l'ID
                        const linkPath = relatedService.slug
                          ? `/services/${relatedService.slug}`
                          : `/services/${relatedService.id}`;
                        
                        console.log("Navigation service connexe vers:", linkPath);
                        
                        return (
                          <Link 
                            href={linkPath} 
                            key={relatedService.id}
                            className="block transition-transform duration-300 hover:scale-[1.02]"
                          >
                            <ServiceCard 
                              service={relatedService} 
                              className="h-full shadow-sm"
                              useDemo={false} 
                            />
                          </Link>
                        );
                      })
                    ) : (
                      <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <Package2 className="h-10 w-10 mx-auto text-gray-400 mb-3" aria-hidden="true" />
                        <p className="text-gray-600 mb-1">Ce vendeur n'a pas d'autres services pour le moment</p>
                        <p className="text-sm text-gray-500">Revenez plus tard pour découvrir ses nouveaux services</p>
                      </div>
                    )
                  )}
                  
                  {/* Affichage "Voir tous les services" uniquement si nécessaire */}
                  {!loadingRelated && filteredRelatedServices.length > 0 && filteredRelatedServices.length < 3 && (
                    <Link href={`/services?freelancer=${freelance.id}`} className="block">
                      <Card className="h-full border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 transition-colors flex items-center justify-center group">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Package2 className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                          </div>
                          <h3 className="text-sm font-medium text-gray-700 mb-1 group-hover:text-indigo-700 transition-colors">
                            Voir tous les services
                          </h3>
                          <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                            Découvrez la liste complète des services
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      );
    } catch (err) {
      // Gestion silencieuse de l'erreur en production
      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <Card className="max-w-lg mx-auto border-red-100 overflow-hidden">
              <div className="bg-red-50 p-4 border-b border-red-100 flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-red-500" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-red-700">Une erreur est survenue</h2>
              </div>
              <CardContent className="p-6">
                <p className="mb-6 text-gray-600">
                  Nous n'avons pas pu afficher les détails de ce service. Veuillez réessayer ultérieurement.
                </p>
                <Link href="/services">
                  <Button 
                    variant="outline" 
                    className="group"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Retour aux services
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
  } catch (err) {
    // Gestion silencieuse de l'erreur globale en production
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-lg mx-auto border-red-100 overflow-hidden">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-red-700">Une erreur critique est survenue</h2>
            </div>
            <CardContent className="p-6">
              <p className="mb-6 text-gray-600">
                Nous n'avons pas pu traiter votre demande. Veuillez réessayer ultérieurement.
              </p>
              <Link href="/services">
                <Button 
                  variant="outline" 
                  className="group"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Retour aux services
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
};

export default ServiceView;