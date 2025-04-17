import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: 'Contact | Vynal Platform',
  description: 'Contactez l\'équipe Vynal pour toute question ou assistance',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-vynal-purple-dark py-12">
      {/* En-tête décoratif */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-vynal-accent-secondary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-vynal-accent-primary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-vynal-text-primary">
            Contactez-nous
          </h1>
          <p className="mt-4 text-lg text-vynal-text-secondary max-w-2xl mx-auto">
            Une question, une suggestion ou besoin d'assistance ? Notre équipe est là pour vous aider.
          </p>
        </div>

        {/* Contact Form */}
        <Card className="max-w-2xl mx-auto bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-8">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-vynal-text-primary mb-1">
                    Prénom
                  </label>
                  <Input
                    type="text"
                    id="firstName"
                    className="bg-vynal-purple-secondary/10 border-vynal-purple-secondary/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-vynal-text-primary placeholder:text-vynal-text-secondary/50"
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-vynal-text-primary mb-1">
                    Nom
                  </label>
                  <Input
                    type="text"
                    id="lastName"
                    className="bg-vynal-purple-secondary/10 border-vynal-purple-secondary/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-vynal-text-primary placeholder:text-vynal-text-secondary/50"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-vynal-text-primary mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  id="email"
                  className="bg-vynal-purple-secondary/10 border-vynal-purple-secondary/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-vynal-text-primary placeholder:text-vynal-text-secondary/50"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-vynal-text-primary mb-1">
                  Sujet
                </label>
                <select
                  id="subject"
                  className="w-full bg-vynal-purple-secondary/10 border-vynal-purple-secondary/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 rounded-md px-4 py-2 text-vynal-text-primary outline-none transition-colors"
                >
                  <option value="" className="bg-vynal-purple-dark text-vynal-text-primary">Sélectionnez un sujet</option>
                  <option value="support" className="bg-vynal-purple-dark text-vynal-text-primary">Support technique</option>
                  <option value="billing" className="bg-vynal-purple-dark text-vynal-text-primary">Facturation</option>
                  <option value="partnership" className="bg-vynal-purple-dark text-vynal-text-primary">Partenariat</option>
                  <option value="feedback" className="bg-vynal-purple-dark text-vynal-text-primary">Feedback</option>
                  <option value="other" className="bg-vynal-purple-dark text-vynal-text-primary">Autre</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-vynal-text-primary mb-1">
                  Message
                </label>
                <Textarea
                  id="message"
                  rows={6}
                  className="bg-vynal-purple-secondary/10 border-vynal-purple-secondary/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-vynal-text-primary placeholder:text-vynal-text-secondary/50"
                  placeholder="Détaillez votre message ici..."
                />
              </div>

              <div className="flex items-center">
                <input
                  id="privacy"
                  type="checkbox"
                  className="h-4 w-4 rounded border-vynal-purple-secondary/30 bg-vynal-purple-secondary/10 text-vynal-accent-primary focus:ring-vynal-accent-primary/20"
                />
                <label htmlFor="privacy" className="ml-2 text-sm text-vynal-text-secondary">
                  J'accepte la {' '}
                  <Link href="/privacy-policy" className="text-vynal-accent-primary hover:underline">
                    politique de confidentialité
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium transition-all"
              >
                Envoyer le message
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Contact Info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                <Mail className="h-6 w-6 text-vynal-accent-primary" />
              </div>
              <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Email</h3>
              <p className="text-vynal-text-secondary">support@vynal.com</p>
            </CardContent>
          </Card>

          <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                <Phone className="h-6 w-6 text-vynal-accent-primary" />
              </div>
              <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Téléphone</h3>
              <p className="text-vynal-text-secondary">+33 (0)1 23 45 67 89</p>
            </CardContent>
          </Card>

          <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                <MapPin className="h-6 w-6 text-vynal-accent-primary" />
              </div>
              <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Adresse</h3>
              <p className="text-vynal-text-secondary">123 Avenue des Champs-Élysées<br />75008 Paris, France</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-vynal-text-primary">
            Questions fréquentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vynal-purple-secondary/20 flex items-center justify-center border border-vynal-purple-secondary/30">
                    <Check className="h-4 w-4 text-vynal-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Comment créer un compte ?</h3>
                    <p className="text-vynal-text-secondary">
                      Cliquez sur "S'inscrire" en haut à droite de la page, puis suivez les instructions pour créer votre compte client ou freelance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vynal-purple-secondary/20 flex items-center justify-center border border-vynal-purple-secondary/30">
                    <Check className="h-4 w-4 text-vynal-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Comment poster un projet ?</h3>
                    <p className="text-vynal-text-secondary">
                      Connectez-vous à votre compte client, accédez à votre tableau de bord et cliquez sur "Nouveau projet". Remplissez ensuite le formulaire détaillé.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vynal-purple-secondary/20 flex items-center justify-center border border-vynal-purple-secondary/30">
                    <Check className="h-4 w-4 text-vynal-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Comment sont gérés les paiements ?</h3>
                    <p className="text-vynal-text-secondary">
                      Nous utilisons un système de paiement sécurisé avec un système d'escrow. Les fonds sont libérés au freelance une fois que le client a approuvé le travail.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vynal-purple-secondary/20 flex items-center justify-center border border-vynal-purple-secondary/30">
                    <Check className="h-4 w-4 text-vynal-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Quels sont les délais de réponse ?</h3>
                    <p className="text-vynal-text-secondary">
                      Notre équipe s'engage à répondre à toutes les demandes dans un délai de 24 à 48 heures ouvrables.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 