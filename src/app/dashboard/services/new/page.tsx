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
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    delivery_time: "",
    category_id: "",
    subcategory_id: "",
    active: true,
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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
      if (!formData.title.trim()) {
        throw new Error("Le titre est obligatoire");
      }
      
      if (formData.title.trim().length < 10) {
        throw new Error("Le titre doit contenir au moins 10 caractères");
      }
      
      if (!formData.description.trim()) {
        throw new Error("La description est obligatoire");
      }
      
      if (formData.description.trim().length < 3000) {
        throw new Error("La description doit contenir au moins 3000 caractères pour bien décrire votre service");
      }
      
      if (formData.description.trim().length > 10000) {
        throw new Error("La description ne doit pas dépasser 10000 caractères");
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
      
      const result = await createService({
        title: formData.title,
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard/services")} 
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Créer un service</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 flex gap-2 items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {profile && !profile.is_certified && profile.role === 'freelance' && (
            <div className="md:col-span-2 mb-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Limitation des services actifs</p>
                <p className="text-xs">Sans certification expert, vous êtes limité à 6 services actifs maximum. Pour supprimer cette limitation, obtenez une certification expert.</p>
              </div>
            </div>
          )}
          
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Définissez les informations principales de votre service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du service *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Je vais créer un logo professionnel pour votre entreprise"
                  maxLength={100}
                  required
                />
                <p className="text-xs text-gray-500">
                  {formData.title.length}/100 caractères
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez en détail ce que vous proposez, vos compétences, le process, etc."
                  rows={8}
                  maxLength={10000}
                  required
                />
                <p className="text-xs text-gray-500">
                  {formData.description.length}/10000 caractères (minimum 3000 caractères requis)
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix (FCFA) *</Label>
                  <Input
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Ex: 5000"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Prix minimum: 1000 FCFA
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="delivery_time">Délai de livraison (jours) *</Label>
                  <Input
                    id="delivery_time"
                    name="delivery_time"
                    value={formData.delivery_time}
                    onChange={handleChange}
                    placeholder="Ex: 3"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category_id">Catégorie *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleSelectChange("category_id", value)}
                >
                  <SelectTrigger id="category_id" className="w-full">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {subcategoriesForSelected.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="subcategory_id">Sous-catégorie</Label>
                  <Select
                    value={formData.subcategory_id}
                    onValueChange={(value) => handleSelectChange("subcategory_id", value)}
                  >
                    <SelectTrigger id="subcategory_id" className="w-full">
                      <SelectValue placeholder="Sélectionnez une sous-catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategoriesForSelected.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="active">Statut</Label>
                <Select
                  value={formData.active ? "true" : "false"}
                  onValueChange={(value) => handleSelectChange("active", value === "true")}
                >
                  <SelectTrigger id="active" className="w-full">
                    <SelectValue placeholder="Statut du service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Actif</SelectItem>
                    <SelectItem value="false">Inactif</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Un service inactif ne sera pas visible par les clients
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>Ajoutez des images représentatives de votre service (1 à 3 images)</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceImageUploader onImagesChange={setImages} />
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
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
      </form>
    </div>
  );
} 