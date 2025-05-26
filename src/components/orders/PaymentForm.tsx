"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Phone } from "lucide-react";
import { PaymentMethodType } from "@/lib/constants/payment";

interface PaymentFormProps {
  method: PaymentMethodType | null;
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
  setMobileOperator,
}: PaymentFormProps) {
  if (method === "card") {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-vynal-accent-primary/20 dark:bg-vynal-accent-primary/10 rounded-md border border-vynal-accent-primary/40 dark:border-vynal-accent-primary/20 text-xs text-slate-800 dark:text-vynal-text-secondary flex items-start mb-2">
          <Lock className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-vynal-accent-primary dark:text-vynal-accent-primary" />
          <span>
            Vos informations sont sécurisées et chiffrées. Nous ne stockons
            jamais vos données de carte bancaire.
          </span>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-800 dark:text-vynal-text-secondary font-medium">
            Numéro de carte
            <Input
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="mt-1 font-mono bg-white/60 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700/20 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/30 dark:focus:border-vynal-accent-primary dark:focus:ring-vynal-accent-primary/20"
              maxLength={19}
            />
          </Label>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-800 dark:text-vynal-text-secondary font-medium">
            Titulaire de la carte
            <Input
              placeholder="JEAN DUPONT"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              className="mt-1 uppercase bg-white/60 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700/20 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/30 dark:focus:border-vynal-accent-primary dark:focus:ring-vynal-accent-primary/20"
            />
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-800 dark:text-vynal-text-secondary font-medium">
              Date d'expiration
              <Input
                placeholder="MM/AA"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                maxLength={5}
                className="mt-1 font-mono bg-white/60 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700/20 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/30 dark:focus:border-vynal-accent-primary dark:focus:ring-vynal-accent-primary/20"
              />
            </Label>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-800 dark:text-vynal-text-secondary font-medium">
              Code de sécurité
              <Input
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                maxLength={4}
                type="password"
                className="mt-1 font-mono bg-white/60 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700/20 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/30 dark:focus:border-vynal-accent-primary dark:focus:ring-vynal-accent-primary/20"
              />
            </Label>
          </div>
        </div>
      </div>
    );
  } else if (method === "paypal") {
    return (
      <div className="space-y-4">
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 bg-white/40 dark:bg-slate-800/25 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-vynal-accent-primary dark:text-vynal-accent-primary"
            >
              <path d="M7.144 19.532l1.049-5.751c.11-.605.691-1.047 1.304-.942.613.106 1.029.693.92 1.298l-1.05 5.751c-.11.605-.691 1.047-1.304.942-.613-.106-1.029-.693-.92-1.298z" />
              <path d="M11.466 14.775l1.049-5.751c.11-.605.691-1.047 1.304-.942.613.106 1.029.693.92 1.298l-1.05 5.751c-.11.605-.691 1.047-1.304.942-.613-.106-1.029-.693-.92-1.298z" />
              <path d="M3.53 11.795l5.568-2.219c.468-.187.436-.772-.055-.929L2.46 6.891c-.5-.161-.949.384-.706.847l1.108 2.113c.054.104.069.223.042.336l-.466 1.959c-.051.217.088.435.298.499.213.065.438-.033.532-.232l.263-.618z" />
            </svg>
          </div>
        </div>

        <div className="p-3 bg-vynal-accent-primary/20 dark:bg-vynal-accent-primary/10 rounded-md border border-vynal-accent-primary/40 dark:border-vynal-accent-primary/20 text-xs text-slate-800 dark:text-vynal-text-secondary mb-4">
          Vous allez être redirigé vers le site PayPal pour finaliser votre
          paiement en toute sécurité.
        </div>

        <div className="space-y-2">
          <Label className="text-slate-800 dark:text-vynal-text-secondary font-medium">
            Email associé à votre compte PayPal
            <Input
              type="email"
              placeholder="exemple@email.com"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              className="mt-1 bg-white/60 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700/20 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/30 dark:focus:border-vynal-accent-primary dark:focus:ring-vynal-accent-primary/20"
            />
          </Label>
        </div>
      </div>
    );
  } else if (
    method &&
    ["orange-money", "free-money", "wave"].includes(method)
  ) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-800 dark:text-vynal-text-secondary">
              Sélectionnez votre opérateur
              <div className="grid grid-cols-3 gap-2 mt-2" role="radiogroup">
                <Button
                  type="button"
                  variant={
                    mobileOperator === "orange-money" ? "default" : "outline"
                  }
                  className={`flex flex-col items-center justify-center h-20 ${
                    mobileOperator === "orange-money"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                      : "border-slate-300 dark:border-slate-700/20 bg-white/60 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-800/25 hover:border-orange-400 dark:hover:border-orange-700"
                  }`}
                  onClick={() => setMobileOperator("orange-money")}
                  role="radio"
                  aria-checked={mobileOperator === "orange-money"}
                >
                  <div className="w-8 h-8 mb-1">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-full h-full"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                  </div>
                  <span className="text-xs">Orange Money</span>
                </Button>

                <Button
                  type="button"
                  variant={
                    mobileOperator === "free-money" ? "default" : "outline"
                  }
                  className={`flex flex-col items-center justify-center h-20 ${
                    mobileOperator === "free-money"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                      : "border-slate-300 dark:border-slate-700/20 bg-white/60 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-800/25 hover:border-blue-400 dark:hover:border-blue-700"
                  }`}
                  onClick={() => setMobileOperator("free-money")}
                  role="radio"
                  aria-checked={mobileOperator === "free-money"}
                >
                  <div className="w-8 h-8 mb-1">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-full h-full"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                  </div>
                  <span className="text-xs">Free Money</span>
                </Button>

                <Button
                  type="button"
                  variant={mobileOperator === "wave" ? "default" : "outline"}
                  className={`flex flex-col items-center justify-center h-20 ${
                    mobileOperator === "wave"
                      ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      : "border-slate-300 dark:border-slate-700/20 bg-white/60 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-800/25 hover:border-green-400 dark:hover:border-green-700"
                  }`}
                  onClick={() => setMobileOperator("wave")}
                  role="radio"
                  aria-checked={mobileOperator === "wave"}
                >
                  <div className="w-8 h-8 mb-1">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-full h-full"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                  </div>
                  <span className="text-xs">Wave</span>
                </Button>
              </div>
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-800 dark:text-vynal-text-secondary font-medium">
            Numéro de téléphone
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-500" />
              <Input
                type="tel"
                placeholder="Ex: 77 123 45 67"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-10 bg-white/60 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700/20 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/30 dark:focus:border-vynal-accent-primary dark:focus:ring-vynal-accent-primary/20"
              />
            </div>
          </Label>
        </div>

        <div className="p-3 bg-white/40 dark:bg-slate-800/25 rounded-md border border-slate-300 dark:border-slate-700/20 mt-4">
          <h4 className="text-sm font-medium mb-1 text-slate-800 dark:text-vynal-text-secondary">
            Comment ça marche :
          </h4>
          <ol className="text-xs text-slate-800 dark:text-vynal-text-secondary space-y-1 pl-5 list-decimal">
            <li>Entrez votre numéro de téléphone</li>
            <li>Validez votre paiement sur cette page</li>
            <li>Vous recevrez une notification sur votre téléphone</li>
            <li>
              Confirmez le paiement avec votre code PIN{" "}
              {mobileOperator === "orange-money"
                ? "Orange Money"
                : mobileOperator === "free-money"
                  ? "Free Money"
                  : "Wave"}
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return null;
}
