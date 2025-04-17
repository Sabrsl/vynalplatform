import React, { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon, Loader2, Info, Scissors } from "lucide-react";

interface ServiceImageUploaderProps {
  serviceId?: string;
  initialImages?: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

const ServiceImageUploader: React.FC<ServiceImageUploaderProps> = ({
  serviceId,
  initialImages = [],
  onImagesChange,
  maxImages = 5
}) => {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageWarning, setImageWarning] = useState<string | null>(null);
  const [autoResize, setAutoResize] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dimensions recommandées
  const RECOMMENDED_WIDTH = 1200;
  const RECOMMENDED_HEIGHT = 800;
  const RECOMMENDED_RATIO = RECOMMENDED_WIDTH / RECOMMENDED_HEIGHT;
  const MIN_WIDTH = 800;
  const MAX_SIZE_MB = 5;

  // Fonction pour redimensionner une image
  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      // Créer un objet Image pour charger l'image
      const img = new Image();
      img.onload = () => {
        // Obtenir les dimensions originales
        const originalWidth = img.width;
        const originalHeight = img.height;
        
        // Déterminer les nouvelles dimensions pour maintenir le ratio 3:2
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        const originalRatio = originalWidth / originalHeight;
        
        if (originalRatio > RECOMMENDED_RATIO) {
          // Image trop large
          newWidth = originalHeight * RECOMMENDED_RATIO;
          newHeight = originalHeight;
        } else if (originalRatio < RECOMMENDED_RATIO) {
          // Image trop haute
          newWidth = originalWidth;
          newHeight = originalWidth / RECOMMENDED_RATIO;
        }
        
        // Mettre à l'échelle si nécessaire
        if (newWidth < RECOMMENDED_WIDTH) {
          const scale = RECOMMENDED_WIDTH / newWidth;
          newWidth = RECOMMENDED_WIDTH;
          newHeight = newHeight * scale;
        }
        
        // Créer un canvas pour redimensionner
        const canvas = document.createElement('canvas');
        canvas.width = RECOMMENDED_WIDTH;
        canvas.height = RECOMMENDED_HEIGHT;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }
        
        // Dessiner l'image redimensionnée et recadrée au centre
        const xOffset = (newWidth - RECOMMENDED_WIDTH) / 2;
        const yOffset = (newHeight - RECOMMENDED_HEIGHT) / 2;
        
        // Fond blanc
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dessiner l'image centrée
        ctx.drawImage(
          img,
          Math.max(0, xOffset),
          Math.max(0, yOffset),
          Math.min(originalWidth, RECOMMENDED_WIDTH),
          Math.min(originalHeight, RECOMMENDED_HEIGHT),
          0, 
          0, 
          RECOMMENDED_WIDTH, 
          RECOMMENDED_HEIGHT
        );
        
