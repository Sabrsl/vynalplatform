"use client";

import React, { useState } from 'react';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  AlertCircle,
  FileText,
  Info,
  UserCheck,
  HelpCircle,
  Mail,
  BookText,
  GraduationCap,
  Shield,
  FileCode
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  getCachedData, 
  setCachedData, 
  CACHE_EXPIRY, 
  CACHE_KEYS,
  invalidateCache
} from '@/lib/optimizations';
import { Badge } from '@/components/ui/badge';

// Type pour les options d'invalidation de cache
interface InvalidationOption {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  cacheKey?: string;
}

// Groupes de pages pour l'invalidation
const staticPagesOptions: InvalidationOption[] = [
  {
    id: 'terms',
    title: 'Conditions d\'utilisation',
    description: 'Page des conditions générales d\'utilisation de la plateforme',
    path: '/terms-of-service',
    icon: <Shield className="h-5 w-5 text-blue-500" />
  },
  {
    id: 'privacy',
    title: 'Politique de confidentialité',
    description: 'Page de politique de confidentialité et RGPD',
    path: '/privacy-policy',
    icon: <Shield className="h-5 w-5 text-blue-500" />
  },
  {
    id: 'conduct',
    title: 'Code de conduite',
    description: 'Page du code de conduite de la communauté',
    path: '/code-of-conduct',
    icon: <Shield className="h-5 w-5 text-blue-500" />
  },
  {
    id: 'about',
    title: 'À propos',
    description: 'Page à propos de la plateforme',
    path: '/about',
    icon: <Info className="h-5 w-5 text-purple-500" />
  },
  {
    id: 'how',
    title: 'Comment ça marche',
    description: 'Page expliquant le fonctionnement de la plateforme',
    path: '/how-it-works',
    icon: <HelpCircle className="h-5 w-5 text-green-500" />
  },
  {
    id: 'freelance',
    title: 'Devenir Freelance',
    description: 'Page d\'information pour devenir freelance',
    path: '/devenir-freelance',
    icon: <UserCheck className="h-5 w-5 text-orange-500" />
  },
  {
    id: 'contact',
    title: 'Contact',
    description: 'Page de contact',
    path: '/contact',
    icon: <Mail className="h-5 w-5 text-blue-500" />
  },
  {
    id: 'faq',
    title: 'FAQ',
    description: 'Page de questions fréquemment posées',
    path: '/faq',
    icon: <HelpCircle className="h-5 w-5 text-teal-500" />
  }
];

const apiCachesOptions: InvalidationOption[] = [
  {
    id: 'services_list',
    title: 'Liste des services',
    description: 'Cache de la liste des services sur la page d\'accueil',
    path: '/api/services',
    cacheKey: 'public_services_list',
    icon: <FileText className="h-5 w-5 text-indigo-500" />
  },
  {
    id: 'freelancers_list',
    title: 'Liste des freelances',
    description: 'Cache de la liste des freelances populaires',
    path: '/api/freelancers',
    cacheKey: 'public_freelancers_list',
    icon: <UserCheck className="h-5 w-5 text-green-500" />
  }
];

