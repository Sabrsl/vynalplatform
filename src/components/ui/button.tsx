"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-vynal-accent-primary text-vynal-text-primary hover:bg-vynal-accent-secondary",
        destructive:
          "bg-vynal-status-error text-vynal-text-primary hover:bg-vynal-status-error/90",
        outline:
          "border border-vynal-purple-secondary/50 bg-vynal-purple-dark/30 text-vynal-text-primary hover:bg-vynal-purple-secondary/30",
        secondary:
          "bg-vynal-purple-secondary/70 text-vynal-text-primary hover:bg-vynal-purple-secondary",
        ghost: "text-vynal-text-primary hover:bg-vynal-purple-dark hover:text-vynal-text-primary",
        link: "text-vynal-text-primary underline-offset-4 hover:underline hover:text-vynal-accent-primary",
        success: "bg-vynal-status-success text-vynal-text-primary hover:bg-vynal-status-success/90",
        warning: "bg-vynal-status-warning text-vynal-purple-dark hover:bg-vynal-status-warning/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 