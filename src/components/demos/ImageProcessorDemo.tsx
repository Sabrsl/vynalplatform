"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';
import { validateImage, processImage, getImageDimensions } from '@/lib/image-processor';

interface ProcessedImage {
  original: {
    url: string;
    width: number;
    height: number;
    size: number;
  };
  processed: {
    url: string;
    width: number;
    height: number;
    size: number;
    format: string;
  };
}

const ImageProcessorDemo: React.FC = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Options de traitement
  const [enhanceQuality, setEnhanceQuality] = useState(true);
  const [preserveContent, setPreserveContent] = useState(true);
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'webp' | 'png'>('webp');
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setProcessing(true);
    setError(null);
    
    const files = Array.from(e.target.files);
    const newProcessedImages: ProcessedImage[] = [];
    
    try {
      for (const file of files) {
        // Valider l'image
        const validation = await validateImage(file, {
          targetWidth: width,
          targetHeight: height
        });
        
        if (!validation.isValid) {
          setError(validation.message || 'Image invalide');
          continue;
        }
        
        // Obtenir les dimensions originales
        const originalDimensions = await getImageDimensions(file);
        
        // Créer une URL pour l'image originale
        const originalUrl = URL.createObjectURL(file);
        
        // Traiter l'image
        const result = await processImage(file, {
          targetWidth: width,
          targetHeight: height,
          enhanceQuality,
          preserveContent,
          outputFormat
        });
        
        // Créer une URL pour l'image traitée
        const processedUrl = URL.createObjectURL(result.file);
        
        // Ajouter les résultats
        newProcessedImages.push({
          original: {
            url: originalUrl,
            width: originalDimensions.width,
            height: originalDimensions.height,
            size: Math.round(file.size / 1024) // taille en KB
          },
          processed: {
            url: processedUrl,
            width: result.width,
            height: result.height,
            size: result.sizeKB,
            format: result.format
          }
        });
      }
      
      // Mettre à jour l'état
      setProcessedImages([...newProcessedImages, ...processedImages]);
      
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(`Erreur lors du traitement: ${(err as Error).message}`);
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Démonstration du traitement d'images</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">Options de base</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
                    Largeur (px)
                  </label>
                  <input
                    type="number"
                    id="width"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    min="200"
                    max="2000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                    Hauteur (px)
                  </label>
                  <input
                    type="number"
                    id="height"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    min="200"
                    max="2000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format de sortie
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="format"
                      value="jpeg"
                      checked={outputFormat === 'jpeg'}
                      onChange={() => setOutputFormat('jpeg')}
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="text-sm">JPEG</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="format"
                      value="webp"
                      checked={outputFormat === 'webp'}
                      onChange={() => setOutputFormat('webp')}
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="text-sm">WebP</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="format"
                      value="png"
                      checked={outputFormat === 'png'}
                      onChange={() => setOutputFormat('png')}
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="text-sm">PNG</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">Options avancées</h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enhanceQuality"
                    checked={enhanceQuality}
                    onChange={(e) => setEnhanceQuality(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="enhanceQuality" className="text-sm text-gray-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Améliorer la qualité (contraste, netteté, saturation)
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="preserveContent"
                    checked={preserveContent}
                    onChange={(e) => setPreserveContent(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="preserveContent" className="text-sm text-gray-700 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Préserver le contenu (éviter l'étirement)
                  </label>
                </div>
              </div>
              
              <div className="pt-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="default"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {processing ? 'Traitement en cours...' : 'Sélectionner des images'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Résultats */}
      {processedImages.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Résultats ({processedImages.length} images)</h2>
          
          <div className="grid grid-cols-1 gap-8">
            {processedImages.map((item, index) => (
              <div key={index} className="border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-700">Image originale</h3>
                    <div className="aspect-video bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                      <img
                        src={item.original.url}
                        alt="Image originale"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Dimensions: {item.original.width} × {item.original.height}px</p>
                      <p>Taille: {item.original.size} KB</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-700">Image traitée</h3>
                    <div className="aspect-video bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                      <img
                        src={item.processed.url}
                        alt="Image traitée"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Dimensions: {item.processed.width} × {item.processed.height}px</p>
                      <p>Format: {item.processed.format.toUpperCase()}</p>
                      <p>Taille: {item.processed.size} KB ({Math.round((item.processed.size / item.original.size) * 100)}% de l'original)</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Réduction de taille:</span>
                    <span className="text-sm text-gray-700">
                      {Math.round((1 - item.processed.size / item.original.size) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{ width: `${Math.round((1 - item.processed.size / item.original.size) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageProcessorDemo; 