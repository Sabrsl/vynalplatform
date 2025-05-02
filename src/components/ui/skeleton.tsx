import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("rounded-md bg-vynal-purple-secondary/30", className)}
      {...props}
      style={{
        willChange: 'opacity',
        ...props.style
      }}
    />
  )
} 