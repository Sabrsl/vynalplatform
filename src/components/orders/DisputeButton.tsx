import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle } from 'lucide-react';
import { DisputeCreateForm } from '@/components/disputes/DisputeCreateForm';

interface DisputeButtonProps {
  orderId: string;
  clientId: string;
  freelanceId: string;
  disabled?: boolean;
}

export function DisputeButton({ 
  orderId, 
  clientId, 
  freelanceId, 
  disabled = false
}: DisputeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSuccess = () => {
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 dark:bg-orange-950/20 dark:border-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-950/30"
          disabled={disabled}
        >
          <AlertTriangle className="mr-1 h-4 w-4" />
          Signaler un problème
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ouvrir un litige</DialogTitle>
          <DialogDescription>
            Signalez un problème concernant cette commande. Notre équipe l'examinera afin de trouver une solution.
          </DialogDescription>
        </DialogHeader>
        
        <DisputeCreateForm 
          clientId={clientId} 
          freelanceId={freelanceId} 
          orderId={orderId} 
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
} 