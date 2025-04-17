import React from 'react';
import ImageProcessorDemo from '@/components/demos/ImageProcessorDemo';

export const metadata = {
  title: 'Outil de traitement d\'images - Vynal Platform',
  description: 'Démonstration de l\'outil de traitement d\'images avancé pour optimiser les images uploadées.',
};

export default function ImageProcessorPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Outil de traitement d'images</h1>
          <p className="text-gray-600">
            Optimisez et adaptez automatiquement vos images pour un affichage parfait sur la plateforme.
          </p>
        </header>
        
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
          <h2 className="text-lg font-medium mb-2">À propos de cet outil</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Redimensionne automatiquement les images aux dimensions optimales</li>
            <li>Préserve le contenu principal pour éviter les déformations</li>
            <li>Améliore la qualité avec optimisation du contraste et de la netteté</li>
            <li>Supporte les formats WebP, JPEG et PNG</li>
            <li>Réduit la taille des fichiers tout en préservant la qualité visuelle</li>
          </ul>
        </div>
        
        <ImageProcessorDemo />
      </div>
    </div>
  );
} 