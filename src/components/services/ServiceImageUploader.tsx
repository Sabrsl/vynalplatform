import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { X, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    // Dans une implémentation complète, on traiterait les fichiers déposés ici
  };

  return (
    <div className="space-y-4">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-2 sm:p-4
          ${isDragging ? 'border-vynal-accent-primary bg-vynal-accent-primary/5' : 'border-slate-200 dark:border-slate-700'}
          ${error ? 'border-red-500 dark:border-red-500' : ''}
          transition-colors duration-200
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center p-2 sm:p-4">
          <div className="mb-2 sm:mb-3">
            <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-1 sm:mb-2">
            Glissez-déposez vos images ou cliquez pour parcourir
          </p>
          <p className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-500">
            Vous pouvez ajouter jusqu'à 3 images supplémentaires
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 sm:mt-3 text-[10px] sm:text-xs h-6 sm:h-8 px-2 sm:px-3"
          >
            Sélectionner des images
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-1.5">
          <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-[8px] sm:text-[10px] text-red-500">{error}</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative group aspect-[3/2]">
              <Image
                src={image}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceImageUploader;