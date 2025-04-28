import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Users, Target, Clock, Globe, Award, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "À propos | Vynal Platform",
  description: "Découvrez l'histoire et la mission de Vynal Platform, la plateforme de mise en relation entre freelances et clients au Sénégal",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-vynal-purple-dark">
      {/* En-tête décoratif */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-vynal-accent-secondary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-vynal-accent-primary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-vynal-text-primary mb-6">
            Notre histoire
          </h1>
          <p className="mt-4 text-lg text-vynal-text-secondary max-w-3xl mx-auto">
            Vynal Platform est née d'une vision simple mais ambitieuse : créer un pont entre les talents freelance et les entreprises au Sénégal et en Afrique.
          </p>
        </div>

        {/* Mission */}
        <div className="relative mb-20">
          <div className="absolute -inset-2 bg-gradient-to-r from-vynal-accent-primary/20 to-vynal-accent-secondary/20 rounded-2xl blur-xl opacity-70"></div>
          <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm relative">
            <CardContent className="p-8">
              <div className="w-12 h-12 mb-6 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                <Target className="h-6 w-6 text-vynal-accent-primary" />
              </div>
              <h2 className="text-2xl font-bold text-vynal-text-primary mb-4">Notre mission</h2>
              <p className="text-vynal-text-secondary mb-4">
                Vynal Platform a pour mission de démocratiser l'accès au travail freelance au Sénégal en connectant des talents locaux avec des clients nationaux et internationaux.
              </p>
              <p className="text-vynal-text-secondary">
                Nous nous engageons à créer un écosystème où l'excellence et la transparence sont les piliers d'une collaboration réussie entre freelances et clients.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Nos valeurs */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-vynal-text-primary">
            Nos valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full">
              <CardContent className="p-6">
                <div className="w-12 h-12 mb-6 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                  <Award className="h-6 w-6 text-vynal-accent-primary" />
                </div>
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Excellence</h3>
                <p className="text-vynal-text-secondary">
                  Nous promouvons l'excellence dans chaque interaction, chaque service et chaque échange sur notre plateforme.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full">
              <CardContent className="p-6">
                <div className="w-12 h-12 mb-6 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                  <Globe className="h-6 w-6 text-vynal-accent-primary" />
                </div>
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Inclusivité</h3>
                <p className="text-vynal-text-secondary">
                  Chez Vynal, nous célébrons la diversité des talents et des perspectives. Notre plateforme est conçue pour être accessible à tous.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full">
              <CardContent className="p-6">
                <div className="w-12 h-12 mb-6 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                  <Clock className="h-6 w-6 text-vynal-accent-primary" />
                </div>
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Innovation</h3>
                <p className="text-vynal-text-secondary">
                  L'innovation est au cœur de notre approche. Nous recherchons constamment de nouvelles façons d'améliorer l'expérience utilisateur.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-20">
          <Button asChild className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-text-primary">
            <Link href="/services" className="flex items-center gap-2">
              Découvrir nos services <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 