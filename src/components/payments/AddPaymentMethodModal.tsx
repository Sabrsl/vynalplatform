import { useState } from "react";
import { toast } from "../ui/use-toast";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
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
        toast({ title: "Error", description: "Card number is required", variant: "destructive" });
        return false;
      }
      if (!cardHolder.trim()) {
        toast({ title: "Error", description: "Cardholder name is required", variant: "destructive" });
        return false;
      }
      if (!expiryDate.trim() || expiryDate.length !== 5) {
        toast({ title: "Error", description: "Valid expiry date is required (MM/YY)", variant: "destructive" });
        return false;
      }
      if (!cvv.trim() || cvv.length < 3) {
        toast({ title: "Error", description: "Valid CVV is required", variant: "destructive" });
        return false;
      }
    } else if (paymentType === "paypal") {
      if (!paypalEmail.trim() || !paypalEmail.includes("@")) {
        toast({ title: "Error", description: "Valid PayPal email is required", variant: "destructive" });
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
      toast({ title: "Success", description: "Payment method added successfully" });
      
      // Reset form
      setCardNumber("");
      setCardHolder("");
      setExpiryDate("");
      setCvv("");
      setPaypalEmail("");
      
      onClose();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to add payment method. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Payment Method</DialogTitle>
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
                Credit Card
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
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="cardHolder">Cardholder Name</Label>
                <Input
                  id="cardHolder"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    value={expiryDate}
                    onChange={handleExpiryDateChange}
                    placeholder="MM/YY"
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
              <Label htmlFor="paypalEmail">PayPal Email</Label>
              <Input
                id="paypalEmail"
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          )}
          
          <div className="flex justify-end pt-4 gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Payment Method"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 