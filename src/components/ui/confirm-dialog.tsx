"use client"

import { ReactNode, useState } from "react"
import { Ban } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { Loader } from "@/components/ui/loader"
import { motion } from "framer-motion"

interface ConfirmDialogProps {
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  icon?: ReactNode
  variant?: "default" | "destructive"
  trigger: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  loading?: boolean
}

export function ConfirmDialog({
  onConfirm,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  icon = <Ban className="h-5 w-5 text-red-500 mr-2" />,
  variant = "default",
  trigger,
  open,
  onOpenChange,
  loading = false
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setIsOpen(newOpen)
    }
  }
  
  const handleConfirm = () => {
    onConfirm()
    handleOpenChange(false)
  }
  
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

      <AlertDialog open={open ?? isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogTrigger asChild>
          {trigger}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              {icon}
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelText}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={variant === "destructive" ? 
                "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500" :
                ""}
            >
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  {confirmText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 