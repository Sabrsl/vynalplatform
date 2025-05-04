"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { toast as hotToast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface OrderButtonProps {
  serviceId?: string;
  price?: number;
  showIcon?: boolean;
  variant?: "default" | "outline" | "secondary";
  fullWidth?: boolean;
  customLabel?: string;
  className?: string;
  disabled?: boolean;
  testMode?: boolean;
}

export function OrderButton({
  serviceId,
  price,
  showIcon = true,
  variant = "default",
  fullWidth = false,
  customLabel,
  className,
  disabled,
}: OrderButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour gérer le clic sur le bouton de commande
  const handleOpen = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Vérifier si l'utilisateur est connecté
    if (!user && !authLoading) {
      hotToast.error("Vous devez être connecté pour commander");
      router.push("/sign-in");
      return;
    }
    
    // Vérifier si l'utilisateur est un client et non un freelance
    if (user && user.user_metadata?.role === "freelance") {
      toast({
        title: "Action non autorisée",
        description: "En tant que freelance, vous ne pouvez pas commander de services",
        variant: "destructive",
      });
      return;
    }

    // Rediriger vers la page d'ordre pour ce service (étape requirements)
    router.push(`/order/${serviceId}/unified-checkout`);
  }, [user, authLoading, router, serviceId, toast]);

  // Label personnalisé pour le bouton
  const getLabel = () => {
    if (customLabel) return customLabel;
    
    const baseLabel = "Commander";
    
    if (!price) return baseLabel;
    return `${baseLabel} (${price?.toLocaleString()} F CFA)`;
  };

  return (
    <div className={fullWidth ? "w-full" : "w-auto"}>
      <Button
        className={cn(
          buttonVariants({
            variant,
            size: "default",
          }),
          "w-full relative group",
          className
        )}
        disabled={disabled || authLoading || isLoading}
        onClick={handleOpen}
        type="button"
        aria-label="Commander ce service"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Chargement...
          </span>
        ) : (
          <>
            {showIcon && <ShoppingBag className="mr-2 h-4 w-4" />}
            {getLabel()}
          </>
        )}
      </Button>
    </div>
  );
}

export default memo(OrderButton); 