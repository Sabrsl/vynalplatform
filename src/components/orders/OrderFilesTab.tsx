"use client";

import { useState, useEffect } from "react";
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
  X
} from "lucide-react";
import { Order } from "@/types/orders";
import { useToast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/orders/FileUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  uploadOrderFile,
  getOrderFiles,
  deleteOrderFile,
  OrderFile
} from "@/lib/supabase/order-files";
import { useAuth } from "@/hooks/useAuth";

interface OrderFilesTabProps {
  order: Order;
}

export function OrderFilesTab({ order }: OrderFilesTabProps) {
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Vérifier si l'utilisateur est impliqué dans la commande
  const isInvolved = user && (order.client.id === user.id || order.freelance.id === user.id);

  // Charger les fichiers au chargement du composant
  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true);
      try {
        console.log('[DEBUG] Chargement des fichiers pour la commande:', order.id);
        const orderFiles = await getOrderFiles(order.id);
        console.log('[DEBUG] Fichiers récupérés:', orderFiles);
        setFiles(orderFiles);
      } catch (error) {
        console.error("[DEBUG] Erreur lors du chargement des fichiers:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les fichiers de la commande",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, [order.id, toast]);

  // Surveiller l'état du modal
  useEffect(() => {
    console.log('[DEBUG] État du modal:', isModalOpen);
  }, [isModalOpen]);

  // Gérer le changement de fichiers
  const handleFileChange = (fileList: FileList | null) => {
    console.log('[DEBUG] Fichiers sélectionnés:', fileList);
    setSelectedFiles(fileList);
  };

  // Gérer l'ouverture du modal
  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Arrêter la propagation pour éviter les interactions avec d'autres éléments
    
    try {
      console.log('[DEBUG] Ouverture du modal d\'upload');
      // Réinitialiser les fichiers sélectionnés
      setSelectedFiles(null);
      // Ouvrir le modal avec un délai pour éviter les problèmes de rendu
      setTimeout(() => {
        setIsModalOpen(true);
      }, 50);
    } catch (error) {
      console.error('[DEBUG] Erreur lors de l\'ouverture du modal:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir la fenêtre d'upload",
        variant: "destructive",
      });
    }
  };

  // Gérer la fermeture du modal
  const handleCloseModal = () => {
    console.log('[DEBUG] Fermeture du modal');
    setIsModalOpen(false);
  };

  // Gérer l'upload des fichiers
  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    console.log('[DEBUG] Début de l\'upload des fichiers');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const filesArray = Array.from(selectedFiles);
      const totalFiles = filesArray.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = filesArray[i];
        const progress = Math.round(((i) / totalFiles) * 100);
        setUploadProgress(progress);

        console.log(`[DEBUG] Upload du fichier ${i+1}/${totalFiles}:`, file.name);
        const uploadedFile = await uploadOrderFile(order.id, file);
        if (uploadedFile) {
          console.log('[DEBUG] Fichier uploadé avec succès:', uploadedFile);
          setFiles(prev => [uploadedFile, ...prev]);
        } else {
          console.error('[DEBUG] Échec de l\'upload du fichier:', file.name);
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
      console.error("[DEBUG] Erreur lors de l'upload des fichiers:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger les fichiers",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Gérer la suppression d'un fichier
  const handleDeleteFile = async (fileId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) {
      try {
        console.log('[DEBUG] Tentative de suppression du fichier:', fileId);
        const success = await deleteOrderFile(fileId);
        if (success) {
          console.log('[DEBUG] Fichier supprimé avec succès');
          setFiles(prev => prev.filter(file => file.id !== fileId));
          toast({
            title: "Fichier supprimé",
            description: "Le fichier a été supprimé avec succès",
          });
        } else {
          throw new Error("Échec de la suppression");
        }
      } catch (error) {
        console.error("[DEBUG] Erreur lors de la suppression du fichier:", error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le fichier",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="p-3 sm:p-4 space-y-4">
      {/* Fichiers du projet */}
      <div>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="text-sm sm:text-base font-medium text-vynal-purple-light dark:text-vynal-text-primary">
            Fichiers du projet
          </h3>
          
          {isInvolved && (
            <Button 
              variant="outline"
              size="sm"
              className="border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:bg-vynal-purple-secondary/5 dark:border-vynal-purple-secondary/40 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10 text-xs sm:text-sm"
              onClick={handleOpenModal}
              type="button"
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              Télécharger
            </Button>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-vynal-purple-secondary/50" />
          </div>
        ) : files && files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <div 
                key={file.id}
                className="flex items-center justify-between p-2 sm:p-3 rounded-md border border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <FileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-purple-secondary dark:text-vynal-text-secondary mr-2 sm:mr-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70 truncate">
                      {file.size} • {formatDistanceToNow(new Date(file.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isInvolved && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeleteFile(file.id)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-500/5"
                    >
                      <Trash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost"
                    asChild
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-vynal-purple-secondary hover:text-vynal-purple-light hover:bg-vynal-purple-secondary/5 dark:text-vynal-text-secondary dark:hover:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
                  >
                    <Link href={file.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 sm:py-6 border border-dashed border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30 rounded-md">
            <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-vynal-purple-secondary/30 dark:text-vynal-text-secondary/30" />
            <p className="mt-2 text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Aucun fichier partagé</p>
            {isInvolved && (
              <Button 
                variant="outline"
                size="sm"
                className="mt-3 border-vynal-purple-secondary/20 text-vynal-purple-secondary hover:bg-vynal-purple-secondary/5 dark:border-vynal-purple-secondary/40 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10 text-xs sm:text-sm"
                onClick={handleOpenModal}
                type="button"
              >
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                Partager un fichier
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Modal d'upload de fichiers - UploadDialog comme composant isolé */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={handleCloseModal}>
          <div 
            className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()} // Empêcher la fermeture lors du clic sur le contenu
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Télécharger des fichiers</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={handleCloseModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Sélectionnez les fichiers que vous souhaitez partager pour cette commande.
            </p>
            
            <div className="space-y-4 py-4">
              <FileUpload 
                onChange={(files) => {
                  console.log('[DEBUG] Fichiers sélectionnés:', files);
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
                onClick={handleCloseModal}
                type="button"
              >
                Annuler
              </Button>
              <Button 
                onClick={() => {
                  console.log('[DEBUG] Bouton Télécharger cliqué');
                  if (selectedFiles && selectedFiles.length > 0) {
                    handleUpload();
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
      )}
      
      {/* Fichiers livrés */}
      {order.delivery && order.delivery.files && order.delivery.files.length > 0 && (
        <div>
          <h3 className="text-sm sm:text-base font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2 sm:mb-3">Fichiers livrés</h3>
          <div className="space-y-2">
            {order.delivery.files.map((file: any, index: number) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 sm:p-3 rounded-md border border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 bg-vynal-accent-primary/5 dark:bg-vynal-accent-primary/10"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary dark:text-vynal-accent-primary mr-2 sm:mr-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70 truncate">
                      {file.size} • Fichier de livraison
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  asChild
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-vynal-purple-secondary hover:text-vynal-purple-light hover:bg-vynal-purple-secondary/5 dark:text-vynal-text-secondary dark:hover:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10"
                >
                  <Link href={file.url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 