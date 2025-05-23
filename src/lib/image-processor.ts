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
 * Fonction pour valider qu'une URL est sécurisée
 * Vérifie qu'il s'agit bien d'une URL blob: valide
 */
function isSecureBlobUrl(url: string): boolean {
  return (
    typeof url === 'string' && 
    url.startsWith('blob:') && 
    /^blob:https?:\/\//.test(url)
  );
}

/**
 * Fonction sécurisée pour attribuer une source à une image
 * Protection contre les attaques XSS
 */
function setImageSrcSafely(image: HTMLImageElement, url: string): void {
  if (!url) return;
  
  // Vérifier que l'URL est un blob URL sécurisé
  if (isSecureBlobUrl(url)) {
    // Utiliser setAttribute qui est plus sûr que la propriété directe
    image.setAttribute('src', url);
  } else {
    // Si l'URL n'est pas sécurisée, révoquer et lever une erreur
    URL.revokeObjectURL(url);
    throw new Error("URL d'image non sécurisée");
  }
}

/**
 * Fonction pour créer une URL d'objet de manière sécurisée
 */
export const validateImage = async (
  file: File, 
  options?: ImageProcessorOptions
): Promise<{ isValid: boolean; message?: string }> => {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ isValid: false, message: "Aucun fichier fourni" });
      return;
    }
    
    // Vérifier le type MIME
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      resolve({ isValid: false, message: "Format d'image non supporté" });
      return;
    }
    
    // Vérifier la taille maximale d'upload (2 MB)
    const maxUploadSize = 2; // 2 MB
    if (file.size > maxUploadSize * 1024 * 1024) {
      resolve({ 
        isValid: false, 
        message: `L'image est trop volumineuse (maximum ${maxUploadSize}MB)` 
      });
      return;
    }
    
    // Vérifier les dimensions
    const img = new Image();
    
    img.onload = () => {
      // Nettoyer l'URL
      if (img.src && isSecureBlobUrl(img.src)) {
        URL.revokeObjectURL(img.src);
      }
      
      // Vérifier les dimensions minimales et maximales si spécifiées
      const minWidth = options?.targetWidth ? options.targetWidth / 2 : 100;
      const minHeight = options?.targetHeight ? options.targetHeight / 2 : 100;
      
      if (img.width < minWidth || img.height < minHeight) {
        resolve({ 
          isValid: false, 
          message: `L'image est trop petite (minimum ${minWidth}x${minHeight}px)` 
        });
        return;
      }
      
      resolve({ isValid: true });
    };
    
    img.onerror = () => {
      // Nettoyer l'URL en cas d'erreur
      if (img.src && isSecureBlobUrl(img.src)) {
        URL.revokeObjectURL(img.src);
      }
      resolve({ isValid: false, message: "Impossible de charger l'image" });
    };
    
    try {
      // Créer une URL sécurisée pour l'image
      const objectUrl = URL.createObjectURL(file);
      if (isSecureBlobUrl(objectUrl)) {
        setImageSrcSafely(img, objectUrl);
      } else {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        resolve({ isValid: false, message: "Format d'image non valide" });
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'URL de l'image:", error);
      resolve({ isValid: false, message: "Erreur lors du traitement de l'image" });
    }
  });
};

/**
 * Fonction pour récupérer les dimensions d'une image de manière sécurisée
 */
