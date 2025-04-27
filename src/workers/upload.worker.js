/* 
 * Worker pour l'upload de fichiers
 * Ce worker gère les opérations d'upload en arrière-plan
 * Pour éviter de bloquer l'interface utilisateur
 */

// Fonction pour compresser une image
async function compressImage(file, maxWidth = 1600, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Maintenir le rapport hauteur/largeur
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en Blob
        canvas.toBlob((blob) => {
          // Créer un nouveau fichier avec le même nom mais compressé
          const newFile = new File([blob], file.name, {
            type: file.type,
            lastModified: file.lastModified
          });
          
          resolve(newFile);
        }, file.type, quality);
      };
    };
  });
}

// Fonction pour obtenir l'extension d'un fichier
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// Fonction pour générer un nom de fichier unique
function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const extension = getFileExtension(originalName);
  return `${timestamp}-${random}.${extension}`;
}

// Simuler l'upload (dans un vrai environnement, cela appellerait l'API Supabase)
function simulateFileUpload(file, storageUrl) {
  return new Promise((resolve) => {
    // Simuler le temps d'upload
    const uploadTime = Math.min(file.size / 10000, 3000);
    
    setTimeout(() => {
      // Dans un environnement réel, cela serait l'URL retournée par Supabase
      const uniqueFilename = generateUniqueFilename(file.name);
      const mockUrl = `https://storage.example.com/${storageUrl}/${uniqueFilename}`;
      
      resolve({
        url: mockUrl,
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
        type: file.type
      });
    }, uploadTime);
  });
}

// Traiter les messages reçus du thread principal
self.onmessage = async function(e) {
  const { file, storageUrl, compressImage: shouldCompress = false } = e.data;
  
  try {
    // Si c'est une image et qu'il faut la compresser
    let fileToUpload = file;
    
    if (shouldCompress && file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file);
    }
    
    // Simuler l'upload (remplacer par l'implémentation réelle)
    const result = await simulateFileUpload(fileToUpload, storageUrl);
    
    // Renvoyer le résultat au thread principal
    self.postMessage({
      success: true,
      data: result
    });
  } catch (error) {
    // En cas d'erreur
    self.postMessage({
      success: false,
      error: error.message || 'Une erreur est survenue lors de l\'upload'
    });
  }
}; 