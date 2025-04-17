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
        <div className="p-3 bg-vynal-purple-50/20 dark:bg-vynal-purple-900/20 rounded-md border border-vynal-purple-200/50 dark:border-vynal-purple-800/50 text-xs text-vynal-purple-700 dark:text-vynal-purple-300 flex items-start mb-2">
          <Lock className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-vynal-purple-500 dark:text-vynal-purple-400" />
          <span>Vos informations sont sécurisées et chiffrées. Nous ne stockons jamais vos données de carte bancaire.</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cardNumber" className="text-gray-700 dark:text-gray-300">Numéro de carte</Label>
          <Input
            id="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="font-mono focus:border-vynal-purple-400 focus:ring-vynal-purple-400/20 dark:focus:border-vynal-purple-500 dark:focus:ring-vynal-purple-500/20"
            maxLength={19}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cardHolder" className="text-gray-700 dark:text-gray-300">Titulaire de la carte</Label>
          <Input
            id="cardHolder"
            placeholder="JEAN DUPONT"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            className="uppercase focus:border-vynal-purple-400 focus:ring-vynal-purple-400/20 dark:focus:border-vynal-purple-500 dark:focus:ring-vynal-purple-500/20"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryDate" className="text-gray-700 dark:text-gray-300">Date d'expiration</Label>
            <Input
              id="expiryDate"
              placeholder="MM/AA"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              maxLength={5}
              className="font-mono focus:border-vynal-purple-400 focus:ring-vynal-purple-400/20 dark:focus:border-vynal-purple-500 dark:focus:ring-vynal-purple-500/20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cvv" className="text-gray-700 dark:text-gray-300">Code de sécurité</Label>
            <Input
              id="cvv"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              maxLength={4}
              type="password"
              className="font-mono focus:border-vynal-purple-400 focus:ring-vynal-purple-400/20 dark:focus:border-vynal-purple-500 dark:focus:ring-vynal-purple-500/20"
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
          <div className="w-16 h-16 bg-vynal-purple-50/30 dark:bg-vynal-purple-900/30 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-vynal-purple-600 dark:text-vynal-purple-400">
              <path d="M7.144 19.532l1.049-5.751c.11-.605.691-1.047 1.304-.942.613.106 1.029.693.92 1.298l-1.05 5.751c-.11.605-.691 1.047-1.304.942-.613-.106-1.029-.693-.92-1.298z" />
              <path d="M11.466 14.775l1.049-5.751c.11-.605.691-1.047 1.304-.942.613.106 1.029.693.92 1.298l-1.05 5.751c-.11.605-.691 1.047-1.304.942-.613-.106-1.029-.693-.92-1.298z" />
              <path d="M3.53 11.795l5.568-2.219c.468-.187.436-.772-.055-.929L2.46 6.891c-.5-.161-.949.384-.706.847l1.108 2.113c.054.104.069.223.042.336l-.466 1.959c-.051.217.088.435.298.499.213.065.438-.033.532-.232l.263-.618z" />
            </svg>
          </div>
        </div>
        
        <div className="p-3 bg-vynal-purple-50/20 dark:bg-vynal-purple-900/20 rounded-md border border-vynal-purple-200/50 dark:border-vynal-purple-800/50 text-xs text-vynal-purple-700 dark:text-vynal-purple-300 mb-4">
          Vous allez être redirigé vers le site PayPal pour finaliser votre paiement en toute sécurité.
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="paypalEmail" className="text-gray-700 dark:text-gray-300">Email associé à votre compte PayPal</Label>
          <Input
            id="paypalEmail"
            type="email"
            placeholder="exemple@email.com"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            className="focus:border-vynal-purple-400 focus:ring-vynal-purple-400/20 dark:focus:border-vynal-purple-500 dark:focus:ring-vynal-purple-500/20"
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
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sélectionnez votre opérateur</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                type="button"
                variant={mobileOperator === "orange-money" ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-20 ${
                  mobileOperator === "orange-money" 
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white" 
                    : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700"
                }`}
                onClick={() => setMobileOperator("orange-money")}
              >
                <div className={`w-8 h-8 rounded-full mb-1 flex items-center justify-center ${
                  mobileOperator === "orange-money"
                    ? "bg-white/20 text-white"
                    : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                }`}>
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-xs">Orange Money</span>
              </Button>
              
              <Button 
                type="button"
                variant={mobileOperator === "free-money" ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-20 ${
                  mobileOperator === "free-money" 
                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white" 
                    : "border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700"
                }`}
                onClick={() => setMobileOperator("free-money")}
              >
                <div className={`w-8 h-8 rounded-full mb-1 flex items-center justify-center ${
                  mobileOperator === "free-money"
                    ? "bg-white/20 text-white"
                    : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                }`}>
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-xs">Free Money</span>
              </Button>
              
              <Button 
                type="button"
                variant={mobileOperator === "wave" ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-20 ${
                  mobileOperator === "wave" 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white" 
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
                onClick={() => setMobileOperator("wave")}
              >
                <div className={`w-8 h-8 rounded-full mb-1 flex items-center justify-center ${
                  mobileOperator === "wave"
                    ? "bg-white/20 text-white"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                }`}>
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-xs">Wave</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="text-gray-700 dark:text-gray-300">Numéro de téléphone</Label>
          <div className="flex">
            <div className="bg-gray-100 dark:bg-gray-800 border border-r-0 border-input dark:border-gray-700 rounded-l-md px-3 flex items-center text-gray-500 dark:text-gray-400">
              +221
            </div>
            <Input
              id="phoneNumber"
              placeholder="77 123 45 67"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="rounded-l-none focus:border-vynal-purple-400 focus:ring-vynal-purple-400/20 dark:focus:border-vynal-purple-500 dark:focus:ring-vynal-purple-500/20"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Vous recevrez une notification sur votre téléphone pour confirmer le paiement
          </p>
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700 mt-4">
          <h4 className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Comment ça marche :</h4>
          <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pl-5 list-decimal">
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