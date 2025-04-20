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
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 