export default function CacheInvalidationsPage() {
  const { toast } = useToast();
  const [isInvalidating, setIsInvalidating] = useState<Record<string, boolean>>({});
  const [lastInvalidated, setLastInvalidated] = useState<Record<string, Date>>({});
  
  // Fonction pour invalider le cache d'une page statique
  const handleInvalidateStaticPage = async (option: InvalidationOption) => {
    try {
      setIsInvalidating(prev => ({ ...prev, [option.id]: true }));
      
      // Invalider le cache via l'API Next.js
      const response = await fetch(`/api/revalidate?path=${option.path}&secret=${process.env.NEXT_PUBLIC_REVALIDATION_TOKEN || 'default_token'}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Échec de l'invalidation: ${response.statusText}`);
      }
      
      // Si un cacheKey est défini, invalider aussi ce cache spécifique
      if (option.cacheKey) {
        invalidateCache(option.cacheKey);
      }
      
      // Enregistrer l'heure d'invalidation
      setLastInvalidated(prev => ({ 
        ...prev, 
        [option.id]: new Date() 
      }));
      
      toast({
        title: "Cache invalidé",
        description: `La page ${option.title} a été invalidée avec succès`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'invalidation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'invalider la page",
        variant: "destructive"
      });
    } finally {
      setIsInvalidating(prev => ({ ...prev, [option.id]: false }));
    }
  };
  
  // Fonction pour invalider un cache API
  const handleInvalidateApiCache = async (option: InvalidationOption) => {
    try {
      setIsInvalidating(prev => ({ ...prev, [option.id]: true }));
      
      // Si un cacheKey est défini, invalider ce cache spécifique
      if (option.cacheKey) {
        invalidateCache(option.cacheKey);
        
        // Déclencher un événement pour informer les autres composants
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { 
            detail: { key: option.cacheKey }
          }));
        }
      }
      
      // Enregistrer l'heure d'invalidation
      setLastInvalidated(prev => ({ 
        ...prev, 
        [option.id]: new Date() 
      }));
      
      toast({
        title: "Cache invalidé",
        description: `Le cache ${option.title} a été invalidé avec succès`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'invalidation du cache API:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'invalider le cache API",
        variant: "destructive"
      });
    } finally {
      setIsInvalidating(prev => ({ ...prev, [option.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-base font-bold text-gray-900 dark:text-white">Invalidations de Cache</h1>
        <p className="text-[9px] text-gray-600 dark:text-gray-400 mt-0.5">
          Gérez les invalidations de cache des pages statiques et des API pour forcer leur régénération.
        </p>
      </div>
      
      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pages">Pages Statiques</TabsTrigger>
          <TabsTrigger value="api">Caches API</TabsTrigger>
          <TabsTrigger value="about">À propos du cache</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-medium text-gray-600 dark:text-vynal-text-secondary">Pages Statiques</CardTitle>
              <CardDescription className="text-[9px]">
                Utilisez ces options pour forcer la régénération des pages statiques après des modifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staticPagesOptions.map((option) => (
                  <Card key={option.id} className="flex flex-col h-full bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md">
                    <CardHeader className="pb-1 pt-3 px-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <CardTitle className="text-[10px] font-medium text-gray-900 dark:text-white">{option.title}</CardTitle>
                        </div>
                        {lastInvalidated[option.id] && (
                          <Badge 
                            variant="outline" 
                            className="text-[9px] font-normal bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 hover:bg-vynal-accent-primary/15 hover:border-vynal-accent-primary/30 dark:bg-vynal-accent-primary/10 dark:border-vynal-accent-primary/20 dark:hover:bg-vynal-accent-primary/20 dark:hover:border-vynal-accent-primary/40 transition-all duration-200"
                          >
                            Invalidé {lastInvalidated[option.id].toLocaleTimeString()}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-[9px] mt-1 text-gray-600 dark:text-gray-400">{option.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-1 px-3 pb-3 mt-auto">
                      <Button 
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs text-slate-700 bg-white/40 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700/20 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200"
                        disabled={isInvalidating[option.id]}
                        onClick={() => handleInvalidateStaticPage(option)}
                      >
                        {isInvalidating[option.id] ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Invalidation...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Invalider
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-medium text-gray-600 dark:text-vynal-text-secondary">Caches API</CardTitle>
              <CardDescription className="text-[9px]">
                Invalidez les caches des API pour mettre à jour les données affichées aux utilisateurs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {apiCachesOptions.map((option) => (
                  <Card key={option.id} className="flex flex-col h-full bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md">
                    <CardHeader className="pb-1 pt-3 px-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <CardTitle className="text-[10px] font-medium text-gray-900 dark:text-white">{option.title}</CardTitle>
                        </div>
                        {lastInvalidated[option.id] && (
                          <Badge 
                            variant="outline" 
                            className="text-[9px] font-normal bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 hover:bg-vynal-accent-primary/15 hover:border-vynal-accent-primary/30 dark:bg-vynal-accent-primary/10 dark:border-vynal-accent-primary/20 dark:hover:bg-vynal-accent-primary/20 dark:hover:border-vynal-accent-primary/40 transition-all duration-200"
                          >
                            Invalidé {lastInvalidated[option.id].toLocaleTimeString()}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-[9px] mt-1 text-gray-600 dark:text-gray-400">{option.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-1 px-3 pb-3 mt-auto">
                      <Button 
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs text-slate-700 bg-white/40 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700/20 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200"
                        disabled={isInvalidating[option.id]}
                        onClick={() => handleInvalidateApiCache(option)}
                      >
                        {isInvalidating[option.id] ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Invalidation...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Invalider
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-medium text-gray-600 dark:text-vynal-text-secondary">À propos du cache</CardTitle>
              <CardDescription className="text-[9px]">
                Comprendre comment fonctionne le système de cache de Vynal Platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="pages">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      Pages statiques
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-[9px] text-gray-600 dark:text-slate-400 mb-4">
                      Les pages statiques sont générées au moment de la build, puis mises en cache. 
                      Elles sont configurées avec un temps d'expiration de 30 jours (revalidate: 2592000).
                    </p>
                    <p className="text-[9px] text-gray-600 dark:text-slate-400">
                      L'invalidation force Next.js à régénérer la page lors de la prochaine requête, 
                      mettant ainsi à jour le contenu sans avoir à redéployer l'application.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="api">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileCode className="h-4 w-4" />
                      Caches API
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-[9px] text-gray-600 dark:text-slate-400 mb-4">
                      Les caches API sont des mécanismes client-side qui stockent les réponses des API
                      pour améliorer les performances et réduire la charge serveur.
                    </p>
                    <p className="text-[9px] text-gray-600 dark:text-slate-400">
                      L'invalidation efface les données en cache et force les composants à récupérer
                      des données fraîches lors de leur prochaine exécution.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="process">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <RefreshCw className="h-4 w-4" />
                      Processus d'invalidation
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-[9px] text-gray-600 dark:text-slate-400 mb-4">
                      Pour les pages statiques, l'invalidation appelle l'API de revalidation de Next.js.
                      Lors de la prochaine requête sur cette page, elle sera régénérée à partir de zéro
                      plutôt que d'utiliser la version en cache.
                    </p>
                    <p className="text-[9px] text-gray-600 dark:text-slate-400">
                      Pour les caches API, l'invalidation supprime les entrées de cache spécifiques et
                      émet un événement pour informer les composants concernés qu'ils doivent actualiser
                      leurs données.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="when">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <AlertCircle className="h-4 w-4" />
                      Quand invalider ?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc list-inside space-y-2 text-[9px] text-gray-600 dark:text-slate-400">
                      <li>Après avoir modifié le contenu d'une page statique</li>
                      <li>Après avoir mis à jour des termes et conditions</li>
                      <li>Après des changements importants dans l'API</li>
                      <li>Lorsque vous voulez forcer l'actualisation des listes de services ou freelances</li>
                      <li>Si vous constatez que des données obsolètes sont affichées</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 