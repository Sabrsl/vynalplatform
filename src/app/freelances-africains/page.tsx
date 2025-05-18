import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Award, Briefcase, Clock } from "lucide-react";
import PageLayout from "@/components/ui/PageLayout";
import SchemaOrg from "@/components/seo/SchemaOrg";

export const metadata: Metadata = {
  title: 'Freelances Africains | Talents Numériques en Afrique | Vynal Platform',
  description: 'Découvrez et engagez les meilleurs freelances africains. Développeurs, designers, marketeurs et rédacteurs qualifiés pour vos projets. Paiements sécurisés et qualité garantie.',
  keywords: 'freelances africains, talents numériques Afrique, développeurs africains, designers africains, recrutement Afrique, freelance Sénégal, experts web africains',
  alternates: {
    canonical: 'https://vynalplatform.com/freelances-africains',
  },
  openGraph: {
    title: 'Freelances Africains | Talents Numériques en Afrique',
    description: 'Engagez les meilleurs freelances africains pour vos projets. Paiements sécurisés et qualité garantie.',
    url: 'https://vynalplatform.com/freelances-africains',
    type: 'website',
    images: [
      {
        url: '/assets/images/og-freelances.jpg',
        width: 1200,
        height: 630,
        alt: 'Freelances africains sur Vynal Platform'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Freelances Africains sur Vynal Platform',
    description: 'Découvrez les meilleurs talents freelance en Afrique.',
    images: ['/assets/images/og-freelances.jpg'],
  }
};

// Configuration de mise en cache pour cette page statique
export const dynamic = 'force-static';
export const revalidate = 604800; // 7 jours

export default function FreelancesAfricainsPage() {
  // Données SEO schématisées pour les rich snippets
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Comment recruter un freelance africain ?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Pour recruter un freelance africain, inscrivez-vous sur Vynal Platform, publiez votre projet ou parcourez nos profils de freelances par compétence. Vous pouvez contacter directement les talents, discuter des détails et effectuer un paiement sécurisé via notre système de protection.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Quels types de freelances peut-on trouver en Afrique ?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'L\'Afrique regorge de talents dans divers domaines : développeurs web et mobile, designers UI/UX, spécialistes marketing digital, rédacteurs web, traducteurs, experts en référencement SEO, monteurs vidéo, et bien d\'autres. Vynal Platform vous connecte avec ces experts vérifiés.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Quels sont les avantages de travailler avec des freelances africains ?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Les freelances africains offrent un excellent rapport qualité-prix, une forte éthique de travail, la maîtrise de plusieurs langues (français, anglais, langues locales), une créativité unique et une grande flexibilité. De plus, vous soutenez le développement économique du continent.'
        }
      }
    ]
  };

  const competences = [
    { nom: 'Développement Web', description: 'Experts en React, Node.js, PHP, WordPress' },
    { nom: 'Design Graphique', description: 'UI/UX, identité visuelle, illustrations' },
    { nom: 'Marketing Digital', description: 'SEO, réseaux sociaux, email marketing' },
    { nom: 'Rédaction Web', description: 'Contenu SEO, copywriting, traduction' },
    { nom: 'Développement Mobile', description: 'Applications iOS, Android, React Native' },
    { nom: 'Montage Vidéo', description: 'Édition professionnelle, motion design' },
  ];

  return (
    <PageLayout 
      fullGradient={false}
      withPadding={true}
      title="Talents Freelance en Afrique"
    >
      {/* Hero Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary">
            Les Meilleurs Freelances Africains pour vos Projets
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-vynal-text-secondary mb-8 max-w-3xl mx-auto">
            Engagez des talents numériques qualifiés en Afrique pour transformer vos idées en réalité. Paiements sécurisés et qualité garantie.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary">
              <Link href="/services">
                Explorer les services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/how-it-works">
                Comment ça marche
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Compétences Section */}
      <section className="py-12 md:py-16 bg-slate-100/30 dark:bg-slate-900/30 rounded-3xl my-8">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-slate-800 dark:text-vynal-text-primary">
            Expertises des Freelances Africains
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {competences.map((competence, index) => (
              <Card key={index} className="border border-slate-200 dark:border-slate-700/30 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-vynal-accent-primary">{competence.nom}</h3>
                  <p className="text-slate-600 dark:text-vynal-text-secondary">{competence.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-slate-800 dark:text-vynal-text-primary">
            Pourquoi Engager des Freelances Africains ?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Award className="h-6 w-6 text-vynal-accent-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-vynal-text-primary">Qualité exceptionnelle</h3>
                  <p className="text-slate-600 dark:text-vynal-text-secondary">Les freelances africains sont formés aux dernières technologies et offrent un travail de haute qualité.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Briefcase className="h-6 w-6 text-vynal-accent-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-vynal-text-primary">Diversité des compétences</h3>
                  <p className="text-slate-600 dark:text-vynal-text-secondary">Une large gamme d'expertises couvrant tous les aspects de vos projets numériques.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-vynal-accent-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-vynal-text-primary">Réactivité et flexibilité</h3>
                  <p className="text-slate-600 dark:text-vynal-text-secondary">Des professionnels dédiés qui s'adaptent à vos horaires et respectent vos délais.</p>
                </div>
              </div>
            </div>
            
            <div className="relative rounded-xl overflow-hidden h-[300px] md:h-auto">
              <Image 
                src="/assets/images/african-freelancers.jpg" 
                alt="Freelances africains travaillant sur des projets digitaux" 
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Optimisée pour les Featured Snippets */}
      <section className="py-12 md:py-16 bg-slate-100/30 dark:bg-slate-900/30 rounded-3xl my-8">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-slate-800 dark:text-vynal-text-primary">
            Questions Fréquentes sur les Freelances Africains
          </h2>
          
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-700/30 pb-6">
              <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-vynal-text-primary">Comment recruter un freelance africain ?</h3>
              <p className="text-slate-600 dark:text-vynal-text-secondary">
                Pour recruter un freelance africain, inscrivez-vous sur Vynal Platform, publiez votre projet ou parcourez nos profils de freelances par compétence. Vous pouvez contacter directement les talents, discuter des détails et effectuer un paiement sécurisé via notre système de protection.
              </p>
            </div>
            
            <div className="border-b border-slate-200 dark:border-slate-700/30 pb-6">
              <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-vynal-text-primary">Quels types de freelances peut-on trouver en Afrique ?</h3>
              <p className="text-slate-600 dark:text-vynal-text-secondary">
                L'Afrique regorge de talents dans divers domaines : développeurs web et mobile, designers UI/UX, spécialistes marketing digital, rédacteurs web, traducteurs, experts en référencement SEO, monteurs vidéo, et bien d'autres. Vynal Platform vous connecte avec ces experts vérifiés.
              </p>
            </div>
            
            <div className="border-b border-slate-200 dark:border-slate-700/30 pb-6">
              <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-vynal-text-primary">Quels sont les avantages de travailler avec des freelances africains ?</h3>
              <p className="text-slate-600 dark:text-vynal-text-secondary">
                Les freelances africains offrent un excellent rapport qualité-prix, une forte éthique de travail, la maîtrise de plusieurs langues (français, anglais, langues locales), une créativité unique et une grande flexibilité. De plus, vous soutenez le développement économique du continent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-800 dark:text-vynal-text-primary">
            Prêt à Collaborer avec les Meilleurs Talents Africains ?
          </h2>
          <p className="text-lg text-slate-600 dark:text-vynal-text-secondary mb-8 max-w-3xl mx-auto">
            Rejoignez Vynal Platform et découvrez comment les freelances africains peuvent transformer vos projets.
          </p>
          <div className="flex justify-center">
            <Button asChild size="lg" className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary">
              <Link href="/services">
                Trouver mon freelance
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Schema.org data for rich snippets */}
      <SchemaOrg data={schemaData} />
    </PageLayout>
  );
} 