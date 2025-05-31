"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { Loader } from "@/components/ui/loader"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface DialogProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
  loading?: boolean;
}

const DialogRoot = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full dark:border-vynal-purple-secondary/30 dark:bg-vynal-purple-dark/90 dark:text-vynal-text-primary",
        className
      )}
      aria-labelledby={props["aria-labelledby"] || "dialog-title"}
      aria-describedby={props["aria-describedby"] || "dialog-description"}
      {...props}
    >
      <div id="dialog-title" className="sr-only" aria-hidden="true">Dialogue</div>
      <div id="dialog-description" className="sr-only" aria-hidden="true">Contenu de dialogue</div>
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent/50 data-[state=open]:text-muted-foreground dark:ring-vynal-accent-primary dark:data-[state=open]:bg-vynal-purple-secondary/30 dark:data-[state=open]:text-vynal-text-primary">
        <X className="h-4 w-4" />
        <span className="sr-only">Fermer</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground dark:text-vynal-text-secondary", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export function DialogComponent({
  title,
  description,
  children,
  onClose,
  loading = false
}: DialogProps) {
  return (
    <>
      <motion.div 
        className="bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest p-4 rounded-t-lg border-b border-vynal-purple-secondary/30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.h2 
          className="text-lg font-semibold text-vynal-text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {title}
        </motion.h2>
        <motion.p 
          className="text-sm text-vynal-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {description}
        </motion.p>
      </motion.div>

      <div className="p-4">
        {children}
      </div>

      <motion.div 
        className="flex justify-between sm:justify-between px-4 py-3 bg-vynal-purple-secondary/10 border-t border-vynal-purple-secondary/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          onClick={onClose}
          variant="ghost"
          className="text-vynal-text-primary hover:text-vynal-accent-primary hover:bg-vynal-purple-secondary/20"
          disabled={loading}
          aria-label="Fermer la boîte de dialogue"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Fermer
        </Button>
        
        <Button 
          onClick={onClose}
          className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark"
          disabled={loading}
          aria-label={loading ? "Traitement en cours..." : "Fermer la boîte de dialogue"}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              Fermer
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </motion.div>
    </>
  );
}

export {
  DialogRoot as Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} 