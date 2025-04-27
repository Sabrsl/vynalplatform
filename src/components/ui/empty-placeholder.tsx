import { cn } from "@/lib/utils";

interface EmptyPlaceholderProps {
  title: string;
  description: string;
  className?: string;
}

export function EmptyPlaceholder({ title, description, className }: EmptyPlaceholderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
    </div>
  );
} 