"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useServices, ServiceWithFreelanceAndCategories } from "@/hooks/useServices";
import { Category, Subcategory } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import { AlertCircle, ArrowLeft, Check, X, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import ServiceImageUploader from "@/components/services/ServiceImageUploader";
import { Separator } from "@/components/ui/separator";
import { Loader } from "@/components/ui/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { profile, isFreelance } = useUser();
  const { getServiceById, updateService } = useServices();
  const { toast } = useToast();
  
  // Récupérer l'ID du service depuis les paramètres d'URL
  const serviceId = params?.id ? (typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '') : '';
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [serviceLoading, setServiceLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    delivery_time: "",
    category_id: "",
    subcategory_id: "",
    active: true,
    slug: ""
  });
  
  const [descriptionFields, setDescriptionFields] = useState({
    intro: "",
    service: "",
    deliverables: "",
    requirements: "",
    timing: "",
    exclusions: ""
  });
  
  const [subcategoriesForSelected, setSubcategoriesForSelected] = useState<Subcategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [serviceStatus, setServiceStatus] = useState<string | null>(null);
  const [isPendingValidation, setIsPendingValidation] = useState(false);
  
  // Charger les catégories et sous-catégories
  useEffect(() => {
    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        
        // Récupérer les catégories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');
        
        if (categoriesError) throw categoriesError;
        
        // Récupérer les sous-catégories
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('subcategories')
          .select('*');
        
        if (subcategoriesError) throw subcategoriesError;
        
        setCategories(categoriesData || []);
        setSubcategories(subcategoriesData || []);
      } catch (err) {
        console.error('Erreur lors du chargement des catégories:', err);
        setError('Erreur lors du chargement des catégories et sous-catégories');
      } finally {
        setCategoriesLoading(false);
      }
    }
    
    loadCategories();
  }, []);
  
  // Charger les détails du service
  useEffect(() => {
    async function loadService() {
      if (!serviceId) return;
      
      try {
        setServiceLoading(true);
        
        // Récupérer les détails du service
        const { data: service, error } = await supabase
          .from('services')
          .select('*')
          .eq('id', serviceId)
          .single();
        
        if (error) throw error;
        
        // Vérifier que le service appartient bien au freelance connecté
        if (profile && service.freelance_id !== profile.id && profile.role !== 'admin') {
          setError("Vous n'êtes pas autorisé à modifier ce service");
          return;
        }
        
        // Vérifier si le service est en attente de validation
        if (service.status === 'pending') {
          setIsPendingValidation(true);
          setServiceStatus('pending');
          toast({
            title: "Service en attente de validation",
            description: "Ce service est actuellement en cours d'examen par notre équipe. Vous ne pouvez pas le modifier pour le moment.",
            variant: "destructive"
          });
          // Si l'utilisateur n'est pas un admin, on bloque l'édition
          if (profile?.role !== 'admin') {
            setTimeout(() => {
              router.push(`/dashboard/services/${serviceId}`);
            }, 1500);
            return;
          }
        }
        
        // Mettre à jour le formulaire avec les données du service
        setFormData({
          title: service.title || "",
          description: service.description || "",
          price: service.price?.toString() || "",
          delivery_time: service.delivery_time?.toString() || "",
          category_id: service.category_id || "",
          subcategory_id: service.subcategory_id || "",
          active: service.active,
          slug: service.slug || ""
        });
        
        // Sauvegarder le statut du service
        setServiceStatus(service.status);
        
        // Mettre à jour les images
        setImages(service.images || []);
        
        // Si le service a une catégorie, charger les sous-catégories correspondantes
        if (service.category_id) {
          const filtered = subcategories.filter(subcat => subcat.category_id === service.category_id);
          setSubcategoriesForSelected(filtered);
        }

        // Parser la description existante pour initialiser les champs
        const description = service.description;
        const sections = {
          intro: "",
          service: "",
          deliverables: "",
          requirements: "",
          timing: "",
          exclusions: ""
        };

        // Extraire les sections de la description
        const introMatch = description.match(/Introduction :\s*([\s\S]*?)(?=\n\n📝|$)/);
        const serviceMatch = description.match(/📝 Description du service :\s*([\s\S]*?)(?=\n\n🎯|$)/);
        const deliverablesMatch = description.match(/🎯 Ce que vous obtiendrez :\s*([\s\S]*?)(?=\n\n🛠️|$)/);
        const requirementsMatch = description.match(/🛠️ Ce dont j'ai besoin de vous :\s*([\s\S]*?)(?=\n\n⏱️|$)/);
        const timingMatch = description.match(/⏱️ Délais et révisions :\s*([\s\S]*?)(?=\n\n❌|$)/);
        const exclusionsMatch = description.match(/❌ Ce qui n'est pas inclus :\s*([\s\S]*?)$/);

        if (introMatch) sections.intro = introMatch[1].trim();
        if (serviceMatch) sections.service = serviceMatch[1].trim();
        if (deliverablesMatch) sections.deliverables = deliverablesMatch[1].trim();
        if (requirementsMatch) sections.requirements = requirementsMatch[1].trim();
        if (timingMatch) sections.timing = timingMatch[1].trim();
        if (exclusionsMatch) sections.exclusions = exclusionsMatch[1].trim();

        setDescriptionFields(sections);
      } catch (err: any) {
        console.error('Erreur lors du chargement du service:', err);
        setError(err.message || "Une erreur est survenue lors du chargement du service");
      } finally {
        setServiceLoading(false);
      }
    }
    
    if (profile) {
      loadService();
    }
  }, [serviceId, profile, subcategories, router, toast]);
  
  // Rediriger si l'utilisateur n'est pas freelance
  useEffect(() => {
    if (profile && !isFreelance && profile.role !== 'admin') {
      router.push("/dashboard");
    }
  }, [profile, isFreelance, router]);
  
  // Mettre à jour les sous-catégories lorsque la catégorie change
  useEffect(() => {
    if (formData.category_id) {
      const subs = subcategories.filter(sub => sub.category_id === formData.category_id);
      setSubcategoriesForSelected(subs);
      // Réinitialiser la sous-catégorie si elle n'existe pas dans la nouvelle catégorie
      if (subs.length > 0 && !subs.find(sub => sub.id === formData.subcategory_id)) {
        setFormData(prev => ({ ...prev, subcategory_id: "" }));
      }
    } else {
      setSubcategoriesForSelected([]);
    }
  }, [formData.category_id, formData.subcategory_id, subcategories]);
  
  // Fonction pour vérifier la longueur de chaque section
  const getSectionLength = (field: string) => {
    return descriptionFields[field as keyof typeof descriptionFields].length;
  };

  // Fonction pour vérifier si une section dépasse la limite
  const isSectionOverLimit = (field: string) => {
    return getSectionLength(field) > 1000;
  };

  // Fonction pour vérifier la longueur de la description du service
  const getServiceDescriptionLength = () => {
    return descriptionFields.service.length;
  };

  // Fonction pour vérifier si la description du service est valide
  const isServiceDescriptionValid = () => {
    return getServiceDescriptionLength() >= 300;
  };

  const handleDescriptionChange = (field: string, value: string) => {
    // Vérifier la limite de caractères pour les sections autres que 'service'
    if (field !== 'service' && value.length > 1000) {
      value = value.slice(0, 1000);
    }

    setDescriptionFields(prev => {
      const newFields = { ...prev, [field]: value };
      
      // Construire la description complète
      const fullDescription = `Introduction : 
${newFields.intro}

📝 Description du service : 
${newFields.service}

🎯 Ce que vous obtiendrez : 
${newFields.deliverables}

🛠️ Ce dont j'ai besoin de vous : 
${newFields.requirements}

⏱️ Délais et révisions : 
${newFields.timing}

❌ Ce qui n'est pas inclus : 
${newFields.exclusions}`;

      // Mettre à jour la description dans formData
      setFormData(prev => ({ ...prev, description: fullDescription }));
      
      return newFields;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Cas spécial pour les champs de description
    if (name.startsWith("description_")) {
      const field = name.replace("description_", "");
      handleDescriptionChange(field, value);
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Empêcher la modification si le service est en attente de validation
    if (isPendingValidation && profile?.role !== 'admin') {
      toast({
        title: "Action non autorisée",
        description: "Vous ne pouvez pas modifier un service en cours de validation par l'administration.",
        variant: "destructive"
      });
      return;
    }
    
    let price: number = 0;
    let delivery_time: number = 0;
    
    try {
      // Validation des champs obligatoires
      if (!formData.title.trim()) {
        throw new Error("Le titre est obligatoire");
      }
      
      if (!formData.description.trim()) {
        throw new Error("La description est obligatoire");
      }
      
      // Vérifier uniquement la longueur de la description du service
      if (formData.description.trim().length < 300) {
        throw new Error("La description du service doit contenir au moins 300 caractères");
      }
      
      if (formData.description.trim().length > 10000) {
        throw new Error("La description du service ne doit pas dépasser 10000 caractères");
      }
      
      if (!formData.category_id) {
        throw new Error("La catégorie est obligatoire");
      }
      
      // Conversion et validation du prix
      if (!formData.price) {
        throw new Error("Le prix est obligatoire");
      }
      
      price = Number(formData.price.replace(/\s/g, "").replace(",", "."));
      
      if (isNaN(price) || price <= 0) {
        throw new Error("Le prix doit être un nombre positif");
      }
      
      // Conversion et validation du temps de livraison
      if (!formData.delivery_time) {
        throw new Error("Le temps de livraison est obligatoire");
      }
      
      delivery_time = Number(formData.delivery_time);
      
      if (isNaN(delivery_time) || delivery_time <= 0 || !Number.isInteger(delivery_time)) {
        throw new Error("Le temps de livraison doit être un nombre entier positif");
      }
      
      // Vérification des images
      if (images.length === 0) {
        throw new Error("Veuillez ajouter au moins une image pour illustrer votre service");
      }
      
      if (images.length > 3) {
        throw new Error("Vous ne pouvez pas ajouter plus de 3 images");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la validation du formulaire");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Générer un slug à partir du titre
      const slug = slugify(formData.title);
      
      // Conversion explicite du statut actif en booléen
      let activeValue: boolean;
      if (typeof formData.active === 'boolean') {
        activeValue = formData.active;
      } else {
        activeValue = formData.active === 'true';
      }
      
      const result = await updateService(serviceId, {
        title: formData.title,
        description: formData.description,
        price: price,
        delivery_time: delivery_time,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || null,
        slug,
        active: activeValue,
        images: images,
      } as any);
      
      if (!result.success) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Une erreur est survenue lors de la mise à jour du service');
      }
      
      // Notification différente selon le rôle de l'utilisateur
      if (profile?.role === 'admin') {
        toast({
          title: "Service mis à jour",
          description: "Votre service a été mis à jour avec succès",
          variant: "default"
        });
      } else {
        toast({
          title: "Service envoyé pour validation",
          description: "Votre service a été mis à jour et envoyé à l'équipe de modération",
          variant: "default"
        });
      }
      
      // Ajouter un délai court avant la redirection pour éviter les problèmes de communication asynchrone
      setTimeout(() => {
        // Rediriger vers la page de détails du service
        router.push(`/dashboard/services/${serviceId}`);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la modification du service");
      console.error("Erreur lors de la modification du service:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (categoriesLoading || serviceLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" variant="primary" showText={true} />
      </div>
    );
  }
  
  // Si le service est en attente de validation et l'utilisateur n'est pas admin, afficher un message
  if (isPendingValidation && profile?.role !== 'admin') {
    return (
      <div className="container px-4 sm:px-6 md:max-w-4xl mt-4 sm:mt-6 flex flex-col gap-4 sm:gap-6">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 w-fit mb-4"
          onClick={() => router.push('/dashboard/services')}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux services
        </Button>
        
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Service en attente de validation</AlertTitle>
          <AlertDescription>
            Ce service est actuellement en cours d'examen par notre équipe d'administration. 
            Vous ne pouvez pas le modifier tant qu'il n'a pas été validé ou rejeté.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard/services")} 
          className="mr-4 text-vynal-purple-dark hover:text-vynal-purple-dark/80 dark:text-vynal-text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-xs sm:text-sm md:text-base font-semibold text-vynal-purple-dark dark:text-vynal-text-primary">Modifier le service</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-lg mb-6 flex gap-2 items-start">
          <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] sm:text-xs text-red-900">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {profile && !profile.is_certified && profile.role === 'freelance' && (
            <div className="md:col-span-2 mb-2 p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-400 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-amber-900 dark:text-amber-400">Limitation des services actifs</p>
                <p className="text-[8px] sm:text-[10px] text-amber-800 dark:text-amber-400">Sans certification expert, vous êtes limité à 6 services actifs maximum. Pour supprimer cette limitation, obtenez une certification expert.</p>
              </div>
            </div>
          )}
          
          <Card className="md:col-span-1 border-slate-200/50 dark:border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-xs sm:text-sm md:text-base font-semibold text-vynal-purple-dark dark:text-vynal-text-primary">Informations générales</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs text-vynal-purple-dark/80 dark:text-vynal-text-secondary">Définissez les informations principales de votre service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary">Titre du service *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Je vais créer un logo professionnel pour votre entreprise"
                  maxLength={100}
                  required
                  className="text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary"
                />
                <p className="text-[8px] sm:text-[10px] text-vynal-purple-dark/80 dark:text-vynal-text-secondary">
                  {formData.title.length}/100 caractères
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary">Description *</Label>
                <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 space-y-4">
                  {/* Présentation et Expertise */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-vynal-accent-primary/10 flex items-center justify-center">
                        <span className="text-[10px] text-vynal-accent-primary">1</span>
                      </div>
                      <h4 className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">Présentation et Expertise</h4>
                    </div>
                    <div className="space-y-2 pl-6">
                      <Textarea
                        id="description_intro"
                        name="description_intro"
                        value={descriptionFields.intro}
                        onChange={handleChange}
                        placeholder="Présentez-vous et votre expertise en quelques phrases"
                        rows={2}
                        maxLength={1000}
                        className={`text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary ${
                          isSectionOverLimit('intro') ? 'border-red-300 dark:border-red-800' : ''
                        }`}
                      />
                      <p className="text-[8px] sm:text-[10px] text-vynal-purple-dark/80 dark:text-vynal-text-secondary">
                        {getSectionLength('intro')}/1000 caractères
                      </p>
                    </div>
                  </div>

                  {/* Description du Service */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-vynal-accent-primary/10 flex items-center justify-center">
                        <span className="text-[10px] text-vynal-accent-primary">2</span>
                      </div>
                      <h4 className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">📝 Description du service</h4>
                    </div>
                    <div className="space-y-2 pl-6">
                      <Textarea
                        id="description_service"
                        name="description_service"
                        value={descriptionFields.service}
                        onChange={handleChange}
                        placeholder="Détaillez précisément ce que vous proposez"
                        rows={3}
                        className={`text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary ${
                          !isServiceDescriptionValid() && descriptionFields.service.length > 0
                            ? 'border-red-300 dark:border-red-800'
                            : ''
                        }`}
                      />
                      <p className="text-[8px] sm:text-[10px] text-vynal-purple-dark/80 dark:text-vynal-text-secondary">
                        {getServiceDescriptionLength()}/10000 caractères (minimum 300 caractères requis)
                      </p>
                    </div>
                  </div>

                  {/* Livrables et Résultats */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-vynal-accent-primary/10 flex items-center justify-center">
                        <span className="text-[10px] text-vynal-accent-primary">3</span>
                      </div>
                      <h4 className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">🎯 Ce que vous obtiendrez</h4>
                    </div>
                    <div className="space-y-2 pl-6">
                      <Textarea
                        id="description_deliverables"
                        name="description_deliverables"
                        value={descriptionFields.deliverables}
                        onChange={handleChange}
                        placeholder="Liste des livrables et résultats concrets"
                        rows={3}
                        maxLength={1000}
                        className={`text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary ${
                          isSectionOverLimit('deliverables') ? 'border-red-300 dark:border-red-800' : ''
                        }`}
                      />
                      <p className="text-[8px] sm:text-[10px] text-vynal-purple-dark/80 dark:text-vynal-text-secondary">
                        {getSectionLength('deliverables')}/1000 caractères
                      </p>
                    </div>
                  </div>

                  {/* Conditions et Prérequis */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-vynal-accent-primary/10 flex items-center justify-center">
                        <span className="text-[10px] text-vynal-accent-primary">4</span>
                      </div>
                      <h4 className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">Conditions et Prérequis</h4>
                    </div>
                    <div className="space-y-3 pl-6">
                      <div className="space-y-2">
                        <h5 className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">🛠️ Ce dont j'ai besoin de vous</h5>
                        <Textarea
                          id="description_requirements"
                          name="description_requirements"
                          value={descriptionFields.requirements}
                          onChange={handleChange}
                          placeholder="Informations et documents nécessaires"
                          rows={2}
                          maxLength={1000}
                          className={`text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary ${
                            isSectionOverLimit('requirements') ? 'border-red-300 dark:border-red-800' : ''
                          }`}
                        />
                        <p className="text-[8px] sm:text-[10px] text-vynal-purple-dark/80 dark:text-vynal-text-secondary">
                          {getSectionLength('requirements')}/1000 caractères
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">⏱️ Délais et révisions</h5>
                        <Textarea
                          id="description_timing"
                          name="description_timing"
                          value={descriptionFields.timing}
                          onChange={handleChange}
                          placeholder="Temps de livraison et nombre de révisions incluses"
                          rows={2}
                          maxLength={1000}
                          className={`text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary ${
                            isSectionOverLimit('timing') ? 'border-red-300 dark:border-red-800' : ''
                          }`}
                        />
                        <p className="text-[8px] sm:text-[10px] text-vynal-purple-dark/80 dark:text-vynal-text-secondary">
                          {getSectionLength('timing')}/1000 caractères
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Limites du Service */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-vynal-accent-primary/10 flex items-center justify-center">
                        <span className="text-[10px] text-vynal-accent-primary">5</span>
                      </div>
                      <h4 className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">❌ Ce qui n'est pas inclus</h4>
                    </div>
                    <div className="space-y-2 pl-6">
                      <Textarea
                        id="description_exclusions"
                        name="description_exclusions"
                        value={descriptionFields.exclusions}
                        onChange={handleChange}
                        placeholder="Précisez les limites de votre service"
                        rows={2}
                        maxLength={1000}
                        className={`text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary ${
                          isSectionOverLimit('exclusions') ? 'border-red-300 dark:border-red-800' : ''
                        }`}
                      />
                      <p className="text-[8px] sm:text-[10px] text-vynal-purple-dark/80 dark:text-vynal-text-secondary">
                        {getSectionLength('exclusions')}/1000 caractères
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary">Prix (FCFA) *</Label>
                  <Input
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Ex: 5000"
                    required
                    className="text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary"
                  />
                  <p className="text-[8px] sm:text-[10px] text-vynal-purple-dark/80 dark:text-vynal-text-secondary">
                    Prix minimum: 1000 FCFA
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="delivery_time" className="text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary">Délai de livraison (jours) *</Label>
                  <Input
                    id="delivery_time"
                    name="delivery_time"
                    value={formData.delivery_time}
                    onChange={handleChange}
                    placeholder="Ex: 3"
                    required
                    className="text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category_id" className="text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary">Catégorie *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleSelectChange("category_id", value)}
                >
                  <SelectTrigger id="category_id" className="w-full text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {subcategoriesForSelected.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="subcategory_id" className="text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary">Sous-catégorie *</Label>
                  <Select
                    value={formData.subcategory_id}
                    onValueChange={(value) => handleSelectChange("subcategory_id", value)}
                    required
                  >
                    <SelectTrigger id="subcategory_id" className="w-full text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary">
                      <SelectValue placeholder="Sélectionnez une sous-catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategoriesForSelected.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id} className="text-[10px] sm:text-xs text-vynal-purple-dark dark:text-vynal-text-primary">
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="md:col-span-1 border-slate-200/50 dark:border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-xs sm:text-sm md:text-base font-semibold text-vynal-purple-dark dark:text-vynal-text-primary">Images</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs text-vynal-purple-dark/80 dark:text-vynal-text-secondary">Ajoutez des images représentatives de votre service (1 à 3 images)</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceImageUploader onImagesChange={setImages} />
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2 border-slate-200/50 dark:border-slate-800/50">
            <CardContent className="pt-6">
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto text-[10px] sm:text-xs text-white hover:text-white/80"
                >
                  {isSubmitting ? (
                    <>
                      <Loader size="xs" variant="white" className="mr-2" />
                      Modification du service...
                    </>
                  ) : (
                    "Modifier le service"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
} 