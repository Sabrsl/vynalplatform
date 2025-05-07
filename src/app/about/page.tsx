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
    <div className="min-h-screen bg-white/30 dark:bg-slate-900/30">
      {/* En-tête décoratif */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-slate-100/30 to-white/20 dark:from-slate-900/30 dark:to-slate-800/20 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-vynal-accent-primary/10 dark:bg-vynal-accent-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-vynal-accent-primary/10 dark:bg-vynal-accent-primary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-3 md:px-6 py-6 md:py-12 relative">
        {/* Hero Section */}
        <div className="mb-8 md:mb-16 text-center">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-vynal-text-primary mb-4 md:mb-6">
            Notre histoire
          </h1>
          <p className="mt-2 md:mt-4 text-sm md:text-base lg:text-lg text-slate-600 dark:text-vynal-text-secondary max-w-3xl mx-auto">
            Vynal Platform est née d'une vision simple mais ambitieuse : créer un pont entre les talents freelance et les entreprises au Sénégal et en Afrique.
          </p>
        </div>

        {/* Mission */}
        <div className="relative mb-8 md:mb-16">
          <div className="absolute -inset-2 bg-gradient-to-r from-vynal-accent-primary/10 to-vynal-accent-primary/5 dark:from-vynal-accent-primary/10 dark:to-vynal-accent-primary/5 rounded-lg blur-xl opacity-70"></div>
          <Card className="bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30 rounded-lg overflow-hidden shadow-sm backdrop-blur-sm">
            <CardContent className="p-4 md:p-6 lg:p-8">
              <div className="w-10 h-10 md:w-12 md:h-12 mb-4 md:mb-6 flex items-center justify-center bg-white/40 dark:bg-slate-800/40 rounded-full border border-slate-200/50 dark:border-slate-700/20">
                <Target className="h-5 w-5 md:h-6 md:w-6 text-vynal-accent-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-vynal-text-primary mb-3 md:mb-4">Notre mission</h2>
              <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary mb-3 md:mb-4">
                Vynal Platform a pour mission de démocratiser l'accès au travail freelance au Sénégal en connectant des talents locaux avec des clients nationaux et internationaux.
              </p>
              <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
                Nous nous engageons à créer un écosystème où l'excellence et la transparence sont les piliers d'une collaboration réussie entre freelances et clients.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Nos valeurs */}
        <div className="mb-8 md:mb-16">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-6 md:mb-8 text-slate-800 dark:text-vynal-text-primary">
            Nos valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Card className="bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30 rounded-lg shadow-sm backdrop-blur-sm h-full transition-all duration-200">
              <CardContent className="p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 mb-4 md:mb-6 flex items-center justify-center bg-white/40 dark:bg-slate-800/40 rounded-full border border-slate-200/50 dark:border-slate-700/20">
                  <Award className="h-5 w-5 md:h-6 md:w-6 text-vynal-accent-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-vynal-text-primary mb-2">Excellence</h3>
                <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
                  Nous promouvons l'excellence dans chaque interaction, chaque service et chaque échange sur notre plateforme.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30 rounded-lg shadow-sm backdrop-blur-sm h-full transition-all duration-200">
              <CardContent className="p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 mb-4 md:mb-6 flex items-center justify-center bg-white/40 dark:bg-slate-800/40 rounded-full border border-slate-200/50 dark:border-slate-700/20">
                  <Globe className="h-5 w-5 md:h-6 md:w-6 text-vynal-accent-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-vynal-text-primary mb-2">Inclusivité</h3>
                <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
                  Chez Vynal, nous célébrons la diversité des talents et des perspectives. Notre plateforme est conçue pour être accessible à tous.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30 rounded-lg shadow-sm backdrop-blur-sm h-full transition-all duration-200">
              <CardContent className="p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 mb-4 md:mb-6 flex items-center justify-center bg-white/40 dark:bg-slate-800/40 rounded-full border border-slate-200/50 dark:border-slate-700/20">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-vynal-accent-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-vynal-text-primary mb-2">Innovation</h3>
                <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
                  L'innovation est au cœur de notre approche. Nous recherchons constamment de nouvelles façons d'améliorer l'expérience utilisateur.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-8 md:mb-16">
          <Button asChild className="bg-vynal-accent-primary hover:bg-vynal-accent-primary/90 text-white dark:text-vynal-text-primary transition-all duration-200">
            <Link href="/services" className="flex items-center gap-2">
              Découvrir nos services <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 