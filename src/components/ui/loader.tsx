import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "inverse";
}

export function Loader({
  size = "md",
  variant = "default",
  className,
  ...props
}: LoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const variantClasses = {
    default: "text-vynal-accent-primary",
    inverse: "text-white",
  };

  return (
    <div {...props} className={cn("animate-spin", sizeClasses[size], variantClasses[variant], className)}>
      <Loader2 className="h-full w-full" />
    </div>
  );
} 