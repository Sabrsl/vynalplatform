// Déclaration de modules pour les composants shadcn/ui
declare module "@/components/ui/toast" {
  export const Toast: React.FC<any>;
  export const ToastClose: React.FC<any>;
  export const ToastDescription: React.FC<any>;
  export const ToastProvider: React.FC<any>;
  export const ToastTitle: React.FC<any>;
  export const ToastViewport: React.FC<any>;
  export type ToastProps = any;
  export type ToastActionElement = any;
}

declare module "@/components/ui/use-toast" {
  export const useToast: () => {
    toasts: any[];
    toast: (props: any) => any;
    dismiss: (id?: string) => void;
  };
} 