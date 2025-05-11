"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertTriangle, Copy, Check } from "lucide-react";
import { useState } from "react";

interface TestCard {
  number: string;
  expiry: string;
  cvc: string;
  zipCode: string;
  category: "success" | "error" | "3ds" | "other";
  description: string;
  errorCode?: string;
}

export function CartesTest() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const testCards: TestCard[] = [
    {
      number: "4242 4242 4242 4242",
      expiry: "Toute date future",
      cvc: "Tout CVC",
      zipCode: "Tout code",
      category: "success",
      description: "Paiement réussi"
    },
    {
      number: "4000 0000 0000 0002",
      expiry: "Toute date future",
      cvc: "Tout CVC",
      zipCode: "Tout code",
      category: "error",
      description: "Carte refusée (générique)",
      errorCode: "card_declined"
    },
    {
      number: "4000 0000 0000 0069",
      expiry: "Toute date future",
      cvc: "Tout CVC",
      zipCode: "Tout code",
      category: "error",
      description: "Carte expirée",
      errorCode: "expired_card"
    },
    {
      number: "4000 0000 0000 0127",
      expiry: "Toute date future",
      cvc: "Tout CVC",
      zipCode: "Tout code",
      category: "error",
      description: "CVC incorrect",
      errorCode: "incorrect_cvc"
    },
    {
      number: "4000 0000 0000 0101",
      expiry: "Toute date future",
      cvc: "Tout CVC",
      zipCode: "Tout code",
      category: "error",
      description: "Fonds insuffisants",
      errorCode: "insufficient_funds"
    },
    {
      number: "4000 0000 0000 9995",
      expiry: "Toute date future",
      cvc: "Tout CVC",
      zipCode: "Tout code",
      category: "error",
      description: "Échec du processeur",
      errorCode: "processing_error"
    },
    {
      number: "4000 0025 0000 3155",
      expiry: "Toute date future",
      cvc: "Tout CVC",
      zipCode: "Tout code",
      category: "3ds",
      description: "Requiert 3D Secure (réussite)"
    },
    {
      number: "4000 0000 0000 3063",
      expiry: "Toute date future",
      cvc: "Tout CVC",
      zipCode: "Tout code",
      category: "3ds",
      description: "Requiert 3D Secure (échec)"
    }
  ];

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Cartes de test Stripe
        </CardTitle>
        <CardDescription>
          Utilisez ces cartes pour tester les différents scénarios de paiement. Aucun vrai paiement ne sera effectué.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro de carte</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>CVC</TableHead>
                <TableHead>Code postal</TableHead>
                <TableHead>Résultat</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testCards.map((card) => (
                <TableRow key={card.number}>
                  <TableCell className="font-mono">
                    <div className="flex items-center gap-2">
                      {card.number}
                      <button 
                        onClick={() => copyToClipboard(card.number.replace(/\s/g, ''))}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copier le numéro de carte"
                      >
                        {copied === card.number.replace(/\s/g, '') ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>{card.expiry}</TableCell>
                  <TableCell>{card.cvc}</TableCell>
                  <TableCell>{card.zipCode}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        card.category === "success" ? "default" : 
                        card.category === "error" ? "destructive" : 
                        "outline"
                      }
                    >
                      {card.category === "success" ? "Succès" : 
                       card.category === "error" ? "Échec" : 
                       "3D Secure"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="flex items-start gap-2">
                      {card.category === "error" && (
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        {card.description}
                        {card.errorCode && (
                          <div className="text-xs text-gray-500 mt-1">
                            Code: <code>{card.errorCode}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-6 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
          <p className="text-sm font-medium mb-2">Comment tester :</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Choisissez une carte de test selon le scénario souhaité</li>
            <li>Utilisez n'importe quelle date d'expiration future (ex: 12/34)</li>
            <li>Utilisez n'importe quel CVC à 3 chiffres (ex: 123)</li>
            <li>Utilisez n'importe quel code postal valide (ex: 75001)</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
} 