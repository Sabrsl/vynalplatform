import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "white";
  showText?: boolean;
  text?: string;
}

export function Loader({
  size = "md",
  variant = "primary",
  showText = false,
  text = "Chargement en cours...",
  className,
  ...props
}: LoaderProps) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const variantClasses = {
    primary: "before:border-vynal-accent-primary after:border-vynal-accent-primary/30",
    secondary: "before:border-vynal-accent-secondary after:border-vynal-accent-secondary/30",
    white: "before:border-white after:border-white/30",
  };

  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const textColorClasses = {
    primary: "text-vynal-text-secondary",
    secondary: "text-vynal-text-secondary",
    white: "text-white",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)} {...props}>
      <div 
        className={cn(
          "relative rounded-full",
          "after:content-[''] after:block after:absolute after:inset-0 after:rounded-full after:border-2 after:border-solid",
          "before:content-[''] before:block before:absolute before:inset-0 before:rounded-full before:border-2 before:border-solid before:border-t-transparent before:animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      
      {showText && (
        <p className={cn("mt-3", textSizeClasses[size], textColorClasses[variant])}>
          {text}
        </p>
      )}
    </div>
  );
} 