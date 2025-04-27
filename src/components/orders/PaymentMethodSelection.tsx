"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { AlertCircle, ArrowLeft, ArrowRight, FileText, Clock, CreditCard, Check, Smartphone } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";
import { RadioGroup, RadioGroupItem, Label } from "@/components/ui/radio-group";

// Définition du type PaymentMethod
type PaymentMethod = "card" | "paypal" | "orange-money" | "wave" | "free-money";

interface PaymentMethodSelectionProps {
  service: any;
  requirements: string;
  deliveryDate: string;
  files: FileList | null;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (value: string) => void;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
  loading: boolean;
  isTestMode?: boolean;
}

export function PaymentMethodSelection({
  service,
  requirements,
  deliveryDate,
  files,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  error,
  onBack,
  onNext,
  loading,
  isTestMode = false
}: PaymentMethodSelectionProps) {
  
  return (
    <>
      <DialogHeader className="bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest p-4 rounded-t-lg border-b border-vynal-purple-secondary/30">
        <DialogTitle className="text-vynal-text-primary">Choisir une méthode de paiement</DialogTitle>
        <DialogDescription className="text-vynal-text-secondary">
          Sélectionnez une méthode de paiement pour votre commande
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-2 px-4">
        {/* Message de mode test si activé */}
        {isTestMode && (
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-amber-500">Mode Test activé</h3>
                <p className="text-xs text-amber-400/80 mt-1">
                  Cette commande sera traitée comme un paiement fictif pour des fins de test.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Résumé du service commandé */}
        <div className="bg-vynal-purple-secondary/10 rounded-lg p-4 border border-vynal-purple-secondary/30">
          <div className="flex items-start gap-3">
            <div className="relative h-14 w-14 rounded-md overflow-hidden flex-shrink-0 bg-vynal-purple-secondary/20">
              {service?.images && service.images.length > 0 ? (
                <Image 
                  src={service.images[0]} 
                  alt={service.title || "Service image"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-vynal-purple-secondary/30">
                  <FileText className="h-5 w-5 text-vynal-accent-primary" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium line-clamp-1 text-vynal-text-primary">{service?.title}</h3>
              <p className="text-xs text-vynal-text-secondary mt-1 line-clamp-1">
                Par <span className="font-medium">{service?.profiles?.username || "Vendeur"}</span>
              </p>
              <div className="flex items-center mt-1">
                <div className="text-base font-medium text-vynal-accent-primary">
                  {formatPrice(service?.price || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Message d'erreurs */}
        {error && (
          <div className="bg-vynal-status-error/20 p-2 rounded-md flex items-start gap-2 text-vynal-status-error text-xs border border-vynal-status-error/30">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Options de paiement */}
        <div className="space-y-2">
          <div className="text-sm font-medium mb-2 text-vynal-text-primary">Méthodes de paiement</div>
          
          <RadioGroup
            value={selectedPaymentMethod}
            onValueChange={value => setSelectedPaymentMethod(value as PaymentMethod)}
            className="grid gap-2"
          >
            {/* Carte Bancaire */}
            <div>
              <RadioGroupItem
                value="card"
                id="card"
                className="peer sr-only"
              />
              <Label
                htmlFor="card"
                className="flex items-center justify-between rounded-lg border border-vynal-purple-secondary/30 bg-transparent p-4 hover:bg-vynal-purple-secondary/10 hover:text-vynal-text-primary peer-data-[state=checked]:border-vynal-accent-primary peer-data-[state=checked]:bg-vynal-purple-secondary/20 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-vynal-accent-primary" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-vynal-text-primary">Carte Bancaire</p>
                    <p className="text-xs text-vynal-text-secondary">Visa, Mastercard, CB</p>
                  </div>
                </div>
                <Check className={cn(
                  "h-5 w-5 text-vynal-accent-primary",
                  selectedPaymentMethod === "card" ? "opacity-100" : "opacity-0"
                )} />
              </Label>
            </div>
            
            {/* PayPal */}
            <div>
              <RadioGroupItem
                value="paypal"
                id="paypal"
                className="peer sr-only"
              />
              <Label
                htmlFor="paypal"
                className="flex items-center justify-between rounded-lg border border-vynal-purple-secondary/30 bg-transparent p-4 hover:bg-vynal-purple-secondary/10 hover:text-vynal-text-primary peer-data-[state=checked]:border-vynal-accent-primary peer-data-[state=checked]:bg-vynal-purple-secondary/20 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-[#0070ba] flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.0217 7.61133C19.1343 6.8144 18.6862 6.03943 17.8892 5.92675L5.28967 4.10675C4.49274 3.99407 3.71778 4.44219 3.6051 5.23911C3.49242 6.03604 3.94054 6.811 4.73746 6.92368L17.3369 8.74368C18.1339 8.85636 18.9088 8.40825 19.0215 7.61132L19.0217 7.61133Z" fill="currentColor"/>
                      <path d="M18.0626 9.55994C17.867 9.05136 17.3048 8.80337 16.7962 8.99894L5.67813 13.7768C5.16956 13.9723 4.92156 14.5346 5.11714 15.0431C5.31271 15.5517 5.87493 15.7997 6.3835 15.6041L17.5016 10.8263C18.0102 10.6307 18.2582 10.0685 18.0626 9.55994Z" fill="currentColor"/>
                      <path d="M16.5873 12.1509C16.3918 11.6423 15.8296 11.3943 15.321 11.5899L7.99163 14.5032C7.48306 14.6988 7.23507 15.261 7.43064 15.7696C7.62622 16.2782 8.18844 16.5262 8.69701 16.3306L16.0264 13.4173C16.535 13.2217 16.783 12.6595 16.5874 12.1509L16.5873 12.1509Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-vynal-text-primary">PayPal</p>
                    <p className="text-xs text-vynal-text-secondary">Paiement sécurisé</p>
                  </div>
                </div>
                <Check className={cn(
                  "h-5 w-5 text-vynal-accent-primary",
                  selectedPaymentMethod === "paypal" ? "opacity-100" : "opacity-0"
                )} />
              </Label>
            </div>
            
            {/* Mobile Money - Options supplémentaires si disponible */}
            {service?.location === "Sénégal" && (
              <>
                {/* Orange Money */}
                <div>
                  <RadioGroupItem
                    value="orange-money"
                    id="orange-money"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="orange-money"
                    className="flex items-center justify-between rounded-lg border border-vynal-purple-secondary/30 bg-transparent p-4 hover:bg-vynal-purple-secondary/10 hover:text-vynal-text-primary peer-data-[state=checked]:border-vynal-accent-primary peer-data-[state=checked]:bg-vynal-purple-secondary/20 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-vynal-accent-primary" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-vynal-text-primary">Orange Money</p>
                        <p className="text-xs text-vynal-text-secondary">Paiement mobile</p>
                      </div>
                    </div>
                    <Check className={cn(
                      "h-5 w-5 text-vynal-accent-primary",
                      selectedPaymentMethod === "orange-money" ? "opacity-100" : "opacity-0"
                    )} />
                  </Label>
                </div>
                
                {/* Wave */}
                <div>
                  <RadioGroupItem
                    value="wave"
                    id="wave"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="wave"
                    className="flex items-center justify-between rounded-lg border border-vynal-purple-secondary/30 bg-transparent p-4 hover:bg-vynal-purple-secondary/10 hover:text-vynal-text-primary peer-data-[state=checked]:border-vynal-accent-primary peer-data-[state=checked]:bg-vynal-purple-secondary/20 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-vynal-accent-primary" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-vynal-text-primary">Wave</p>
                        <p className="text-xs text-vynal-text-secondary">Paiement mobile</p>
                      </div>
                    </div>
                    <Check className={cn(
                      "h-5 w-5 text-vynal-accent-primary",
                      selectedPaymentMethod === "wave" ? "opacity-100" : "opacity-0"
                    )} />
                  </Label>
                </div>
                
                {/* Free Money */}
                <div>
                  <RadioGroupItem
                    value="free-money"
                    id="free-money"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="free-money"
                    className="flex items-center justify-between rounded-lg border border-vynal-purple-secondary/30 bg-transparent p-4 hover:bg-vynal-purple-secondary/10 hover:text-vynal-text-primary peer-data-[state=checked]:border-vynal-accent-primary peer-data-[state=checked]:bg-vynal-purple-secondary/20 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-vynal-accent-primary" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-vynal-text-primary">Free Money</p>
                        <p className="text-xs text-vynal-text-secondary">Paiement mobile</p>
                      </div>
                    </div>
                    <Check className={cn(
                      "h-5 w-5 text-vynal-accent-primary",
                      selectedPaymentMethod === "free-money" ? "opacity-100" : "opacity-0"
                    )} />
                  </Label>
                </div>
              </>
            )}
          </RadioGroup>
        </div>
      </div>
      
      <DialogFooter className="flex justify-between sm:justify-between px-4 py-3 bg-vynal-purple-secondary/10 border-t border-vynal-purple-secondary/30">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-vynal-text-primary hover:text-vynal-accent-primary hover:bg-vynal-purple-secondary/20"
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        <Button 
          onClick={onNext}
          className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark"
          disabled={loading || !selectedPaymentMethod}
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  );
} 