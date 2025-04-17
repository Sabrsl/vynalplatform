import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-vynal-accent-primary text-vynal-text-primary hover:bg-vynal-accent-primary/80",
        secondary:
          "border-transparent bg-vynal-purple-secondary text-vynal-text-primary hover:bg-vynal-purple-secondary/80",
        destructive:
          "border-transparent bg-vynal-status-error text-vynal-text-primary hover:bg-vynal-status-error/80",
        outline: "text-vynal-text-primary border-vynal-purple-secondary",
        success:
          "border-transparent bg-vynal-status-success text-vynal-text-primary hover:bg-vynal-status-success/80",
        warning:
          "border-transparent bg-vynal-status-warning text-vynal-purple-dark hover:bg-vynal-status-warning/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 