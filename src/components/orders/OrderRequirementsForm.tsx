"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, FileUp, AlertCircle, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

interface OrderRequirementsFormProps {
  service: any;
  requirements: string;
  setRequirements: (value: string) => void;
  deliveryDate: string;
  setDeliveryDate: (value: string) => void;
  files: FileList | null;
  setFiles: (files: FileList | null) => void;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
}

export function OrderRequirementsForm({
  service,
  requirements,
  setRequirements,
  deliveryDate,
  setDeliveryDate,
  files,
  setFiles,
  error,
  onBack,
  onNext
}: OrderRequirementsFormProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Calcul de la date de livraison estimée
  const getEstimatedDeliveryDate = () => {
    const today = new Date();
    const deliveryDays = service?.delivery_time || 3;
    const deliveryDate = new Date(today);
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    
    return deliveryDate.toLocaleDateString('fr-FR', {
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Gestion du téléchargement de fichiers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    setFileError(null);
    
    if (selectedFiles && selectedFiles.length > 5) {
      setFileError("Vous ne pouvez pas télécharger plus de 5 fichiers.");
      return;
    }
    
    if (selectedFiles) {
      // Vérification de la taille des fichiers (max 10MB chacun)
      for (let i = 0; i < selectedFiles.length; i++) {
        if (selectedFiles[i].size > 10 * 1024 * 1024) {
          setFileError("Chaque fichier doit être inférieur à 10MB.");
          return;
        }
      }
      
      setFiles(selectedFiles);
    }
  };
  
  // Liste des fichiers sélectionnés
  const renderFileList = () => {
    if (!files || files.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-1">
        {Array.from(files).map((file, index) => (
          <div key={index} className="flex items-center text-xs text-gray-700 bg-gray-50 p-1.5 rounded-md">
            <FileUp className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
            <div className="flex-1 truncate">{file.name}</div>
            <div className="text-gray-500">
              {(file.size / 1024).toFixed(0)} KB
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Instructions pour le vendeur</DialogTitle>
        <DialogDescription>
          Décrivez précisément ce dont vous avez besoin pour ce service
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        {/* Résumé du service commandé */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="relative h-14 w-14 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
              {service?.images && service.images.length > 0 ? (
                <Image 
                  src={service.images[0]} 
                  alt={service.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <FileUp className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium line-clamp-1">{service?.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700">
                  <Clock className="h-3 w-3 mr-1" />
                  {service?.delivery_time} jours
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatPrice(service?.price || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Affichage des erreurs */}
        {(error || fileError) && (
          <div className="bg-red-50 p-2 rounded-md flex items-start gap-2 text-red-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error || fileError}</p>
          </div>
        )}
        
        {/* Formulaire d'instructions */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requirements" className="text-sm font-medium">
              Instructions détaillées
              <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Textarea
              id="requirements"
              placeholder="Expliquez en détail ce que vous attendez du vendeur..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="min-h-[150px] resize-y"
              required
            />
            <p className="text-xs text-gray-500">
              {requirements.length} caractères - min. 30 caractères recommandés
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deliveryDate" className="text-sm font-medium">
              Date de livraison souhaitée
            </Label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input
                type="date"
                id="deliveryDate"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <p className="text-xs text-gray-500">
              Date de livraison estimée: {getEstimatedDeliveryDate()}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="files" className="text-sm font-medium">
              Télécharger des fichiers (optionnel)
            </Label>
            <div className="border-dashed border-2 border-gray-200 rounded-md p-4 text-center hover:bg-gray-50 transition-colors">
              <Input
                id="files"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Label htmlFor="files" className="cursor-pointer flex flex-col items-center">
                <FileUp className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Sélectionnez des fichiers</span>
                <span className="text-xs text-gray-500 mt-1">
                  5 fichiers maximum (10MB par fichier)
                </span>
              </Label>
            </div>
            {renderFileList()}
          </div>
        </div>
      </div>
      
      <DialogFooter className="flex justify-between sm:justify-between">
        <Button
          onClick={onBack}
          variant="ghost"
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        <Button 
          onClick={onNext}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
          disabled={requirements.length < 10}
        >
          Continuer au paiement
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </DialogFooter>
    </>
  );
} 