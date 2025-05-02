import { useState } from "react";
import { toast } from "../ui/use-toast";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { CreditCard, Wallet } from "lucide-react";

type AddPaymentMethodModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddPaymentMethod: (paymentMethod: any) => void;
};

export function AddPaymentMethodModal({
  isOpen,
  onClose,
  onAddPaymentMethod,
}: AddPaymentMethodModalProps) {
  const [paymentType, setPaymentType] = useState<"creditCard" | "paypal">("creditCard");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      const month = value.substring(0, 2);
      const year = value.substring(2, 4);
      
      if (value.length <= 2) {
        setExpiryDate(value);
      } else {
        setExpiryDate(`${month}/${year}`);
      }
    }
  };

  const validateInputs = () => {
    if (paymentType === "creditCard") {
      if (!cardNumber.trim()) {
        toast({ title: "Erreur", description: "Numéro de carte est requis", variant: "destructive" });
        return false;
      }
      if (!cardHolder.trim()) {
        toast({ title: "Erreur", description: "Nom du titulaire est requis", variant: "destructive" });
        return false;
      }
      if (!expiryDate.trim() || expiryDate.length !== 5) {
        toast({ title: "Erreur", description: "Date d'expiration valide est requise (MM/AA)", variant: "destructive" });
        return false;
      }
      if (!cvv.trim() || cvv.length < 3) {
        toast({ title: "Erreur", description: "CVV valide est requis", variant: "destructive" });
        return false;
      }
    } else if (paymentType === "paypal") {
      if (!paypalEmail.trim() || !paypalEmail.includes("@")) {
        toast({ title: "Erreur", description: "Email PayPal valide est requis", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const paymentMethod = {
        type: paymentType,
        ...(paymentType === "creditCard" 
          ? { 
              cardNumber: cardNumber.replace(/\s/g, ""),
              cardHolder,
              expiryDate,
              cvv 
            } 
          : { 
              email: paypalEmail 
            }
        ),
      };
      
      onAddPaymentMethod(paymentMethod);
      toast({ title: "Succès", description: "Moyen de paiement ajouté avec succès" });
      
      // Reset form
      setCardNumber("");
      setCardHolder("");
      setExpiryDate("");
      setCvv("");
      setPaypalEmail("");
      
      onClose();
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Échec de l'ajout du moyen de paiement. Veuillez réessayer.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" aria-labelledby="payment-method-title" aria-describedby="payment-method-description">
        <DialogHeader>
          <DialogTitle id="payment-method-title" className="text-xl font-semibold">Ajouter un moyen de paiement</DialogTitle>
          <DialogDescription id="payment-method-description">
            Entrez vos coordonnées bancaires ci-dessous pour ajouter un nouveau moyen de paiement.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <RadioGroup 
            value={paymentType} 
            onValueChange={(value) => setPaymentType(value as "creditCard" | "paypal")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="creditCard" id="creditCard" />
              <Label htmlFor="creditCard" className="flex items-center gap-2 cursor-pointer">
                <CreditCard className="h-5 w-5" />
                Carte de crédit
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="paypal" id="paypal" />
              <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer">
                <Wallet className="h-5 w-5" />
                PayPal
              </Label>
            </div>
          </RadioGroup>
          
          {paymentType === "creditCard" ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="cardNumber">Numéro de carte</Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="cardHolder">Nom du titulaire</Label>
                <Input
                  id="cardHolder"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Jean Dupont"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="expiryDate">Date d'expiration</Label>
                  <Input
                    id="expiryDate"
                    value={expiryDate}
                    onChange={handleExpiryDateChange}
                    placeholder="MM/AA"
                    maxLength={5}
                  />
                </div>
                
                <div className="space-y-1 w-[80px]">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    type="password"
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="paypalEmail">Email PayPal</Label>
              <Input
                id="paypalEmail"
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>
          )}
          
          <div className="flex justify-end pt-4 gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Ajout en cours..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 