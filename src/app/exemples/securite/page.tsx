import React from 'react';
import SecurityExample from '@/components/examples/SecurityExample';

export const metadata = {
  title: 'Exemple de Sécurité - Chiffrement Côté Serveur',
  description: 'Démonstration du service de cryptographie côté serveur pour sécuriser vos données sensibles.',
};

/**
 * Page d'exemple pour démontrer les fonctionnalités de sécurité améliorées
 */
export default function SecurityExamplePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Démonstration de Sécurité</h1>
        
        <div className="prose mb-8">
          <p>
            Cette démonstration montre comment utiliser le nouveau service de cryptographie côté serveur
            pour sécuriser vos données sensibles. Toutes les opérations de chiffrement et déchiffrement
            sont effectuées exclusivement sur le serveur, ce qui renforce considérablement la sécurité.
          </p>
          
          <h2>Points clés à retenir</h2>
          <ul>
            <li>Les données sensibles ne devraient <strong>jamais</strong> être traitées côté client</li>
            <li>Le service utilise un chiffrement AES-256-CBC avec des IV uniques</li>
            <li>Utilisez les API routes pour chiffrer/déchiffrer les données plutôt que de le faire côté client</li>
            <li>Préférez un stockage sécurisé côté serveur (base de données) plutôt que le stockage local</li>
          </ul>
          
          <h2>Cas d'utilisation</h2>
          <ul>
            <li>Stockage sécurisé des informations de paiement</li>
            <li>Protection des données personnelles sensibles</li>
            <li>Sécurisation des documents et fichiers confidentiels</li>
            <li>Transmission sécurisée de données entre services</li>
          </ul>
        </div>
        
        <SecurityExample />
      </div>
    </div>
  );
} 