import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  stableAnimation?: boolean;
}

export function Skeleton({ className, stableAnimation = false, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-gray-100 dark:bg-vynal-purple-secondary/30", 
        stableAnimation ? "skeleton-stable" : "animate-pulse",
        className
      )}
      {...props}
      style={{
        willChange: 'opacity, transform',
        transform: 'translateZ(0)',
        ...props.style
      }}
    />
  )
} 