"use client";

import React, { useState } from 'react';
import { Alert } from './api';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AlertDetailModalProps {
  alert: Alert | null;
  onClose: () => void;
  onMarkAsResolved: (id: string) => void;
  onMarkAsInvestigating: (id: string) => void;
  isOpen: boolean;
}

// Fonction pour formater la date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Fonction pour obtenir la couleur du badge selon le statut
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active': 
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">Actif</Badge>;
    case 'investigating': 
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">En cours d'investigation</Badge>;
    case 'resolved': 
      return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Résolu</Badge>;
    default: 
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AlertDetailModal({ 
  alert, 
  onClose, 
  onMarkAsResolved, 
  onMarkAsInvestigating,
  isOpen 
}: AlertDetailModalProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(false);

  if (!isOpen || !alert) return null;
  
  const handleResolve = async () => {
    try {
      setIsResolving(true);
      await onMarkAsResolved(alert.id);
    } finally {
      setIsResolving(false);
    }
  };

  const handleInvestigate = async () => {
    try {
      setIsInvestigating(true);
      await onMarkAsInvestigating(alert.id);
    } finally {
      setIsInvestigating(false);
    }
  };

  // Prévenir la propagation des clics sur le fond
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto p-6 relative" onClick={handleContainerClick}>
        {/* Bouton de fermeture */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Fermer</span>
        </button>
        
        {/* Entête */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {alert.type === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : alert.type === 'warning' ? (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              ) : (
                <Info className="h-5 w-5 text-blue-500" />
              )}
              <h2 className="text-base font-semibold">{alert.title}</h2>
            </div>
            <Badge 
              variant="outline" 
              className={`${
                alert.priority === 'high' 
                  ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20' 
                  : alert.priority === 'medium'
                  ? 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20'
              }`}
            >
              Priorité {alert.priority === 'high' ? 'Haute' : alert.priority === 'medium' ? 'Moyenne' : 'Basse'}
            </Badge>
          </div>
          <div className="text-xs flex items-center justify-between text-gray-500">
            <span>
              ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{alert.id}</code>
            </span>
            <span>
              Créée le {formatDate(alert.created_at)}
            </span>
          </div>
        </div>
        
        {/* Contenu */}
        <div className="space-y-6">
          {/* Statut actuel et contrôles d'action */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">Statut:</h3>
                {getStatusBadge(alert.status)}
              </div>
              <div className="flex gap-2">
                {alert.status === 'active' && (
                  <Button 
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    size="sm"
                    onClick={handleInvestigate}
                    disabled={isInvestigating}
                  >
                    {isInvestigating ? (
                      <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Traitement...</>
                    ) : (
                      <><Clock className="h-3 w-3 mr-1" /> Démarrer l'investigation</>
                    )}
                  </Button>
                )}
                {alert.status !== 'resolved' && (
                  <Button 
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                    size="sm"
                    onClick={handleResolve}
                    disabled={isResolving}
                  >
                    {isResolving ? (
                      <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Traitement...</>
                    ) : (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Résoudre l'alerte</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Informations détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold">Description</h3>
                <p className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-md whitespace-pre-wrap border border-gray-200 dark:border-gray-700">
                  {alert.description}
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs font-semibold">Métadonnées</h3>
                {alert.metadata ? (
                  <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-md overflow-auto max-h-48 border border-gray-200 dark:border-gray-700">
                    {JSON.stringify(alert.metadata, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500">
                    Aucune métadonnée disponible
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold">Informations générales</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-500">Source:</span>
                    <p className="capitalize mt-1">{alert.source}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-500">Type:</span>
                    <p className="capitalize mt-1 flex items-center gap-1">
                      {alert.type === 'error' ? (
                        <><AlertCircle className="h-3 w-3 text-red-500" /> Erreur</>
                      ) : alert.type === 'warning' ? (
                        <><AlertTriangle className="h-3 w-3 text-amber-500" /> Avertissement</>
                      ) : (
                        <><Info className="h-3 w-3 text-blue-500" /> Information</>
                      )}
                    </p>
                  </div>
                  {alert.related_entity_id && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-500">Entité liée:</span>
                      <p className="mt-1">{alert.related_entity_type || 'Non spécifié'}</p>
                    </div>
                  )}
                  {alert.related_entity_id && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-500">ID de l'entité:</span>
                      <p className="mt-1 font-mono overflow-hidden overflow-ellipsis">{alert.related_entity_id}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs font-semibold">Historique des actions</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 space-y-2 max-h-48 overflow-y-auto">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <p className="text-xs text-muted-foreground">
                      Alerte créée le {formatDate(alert.created_at)}
                    </p>
                  </div>
                  {alert.updated_at !== alert.created_at && (
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <RefreshCw className="h-3 w-3 text-gray-500" />
                      <p className="text-xs text-muted-foreground">
                        Mise à jour le {formatDate(alert.updated_at)}
                      </p>
                    </div>
                  )}
                  {alert.status === 'investigating' && (
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <AlertCircle className="h-3 w-3 text-blue-500" />
                      <p className="text-xs text-muted-foreground">
                        Investigation démarrée
                      </p>
                    </div>
                  )}
                  {alert.status === 'resolved' && (
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <p className="text-xs text-muted-foreground">
                        Alerte résolue
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pied de page */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            size="sm"
            className="text-xs"
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
} 