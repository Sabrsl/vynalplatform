"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Clock, FileText, Upload, AlertCircle, ArrowRight, X, ArrowLeft } from "lucide-react";
import { FileUpload } from "@/components/orders/FileUpload";
import { supabase } from "@/lib/supabase/client";
import { formatPrice, formatFileSize } from "@/lib/utils";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { useDropzone } from "react-dropzone";
import { FileIcon } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useForm } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { FREELANCE_ROUTES, CLIENT_ROUTES } from "@/config/routes";

interface OrderFormProps {
  serviceId: string;
  onClose?: () => void;
}

interface ServiceData {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_time: number;
  images?: string[];
  profiles?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    rating?: number;
  };
}

export function OrderForm({ serviceId, onClose }: OrderFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUser();
  const [loading, setLoading] = useState(false);
  const [loadingService, setLoadingService] = useState(true);
  const [service, setService] = useState<ServiceData | null>(null);
  const [requirements, setRequirements] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorFading, setErrorFading] = useState(false);
  const [isOwnService, setIsOwnService] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Setup react-hook-form
  const form = useForm({
    defaultValues: {
      requirements: ""
    }
  });

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Effet pour faire disparaître les messages d'erreur après quelques secondes
  useEffect(() => {
    if (error) {
      // Attendre 3 secondes avant de commencer à faire disparaître le message
      const fadeTimer = setTimeout(() => {
        setErrorFading(true);
        
        // Attendre 1 seconde pour l'animation avant de supprimer complètement le message
        const removeTimer = setTimeout(() => {
          setError(null);
          setErrorFading(false);
        }, 1000);
        
        return () => clearTimeout(removeTimer);
      }, 3000);
      
      return () => clearTimeout(fadeTimer);
    }
  }, [error]);

  // Retrait d'un fichier de la liste
  const removeFile = (index: number) => {
    if (files.length === 0) return;
    
    setFiles(files.filter((_, i) => i !== index));
  };

  // Charger les données du service
  useEffect(() => {
    const fetchServiceData = async () => {
      if (!serviceId) return;
      
      setLoadingService(true);
      try {
        // Appel direct à Supabase pour récupérer les données du service
        const { data, error: fetchError } = await supabase
          .from('services')
          .select(`
            *,
            profiles!services_freelance_id_fkey (
              id, 
              username, 
              full_name, 
              avatar_url
            )
          `)
          .eq('id', serviceId)
          .single();
        
        if (fetchError) {
          console.error("Erreur lors de la récupération du service:", fetchError);
          throw new Error(fetchError.message);
        }
        
        if (!data) {
          throw new Error("Service non trouvé");
        }
        
        // Vérifier si l'utilisateur est le propriétaire du service
        if (profile && data.freelance_id === profile.id) {
          setIsOwnService(true);
          setError("Vous ne pouvez pas commander votre propre service");
        }
        
        // Récupérer la note moyenne du prestataire si disponible
        let rating = 0;
        if (data.freelance_id) {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('freelance_id', data.freelance_id);
            
          if (!reviewsError && reviewsData && reviewsData.length > 0) {
            rating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
          }
        }
        
        // Formater les données du service
        const serviceData: ServiceData = {
          ...data,
          profiles: data.profiles ? {
            ...data.profiles,
            rating: rating
          } : undefined
        };
        
        setService(serviceData);
      } catch (err: any) {
        console.error("Erreur lors du chargement du service:", err);
        setError(err.message || "Impossible de charger les détails du service");
      } finally {
        setLoadingService(false);
      }
    };
    
    fetchServiceData();
  }, [serviceId, profile]);

  // Handle form submission
  const onSubmit = form.handleSubmit((data) => {
    setError(null);
    
    // Empêcher la commande si c'est le propre service de l'utilisateur
    if (isOwnService) {
      setError("Vous ne pouvez pas commander votre propre service");
      return;
    }
    
    if (!data.requirements || !data.requirements.trim()) {
      setError("Veuillez fournir des instructions pour cette commande");
      return;
    }

    setSubmitting(true);

    try {
      // Préparation des données de la commande pour le sessionStorage
      const orderData = {
        service_id: serviceId,
        requirements: data.requirements,
        has_files: files.length > 0
      };
      
      // Stockage des données temporaire dans le sessionStorage
      sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
      
      // Redirection vers la page de paiement
      router.push(`${FREELANCE_ROUTES.ORDERS}/payment?serviceId=${serviceId}`);
    } catch (err: any) {
      console.error("Erreur lors de la préparation de la commande", err);
      setError("Une erreur s'est produite lors de la préparation de la commande: " + (err.message || ""));
    } finally {
      setSubmitting(false);
    }
  });

  if (loadingService) {
    return (
      <Card className="relative min-h-[300px] flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        <p className="text-sm text-gray-500 mt-2">Chargement des détails du service...</p>
      </Card>
    );
  }

  if (!service) {
    return (
      <Card className="border-red-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900">Service non disponible</h3>
            <p className="text-sm text-gray-500 mt-1">
              Impossible de charger les détails de ce service. Veuillez réessayer ultérieurement.
            </p>
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="mt-4"
            >
              Retour
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <motion.div 
        className="bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest p-4 rounded-t-lg border-b border-vynal-purple-secondary/30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.h2 
          className="text-lg font-semibold text-vynal-text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Détails de la commande
        </motion.h2>
        <motion.p 
          className="text-sm text-vynal-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Remplissez les détails de votre commande
        </motion.p>
      </motion.div>
      
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6 p-4">
          {/* Résumé du service */}
          <div className="bg-vynal-purple-secondary/10 rounded-lg p-4 border border-vynal-purple-secondary/30">
            <div className="flex items-start gap-3">
              <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0 bg-vynal-purple-secondary/20">
                {service?.images && service.images.length > 0 ? (
                  <Image 
                    src={service.images[0]} 
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-vynal-purple-secondary/30">
                    <FileText className="h-5 w-5 text-vynal-accent-primary" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium line-clamp-1 text-vynal-text-primary">{service?.title}</h3>
                <p className="text-xs text-vynal-text-secondary mt-1 line-clamp-2">
                  Par <span className="font-medium">{service?.profiles?.username || "Vendeur"}</span>
                </p>
                <div className="flex items-center mt-1">
                  <div className="text-base font-medium text-vynal-accent-primary">
                    {formatPrice(service?.price || 0)}
                  </div>
                  <div className="ml-2 flex items-center text-xs text-vynal-text-secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {service?.delivery_time} {(service?.delivery_time || 1) > 1 ? 'jours' : 'jour'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-vynal-status-error/20 p-2 rounded-md flex items-start gap-2 text-vynal-status-error text-xs border border-vynal-status-error/30">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="grid gap-6">
            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-vynal-text-primary">Exigences du projet</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez ce dont vous avez besoin pour ce service..." 
                      className="min-h-[120px] bg-transparent border-vynal-purple-secondary/30 text-vynal-text-primary focus-visible:ring-vynal-accent-primary"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Fournissez autant de détails que possible pour une livraison réussie
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <Label htmlFor="file-upload" className="text-vynal-text-primary block mb-2">
                Fichiers (optionnel)
              </Label>
              
              {/* Zone de dépôt de fichiers */}
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isDragActive 
                    ? "border-vynal-accent-primary bg-vynal-accent-primary/10" 
                    : "border-vynal-purple-secondary/30 hover:bg-vynal-purple-secondary/10"
                )}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p className="text-sm text-vynal-accent-primary">Déposez les fichiers ici...</p>
                ) : (
                  <div>
                    <Upload className="mx-auto h-8 w-8 text-vynal-accent-primary mb-2" />
                    <p className="text-sm font-medium text-vynal-text-primary">
                      Glissez-déposez des fichiers ici, ou cliquez pour sélectionner
                    </p>
                    <p className="text-xs text-vynal-text-secondary mt-1">
                      Formats acceptés: images, PDF, Word, Excel, ZIP (max 10MB)
                    </p>
                  </div>
                )}
              </div>
              
              {/* Liste des fichiers */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 rounded-md bg-vynal-purple-secondary/10 border border-vynal-purple-secondary/30"
                    >
                      <div className="flex items-center truncate">
                        <div className="p-1.5 rounded-md bg-vynal-purple-secondary/20 mr-2">
                          <FileIcon className="h-4 w-4 text-vynal-accent-primary" />
                        </div>
                        <span className="text-sm text-vynal-text-primary truncate max-w-[180px]">
                          {file.name}
                        </span>
                        <span className="text-xs text-vynal-text-secondary ml-2">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-vynal-status-error/20 hover:text-vynal-status-error"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {fileError && (
                <p className="mt-2 text-xs text-vynal-status-error">{fileError}</p>
              )}
            </div>
          </div>
          
          <motion.div 
            className="mt-6 px-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-vynal-text-primary hover:text-vynal-accent-primary hover:bg-vynal-purple-secondary/20"
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark"
                disabled={submitting || !form.formState.isValid}
              >
                {submitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  "Continuer vers le paiement"
                )}
              </Button>
            </div>
          </motion.div>
        </form>
      </Form>

      <motion.div 
        className="flex justify-between sm:justify-between px-4 py-3 bg-vynal-purple-secondary/10 border-t border-vynal-purple-secondary/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          onClick={onClose}
          variant="ghost"
          className="text-vynal-text-primary hover:text-vynal-accent-primary hover:bg-vynal-purple-secondary/20"
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        <Button 
          onClick={onSubmit}
          className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </motion.div>
    </>
  );
} 