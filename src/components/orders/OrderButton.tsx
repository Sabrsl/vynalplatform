"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

interface OrderButtonProps {
  serviceId: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function OrderButton({ serviceId, className, variant = "default", size = "default" }: OrderButtonProps) {
  const router = useRouter();

  const handleOrder = () => {
    router.push(`/dashboard/orders/new?serviceId=${serviceId}`);
  };

  return (
    <Button 
      onClick={handleOrder} 
      className={className}
      variant={variant}
      size={size}
    >
      <ShoppingBag className="mr-2 h-4 w-4" />
      Commander
    </Button>
  );
} 