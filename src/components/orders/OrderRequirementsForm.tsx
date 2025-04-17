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
import { formatPrice, formatFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { Loader } from "lucide-react";

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
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
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
  
  // Configuration de react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      // Conversion du tableau de fichiers en FileList (imparfait mais fonctionnel)
      const dataTransfer = new DataTransfer();
      acceptedFiles.forEach(file => {
        dataTransfer.items.add(file);
      });
      setFiles(dataTransfer.files);
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Retrait d'un fichier de la liste
  const removeFile = (index: number) => {
    if (!files) return;
    
    const dataTransfer = new DataTransfer();
    Array.from(files).forEach((file, i) => {
      if (i !== index) {
        dataTransfer.items.add(file);
      }
    });
    
    setFiles(dataTransfer.files.length > 0 ? dataTransfer.files : null);
  };

  // Gestion de la soumission
  const handleSubmit = () => {
    setSubmitting(true);
    // Simulation d'un envoi API
    setTimeout(() => {
      setSubmitting(false);
      onNext();
    }, 1000);
  };

  return (
    <>
      <DialogHeader className="bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest p-4 rounded-t-lg border-b border-vynal-purple-secondary/30">
        <DialogTitle className="text-vynal-text-primary">Détails de la commande</DialogTitle>
        <DialogDescription className="text-vynal-text-secondary">
          Fournissez vos exigences pour cette commande
        </DialogDescription>
      </DialogHeader>
      
      <div className="p-4 space-y-6">
        {/* Informations du service */}
        <div className="bg-vynal-purple-secondary/10 rounded-lg p-4 border border-vynal-purple-secondary/30">
          <div className="flex items-start gap-3">
            <div className="relative h-14 w-14 rounded-md overflow-hidden flex-shrink-0 bg-vynal-purple-secondary/20">
              {service?.images && service.images.length > 0 ? (
                <Image 
                  src={service.images[0]} 
                  alt={service.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-vynal-purple-secondary/30">
                  <FileUp className="h-5 w-5 text-vynal-accent-primary" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium line-clamp-1 text-vynal-text-primary">{service?.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-vynal-purple-secondary/10 text-vynal-accent-primary hover:bg-vynal-purple-secondary/20 border-vynal-purple-secondary/30">
                  <Clock className="h-3 w-3 mr-1" />
                  {service?.delivery_time || 1} jour{(service?.delivery_time || 1) > 1 ? 's' : ''}
                </Badge>
                <span className="text-xs text-vynal-text-secondary">
                  {formatPrice(service?.price || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Formulaire d'exigences */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="requirements" className="text-vynal-text-primary">
              Exigences détaillées
              <span className="text-vynal-status-error ml-0.5">*</span>
            </Label>
            <Textarea 
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Expliquez en détail ce que vous attendez du vendeur..."
              className="mt-1.5 min-h-[120px] resize-none bg-transparent border-vynal-purple-secondary/30 text-vynal-text-primary focus-visible:ring-vynal-accent-primary"
            />
            <p className="text-xs text-vynal-text-secondary mt-1">
              {requirements.length} caractères - min. 30 caractères recommandés
            </p>
          </div>
          
          <div>
            <Label htmlFor="deliveryDate" className="text-vynal-text-primary">
              Date de livraison souhaitée
            </Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Calendar className="h-4 w-4 text-vynal-accent-primary" />
              <Input
                type="date"
                id="deliveryDate"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-transparent border-vynal-purple-secondary/30 text-vynal-text-primary focus-visible:ring-vynal-accent-primary"
              />
            </div>
            <p className="text-xs text-vynal-text-secondary mt-1">
              Date de livraison estimée: {getEstimatedDeliveryDate()}
            </p>
          </div>
        </div>
        
        {/* Zone de téléchargement de fichiers */}
        <div>
          <Label className="text-vynal-text-primary block mb-2">
            Télécharger des fichiers (optionnel)
          </Label>
          
          {/* Zone de dépôt */}
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragActive 
                ? "border-vynal-accent-primary bg-vynal-accent-primary/10" 
                : "border-vynal-purple-secondary/30 hover:bg-vynal-purple-secondary/10"
            )}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-sm text-vynal-accent-primary">Déposez les fichiers ici...</p>
            ) : (
              <div>
                <Upload className="mx-auto h-8 w-8 text-vynal-accent-primary mb-2" />
                <p className="text-sm font-medium text-vynal-text-primary">
                  Glissez-déposez des fichiers ici, ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-vynal-text-secondary mt-1">
                  Formats acceptés: images, PDF, Word, Excel, ZIP (max 10MB)
                </p>
              </div>
            )}
          </div>
          
          {/* Liste des fichiers */}
          {files && files.length > 0 && (
            <div className="mt-4 space-y-2">
              {Array.from(files).map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 rounded-md bg-vynal-purple-secondary/10 border border-vynal-purple-secondary/30"
                >
                  <div className="flex items-center truncate">
                    <div className="p-1.5 rounded-md bg-vynal-purple-secondary/20 mr-2">
                      <FileUp className="h-4 w-4 text-vynal-accent-primary" />
                    </div>
                    <span className="text-sm text-vynal-text-primary truncate max-w-[250px]">
                      {file.name}
                    </span>
                    <span className="text-xs text-vynal-text-secondary ml-2">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-vynal-status-error/20 hover:text-vynal-status-error"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Supprimer</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
          {fileError && (
            <p className="mt-2 text-xs text-vynal-status-error">{fileError}</p>
          )}
        </div>
        
        {error && (
          <div className="bg-vynal-status-error/20 p-2 rounded-md flex items-start gap-2 text-vynal-status-error text-xs border border-vynal-status-error/30">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="text-vynal-text-primary hover:text-vynal-accent-primary hover:bg-vynal-purple-secondary/20"
            disabled={submitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <Button 
            onClick={onNext}
            className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark"
            disabled={submitting || requirements.length < 10}
          >
            {submitting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </div>
    </>
  );
} 