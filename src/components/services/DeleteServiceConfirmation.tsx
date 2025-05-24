"use client";

import React, { useState } from "react";
import ConfirmationCard from "@/components/ui/confirmation-card";
import { cn } from "@/lib/utils";

interface DeleteServiceConfirmationProps {
  serviceName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  className?: string;
}

/**
 * Composant de confirmation pour la suppression d'un service
 * Utilise le ConfirmationCard avec la variante "error"
 */
const DeleteServiceConfirmation: React.FC<DeleteServiceConfirmationProps> = ({
  serviceName,
  onConfirm,
  onCancel,
  className,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm();
    } catch (error) {
      setError(
        error instanceof Error 
          ? error.message 
          : "Une erreur est survenue lors de la suppression."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn("w-full mx-auto", className)}>
      {isDeleting ? (
        <ConfirmationCard
          variant="info"
          title="Suppression en cours"
          description="Veuillez patienter..."
          showProgress
          progress={50}
        />
      ) : error ? (
        <ConfirmationCard
          variant="error"
          title="Échec de la suppression"
          description={error}
          primaryActionLabel="Réessayer"
          secondaryActionLabel="Annuler"
          onPrimaryAction={handleConfirm}
          onSecondaryAction={onCancel}
          onClose={onCancel}
        />
      ) : (
        <ConfirmationCard
          variant="error"
          title="Confirmer la suppression"
          description={`Voulez-vous vraiment supprimer "${serviceName}" ? Cette action est irréversible.`}
          primaryActionLabel="Supprimer"
          secondaryActionLabel="Annuler"
          onPrimaryAction={handleConfirm}
          onSecondaryAction={onCancel}
          onClose={onCancel}
        />
      )}
    </div>
  );
};

export default DeleteServiceConfirmation; 