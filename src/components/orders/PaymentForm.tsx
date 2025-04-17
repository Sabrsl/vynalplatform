"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Phone } from "lucide-react";

interface PaymentFormProps {
  method: string;
  cardNumber: string;
  setCardNumber: (value: string) => void;
  cardHolder: string;
  setCardHolder: (value: string) => void;
  expiryDate: string;
  setExpiryDate: (value: string) => void;
  cvv: string;
  setCvv: (value: string) => void;
  paypalEmail: string;
  setPaypalEmail: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  mobileOperator: "orange-money" | "free-money" | "wave";
  setMobileOperator: (value: "orange-money" | "free-money" | "wave") => void;
}

export function PaymentForm({
  method,
  cardNumber,
  setCardNumber,
  cardHolder,
  setCardHolder,
  expiryDate,
  setExpiryDate,
  cvv,
  setCvv,
  paypalEmail,
  setPaypalEmail,
  phoneNumber,
  setPhoneNumber,
  mobileOperator,
  setMobileOperator
}: PaymentFormProps) {
  
  if (method === 'card') {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-md border border-blue-100 text-xs text-blue-700 flex items-start mb-2">
          <Lock className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-blue-500" />
          <span>Vos informations sont sécurisées et chiffrées. Nous ne stockons jamais vos données de carte bancaire.</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Numéro de carte</Label>
          <Input
            id="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="font-mono"
            maxLength={19}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cardHolder">Titulaire de la carte</Label>
          <Input
            id="cardHolder"
            placeholder="JEAN DUPONT"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            className="uppercase"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Date d'expiration</Label>
            <Input
              id="expiryDate"
              placeholder="MM/AA"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              maxLength={5}
              className="font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cvv">Code de sécurité</Label>
            <Input
              id="cvv"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              maxLength={4}
              type="password"
              className="font-mono"
            />
          </div>
        </div>
      </div>
    );
  } 
  else if (method === 'paypal') {
    return (
      <div className="space-y-4">
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <path d="M7.144 19.532l1.049-5.751c.11-.605.691-1.047 1.304-.942.613.106 1.029.693.92 1.298l-1.05 5.751c-.11.605-.691 1.047-1.304.942-.613-.106-1.029-.693-.92-1.298z" />
              <path d="M11.466 14.775l1.049-5.751c.11-.605.691-1.047 1.304-.942.613.106 1.029.693.92 1.298l-1.05 5.751c-.11.605-.691 1.047-1.304.942-.613-.106-1.029-.693-.92-1.298z" />
              <path d="M3.53 11.795l5.568-2.219c.468-.187.436-.772-.055-.929L2.46 6.891c-.5-.161-.949.384-.706.847l1.108 2.113c.054.104.069.223.042.336l-.466 1.959c-.051.217.088.435.298.499.213.065.438-.033.532-.232l.263-.618z" />
            </svg>
          </div>
        </div>
        
        <div className="p-3 bg-blue-50 rounded-md border border-blue-100 text-xs text-blue-700 mb-4">
          Vous allez être redirigé vers le site PayPal pour finaliser votre paiement en toute sécurité.
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="paypalEmail">Email associé à votre compte PayPal</Label>
          <Input
            id="paypalEmail"
            type="email"
            placeholder="exemple@email.com"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
          />
        </div>
      </div>
    );
  } 
  else if (['orange-money', 'free-money', 'wave'].includes(method)) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sélectionnez votre opérateur</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                type="button"
                variant={mobileOperator === "orange-money" ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-20 ${mobileOperator === "orange-money" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                onClick={() => setMobileOperator("orange-money")}
              >
                <div className="w-8 h-8 bg-orange-100 rounded-full mb-1 flex items-center justify-center text-orange-600">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-xs">Orange Money</span>
              </Button>
              
              <Button 
                type="button"
                variant={mobileOperator === "free-money" ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-20 ${mobileOperator === "free-money" ? "bg-red-500 hover:bg-red-600" : ""}`}
                onClick={() => setMobileOperator("free-money")}
              >
                <div className="w-8 h-8 bg-red-100 rounded-full mb-1 flex items-center justify-center text-red-600">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-xs">Free Money</span>
              </Button>
              
              <Button 
                type="button"
                variant={mobileOperator === "wave" ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-20 ${mobileOperator === "wave" ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                onClick={() => setMobileOperator("wave")}
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full mb-1 flex items-center justify-center text-blue-600">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-xs">Wave</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
          <div className="flex">
            <div className="bg-gray-100 border border-r-0 border-input rounded-l-md px-3 flex items-center text-gray-500">
              +221
            </div>
            <Input
              id="phoneNumber"
              placeholder="77 123 45 67"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="rounded-l-none"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Vous recevrez une notification sur votre téléphone pour confirmer le paiement
          </p>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200 mt-4">
          <h4 className="text-sm font-medium mb-1">Comment ça marche :</h4>
          <ol className="text-xs text-gray-600 space-y-1 pl-5 list-decimal">
            <li>Entrez votre numéro de téléphone</li>
            <li>Validez votre paiement sur cette page</li>
            <li>Vous recevrez une notification sur votre téléphone</li>
            <li>Confirmez le paiement avec votre code PIN {mobileOperator === 'orange-money' ? 'Orange Money' : mobileOperator === 'free-money' ? 'Free Money' : 'Wave'}</li>
          </ol>
        </div>
      </div>
    );
  }
  
  return null;
} 