export const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Nettoyer l'URL
      if (img.src && isSecureBlobUrl(img.src)) {
        URL.revokeObjectURL(img.src);
      }
      resolve({
        width: img.width,
        height: img.height
      });
    };
    
    img.onerror = () => {
      // Nettoyer l'URL en cas d'erreur
      if (img.src && isSecureBlobUrl(img.src)) {
        URL.revokeObjectURL(img.src);
      }
      reject(new Error('Impossible de lire les dimensions de l\'image'));
    };
    
    // Créer une URL sécurisée pour l'image
    try {
      const objectUrl = URL.createObjectURL(file);
      if (isSecureBlobUrl(objectUrl)) {
        setImageSrcSafely(img, objectUrl);
      } else {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(new Error("Format d'image non valide"));
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'URL de l'image:", error);
      reject(new Error("Erreur lors du traitement de l'image"));
    }
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

// Fonction sécurisée pour créer une URL d'objet
const createSecureObjectURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const objectUrl = URL.createObjectURL(file);
      if (isSecureBlobUrl(objectUrl)) {
        resolve(objectUrl);
      } else {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(new Error("Format d'image non valide"));
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'URL de l'image:", error);
      reject(new Error("Erreur lors du traitement de l'image"));
    }
  });
};

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
    outputQuality: 0.8,
    outputFormat: 'webp' as const,
    maxFileSize: 15, // 15ko maximum
    ...options
  };

  // Forcer le format WebP
  opts.outputFormat = 'webp';
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Le traitement a pris trop de temps et a été interrompu"));
    }, 30000);
    
    const img = new Image();
    img.onload = async () => {
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
              targetHeight = Math.round(targetWidth / originalRatio);
            } else {
              targetWidth = Math.round(targetHeight * originalRatio);
            }
          }
        }

        // Réduction préalable pour les grandes images
        const maxDimension = 1200; // Dimension maximale réduite
        if (originalWidth > maxDimension || originalHeight > maxDimension) {
          const scale = Math.min(maxDimension / originalWidth, maxDimension / originalHeight);
          targetWidth = Math.round(originalWidth * scale);
          targetHeight = Math.round(originalHeight * scale);
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
        
        // Fonction pour compresser l'image avec une qualité donnée
        const compressImage = (quality: number): Promise<Blob> => {
          return new Promise((resolve, reject) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Échec de la conversion canvas en blob'));
                  return;
                }
                resolve(blob);
              },
              'image/webp',
              quality
            );
          });
        };

        // Compression progressive simple
        let quality = 0.8;
        let blob = await compressImage(quality);
        let attempts = 0;
        const maxAttempts = 10;

        // Si la première tentative est trop grande, réduire la taille
        if (blob.size > opts.maxFileSize * 1024) {
          const scale = Math.sqrt(opts.maxFileSize * 1024 / blob.size);
          targetWidth = Math.round(targetWidth * scale);
          targetHeight = Math.round(targetHeight * scale);
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          blob = await compressImage(quality);
        }

        // Compression simple et progressive
        while (blob.size > opts.maxFileSize * 1024 && attempts < maxAttempts) {
          quality -= 0.1;
          if (quality < 0.6) quality = 0.6;
          blob = await compressImage(quality);
          attempts++;
        }

        if (blob.size > opts.maxFileSize * 1024) {
          clearTimeout(timeoutId);
          reject(new Error(`L'image est trop volumineuse. Veuillez choisir une image plus légère.`));
          return;
        }

        // Créer un nouveau fichier
        const newFileName = file.name.split('.').slice(0, -1).join('.') + '.webp';
        
        const processedFile = new File([blob], newFileName, {
          type: 'image/webp',
          lastModified: Date.now()
        });
        
        // Résultat avec métadonnées
        resolve({
          file: processedFile,
          width: targetWidth,
          height: targetHeight,
          format: 'webp',
          sizeKB: Math.round(blob.size / 1024)
        });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Échec du chargement de l\'image pour traitement'));
    };
    
    // Créer une URL sécurisée pour l'image
    try {
      const objectUrl = URL.createObjectURL(file);
      if (isSecureBlobUrl(objectUrl)) {
        setImageSrcSafely(img, objectUrl);
      } else {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        clearTimeout(timeoutId);
        reject(new Error("Format d'image non valide"));
      }
    } catch (error) {
      clearTimeout(timeoutId);
      reject(new Error("Erreur lors du traitement de l'image"));
    }
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