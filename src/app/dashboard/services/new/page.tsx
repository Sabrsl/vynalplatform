"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useServices } from "@/hooks/useServices";
import { Category, Subcategory } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ServiceDescriptionValidator from "@/components/services/ServiceDescriptionValidator";
import ServicePricingValidator from "@/components/services/ServicePricingValidator";
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
import { AlertCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import ServiceImageUploader from "@/components/services/ServiceImageUploader";
import { Separator } from "@/components/ui/separator";
import { Loader } from "@/components/ui/loader";

export default function NewServicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isFreelance } = useUser();
  const { createService } = useServices();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [activeServicesCount, setActiveServicesCount] = useState<number | null>(null);
  const [checkingServices, setCheckingServices] = useState(true);
  
  // État séparé pour la partie saisie par l'utilisateur (sans le préfixe)
  const [userTitleInput, setUserTitleInput] = useState("");
  
  const [formData, setFormData] = useState({
    title: "Je vais ",
    description: "",
    price: "",
    delivery_time: "",
    category_id: "",
    subcategory_id: "",
    active: true,
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
  
  // Vérifier le nombre de services actifs et rediriger si nécessaire
  useEffect(() => {
    if (!profile) return;

    const checkActiveServices = async () => {
      setCheckingServices(true);
      try {
        // Si pas freelance ou si admin, pas besoin de vérifier
        if (!isFreelance || profile.role === 'admin') {
          setCheckingServices(false);
          return;
        }

        // Si le freelance est certifié expert, pas besoin de limiter
        if (profile.is_certified && profile.certification_type === 'expert') {
          setCheckingServices(false);
          return;
        }

        // Compter les services actifs
        const { data, error } = await supabase
          .from('services')
          .select('id', { count: 'exact' })
          .eq('freelance_id', profile.id)
          .eq('active', true);

        if (error) {
          console.error('Erreur lors du comptage des services actifs:', error);
          setError('Erreur lors de la vérification de vos services actifs');
          setCheckingServices(false);
          return;
        }

        // Stocker le nombre de services actifs
        const count = data ? data.length : 0;
        setActiveServicesCount(count);
        
        // Rediriger si le nombre de services actifs est >= 6
        if (count >= 6) {
          router.push('/dashboard/services?error=max_services_reached');
        }
      } catch (err) {
        console.error('Erreur lors de la vérification des services actifs:', err);
      } finally {
        setCheckingServices(false);
      }
    };

    checkActiveServices();
  }, [profile, isFreelance, router]);
  
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
  
  // Rediriger si l'utilisateur n'est pas freelance
  useEffect(() => {
    if (profile && !isFreelance) {
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
  
  const handleDescriptionChange = (field: string, value: string) => {
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
  
  // Fonction pour vérifier la longueur de la description du service
  const getServiceDescriptionLength = () => {
    return descriptionFields.service.length;
  };

  // Fonction pour vérifier si la description du service est valide
  const isServiceDescriptionValid = () => {
    return getServiceDescriptionLength() >= 1000;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Cas spécial pour le champ titre
    if (name === "title") {
      setUserTitleInput(value);
      setFormData(prev => ({ ...prev, title: "Je vais " + value }));
      return;
    }
    
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
    
    // Vérifier si l'utilisateur est connecté
    if (!profile) {
      setError("Vous devez être connecté pour créer un service");
      return;
    }
    
    let price: number = 0;
    let delivery_time: number = 0;
    
    try {
      // Validation des champs obligatoires
      if (!formData.title.trim() || formData.title.trim() === "Je vais") {
        throw new Error("Le titre est obligatoire");
      }
      
      // Vérifier que le titre a du contenu après "Je vais "
      if (userTitleInput.trim().length === 0) {
        throw new Error("Veuillez compléter le titre après \"Je vais\"");
      }
      
      if (formData.title.trim().length < 10) {
        throw new Error("Le titre doit contenir au moins 10 caractères");
      }
      
      if (!formData.description.trim()) {
        throw new Error("La description est obligatoire");
      }
      
      // Vérifier uniquement la longueur de la description du service
      if (getServiceDescriptionLength() < 1000) {
        throw new Error("La description du service doit contenir au moins 1000 caractères");
      }
      
      if (getServiceDescriptionLength() > 10000) {
        throw new Error("La description du service ne doit pas dépasser 10000 caractères");
      }
      
      if (!formData.category_id) {
        throw new Error("La catégorie est obligatoire");
      }

      // Vérification de la sous-catégorie
      if (subcategoriesForSelected.length > 0 && !formData.subcategory_id) {
        throw new Error("La sous-catégorie est obligatoire");
      }
      
      // Conversion et validation du prix
      if (!formData.price) {
        throw new Error("Le prix est obligatoire");
      }
      
      price = Number(formData.price.replace(/\s/g, "").replace(",", "."));
      
      if (isNaN(price) || price <= 0) {
        throw new Error("Le prix doit être un nombre positif");
      }
      
      if (price < 1000) {
        throw new Error("Le prix minimum est de 1000 FCFA");
      }
      
      if (price > 1000000) {
        throw new Error("Le prix maximum est de 1 000 000 FCFA");
      }
      
      // Conversion et validation du temps de livraison
      if (!formData.delivery_time) {
        throw new Error("Le temps de livraison est obligatoire");
      }
      
      delivery_time = Number(formData.delivery_time);
      
      if (isNaN(delivery_time) || delivery_time <= 0 || !Number.isInteger(delivery_time)) {
        throw new Error("Le temps de livraison doit être un nombre entier positif");
      }
      
      if (delivery_time > 60) {
        throw new Error("Le temps de livraison maximum est de 60 jours");
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
      setError(null); // Réinitialiser les erreurs
      
      // Générer un slug à partir du titre
      const slug = slugify(formData.title);
      
      // Vérifier que le titre commence par "Je vais "
      const prefix = "Je vais ";
      const title = formData.title.startsWith(prefix) 
        ? formData.title 
        : prefix + formData.title.replace(prefix, "");
      
      const result = await createService({
        title: title,
        description: formData.description,
        price: price,
        delivery_time: delivery_time,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || null,
        freelance_id: profile.id,
        slug,
        active: formData.active,
        images: images, // Ajouter les images au service
      });
      
      if (!result.success) {
        throw new Error(String(result.error));
      }
      
      // Rediriger vers la liste des services du freelance
      router.push("/dashboard/services?status=created");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la création du service");
      console.error("Erreur lors de la création du service:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (categoriesLoading || checkingServices) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" variant="primary" showText={true} />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center mb-3">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard/services")} 
          className="mr-3 text-slate-700 hover:text-slate-800 dark:text-vynal-text-primary dark:hover:text-vynal-text-primary/80"
        >
          <ArrowLeft className="w-3 h-3 mr-1.5" />
          Retour
        </Button>
        <h1 className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-800 dark:text-vynal-text-primary">Créer un service</h1>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-4 rounded-lg mb-6 flex gap-2 items-start">
          <AlertCircle className="h-3 w-3 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] sm:text-xs text-red-500 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {profile && !profile.is_certified && profile.role === 'freelance' && (
            <div className="md:col-span-2 mb-2 p-2 sm:p-3 bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-3 w-3 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-amber-700 dark:text-amber-400">Limitation des services actifs</p>
                <p className="text-[8px] sm:text-[10px] text-amber-600 dark:text-amber-400">Sans certification expert, vous êtes limité à 6 services actifs maximum. Pour supprimer cette limitation, obtenez une certification expert.</p>
              </div>
            </div>
          )}
          
          <Card className="md:col-span-1 border-slate-200 dark:border-slate-700/30 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xs sm:text-sm md:text-base font-semibold text-slate-800 dark:text-vynal-text-primary">Informations générales</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs text-slate-600 dark:text-vynal-text-secondary">Définissez les informations principales de votre service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] sm:text-xs text-slate-700 dark:text-vynal-text-primary">Titre du service *</Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 bg-slate-100/30 dark:bg-slate-800/30 px-2 flex items-center rounded-l-md border-r border-slate-200 dark:border-slate-700/30 pointer-events-none">
                    <span className="text-[10px] sm:text-xs text-slate-600 dark:text-vynal-text-secondary font-medium">Je vais</span>
                  </div>
                <Input
                  id="title"
                  name="title"
                    value={userTitleInput}
                  onChange={handleChange}
                    placeholder="créer un logo professionnel pour votre entreprise"
                    maxLength={93}
                  required
                    className="text-[10px] sm:text-xs text-slate-700 dark:text-vynal-text-primary pl-20 bg-slate-100/85 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30"
                />
                </div>
                <p className="text-[8px] sm:text-[10px] text-slate-600 dark:text-vynal-text-secondary">
                  {(formData.title.length)}/100 caractères (commence toujours par "Je vais")
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] sm:text-xs text-slate-700 dark:text-vynal-text-primary">Description *</Label>
                <div className="rounded-md border border-slate-200 dark:border-slate-700/30 bg-white/25 dark:bg-slate-900/20 p-3 space-y-4">
                  {/* Présentation et Expertise */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-vynal-accent-primary/10 dark:bg-vynal-accent-primary/10 flex items-center justify-center">
                        <span className="text-[10px] text-vynal-accent-primary dark:text-vynal-accent-primary">1</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">Présentation et Expertise</span>
                    </div>
                    <div className="space-y-2 pl-6">
                      <ServiceDescriptionValidator
                        id="description_intro"
                        field="intro"
                        value={descriptionFields.intro}
                        onChange={handleDescriptionChange}
                        label="Présentation et Expertise"
                        placeholder="Présentez-vous et votre expertise en quelques phrases"
                        rows={2}
                        required={false}
                        className="bg-slate-100/85 dark:bg-slate-800/40"
                      />
                    </div>
                  </div>

                  {/* Description du Service */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-vynal-accent-primary/10 dark:bg-vynal-accent-primary/10 flex items-center justify-center">
                        <span className="text-[10px] text-vynal-accent-primary dark:text-vynal-accent-primary">2</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">📝 Description du service</span>
                    </div>
                    <div className="space-y-2 pl-6">
                      <ServiceDescriptionValidator
                        id="description_service"
                        field="service"
                        value={descriptionFields.service}
                        onChange={handleDescriptionChange}
                        label="Description détaillée"
                        placeholder="Détaillez précisément ce que vous proposez"
                        rows={3}
                        required={true}
                        className="bg-slate-100/85 dark:bg-slate-800/40"
                      />
                    </div>
                  </div>

                  {/* Livrables et Résultats */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-vynal-accent-primary/10 dark:bg-vynal-accent-primary/10 flex items-center justify-center">
                        <span className="text-[10px] text-vynal-accent-primary dark:text-vynal-accent-primary">3</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">🎯 Ce que vous obtiendrez</span>
                    </div>
                    <div className="space-y-2 pl-6">
                      <ServiceDescriptionValidator
                        id="description_deliverables"
                        field="deliverables"
                        value={descriptionFields.deliverables}
                        onChange={handleDescriptionChange}
                        label="Livrables"
                        placeholder="Liste des livrables et résultats concrets"
                        rows={3}
                        required={true}
                        className="bg-slate-100/85 dark:bg-slate-800/40"
                      />
                    </div>
                  </div>

                  {/* Conditions et Prérequis */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-vynal-accent-primary/10 dark:bg-vynal-accent-primary/10 flex items-center justify-center">
                        <span className="text-[10px] text-vynal-accent-primary dark:text-vynal-accent-primary">4</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">Conditions et Prérequis</span>
                    </div>
                    <div className="space-y-3 pl-6">
                      <div className="space-y-2">
                        <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">🛠️ Ce dont j'ai besoin de vous</span>
                        <ServiceDescriptionValidator
                          id="description_requirements"
                          field="requirements"
                          value={descriptionFields.requirements}
                          onChange={handleDescriptionChange}
                          label="Prérequis"
                          placeholder="Informations et documents nécessaires"
                          rows={2}
                          required={true}
                          className="bg-slate-100/85 dark:bg-slate-800/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">⏱️ Délais et révisions</span>
                        <ServiceDescriptionValidator
                          id="description_timing"
                          field="timing"
                          value={descriptionFields.timing}
                          onChange={handleDescriptionChange}
                          label="Délais"
                          placeholder="Temps de livraison et nombre de révisions incluses"
                          rows={2}
                          required={true}
                          className="bg-slate-100/85 dark:bg-slate-800/40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Limites du Service */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-vynal-accent-primary/10 dark:bg-vynal-accent-primary/10 flex items-center justify-center">
                        <span className="text-[10px] text-vynal-accent-primary dark:text-vynal-accent-primary">5</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-vynal-text-primary">❌ Ce qui n'est pas inclus</span>
                    </div>
                    <div className="space-y-2 pl-6">
                      <ServiceDescriptionValidator
                        id="description_exclusions"
                        field="exclusions"
                        value={descriptionFields.exclusions}
                        onChange={handleDescriptionChange}
                        label="Exclusions"
                        placeholder="Précisez les limites de votre service"
                        rows={2}
                        required={true}
                        className="bg-slate-100/85 dark:bg-slate-800/40"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-1 space-y-6">
            <Card className="border-slate-200 dark:border-slate-700/30 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xs sm:text-sm md:text-base font-semibold text-slate-800 dark:text-vynal-text-primary">Prix et délais</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs text-slate-600 dark:text-vynal-text-secondary">Définissez le prix et le délai de livraison de votre service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <ServicePricingValidator
                    id="price"
                    type="price"
                    value={formData.price}
                    onChange={(value) => handleChange({ target: { name: 'price', value } } as any)}
                    label="Prix (FCFA)"
                    placeholder="Ex: 5000"
                    required={true}
                    className="bg-slate-100/85 dark:bg-slate-800/40"
                  />
                
                  <ServicePricingValidator
                    id="delivery_time"
                    type="deliveryTime"
                    value={formData.delivery_time}
                    onChange={(value) => handleChange({ target: { name: 'delivery_time', value } } as any)}
                    label="Délai de livraison (jours)"
                    placeholder="Ex: 3"
                    required={true}
                    className="bg-slate-100/85 dark:bg-slate-800/40"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700/30 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xs sm:text-sm md:text-base font-semibold text-slate-800 dark:text-vynal-text-primary">Catégorie</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs text-slate-600 dark:text-vynal-text-secondary">Sélectionnez la catégorie et sous-catégorie de votre service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="category_id" className="text-[10px] sm:text-xs text-slate-700 dark:text-vynal-text-primary">Catégorie *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleSelectChange("category_id", value)}
                >
                    <SelectTrigger id="category_id" className="w-full text-[10px] sm:text-xs text-slate-700 dark:text-vynal-text-primary bg-slate-100/85 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="text-[10px] sm:text-xs text-slate-700 dark:text-vynal-text-primary">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {subcategoriesForSelected.length > 0 && (
                <div className="space-y-2">
                    <Label htmlFor="subcategory_id" className="text-[10px] sm:text-xs text-slate-700 dark:text-vynal-text-primary">Sous-catégorie *</Label>
                  <Select
                    value={formData.subcategory_id}
                    onValueChange={(value) => handleSelectChange("subcategory_id", value)}
                    required
                  >
                      <SelectTrigger id="subcategory_id" className="w-full text-[10px] sm:text-xs text-slate-700 dark:text-vynal-text-primary bg-slate-100/85 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30">
                      <SelectValue placeholder="Sélectionnez une sous-catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategoriesForSelected.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id} className="text-[10px] sm:text-xs text-slate-700 dark:text-vynal-text-primary">
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
          
            <Card className="border-slate-200 dark:border-slate-700/30 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xs sm:text-sm md:text-base font-semibold text-slate-800 dark:text-vynal-text-primary">Images</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs text-slate-600 dark:text-vynal-text-secondary">Ajoutez des images représentatives de votre service (1 à 3 images)</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceImageUploader onImagesChange={setImages} />
            </CardContent>
          </Card>
          
            <Card className="border-slate-200 dark:border-slate-700/30 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
              <CardContent className="pt-4">
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                    className="w-full sm:w-auto text-[10px] sm:text-xs text-white hover:text-white/80 bg-vynal-accent-primary hover:bg-vynal-accent-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader size="xs" variant="white" className="mr-2" />
                      Création du service...
                    </>
                  ) : (
                    "Créer le service"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </form>
    </div>
  );
} 