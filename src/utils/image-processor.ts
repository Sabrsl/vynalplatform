export type ImageOutputFormat = 'jpeg' | 'png' | 'webp';

// Interface pour la compatibilité avec la function processImage dans lib/image-processor.ts
interface LibProcessedImageResult {
  file: File;
  width: number;
  height: number;
  format: string;
  sizeKB: number;
}

export interface ProcessedImageResult {
  file: File;
  dimensions: {
    width: number;
    height: number;
  };
  originalDimensions: {
    width: number;
    height: number;
  };
  sizeReduction: {
    original: number;
    processed: number;
    percentage: number;
  };
}

/**
 * Validates that a file is a supported image type
 */
export const validateImage = (file: File): { valid: boolean; message?: string } => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return { 
      valid: false, 
      message: `Unsupported file type: ${file.type}. Please use JPEG, PNG, WebP, or GIF.` 
    };
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return { 
      valid: false, 
      message: `File size exceeds maximum allowed (10MB). Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB.` 
    };
  }
  
  return { valid: true };
};

/**
 * Returns the MIME type for the specified output format
 */
export const getMimeType = (outputFormat: ImageOutputFormat): string => {
  switch (outputFormat) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
};

const getOutputFilename = (originalFilename: string, outputFormat: ImageOutputFormat): string => {
  // Récupérer le nom de base sans extension
  const baseName = originalFilename.replace(/\.[^/.]+$/, '');
  // Ajouter la nouvelle extension
  return `${baseName}.${outputFormat}`;
};

/**
 * Adapte l'interface entre les deux implémentations de traitement d'image
 * Afin de pouvoir utiliser les nouvelles fonctionnalités avec le code existant
 */
export const processImage = async (
  file: File,
  options: {
    targetWidth?: number;
    targetHeight?: number;
    preserveContent?: boolean;
    enhanceQuality?: boolean;
    outputFormat?: ImageOutputFormat;
  } = {}
): Promise<ProcessedImageResult> => {
  // Set default options
  const { 
    targetWidth = 0,
    targetHeight = 0,
    preserveContent = true, 
    enhanceQuality = true, 
    outputFormat = 'webp' 
  } = options;
  
  return new Promise((resolve, reject) => {
    // Add timeout to prevent infinite processing
    const timeoutId = setTimeout(() => {
      reject(new Error('Image processing timed out after 30 seconds'));
    }, 30000); // 30 seconds timeout
    
    // Créer un URL pour charger l'image
    const objectUrl = URL.createObjectURL(file);
    
    const img = new Image();
    img.onload = () => {
      // Clear the timeout when image loads successfully
      clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // Determine target dimensions
      let finalWidth = targetWidth || originalWidth;
      let finalHeight = targetHeight || originalHeight;
      
      // If preserveContent is true, maintain aspect ratio
      if (preserveContent && (targetWidth || targetHeight)) {
        const originalRatio = originalWidth / originalHeight;
        
        if (targetWidth && !targetHeight) {
          // Si seule la largeur est spécifiée, calculer la hauteur
          finalHeight = Math.round(finalWidth / originalRatio);
        } else if (targetHeight && !targetWidth) {
          // Si seule la hauteur est spécifiée, calculer la largeur
          finalWidth = Math.round(finalHeight * originalRatio);
        } else if (targetWidth && targetHeight) {
          // Si les deux dimensions sont spécifiées, ajuster pour maintenir le ratio
          const targetRatio = targetWidth / targetHeight;
          
          if (Math.abs(originalRatio - targetRatio) > 0.1) {
            // Les ratios sont trop différents, adapter l'image
            if (originalRatio > targetRatio) {
              // Image plus large que cible, ajuster la hauteur
              finalHeight = Math.round(finalWidth / originalRatio);
            } else {
              // Image plus haute que cible, ajuster la largeur
              finalWidth = Math.round(finalHeight * originalRatio);
            }
          }
        }
      }
      
      // Assurer des dimensions minimales raisonnables
      finalWidth = Math.max(finalWidth, 100);
      finalHeight = Math.max(finalHeight, 100);
      
      // Create a canvas to resize and process the image
      const canvas = document.createElement('canvas');
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      
      if (!ctx) {
        clearTimeout(timeoutId);
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Fill with white background to avoid transparency issues
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
      
      // Utiliser une méthode de redimensionnement de haute qualité
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw the image on the canvas with proper sizing
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
      
      // Apply quality enhancements if specified
      if (enhanceQuality) {
        try {
          // Appliquer des filtres basiques pour améliorer la netteté et le contraste
          ctx.filter = 'contrast(105%) brightness(102%) saturate(105%)';
          ctx.drawImage(canvas, 0, 0);
          ctx.filter = 'none';
        } catch (error) {
          console.warn('Amélioration de qualité non supportée par le navigateur, ignorée.');
        }
      }
      
      // Convert canvas to Blob
      const mimeType = getMimeType(outputFormat);
      // Ajuster la qualité selon le format - WebP peut avoir une meilleure compression sans perte visible
      const quality = outputFormat === 'webp' ? 0.90 : outputFormat === 'jpeg' ? 0.92 : 0.95;
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            clearTimeout(timeoutId);
            reject(new Error('Failed to convert canvas to blob'));
            return;
          }
          
          const processedFile = new File(
            [blob], 
            getOutputFilename(file.name, outputFormat),
            { type: mimeType }
          );
          
          // Si le fichier traité est plus grand que l'original, utiliser l'original
          if (blob.size > file.size * 1.1 && file.type.includes(outputFormat)) {
            console.info('Le fichier traité est plus grand que l\'original, conservant l\'original');
            
            const result: LibProcessedImageResult = {
              file: file,
              width: originalWidth,
              height: originalHeight,
              format: outputFormat,
              sizeKB: Math.round(file.size / 1024)
            };
            
            clearTimeout(timeoutId);
            resolve(result as any);
            return;
          }
          
          const result: LibProcessedImageResult = {
            file: processedFile,
            width: finalWidth,
            height: finalHeight,
            format: outputFormat,
            sizeKB: Math.round(blob.size / 1024)
          };
          
          clearTimeout(timeoutId);
          resolve(result as any);
        },
        mimeType,
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      clearTimeout(timeoutId);
      reject(new Error('Failed to load image'));
    };
    
    // Set source to file
    img.src = objectUrl;
  });
}; 