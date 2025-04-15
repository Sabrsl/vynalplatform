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
import { AlertCircle, ArrowLeft, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { profile, isFreelance } = useUser();
  const { getServiceById, updateService } = useServices();
  
  // Récupérer l'ID du service depuis les paramètres d'URL
  const serviceId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
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
  
  const [subcategoriesForSelected, setSubcategoriesForSelected] = useState<Subcategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  
  // Charger les détails du service à modifier
  useEffect(() => {
    async function loadServiceDetails() {
      if (!serviceId || !profile) {
        return;
      }
      
      try {
        setServiceLoading(true);
        
        // Appel direct à Supabase pour récupérer les détails du service
        const { data, error: fetchError } = await supabase
          .from('services')
          .select(`
            *,
            profiles!services_freelance_id_fkey (
              id, 
              username, 
              full_name, 
              avatar_url
            ),
            categories (id, name, slug),
            subcategories (id, name, slug)
          `)
          .eq('id', serviceId)
          .single();
        
        if (fetchError) {
          throw new Error(fetchError.message);
        }
        
        if (!data) {
          throw new Error("Service non trouvé");
        }
        
        // Vérifier que le service appartient bien au freelancer connecté
        if (data.freelance_id !== profile.id && profile.role !== 'admin') {
          throw new Error("Vous n'êtes pas autorisé à modifier ce service");
        }
        
        // Remplir le formulaire avec les données du service
        setFormData({
          title: data.title,
          description: data.description,
          price: data.price.toString(),
          delivery_time: data.delivery_time.toString(),
          category_id: data.category_id,
          subcategory_id: data.subcategory_id || "",
          active: data.active,
          slug: data.slug || ""
        });
        
      } catch (err: any) {
        console.error('Erreur lors du chargement du service:', err);
        setError(err.message || "Une erreur est survenue lors du chargement du service");
        router.push("/dashboard/services");
      } finally {
        setServiceLoading(false);
      }
    }
    
    loadServiceDetails();
  }, [serviceId, profile, router]);
  
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
  }, [formData.category_id, subcategories]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!profile) {
      setError("Vous devez être connecté pour modifier un service");
      return;
    }
    
    if (!serviceId) {
      setError("Identifiant de service invalide");
      return;
    }
    
    // Validation basique
    if (!formData.title.trim()) {
      setError("Le titre est requis");
      return;
    }
    
    if (!formData.description.trim()) {
      setError("La description est requise");
      return;
    }
    
    // Vérification de la longueur minimale de la description
    if (formData.description.trim().length < 500) {
      setError("La description doit contenir au moins 500 caractères pour bien détailler votre service");
      return;
    }
    
    if (!formData.category_id) {
      setError("Veuillez sélectionner une catégorie");
      return;
    }
    
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      setError("Le prix doit être un nombre positif");
      return;
    }
    
    // Vérification du prix minimum
    if (price < 2000) {
      setError("Le prix minimum d'un service doit être de 2000 FCFA");
      return;
    }
    
    const delivery_time = parseInt(formData.delivery_time);
    if (isNaN(delivery_time) || delivery_time <= 0) {
      setError("Le délai de livraison doit être un nombre entier positif");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Générer un slug à partir du titre
      const slug = slugify(formData.title);
      
      const result = await updateService(serviceId, {
        title: formData.title,
        description: formData.description,
        price: price,
        delivery_time: delivery_time,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || null,
        slug,
        active: formData.active,
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Rediriger vers la page de détails du service
      router.push(`/dashboard/services/${serviceId}`);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la modification du service");
      console.error("Erreur lors de la modification du service:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (categoriesLoading || serviceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard/services")} 
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Modifier le service</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md flex items-start mb-6 text-red-800">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Informations du service</CardTitle>
          <CardDescription>
            Modifiez les détails de votre service pour attirer plus de clients
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Titre du service*</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Je crée un logo professionnel pour votre entreprise"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Choisissez un titre clair et accrocheur qui décrit bien votre service
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description détaillée*</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez en détail votre service, ce qu'il inclut, votre processus de travail, etc."
                  rows={8}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 500 caractères. Soyez précis pour que les clients comprennent exactement ce que vous proposez.
                </p>
                <div className="text-xs text-right">
                  {formData.description.length} / 500 caractères minimum
                </div>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="price">Prix (FCFA)*</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Ex: 15000"
                    min="2000"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Prix minimum: 2000 FCFA
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="delivery_time">Délai de livraison (jours)*</Label>
                  <Input
                    id="delivery_time"
                    name="delivery_time"
                    type="number"
                    value={formData.delivery_time}
                    onChange={handleChange}
                    placeholder="Ex: 3"
                    min="1"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Combien de jours vous faut-il pour livrer ce service?
                  </p>
                </div>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="category">Catégorie*</Label>
                  <Select
                    name="category_id"
                    value={formData.category_id}
                    onValueChange={(value) => handleSelectChange("category_id", value)}
                    disabled={isSubmitting || categories.length === 0}
                  >
                    <SelectTrigger>
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
                
                <div className="grid gap-2">
                  <Label htmlFor="subcategory">Sous-catégorie</Label>
                  <Select
                    name="subcategory_id"
                    value={formData.subcategory_id}
                    onValueChange={(value) => handleSelectChange("subcategory_id", value)}
                    disabled={isSubmitting || subcategoriesForSelected.length === 0 || !formData.category_id}
                  >
                    <SelectTrigger>
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
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="active">Statut</Label>
                <Select
                  name="active"
                  value={formData.active ? "true" : "false"}
                  onValueChange={(value) => handleSelectChange("active", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Actif (visible par les clients)</SelectItem>
                    <SelectItem value="false">Inactif (masqué pour les clients)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Un service inactif ne sera pas visible dans la recherche ou sur votre profil
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="slug">URL personnalisée (slug)</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground text-sm">votresite.com/services/</span>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="mon-service"
                    className="flex-1"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Utilisez uniquement des lettres minuscules, chiffres et tirets
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center mt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/services/${serviceId}`)}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 