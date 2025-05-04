"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, FileUp, AlertCircle, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { formatPrice, formatFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface OrderRequirementsFormProps {
  service: any;
  requirements: string;
  setRequirements: (value: string) => void;
  files: FileList | null;
  setFiles: (files: FileList | null) => void;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
  isTestMode?: boolean;
  isLoading: boolean;
}

export function OrderRequirementsForm({
  service,
  requirements,
  setRequirements,
  files,
  setFiles,
  error,
  onBack,
  onNext,
  isTestMode = false,
  isLoading
}: OrderRequirementsFormProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-4"
    >
      <div className="bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest p-4 rounded-t-lg border-b border-vynal-purple-secondary/30">
        <h2 className="text-lg font-semibold text-vynal-text-primary">Détails de la commande</h2>
        <p className="text-sm text-vynal-text-secondary">
          Veuillez fournir les détails de votre commande pour que le freelance puisse la traiter.
        </p>
      </div>
      
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
                  sizes="56px"
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
        
        {isTestMode && (
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink0" />
              <div>
                <h3 className="text-sm font-medium text-amber-500">Mode Test activé</h3>
                <p className="text-xs text-amber-400/80 mt-1">
                  Cette commande sera marquée comme un TEST. Les champs obligatoires ne sont plus requis.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Formulaire d'exigences */}
        <div className="space-y-4">
          <div>
            <Label className="text-vynal-text-primary">
              Exigences détaillées
              <span className="text-vynal-status-error ml-0.5">*</span>
              <Textarea 
                id="order-requirements"
                name="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Expliquez en détail ce que vous attendez du vendeur..."
                className="mt-1.5 min-h-[120px] resize-none bg-transparent border-vynal-purple-secondary/30 text-vynal-text-primary focus-visible:ring-vynal-accent-primary"
              />
              <p className="text-xs text-vynal-text-secondary mt-1">
                {requirements.length} caractères - min. 30 caractères recommandés
              </p>
            </Label>
          </div>
          
          <div>
            <Label className="text-vynal-text-primary">
              Fichiers joints (optionnel)
              <div
                {...getRootProps()}
                className={cn(
                  "mt-1.5 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-vynal-accent-primary bg-vynal-accent-primary/10"
                    : "border-vynal-purple-secondary/30 hover:border-vynal-accent-primary/50"
                )}
              >
                <input 
                  {...getInputProps()} 
                  id="order-files"
                  name="files"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-6 w-6 text-vynal-text-secondary" />
                  <p className="text-sm text-vynal-text-secondary">
                    {isDragActive
                      ? "Déposez les fichiers ici..."
                      : "Glissez-déposez des fichiers ou cliquez pour sélectionner"}
                  </p>
                  <p className="text-xs text-vynal-text-secondary/80">
                    Maximum 5 fichiers, 10MB par fichier
                  </p>
                </div>
              </div>
            </Label>
          </div>
        </div>
        
        {/* Zone de téléchargement de fichiers */}
        <div>
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
        
        <div className="pt-2 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={onBack}
            className="text-vynal-text-secondary hover:text-vynal-text-primary"
          >
            Annuler
          </Button>
          <Button
            onClick={onNext}
            disabled={isLoading}
            className="bg-vynal-accent-primary hover:bg-vynal-accent-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              "Continuer"
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
} 