        // Convertir le canvas en Blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Échec de la conversion canvas en blob'));
            return;
          }
          
          // Créer un nouveau fichier
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          resolve(resizedFile);
        }, 'image/jpeg', 0.9); // Qualité 90%
      };
      
      img.onerror = () => {
        reject(new Error('Échec du chargement de l\'image pour redimensionnement'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Vérifier les dimensions de l'image
  const checkImageDimensions = (file: File): Promise<{ isValid: boolean; message?: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const width = img.width;
        const height = img.height;
        const ratio = width / height;
        
        // Vérifier les dimensions minimales
        if (width < MIN_WIDTH) {
          resolve({ 
            isValid: false, 
            message: `L'image est trop petite. Largeur minimale recommandée: ${MIN_WIDTH}px` 
          });
          return;
        }
        
        // Vérifier si le ratio est loin de l'idéal (tolérance de 20%)
        const ratioDeviation = Math.abs(ratio - RECOMMENDED_RATIO) / RECOMMENDED_RATIO;
        if (ratioDeviation > 0.2) {
          resolve({ 
            isValid: true, 
            message: `Pour un meilleur affichage, utilisez des images au format ${RECOMMENDED_WIDTH}x${RECOMMENDED_HEIGHT}px (ratio 3:2)`
          });
          return;
        }
        
        resolve({ isValid: true });
      };
      
      img.onerror = () => {
        resolve({ isValid: false, message: "Impossible de lire l'image" });
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Gestion de l'upload d'images
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    // Vérifier si on a déjà atteint le nombre maximal d'images
    if (images.length >= maxImages) {
      setError(`Vous ne pouvez pas uploader plus de ${maxImages} images`);
      return;
    }

    const selectedFiles = Array.from(e.target.files);
    
    // Vérifier si le nombre total d'images ne dépasse pas le maximum
    if (images.length + selectedFiles.length > maxImages) {
      setError(`Vous ne pouvez pas uploader plus de ${maxImages} images au total`);
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setImageWarning(null);
      
      const uploadedUrls: string[] = [];
      let dimensionWarning: string | null = null;
      
      for (const file of selectedFiles) {
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
          setError('Seules les images sont autorisées');
          continue;
        }
        
        // Vérifier la taille du fichier (max 5MB)
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          setError(`La taille de l'image ne doit pas dépasser ${MAX_SIZE_MB}MB`);
          continue;
        }
        
        // Si le redimensionnement automatique est activé, on redimensionne l'image
        let fileToUpload = file;
        if (autoResize) {
          try {
            fileToUpload = await resizeImage(file);
          } catch (resizeError) {
            console.error('Erreur lors du redimensionnement:', resizeError);
            // On utilise le fichier original en cas d'échec du redimensionnement
            // Mais on vérifie quand même ses dimensions
            const { isValid, message } = await checkImageDimensions(file);
            if (!isValid) {
              setError(message || "Image invalide");
              continue;
            } else if (message) {
              dimensionWarning = message;
            }
          }
        } else {
          // Vérifier les dimensions de l'image uniquement si le redimensionnement est désactivé
          const { isValid, message } = await checkImageDimensions(file);
          if (!isValid) {
            setError(message || "Image invalide");
            continue;
          } else if (message) {
            dimensionWarning = message;
          }
        }
        
        // Générer un nom de fichier unique
        const fileExt = autoResize ? 'jpg' : file.name.split('.').pop();
        const fileName = `${serviceId || 'temp'}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        // Upload l'image vers Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('services')
          .upload(filePath, fileToUpload, { upsert: true });
        
        if (uploadError) {
          console.error('Erreur lors de l\'upload:', uploadError);
          
          if (uploadError.message?.includes('row-level security')) {
            throw new Error('Problème de permission avec le bucket de stockage');
          }
          
          if (uploadError.message?.includes('not found')) {
            throw new Error('Le bucket "services" n\'existe pas. Contactez l\'administrateur.');
          }
          
          throw uploadError;
        }
        
        // Récupérer l'URL publique
        const { data } = supabase.storage.from('services').getPublicUrl(filePath);
        
        if (!data || !data.publicUrl) {
          throw new Error('Impossible d\'obtenir l\'URL publique de l\'image');
        }
        
        uploadedUrls.push(data.publicUrl);
      }
      
      // Si un avertissement sur les dimensions a été trouvé et que le redimensionnement 
      // automatique est désactivé, l'afficher
      if (dimensionWarning && !autoResize) {
        setImageWarning(dimensionWarning);
      }
      
      // Mettre à jour l'état des images
      const updatedImages = [...images, ...uploadedUrls];
      setImages(updatedImages);
      onImagesChange(updatedImages);
      
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'upload des images');
      console.error('Erreur lors de l\'upload des images:', err);
    } finally {
      setUploading(false);
    }
  };

  // Supprimer une image
  const handleRemoveImage = async (index: number) => {
    try {
      const imageToRemove = images[index];
      
      // Extraire le nom du fichier de l'URL
      const fileName = imageToRemove.split('/').pop();
      
      if (fileName) {
        // Supprimer l'image de Supabase Storage
        const { error } = await supabase.storage
          .from('services')
          .remove([fileName]);
          
        if (error) {
          console.error('Erreur lors de la suppression de l\'image:', error);
        }
      }
      
      // Mettre à jour l'état des images
      const updatedImages = [...images];
      updatedImages.splice(index, 1);
      setImages(updatedImages);
      onImagesChange(updatedImages);
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'image:', err);
      setError('Erreur lors de la suppression de l\'image');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md">
          {error}
        </div>
      )}
      
      {imageWarning && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm p-3 rounded-md flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>{imageWarning}</p>
        </div>
      )}
      
      {/* Prévisualisation des images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-video bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                <img 
                  src={image} 
                  alt={`Image ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-80 hover:opacity-100 shadow-sm"
                title="Supprimer l'image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Bouton d'upload */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id="autoResize"
            checked={autoResize}
            onChange={(e) => setAutoResize(e.target.checked)}
            className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
          <label htmlFor="autoResize" className="text-sm text-gray-700 flex items-center gap-1.5">
            <Scissors className="h-3.5 w-3.5" />
            Redimensionner automatiquement ({RECOMMENDED_WIDTH}x{RECOMMENDED_HEIGHT}px)
          </label>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? 'Upload en cours...' : 'Ajouter des images'}
        </Button>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            Formats acceptés: JPG, PNG, GIF. Taille maximale: {MAX_SIZE_MB}MB.
          </p>
          <p>
            Vous pouvez uploader jusqu'à {maxImages} images ({images.length}/{maxImages}).
          </p>
          <div className="flex items-start gap-1 mt-1">
            <Info className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
            <p>
              {autoResize 
                ? "Les images seront automatiquement redimensionnées pour un affichage optimal."
                : `Pour un affichage optimal, utilisez des images au format ${RECOMMENDED_WIDTH}x${RECOMMENDED_HEIGHT}px (ratio 3:2).
                  Largeur minimale: ${MIN_WIDTH}px.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceImageUploader; 