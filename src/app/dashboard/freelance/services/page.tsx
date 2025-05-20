"use client";

import { useState, useEffect, useCallback } from 'react';
import { addRefreshListener } from '@/lib/services/servicesRefreshService';

export default function FreelanceServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fonction pour charger les services
  const fetchServices = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Appel API pour récupérer les services du freelance
      const response = await fetch('/api/freelance/services', {
        method: 'GET',
        headers: {
          'Cache-Control': forceRefresh ? 'no-cache' : 'default',
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des services');
      }
      
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Charger les services au démarrage
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  
  // Ajouter l'écouteur de rafraîchissement
  useEffect(() => {
    // Ajouter un écouteur de rafraîchissement pour cette page
    const removeListener = addRefreshListener(() => {
      console.log('Freelance Services: Rafraîchissement demandé');
      
      // Force le rafraîchissement des données
      fetchServices(true);
    });
    
    // Écouter également l'événement spécifique aux services freelance
    const handleFreelanceServicesUpdated = () => {
      console.log('Événement freelance-services-updated reçu');
      fetchServices(true);
    };
    
    window.addEventListener('vynal:freelance-services-updated', handleFreelanceServicesUpdated);
    
    // Nettoyer les écouteurs lors du démontage du composant
    return () => {
      removeListener();
      window.removeEventListener('vynal:freelance-services-updated', handleFreelanceServicesUpdated);
    };
  }, [fetchServices]);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Services Freelance</h1>
      
      <button 
        onClick={() => fetchServices(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-4 flex items-center"
      >
        <span className={`mr-2 ${loading ? 'animate-spin' : ''}`}>↻</span>
        Rafraîchir
      </button>
      
      {loading ? (
        <div>Chargement des services...</div>
      ) : services.length === 0 ? (
        <div>Aucun service trouvé</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service: any) => (
            <div key={service.id} className="border p-4 rounded shadow">
              <h2 className="font-bold">{service.title}</h2>
              <p className="text-sm">{service.description}</p>
              <p className="mt-2 font-semibold">{service.price} FCFA</p>
              <p className="text-xs mt-2">Statut: {service.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 