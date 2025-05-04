"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  FileIcon, 
  Package, 
  Download, 
  Upload,
  Loader2,
  Trash,
} from "lucide-react";
import { Order } from "@/types/orders";
import { useToast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/orders/FileUpload";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  uploadOrderFile,
  getOrderFiles,
  deleteOrderFile,
  OrderFile
} from "@/lib/supabase/order-files";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Loader } from "@/components/ui/loader";

// Utilitaire pour formater la taille des fichiers - déplacé hors du composant
const formatFileSize = (sizeInBytes: number | string): string => {
  if (sizeInBytes === undefined || sizeInBytes === null) return "—";
  
  // Convertir en nombre si c'est une chaîne
  const size = typeof sizeInBytes === 'string' ? parseInt(sizeInBytes, 10) : sizeInBytes;
  
  // Vérifier si c'est un nombre valide
  if (isNaN(size) || size === 0) return "—";
  
  const kb = size / 1024;
  if (kb < 1024) {
    return `${Math.round(kb * 10) / 10} Ko`;
  }
  
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${Math.round(mb * 10) / 10} Mo`;
  }
  
  const gb = mb / 1024;
  return `${Math.round(gb * 10) / 10} Go`;
};

// Composant pour afficher le header de la section
const SectionHeader = memo(() => (
  <motion.div 
    className="bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest p-4 rounded-t-lg border-b border-vynal-purple-secondary/30"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
  >
    <motion.h2 
      className="text-sm sm:text-base font-semibold text-vynal-text-primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      Fichiers de la commande
    </motion.h2>
    <motion.p 
      className="text-[8px] sm:text-[10px] text-vynal-text-secondary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      Ajoutez les fichiers nécessaires pour votre commande
    </motion.p>
  </motion.div>
));

SectionHeader.displayName = 'SectionHeader';

// Composant pour afficher un fichier
const FileItem = memo(({ 
  file, 
  isDeliveryFile, 
  onDelete, 
  canDelete 
}: { 
  file: OrderFile | any; 
  isDeliveryFile?: boolean;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}) => {
  const bgClass = isDeliveryFile 
    ? "bg-vynal-accent-primary/5 dark:bg-vynal-accent-primary/10 hover:bg-vynal-accent-primary/10 dark:hover:bg-vynal-accent-primary/15" 
    : "bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 hover:bg-vynal-purple-secondary/10 dark:hover:bg-vynal-purple-secondary/15";
  
  const iconBgClass = isDeliveryFile
    ? "bg-vynal-accent-primary/10 dark:bg-vynal-accent-primary/20"
    : "bg-vynal-purple-secondary/10 dark:bg-vynal-purple-secondary/20";
  
  const iconColorClass = isDeliveryFile
    ? "text-vynal-accent-primary dark:text-vynal-accent-primary"
    : "text-vynal-purple-secondary dark:text-vynal-text-secondary";
  
  const actionBtnClass = isDeliveryFile
    ? "text-vynal-accent-primary dark:text-vynal-accent-primary hover:bg-vynal-accent-primary/10 dark:hover:bg-vynal-accent-primary/20"
    : "text-vynal-purple-secondary dark:text-vynal-text-secondary hover:bg-vynal-purple-secondary/10 dark:hover:bg-vynal-purple-secondary/20";
  
  const Icon = isDeliveryFile ? Package : FileIcon;
  
  return (
    <div className={`flex items-start space-x-3 p-2 sm:p-3 ${bgClass} rounded-lg transition-colors`}>
      <div className={`flex-shrink-0 ${iconBgClass} h-10 w-10 rounded-md flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${iconColorClass}`} />
      </div>
      
      <div className="min-w-0 flex-grow">
        <h4 className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary truncate">
          {file.name}
        </h4>
        <div className="flex items-center justify-between">
          <p className="text-[8px] sm:text-[9px] text-vynal-purple-secondary dark:text-vynal-text-secondary">
            {isDeliveryFile 
              ? "Fichier de livraison" 
              : formatDistanceToNow(new Date(file.created_at), { addSuffix: true, locale: fr })}
          </p>
          <p className="text-[8px] sm:text-[9px] text-vynal-purple-secondary dark:text-vynal-text-secondary">
            {formatFileSize(file.size || 0)}
          </p>
        </div>
      </div>
      
      <div className="flex-shrink-0 flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className={`h-6 w-6 p-0 ${actionBtnClass} rounded-full`}
        >
          <Link href={file.url} target="_blank" rel="noopener noreferrer">
            <Download className="h-3 w-3" />
          </Link>
        </Button>
        
        {canDelete && onDelete && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
            onClick={() => onDelete(file.id)}
          >
            <Trash className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
});

FileItem.displayName = 'FileItem';

// Composant pour l'état vide (aucun fichier)
const EmptyFilesState = memo(({ onOpenModal, isInvolved }: { onOpenModal: () => void, isInvolved: boolean }) => (
  <div className="text-center py-4 sm:py-6 border border-dashed border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 rounded-md">
    <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-vynal-purple-secondary/30 dark:text-vynal-text-secondary/30" />
    <p className="mt-2 text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Aucun fichier partagé</p>
    {isInvolved && (
      <Button 
        variant="outline"
        size="sm"
        className="mt-3 border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:bg-vynal-purple-secondary/5 dark:border-vynal-purple-secondary/40 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10 text-xs sm:text-sm"
        onClick={onOpenModal}
        type="button"
      >
        <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
        Partager un fichier
      </Button>
    )}
  </div>
));

EmptyFilesState.displayName = 'EmptyFilesState';

// Composant pour l'état de chargement
const LoadingState = memo(() => (
  <div className="flex justify-center items-center py-8">
    <Loader2 className="h-8 w-8 animate-spin text-vynal-purple-secondary/50" />
  </div>
));

LoadingState.displayName = 'LoadingState';

// Composant pour le modal d'upload
const UploadModal = memo(({ 
  isOpen, 
  onClose, 
  onUpload, 
  isUploading, 
  uploadProgress,
  toast
}: { 
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
  isUploading: boolean;
  uploadProgress: number;
  toast: any;
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()} // Empêcher la fermeture lors du clic sur le contenu
      >
        <DialogHeader>
          <DialogTitle className="text-xs sm:text-sm text-vynal-purple-light dark:text-vynal-text-primary">
            Télécharger des fichiers
          </DialogTitle>
          <DialogDescription className="text-[8px] sm:text-[10px] text-vynal-purple-secondary dark:text-vynal-text-secondary">
            Ajoutez les fichiers que vous souhaitez partager pour cette commande
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <FileUpload 
            onChange={(files) => {
              setSelectedFiles(files);
            }}
            label="Fichiers pour la commande"
            description="Glissez-déposez ou cliquez pour sélectionner"
            multiple={true}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,.md"
            maxFiles={5}
            maxSize={25}
          />
        </div>
        
        <div className="flex justify-end items-center space-x-2 mt-4">
          {isUploading && (
            <div className="mr-auto flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-xs">
                {uploadProgress}%
              </span>
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm"
            disabled={isUploading}
            onClick={onClose}
            type="button"
          >
            Annuler
          </Button>
          <Button 
            onClick={() => {
              if (selectedFiles && selectedFiles.length > 0) {
                onUpload();
              } else {
                toast({
                  title: "Aucun fichier sélectionné",
                  description: "Veuillez sélectionner au moins un fichier à télécharger",
                  variant: "destructive",
                });
              }
            }} 
            disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}
            size="sm"
            className="bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90"
            type="button"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Télécharger
          </Button>
        </div>
      </div>
    </div>
  );
});

UploadModal.displayName = 'UploadModal';

// Composant principal
export function OrderFilesTab({ order }: { order: Order }) {
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Vérifier si l'utilisateur est impliqué dans la commande
  const isInvolved = Boolean(user && (order.client.id === user.id || order.freelance.id === user.id));

  // Charger les fichiers au chargement du composant
  useEffect(() => {
    async function loadFiles() {
      setIsLoading(true);
      try {
        const orderFiles = await getOrderFiles(order.id);
        setFiles(orderFiles);
      } catch (error) {
        console.error("Erreur lors du chargement des fichiers:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les fichiers de la commande",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadFiles();
  }, [order.id, toast]);

  // Gérer le changement de fichiers - mémorisé pour éviter les re-rendus
  const handleFileChange = useCallback((fileList: FileList | null) => {
    setSelectedFiles(fileList);
  }, []);

  // Gérer l'ouverture du modal - mémorisé
  const handleOpenModal = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setSelectedFiles(null);
    setIsModalOpen(true);
  }, []);

  // Gérer la fermeture du modal - mémorisé
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Gérer l'upload des fichiers - mémorisé
  const handleUpload = useCallback(async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const filesArray = Array.from(selectedFiles);
      const totalFiles = filesArray.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = filesArray[i];
        const progress = Math.round(((i) / totalFiles) * 100);
        setUploadProgress(progress);

        const uploadedFile = await uploadOrderFile(order.id, file);
        if (uploadedFile) {
          setFiles(prev => [uploadedFile, ...prev]);
        }
      }

      setUploadProgress(100);
      setIsModalOpen(false);
      setSelectedFiles(null);
      
      toast({
        title: "Succès",
        description: `${filesArray.length} fichier(s) téléchargé(s) avec succès`,
      });
    } catch (error) {
      console.error("Erreur lors de l'upload des fichiers:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger les fichiers",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [order.id, selectedFiles, toast]);

  // Gérer la suppression d'un fichier - mémorisé
  const handleDeleteFile = useCallback(async (fileId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) {
      try {
        const success = await deleteOrderFile(fileId);
        if (success) {
          setFiles(prev => prev.filter(file => file.id !== fileId));
          toast({
            title: "Fichier supprimé",
            description: "Le fichier a été supprimé avec succès",
          });
        } else {
          throw new Error("Échec de la suppression");
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du fichier:", error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le fichier",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  // Extraction des fichiers de livraison pour éviter les calculs répétés
  const deliveryFiles = order.delivery?.files || [];
  const hasDeliveryFiles = deliveryFiles.length > 0;

  return (
    <>
      <SectionHeader />

      <div className="p-3 sm:p-4 space-y-4">
        {/* Fichiers du projet */}
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary">
              Fichiers du projet
            </h3>
            
            {isInvolved && (
              <Button 
                variant="outline"
                size="sm"
                className="border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:bg-vynal-purple-secondary/5 dark:border-vynal-purple-secondary/40 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10 text-[8px] sm:text-[10px]"
                onClick={handleOpenModal}
                type="button"
              >
                <Upload className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                Télécharger
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <LoadingState />
          ) : files && files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file) => (
                <FileItem 
                  key={file.id}
                  file={file}
                  onDelete={handleDeleteFile}
                  canDelete={isInvolved}
                />
              ))}
            </div>
          ) : (
            <EmptyFilesState onOpenModal={handleOpenModal} isInvolved={isInvolved} />
          )}
        </div>
        
        {/* Modal d'upload de fichiers */}
        <UploadModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUpload={handleUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          toast={toast}
        />
        
        {/* Fichiers livrés */}
        {hasDeliveryFiles && (
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2 sm:mb-3">
              Fichiers livrés
            </h3>
            <div className="space-y-2">
              {deliveryFiles.map((file: any, index: number) => (
                <FileItem 
                  key={`delivery-${index}`}
                  file={file}
                  isDeliveryFile={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}