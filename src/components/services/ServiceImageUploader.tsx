import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Info, AlertCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { validateImage, processImage } from "@/lib/image-processor";

interface ServiceImageUploaderProps {
  serviceId?: string;
  initialImages?: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  isRequired?: boolean;
}

interface PreviewImage {
  file: File;
  isProcessing?: boolean;
  error?: string;
}

const ServiceImageUploader: React.FC<ServiceImageUploaderProps> = ({
  serviceId,
  initialImages = [],
  onImagesChange,
  maxImages = 3, // Limite à 3 images maximum par défaut
  isRequired = true // Une image est requise par défaut
}) => {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<PreviewImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [optimizationStats, setOptimizationStats] = useState<{[key: string]: {
    originalSize: number,
    optimizedSize: number,
    reduction: number,
    adapted: boolean
  }}>({});

  // Dimensions recommandées
  const RECOMMENDED_WIDTH = 1200;
  const RECOMMENDED_HEIGHT = 800;
  const MAX_SIZE_MB = 5;

  // Options fixes de traitement d'image
  const enhanceQuality = false;
  const preserveContent = true;
  const outputFormat = 'webp' as const;

  // Initialiser les images au démarrage
  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      setImages(initialImages);
    }
  }, [initialImages]);

  // Vérification si le service a au moins une image
  useEffect(() => {
    if (isRequired && images.length === 0) {
      setWarning("Un service doit avoir au moins une image");
    } else {
      setWarning(null);
    }
  }, [images, isRequired]);

  // Gestion de la sélection d'images
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    // Vérifier si on a déjà atteint le nombre maximal d'images
    if (images.length >= maxImages) {
      setError(`Vous ne pouvez pas uploader plus de ${maxImages} images`);
      return;
    }

    // Vérifier si le nombre total d'images ne dépasse pas le maximum
    const files = Array.from(e.target.files);
    if (images.length + files.length > maxImages) {
      setError(`Vous ne pouvez pas uploader plus de ${maxImages} images au total`);
      return;
    }
    
    setError(null);
    setUploading(true);
    
    try {
      // Traiter et uploader chaque image directement
      const newImageUrls: string[] = [];
      
      for (const file of files) {
        try {
          // Valider l'image
          const validation = await validateImage(file, {
            targetWidth: RECOMMENDED_WIDTH,
            targetHeight: RECOMMENDED_HEIGHT,
            maxFileSize: MAX_SIZE_MB
          });
          
          if (!validation.isValid) {
            setError(validation.message || "Une image n'est pas valide");
            continue;
          }
          
          // Traiter l'image
          const result = await processImage(file, {
            targetWidth: RECOMMENDED_WIDTH,
            targetHeight: RECOMMENDED_HEIGHT,
            enhanceQuality,
            preserveContent,
            outputFormat
          });
          
          // Calculer les statistiques d'optimisation
          const originalSizeKB = Math.round(file.size / 1024);
          const optimizedSizeKB = result.sizeKB;
          const reductionPercent = Math.round(((originalSizeKB - optimizedSizeKB) / originalSizeKB) * 100);
          
          // Pour obtenir originalWidth et originalHeight
          let originalWidth = 0;
          let originalHeight = 0;

          // Obtenir les dimensions originales avant le traitement
          try {
            // Créer un objet Image pour obtenir les dimensions
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            
            // Attendre que l'image soit chargée pour obtenir les dimensions
            await new Promise<void>((resolve) => {
              img.onload = () => {
                originalWidth = img.width;
                originalHeight = img.height;
                URL.revokeObjectURL(img.src); // Libérer l'URL
                resolve();
              };
              img.onerror = () => {
                URL.revokeObjectURL(img.src);
                resolve(); // Continuer même en cas d'erreur
              };
            });
          } catch (err) {
            console.warn('Impossible de déterminer les dimensions originales:', err);
            // En cas d'erreur, considérer que les dimensions sont inchangées
            originalWidth = result.width;
            originalHeight = result.height;
          }
          
          const isAdapted = result.width !== originalWidth && result.height !== originalHeight;
          
          // Générer un nom de fichier unique pour éviter les doublons
          // Utiliser UUID v4 pour une probabilité négligeable de collision
          const uniqueId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          const safeServiceId = serviceId || 'temp';
          const fileExt = outputFormat === 'webp' ? 'webp' : 'jpg';
          const fileName = `${safeServiceId}_${uniqueId}.${fileExt}`;
          
          console.log('Uploading image with filename:', fileName);
          
          // Upload vers Supabase Storage avec retry
          let uploadAttempt = 0;
          let uploadSuccess = false;
          let uploadData;
          let uploadError;
          
          while (uploadAttempt < 3 && !uploadSuccess) {
            try {
              const response = await supabase.storage
                .from('services')
                .upload(fileName, result.file, { 
                  upsert: true,
                  contentType: `image/${fileExt}`
                });
              
              uploadData = response.data;
              uploadError = response.error;
              
              if (!uploadError) {
                uploadSuccess = true;
              } else {
                console.warn(`Tentative d'upload ${uploadAttempt + 1} échouée:`, uploadError);
                uploadAttempt++;
                // Attendre un peu avant de réessayer
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (err) {
              console.error('Erreur lors de la tentative d\'upload:', err);
              uploadAttempt++;
              // Attendre un peu avant de réessayer
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          if (!uploadSuccess) {
            throw new Error('Échec de l\'upload de l\'image après plusieurs tentatives');
          }
          
          // Récupérer l'URL publique avec CDN cachable
          const { data } = supabase.storage.from('services').getPublicUrl(fileName);
          
          if (!data || !data.publicUrl) {
            throw new Error('Impossible d\'obtenir l\'URL publique de l\'image');
          }
          
          // Ajouter les statistiques d'optimisation
          setOptimizationStats(prev => ({
            ...prev,
            [data.publicUrl]: {
              originalSize: originalSizeKB,
              optimizedSize: optimizedSizeKB,
              reduction: reductionPercent,
              adapted: isAdapted
            }
          }));
          
          // Ajouter l'URL à la liste
          newImageUrls.push(data.publicUrl);
          
        } catch (err) {
          console.error('Erreur lors du traitement/upload d\'une image:', err);
          // Continuer avec les autres images
        }
      }
      
      // Mettre à jour les images
      if (newImageUrls.length > 0) {
        const updatedImages = [...images, ...newImageUrls];
        setImages(updatedImages);
        onImagesChange(updatedImages);
      }
      
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'upload des images');
      console.error('Erreur globale:', err);
    } finally {
      setUploading(false);
      
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Supprimer une image uploadée
  const handleRemoveImage = async (index: number) => {
    try {
      // Ne pas permettre de supprimer si c'est la dernière image et qu'une image est requise
      if (isRequired && images.length === 1) {
        setWarning("Un service doit avoir au moins une image");
        return;
      }
      
      const imageToRemove = images[index];
      
      // Extraire le nom du fichier de l'URL
      const fileName = imageToRemove.split('/').pop();
      
      if (fileName) {
        try {
          // Supprimer l'image de Supabase Storage
          const { error } = await supabase.storage
            .from('services')
            .remove([fileName]);
            
          if (error) {
            console.error('Erreur lors de la suppression de l\'image:', error);
            // Continuer malgré l'erreur pour permettre la suppression de l'UI
          }
        } catch (err) {
          console.error('Exception lors de la suppression de l\'image du storage:', err);
          // Continuer malgré l'erreur pour permettre la suppression de l'UI
        }
      }
      
      // Mettre à jour l'état des images (toujours, même si la suppression du storage échoue)
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
      
      {warning && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm p-3 rounded-md flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>{warning}</p>
        </div>
      )}
      
      {/* Images uploadées */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Images téléchargées ({images.length}/{maxImages})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                  disabled={isRequired && images.length === 1}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {images.length > 0 && Object.keys(optimizationStats).length > 0 && (
        <div className="mt-4 bg-blue-50 rounded-md border border-blue-100 p-3">
          <h4 className="text-sm font-semibold text-blue-700 mb-2">Informations sur les optimisations appliquées</h4>
          <ul className="text-xs space-y-1 text-blue-700">
            {images.map((image, index) => optimizationStats[image] && (
              <li key={index} className="flex flex-col">
                <span className="font-medium mb-1">Image {index + 1}:</span>
                <div className="pl-2 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Format optimisé: <span className="font-medium">WebP</span> (meilleure compression)</span>
                  </div>
                  
                  {optimizationStats[image].adapted && (
                    <div className="flex items-center gap-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Dimensions adaptées: <span className="font-medium">{RECOMMENDED_WIDTH}x{RECOMMENDED_HEIGHT}</span> (proportions préservées)</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Qualité d'image optimisée pour le web</span>
                  </div>
                  
                  {optimizationStats[image].reduction > 30 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Optimisation substantielle appliquée</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-blue-600 italic">Ces optimisations améliorent la vitesse de chargement et l'expérience utilisateur</p>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple={images.length < maxImages - 1}
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
          <div className="flex items-center space-x-1 text-xs font-medium">
            <Loader size="xs" variant="primary" />
            <span>Téléchargement en cours...</span>
          </div>
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploading ? 'Téléchargement en cours...' : 'Sélectionner des images'}
      </Button>
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>
          Formats acceptés: JPG, PNG, GIF. Taille maximale: {MAX_SIZE_MB}MB.
        </p>
        <p>
          Vous pouvez uploader jusqu'à {maxImages} images ({images.length}/{maxImages}).
          {isRequired && ' Au moins une image est requise.'}
        </p>
        <div className="flex items-start gap-1 mt-1">
          <Info className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
          <p>
            Les images seront automatiquement optimisées avec les améliorations suivantes:
          </p>
        </div>
        <div className="pl-4 space-y-0.5">
          <p>• Conversion en format WebP pour une meilleure performance</p>
          <p>• Adaptation intelligente aux dimensions recommandées ({RECOMMENDED_WIDTH}x{RECOMMENDED_HEIGHT}px)</p>
          <p>• Préservation des proportions originales (pas de déformation)</p>
          <p>• Optimisation de qualité pour le web</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceImageUploader;