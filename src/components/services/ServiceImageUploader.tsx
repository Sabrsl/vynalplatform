import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { X, Upload, AlertCircle } from "lucide-react";

// Types pour le composant
interface ServiceImageUploaderProps {
  serviceId?: string;
  initialImages?: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  isRequired?: boolean;
  className?: string;
}

const ServiceImageUploader: React.FC<ServiceImageUploaderProps> = ({
  serviceId,
  initialImages = [],
  onImagesChange,
  maxImages = 3,
  isRequired = true,
  className
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>(initialImages);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser les images au démarrage
  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      setImages(initialImages);
    }
  }, [initialImages]);

  // Gestionnaire de fichiers sélectionnés
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Vérifier si on a atteint le nombre maximum d'images
    if (images.length >= maxImages) {
      setError(`Vous ne pouvez pas uploader plus de ${maxImages} images`);
      return;
    }
    
    const files = Array.from(e.target.files);
    const newFiles = files.slice(0, maxImages - images.length);
    
    try {
      setError(null);
      
      // Tableau pour stocker les URL définitives
      const uploadedUrls: string[] = [];
      
      // Pour chaque fichier, télécharger vers le bucket "services"
      for (const file of newFiles) {
        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `temp_${crypto.randomUUID()}.${fileExt}`;
        
        // Télécharger le fichier vers Supabase
        const { data, error } = await supabase.storage
          .from('services')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) {
          throw new Error(`Erreur lors du téléchargement de l'image: ${error.message}`);
        }
        
        // Obtenir l'URL publique du fichier
        const { data: urlData } = supabase.storage
          .from('services')
          .getPublicUrl(fileName);
        
        // Ajouter l'URL au tableau
        uploadedUrls.push(urlData.publicUrl);
      }
      
      // Mise à jour de l'état avec les nouvelles URL
      const updatedImages = [...images, ...uploadedUrls];
      setImages(updatedImages);
      onImagesChange(updatedImages);
      
      // Afficher une notification de succès
      toast({
        title: "Images téléchargées",
        description: `${uploadedUrls.length} image(s) téléchargée(s) avec succès`
      });
    } catch (err: any) {
      console.error("Erreur lors du téléchargement des images:", err);
      setError(err.message || "Une erreur est survenue lors du téléchargement des images");
    } finally {
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [images, maxImages, onImagesChange, toast]);

  // Supprimer une image
  const handleRemoveImage = useCallback(async (index: number) => {
    // Ne pas permettre de supprimer si c'est la dernière image et qu'une image est requise
    if (isRequired && images.length === 1) {
      setError("Un service doit avoir au moins une image");
      return;
    }
    
    try {
      const imageUrl = images[index];
      
      // Si l'image est stockée dans le bucket "services", essayer de la supprimer
      if (imageUrl && imageUrl.includes('/services/')) {
        // Extraire le nom du fichier de l'URL
        const fileName = imageUrl.split('/').pop();
        
        if (fileName) {
          // Supprimer le fichier du bucket
          const { error } = await supabase.storage
            .from('services')
            .remove([fileName]);
          
          if (error) {
            console.warn("Erreur lors de la suppression de l'image du stockage:", error);
            // On continue malgré l'erreur pour que l'utilisateur puisse quand même supprimer l'image de l'interface
          }
        }
      }
      
      // Mettre à jour la liste des images
      const updatedImages = [...images];
      updatedImages.splice(index, 1);
      setImages(updatedImages);
      onImagesChange(updatedImages);
      
      toast({
        title: "Image supprimée",
        description: "L'image a été supprimée avec succès"
      });
    } catch (err) {
      console.error("Erreur lors de la suppression de l'image:", err);
      setError("Une erreur est survenue lors de la suppression de l'image");
    }
  }, [images, isRequired, onImagesChange, toast]);

  return (
    <div className="space-y-4">
      {/* Message d'erreur */}
      {error && (
        <div className="p-3 rounded-md flex items-start gap-2 text-sm bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {/* Images uploadées */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Images téléchargées ({images.length}/{maxImages})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-video bg-gray-100 rounded-md overflow-hidden border border-gray-200 relative">
                  <Image 
                    src={image} 
                    alt={`Image ${index + 1}`} 
                    className="object-cover" 
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    priority={index === 0 || image.includes('/services/temp_')}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className={cn(
                    "absolute top-2 right-2 p-1 rounded-full shadow-sm",
                    "opacity-80 hover:opacity-100 transition-opacity",
                    isRequired && images.length === 1 
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-red-500 text-white hover:bg-red-600"
                  )}
                  disabled={isRequired && images.length === 1}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Zone d'upload */}
      {images.length < maxImages && (
        <div 
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center transition-all",
            isDragging ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-indigo-300",
            className
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            // Dans une implémentation complète, on traiterait les fichiers déposés ici
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            multiple={maxImages - images.length > 1}
            className="hidden"
          />
          
          <div className="py-4">
            <div className="mb-2">
              <div className="mx-auto h-12 w-12 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600">
                <Upload className="h-6 w-6" />
              </div>
            </div>
            
            <p className="text-sm font-medium mb-1 text-gray-700">
              {isDragging 
                ? "Déposez vos images ici"
                : "Glissez-déposez vos images ou cliquez pour parcourir"
              }
            </p>
            
            <p className="text-xs text-gray-500">
              {maxImages - images.length > 1 
                ? `Vous pouvez ajouter jusqu'à ${maxImages - images.length} images supplémentaires`
                : "Vous pouvez ajouter 1 image supplémentaire"
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceImageUploader;