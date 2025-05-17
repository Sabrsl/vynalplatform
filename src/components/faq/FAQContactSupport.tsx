"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function FAQContactSupport() {
  const handleContactSupport = () => {
    // Logique pour contacter le support (pourrait ouvrir une modal, rediriger, etc.)
    console.log("Contacter le support");
  };

  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-r from-vynal-accent-primary/20 to-vynal-accent-secondary/20 rounded-2xl blur-xl opacity-70"></div>
      <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm relative">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold text-vynal-text-primary mb-4">
            Vous n'avez pas trouvé la réponse à votre question ?
          </h2>
          <p className="text-vynal-text-secondary mb-6 max-w-xl mx-auto">
            Notre équipe de support est disponible pour vous aider. N'hésitez pas à nous contacter directement.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark"
              onClick={handleContactSupport}
            >
              <MessageSquare className="mr-2 h-4 w-4" /> Contacter le support
            </Button>
            <Link href="/contact">
              <Button variant="outline" className="border-vynal-purple-secondary/50 text-vynal-text-primary hover:bg-vynal-purple-secondary/20">
                Voir la page contact
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 