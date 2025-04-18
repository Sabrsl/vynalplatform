/**
 * Fonctions utilitaires pour le traitement d'images
 */

// Types pour les options de traitement d'image
export interface ImageProcessorOptions {
  targetWidth?: number;
  targetHeight?: number;
  enhanceQuality?: boolean;
  preserveContent?: boolean; 
  outputQuality?: number;
  outputFormat?: 'jpeg' | 'png' | 'webp';
  maxFileSize?: number; // en MB
}

// Type pour le résultat du traitement d'image
export interface ProcessedImageResult {
  file: File;
  width: number;
  height: number;
  format: string;
  sizeKB: number;
}

/**
 * Fonction de validation d'image
 */
export const validateImage = async (
  file: File, 
  options?: ImageProcessorOptions
): Promise<{ isValid: boolean; message?: string }> => {
  const opts = options || {
    targetWidth: 1200,
    targetHeight: 800,
    maxFileSize: 5
  };
  
  // Vérifier le type MIME
  if (!file.type.startsWith('image/')) {
    return { isValid: false, message: "Le fichier n'est pas une image" };
  }
  
  // Vérifier la taille du fichier
  if (opts.maxFileSize && file.size > opts.maxFileSize * 1024 * 1024) {
    return { 
      isValid: false, 
      message: `La taille de l'image ne doit pas dépasser ${opts.maxFileSize}MB` 
    };
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const width = img.width;
      const height = img.height;
      const ratio = width / height;
      const targetRatio = (opts.targetWidth || 1200) / (opts.targetHeight || 800);
      
      // Vérifier les dimensions minimales
      const minWidth = (opts.targetWidth || 1200) * 0.6;
      
      if (width < minWidth) {
        resolve({ 
          isValid: false, 
          message: `L'image est trop petite. Largeur minimale recommandée: ${minWidth}px` 
        });
        return;
      }
      
      // Vérifier si le ratio est loin de l'idéal
      const ratioDeviation = Math.abs(ratio - targetRatio) / targetRatio;
      if (ratioDeviation > 0.2) {
        resolve({ 
          isValid: true, 
          message: `Pour un meilleur affichage, utilisez des images au format 3:2` 
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

/**
 * Fonction pour récupérer les dimensions d'une image
 */
export const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({
        width: img.width,
        height: img.height
      });
    };
    
    img.onerror = () => {
      reject(new Error('Impossible de lire les dimensions de l\'image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Applique des effets d'amélioration de qualité sur une image
 */
export function enhanceImageQuality(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number
): void {
  // Récupérer les données de l'image
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // 1. Amélioration du contraste par étirement d'histogramme
  const histogram = Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const brightness = Math.round((data[i] + data[i+1] + data[i+2]) / 3);
    histogram[brightness]++;
  }
  
  // Trouver les limites pour l'étirement d'histogramme
  let min = 0;
  let max = 255;
  let pixelCount = width * height;
  let threshold = pixelCount * 0.01; // ignorer 1% des pixels les plus sombres/clairs
  
  // Trouver le minimum
  let count = 0;
  for (let i = 0; i < 256; i++) {
    count += histogram[i];
    if (count > threshold) {
      min = i;
      break;
    }
  }
  
  // Trouver le maximum
  count = 0;
  for (let i = 255; i >= 0; i--) {
    count += histogram[i];
    if (count > threshold) {
      max = i;
      break;
    }
  }
  
  // Appliquer l'amélioration du contraste
  const range = max - min;
  if (range > 0) {
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const value = data[i + c];
        data[i + c] = Math.max(0, Math.min(255, 
          Math.round(((value - min) / range) * 255)
        ));
      }
    }
  }
  
  // 2. Légère augmentation de la saturation
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convertir RGB en HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      // Augmenter légèrement la saturation
      const newS = Math.min(1, s * 1.1);
      
      if (newS !== s) {
        // Appliquer la nouvelle saturation
        const q = l < 0.5 ? l * (1 + newS) : l + newS - l * newS;
        const p = 2 * l - q;
        
        // Fonction pour convertir hue en RGB
        const hueToRgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        
        // Calculer la teinte
        let h;
        if (max === r) {
          h = (g - b) / d + (g < b ? 6 : 0);
        } else if (max === g) {
          h = (b - r) / d + 2;
        } else {
          h = (r - g) / d + 4;
        }
        h /= 6;
        
        // Convertir HSL en RGB
        data[i] = Math.round(hueToRgb(p, q, h + 1/3) * 255);
        data[i + 1] = Math.round(hueToRgb(p, q, h) * 255);
        data[i + 2] = Math.round(hueToRgb(p, q, h - 1/3) * 255);
      }
    }
  }
  
  // Appliquer les améliorations
  ctx.putImageData(imageData, 0, 0);
  
  // 3. Amélioration de netteté par masque flou
  const canvas = ctx.canvas;
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = width;
  blurCanvas.height = height;
  const blurCtx = blurCanvas.getContext('2d')!;
  
  blurCtx.drawImage(canvas, 0, 0);
  blurCtx.filter = 'blur(2px)';
  blurCtx.drawImage(canvas, 0, 0);
  
  ctx.globalCompositeOperation = 'difference';
  ctx.drawImage(blurCanvas, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * Fonction principale de traitement d'image
 */
export const processImage = async (
  file: File, 
  options?: ImageProcessorOptions
): Promise<ProcessedImageResult> => {
  const opts = {
    targetWidth: 1200,
    targetHeight: 800,
    enhanceQuality: false,
    preserveContent: true,
    outputQuality: 0.92,
    outputFormat: 'jpeg' as const,
    ...options
  };
  
  // Toujours désactiver l'amélioration automatique quelle que soit la valeur passée
  opts.enhanceQuality = false;
  
  return new Promise((resolve, reject) => {
    // Ajout d'un timeout pour éviter le traitement infini
    const timeoutId = setTimeout(() => {
      reject(new Error("Le traitement a pris trop de temps et a été interrompu"));
    }, 15000); // 15 secondes max
    
    const img = new Image();
    img.onload = () => {
      try {
        // Obtenir les dimensions originales
        const originalWidth = img.width;
        const originalHeight = img.height;
        const originalRatio = originalWidth / originalHeight;
        
        // Déterminer les nouvelles dimensions avec préservation intelligente du contenu
        let targetWidth = opts.targetWidth;
        let targetHeight = opts.targetHeight;
        
        // Calculer les dimensions en préservant le ratio d'aspect
        if (opts.preserveContent) {
          const targetRatio = targetWidth / targetHeight;
          
          if (Math.abs(originalRatio - targetRatio) > 0.01) {
            if (originalRatio > targetRatio) {
              // Image plus large, adapter la hauteur
              targetHeight = Math.round(targetWidth / originalRatio);
            } else {
              // Image plus haute, adapter la largeur
              targetWidth = Math.round(targetHeight * originalRatio);
            }
          }
        }
        
        // Créer un canvas pour le traitement
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { alpha: false });
        
        if (!ctx) {
          clearTimeout(timeoutId);
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }
        
        // Fond blanc pour assurer que la transparence est gérée correctement
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        
        // Utiliser une méthode de redimensionnement de haute qualité
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Dessiner l'image avec la meilleure qualité
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        // Amélioration de la qualité simplifiée pour éviter les problèmes
        if (opts.enhanceQuality) {
          try {
            // Léger ajustement du contraste uniquement
            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const data = imageData.data;
            
            // Ajustement de contraste simplifié
            for (let i = 0; i < data.length; i += 4) {
              // Éviter de toucher au canal alpha
              for (let j = 0; j < 3; j++) {
                // Légère amélioration du contraste (formule douce)
                const val = data[i + j];
                data[i + j] = Math.max(0, Math.min(255, val * 1.05 - 10));
              }
            }
            
            ctx.putImageData(imageData, 0, 0);
          } catch (enhanceError) {
            console.warn('Échec de l\'amélioration:', enhanceError);
            // Continuer sans amélioration en cas d'erreur
          }
        }
        
        // Récupérer le format de sortie et la qualité
        const outputFormat = opts.outputFormat;
        const mimeType = outputFormat === 'webp' 
          ? 'image/webp' 
          : outputFormat === 'png' 
            ? 'image/png' 
            : 'image/jpeg';
        
        // Qualité optimisée selon le format
        const quality = outputFormat === 'webp' ? 0.85 : 0.9;
        
        // Convertir le canvas en Blob avec la qualité améliorée
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeoutId);
            
            if (!blob) {
              reject(new Error('Échec de la conversion canvas en blob'));
              return;
            }
            
            // Créer un nouveau fichier
            const extension = outputFormat === 'webp' ? 'webp' : outputFormat === 'png' ? 'png' : 'jpg';
            const newFileName = file.name.split('.').slice(0, -1).join('.') + '.' + extension;
            
            const processedFile = new File([blob], newFileName, {
              type: mimeType,
              lastModified: Date.now()
            });
            
            // Si le fichier traité est plus grand, utiliser l'original
            if (blob.size > file.size * 1.1) {
              console.info('Image traitée plus grande que l\'originale, conservation de l\'original');
              
              resolve({
                file: file,
                width: originalWidth,
                height: originalHeight,
                format: file.type.split('/')[1],
                sizeKB: Math.round(file.size / 1024)
              });
              return;
            }
            
            // Résultat avec métadonnées
            resolve({
              file: processedFile,
              width: targetWidth,
              height: targetHeight,
              format: outputFormat,
              sizeKB: Math.round(blob.size / 1024)
            });
          }, 
          mimeType, 
          quality
        );
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Échec du chargement de l\'image pour traitement'));
    };
    
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    // S'assurer que l'URL est libérée si l'image n'est pas chargée
    img.onload = img.onload.bind(img);
    img.onerror = function() {
      URL.revokeObjectURL(objectUrl);
      clearTimeout(timeoutId);
      reject(new Error('Impossible de charger l\'image'));
    };
  });
};

// Export par défaut pour la compatibilité avec les imports existants
const ImageProcessor = {
  validateImage,
  processImage,
  getImageDimensions,
  enhanceImageQuality
};

export default ImageProcessor;