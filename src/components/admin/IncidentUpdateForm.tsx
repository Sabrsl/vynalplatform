"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { 
  SystemIncident, 
  IncidentStatus,
  SystemFeature,
  FeatureStatus,
  IncidentSeverity
} from '@/types/system-status';
import { Separator } from "@/components/ui/separator";

// Props pour le composant
interface IncidentUpdateFormProps {
  incident: SystemIncident | null;
  feature: SystemFeature | null; 
  isOpen: boolean;
  onClose: () => void;
  onIncidentUpdated: () => void;
}

// Composant pour gérer à la fois les mises à jour d'incidents et de statuts
export const IncidentUpdateForm: React.FC<IncidentUpdateFormProps> = ({
  incident,
  feature,
  isOpen,
  onClose,
  onIncidentUpdated
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // État pour le formulaire de mise à jour d'incident
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateStatus, setUpdateStatus] = useState<IncidentStatus>("investigating");
  const [resolveIncident, setResolveIncident] = useState(false);
  
  // État pour le formulaire de mise à jour de statut
  const [selectedStatus, setSelectedStatus] = useState<FeatureStatus | "">("");
  
  // État pour le formulaire de déclaration d'incident
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentMessage, setIncidentMessage] = useState("");
  const [incidentSeverity, setIncidentSeverity] = useState<IncidentSeverity | "">("");
  const [incidentStatus, setIncidentStatus] = useState<IncidentStatus>("investigating");
  
  // Réinitialiser les formulaires quand on change d'incident ou de fonctionnalité
  useEffect(() => {
    if (incident) {
      setUpdateStatus(incident.status);
      setUpdateMessage("");
      setResolveIncident(false);
    }
    
    if (feature) {
      setSelectedStatus(feature.status);
      
      // Suggérer un message d'incident si le statut change de fonctionnel à dégradé ou en panne
      if (feature.status === 'functional') {
        setIncidentMessage(`Nous enquêtons sur un problème affectant le système de ${feature.name.toLowerCase()}.`);
      }
    } else {
      setSelectedStatus("");
    }
    
    setIncidentTitle("");
    setIncidentDescription("");
    setIncidentSeverity("");
  }, [incident, feature]);
  
  // Gérer le changement de statut d'incident
  const handleIncidentStatusChange = (value: string) => {
    setUpdateStatus(value as IncidentStatus);
    
    // Suggestion de message en fonction du statut
    if (value === "identified") {
      setUpdateMessage("Nous avons identifié la cause du problème et travaillons sur une solution.");
    } else if (value === "monitoring") {
      setUpdateMessage("Nous avons mis en place une solution et surveillons la situation.");
    } else if (value === "resolved") {
      setUpdateMessage("Le problème a été résolu. Toutes les fonctionnalités sont à nouveau opérationnelles.");
      setResolveIncident(true);
    }
  };
  
  // Mettre à jour uniquement le statut de la fonctionnalité
  const handleStatusUpdate = async () => {
    if (!feature || !selectedStatus || selectedStatus === feature.status) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/status/features/${feature.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      toast({
        title: "Statut mis à jour",
        description: `Le statut de la fonctionnalité "${feature.name}" a été mis à jour avec succès.`,
        variant: "default",
      });
      
      onIncidentUpdated();
      onClose(); // Fermer le formulaire après la mise à jour
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Mettre à jour l'incident existant
  const handleUpdateIncident = async () => {
    if (!incident || !updateMessage) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez saisir un message de mise à jour.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/status/incidents/${incident.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: updateMessage,
          status: updateStatus,
          resolve: resolveIncident
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      toast({
        title: "Incident mis à jour",
        description: `L'incident "${incident.title}" a été mis à jour avec succès.`,
        variant: "default",
      });
      
      onIncidentUpdated();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'incident:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'incident.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Déclarer un nouvel incident
  const handleCreateIncident = async () => {
    if (!feature || !incidentTitle || !incidentDescription || !incidentMessage || !incidentSeverity) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/status/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_id: feature.id,
          title: incidentTitle,
          description: incidentDescription,
          severity: incidentSeverity,
          status: incidentStatus,
          message: incidentMessage
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      toast({
        title: "Incident créé",
        description: `Un nouvel incident a été créé pour la fonctionnalité "${feature.name}".`,
        variant: "default",
      });
      
      onIncidentUpdated();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la création de l'incident:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'incident.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!feature) return null;
  
  // Vérifier si un incident est déjà sélectionné et s'il est résolu
  const isIncidentSelected = !!incident;
  const isIncidentResolved = isIncidentSelected && incident.status === "resolved";
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isIncidentSelected 
              ? `Détails de l'incident : ${incident.title}` 
              : `Mise à jour de : ${feature.name}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-3 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Formulaire de mise à jour de statut */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Statut actuel: {getStatusLabel(feature.status)}</div>
            
            <div className="flex flex-col gap-2">
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as FeatureStatus)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sélectionner un nouveau statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="functional" className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    <span>Fonctionnelle</span>
                  </SelectItem>
                  <SelectItem value="degraded" className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                    <span>Dégradée</span>
                  </SelectItem>
                  <SelectItem value="down" className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                    <span>En panne</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={handleStatusUpdate}
                disabled={loading || !selectedStatus || selectedStatus === feature.status}
                className="text-sm"
              >
                Mettre à jour le statut
              </Button>
            </div>
          </div>
          
          <div className="my-4">
            <Separator />
          </div>
          
          {/* Formulaire pour incident existant */}
          {isIncidentSelected && !isIncidentResolved && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Ajouter une mise à jour à l'incident</div>
              
              <div className="space-y-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="update-status" className="text-sm">Statut de l'incident</Label>
                  <Select
                    value={updateStatus}
                    onValueChange={handleIncidentStatusChange}
                    disabled={loading}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investigating" className="text-sm">En cours d'investigation</SelectItem>
                      <SelectItem value="identified" className="text-sm">Problème identifié</SelectItem>
                      <SelectItem value="monitoring" className="text-sm">Surveillance en cours</SelectItem>
                      <SelectItem value="resolved" className="text-sm">Résolu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-1.5">
                  <Label htmlFor="update-message" className="text-sm">Message</Label>
                  <Textarea
                    id="update-message"
                    placeholder="Décrivez la mise à jour de l'incident"
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    className="min-h-[80px] text-sm"
                    disabled={loading}
                  />
                </div>
                
                {updateStatus !== "resolved" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="resolve-incident"
                      checked={resolveIncident}
                      onCheckedChange={(checked) => setResolveIncident(checked as boolean)}
                      disabled={loading}
                    />
                    <Label
                      htmlFor="resolve-incident"
                      className="text-xs font-normal cursor-pointer"
                    >
                      Marquer l'incident comme résolu
                    </Label>
                  </div>
                )}
                
                <Button 
                  onClick={handleUpdateIncident}
                  disabled={loading || !updateMessage}
                  className="w-full text-sm"
                >
                  {loading ? "Mise à jour en cours..." : "Ajouter la mise à jour"}
                </Button>
              </div>
            </div>
          )}
          
          {/* Formulaire de déclaration d'incident */}
          {!isIncidentSelected && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Déclarer un nouvel incident</div>
              
              <div className="space-y-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="incident-title" className="text-sm">Titre de l'incident</Label>
                  <Input
                    id="incident-title"
                    placeholder="Titre court et descriptif"
                    value={incidentTitle}
                    onChange={(e) => setIncidentTitle(e.target.value)}
                    disabled={loading}
                    className="text-sm"
                  />
                </div>
                
                <div className="grid gap-1.5">
                  <Label htmlFor="incident-description" className="text-sm">Description</Label>
                  <Textarea
                    id="incident-description"
                    placeholder="Description détaillée du problème"
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    className="min-h-[60px] text-sm"
                    disabled={loading}
                  />
                </div>
                
                <div className="grid gap-1.5">
                  <Label htmlFor="incident-severity" className="text-sm">Sévérité</Label>
                  <Select
                    value={incidentSeverity}
                    onValueChange={(value) => setIncidentSeverity(value as IncidentSeverity)}
                    disabled={loading}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="text-sm">Faible</SelectItem>
                      <SelectItem value="medium" className="text-sm">Moyenne</SelectItem>
                      <SelectItem value="high" className="text-sm">Élevée</SelectItem>
                      <SelectItem value="critical" className="text-sm">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-1.5">
                  <Label htmlFor="incident-status" className="text-sm">Statut initial</Label>
                  <Select
                    value={incidentStatus}
                    onValueChange={(value) => setIncidentStatus(value as IncidentStatus)}
                    disabled={loading}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investigating" className="text-sm">En cours d'investigation</SelectItem>
                      <SelectItem value="identified" className="text-sm">Problème identifié</SelectItem>
                      <SelectItem value="monitoring" className="text-sm">Surveillance en cours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-1.5">
                  <Label htmlFor="incident-message" className="text-sm">Premier message d'information</Label>
                  <Textarea
                    id="incident-message"
                    placeholder="Informations sur l'incident à partager avec les utilisateurs"
                    value={incidentMessage}
                    onChange={(e) => setIncidentMessage(e.target.value)}
                    className="min-h-[80px] text-sm"
                    disabled={loading}
                  />
                </div>
                
                <Button 
                  onClick={handleCreateIncident}
                  disabled={loading || !incidentTitle || !incidentDescription || !incidentMessage || !incidentSeverity}
                  className="w-full text-sm"
                >
                  {loading ? "Création en cours..." : "Créer l'incident"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Fonction utilitaire pour obtenir le libellé du statut
function getStatusLabel(status: FeatureStatus): string {
  switch (status) {
    case 'functional': return 'Fonctionnelle';
    case 'degraded': return 'Dégradée';
    case 'down': return 'En panne';
    default: return 'Inconnu';
  }
}

export default IncidentUpdateForm;