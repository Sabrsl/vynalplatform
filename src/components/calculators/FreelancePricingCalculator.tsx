"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { HelpCircle, Info, Loader2, DollarSign, Euro, Share2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip/index";

// Type pour les props
interface FreelancePricingCalculatorProps {
  defaultCurrency?: string;
}

// Définition des types
type Sector = {
  id: string;
  name: string;
  baseRate: number;
  marketDemand: number; // 0.8 - 1.5 coefficient
};

type Location = {
  id: string;
  name: string;
  costFactor: number; // 0.7 - 2.0 coefficient
};

// Données des secteurs d'activité - version simplifiée avec tarifs réalistes
const SECTORS: Sector[] = [
  { id: "web-dev", name: "Développement Web", baseRate: 3000, marketDemand: 1.2 },
  { id: "mobile-dev", name: "Développement Mobile", baseRate: 3500, marketDemand: 1.3 },
  { id: "design", name: "Design & UI/UX", baseRate: 2500, marketDemand: 1.1 },
  { id: "marketing", name: "Marketing Digital", baseRate: 2000, marketDemand: 1.0 },
  { id: "content", name: "Rédaction & Contenu", baseRate: 1800, marketDemand: 0.9 },
  { id: "other", name: "Autre", baseRate: 2200, marketDemand: 1.0 },
];

// Données des localisations - version simplifiée
const LOCATIONS: Location[] = [
  { id: "africa", name: "Afrique", costFactor: 0.8 },
  { id: "europe", name: "Europe", costFactor: 1.4 },
  { id: "americas", name: "Amériques", costFactor: 1.2 },
  { id: "other", name: "Autre", costFactor: 1.0 },
];

export default function FreelancePricingCalculator({ defaultCurrency = "XOF" }: FreelancePricingCalculatorProps) {
  // États pour les entrées utilisateur
  const [sector, setSector] = useState<string>("web-dev");
  const [location, setLocation] = useState<string>("africa");
  const [experience, setExperience] = useState<number[]>([3]); // années d'expérience
  const [specialization, setSpecialization] = useState<number[]>([50]); // niveau de spécialisation (0-100)
  const [hours, setHours] = useState<number>(160); // heures travaillées par mois
  const [expenses, setExpenses] = useState<number>(150000); // dépenses mensuelles
  
  // États pour les résultats
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [dailyRate, setDailyRate] = useState<number>(0);
  const [monthlyRate, setMonthlyRate] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>(defaultCurrency);

  // État pour la méthode de calcul
  const [calculationMethod, setCalculationMethod] = useState<string>("market");

  // Calcul des tarifs
  useEffect(() => {
    setLoading(true);
    
    // Simulation d'un délai pour montrer le loader (peut être supprimé en production)
    const timer = setTimeout(() => {
      const selectedSector = SECTORS.find(s => s.id === sector) || SECTORS[0];
      const selectedLocation = LOCATIONS.find(l => l.id === location) || LOCATIONS[0];
      
      let calculatedHourlyRate = 0;
      
      if (calculationMethod === "market") {
        // Méthode basée sur le marché
        const experienceFactor = 1 + Math.min(experience[0] / 20, 0.7); // max +70% pour 20 ans d'expérience
        const specializationFactor = 1 + (specialization[0] / 100) * 0.35; // max +35% pour spécialisation max
        
        calculatedHourlyRate = selectedSector.baseRate * 
                              selectedSector.marketDemand * 
                              experienceFactor * 
                              specializationFactor * 
                              selectedLocation.costFactor;
      } else {
        // Méthode basée sur les dépenses (Tarif horaire = (Dépenses mensuelles × 1.5) ÷ (Heures travaillées par mois × 0.7))
        calculatedHourlyRate = (expenses * 1.5) / (hours * 0.7);
        
        // Suppression du facteur qui réduit trop les valeurs
        // On applique juste l'ajustement par facteur de localisation sans facteur multiplicateur supplémentaire
        calculatedHourlyRate = calculatedHourlyRate * selectedLocation.costFactor;
      }
      
      // Arrondir à l'entier le plus proche
      calculatedHourlyRate = Math.round(calculatedHourlyRate);
      
      // Convertir les taux si nécessaire
      let rateMultiplier = 1;
      if (currency === "EUR" && defaultCurrency === "XOF") {
        rateMultiplier = 1/655.957;
      } else if (currency === "USD" && defaultCurrency === "XOF") {
        rateMultiplier = 1/600;
      } else if (currency === "XOF" && defaultCurrency !== "XOF") {
        rateMultiplier = 1;
      }
      
      const finalHourlyRate = calculatedHourlyRate * rateMultiplier;
      
      setHourlyRate(finalHourlyRate);
      setDailyRate(finalHourlyRate * 8); // journée de 8h
      setMonthlyRate(finalHourlyRate * hours);
      
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [sector, location, experience, specialization, hours, expenses, calculationMethod, currency, defaultCurrency]);

  // Formatage de la devise
  const formatCurrency = (amount: number) => {
    if (currency === "XOF") {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
    }
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(amount);
  };

  // Fonction pour partager les résultats
  const shareResults = () => {
    // Construire le message à partager
    const shareText = `💰 Mes tarifs freelance calculés sur Vynal Platform 💰\n\n` +
      `Tarif horaire: ${formatCurrency(hourlyRate)}\n` +
      `Tarif journalier: ${formatCurrency(dailyRate)}\n` +
      `Revenu mensuel: ${formatCurrency(monthlyRate)}\n\n` +
      `Calculez vos propres tarifs sur https://vynal-platform.com/tools/pricing-calculator`;
    
    // Vérifier si l'API de partage est disponible dans le navigateur
    if (navigator.share) {
      navigator.share({
        title: 'Mes tarifs freelance',
        text: shareText,
        url: 'https://vynal-platform.com/tools/pricing-calculator',
      })
      .catch((error) => console.log('Erreur de partage', error));
    } else {
      // Fallback: copier dans le presse-papier
      navigator.clipboard.writeText(shareText)
        .then(() => alert('Résultats copiés dans le presse-papier !'))
        .catch((error) => console.error('Erreur de copie', error));
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden bg-gradient-to-br from-vynal-purple-dark to-vynal-purple-darkest border-vynal-purple-secondary/30">
      <CardHeader className="bg-gradient-to-r from-vynal-accent-primary/10 to-vynal-accent-secondary/10 pb-8">
        <CardTitle className="text-2xl md:text-3xl font-bold text-vynal-text-primary">
          Calculateur de tarifs freelance
        </CardTitle>
        <CardDescription className="text-vynal-text-secondary text-base mt-2">
          Déterminez vos tarifs optimaux en fonction de votre expérience, votre secteur d'activité et votre localisation.
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="market" className="w-full" onValueChange={setCalculationMethod}>
        <div className="px-6 pt-4">
          <TabsList className="grid w-full grid-cols-2 bg-vynal-purple-secondary/20">
            <TabsTrigger value="market" className="data-[state=active]:bg-vynal-accent-primary data-[state=active]:text-vynal-purple-dark">
              Basé sur le marché
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-vynal-accent-primary data-[state=active]:text-vynal-purple-dark">
              Basé sur vos dépenses
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-6">
          <TabsContent value="market" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex justify-between">
                  <Label htmlFor="sector" className="text-vynal-text-primary mb-2 flex items-center">
                    Secteur d'activité
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-vynal-text-secondary">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-vynal-purple-secondary/90 text-vynal-text-primary border-vynal-purple-secondary">
                        <p>Chaque secteur a un taux de base et une demande du marché différents</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger className="w-full h-12 text-base bg-vynal-purple-darkest/50 border-vynal-purple-secondary/30 text-vynal-text-primary focus:ring-vynal-accent-primary">
                    <SelectValue placeholder="Sélectionnez votre secteur" />
                  </SelectTrigger>
                  <SelectContent className="bg-vynal-purple-darkest border-vynal-purple-secondary/30 text-vynal-text-primary">
                    {SECTORS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <Label htmlFor="location" className="text-vynal-text-primary mb-2 flex items-center">
                    Localisation
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-vynal-text-secondary">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-vynal-purple-secondary/90 text-vynal-text-primary border-vynal-purple-secondary">
                        <p>Votre localisation influence le coût de la vie et les tarifs attendus</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="w-full h-12 text-base bg-vynal-purple-darkest/50 border-vynal-purple-secondary/30 text-vynal-text-primary focus:ring-vynal-accent-primary">
                    <SelectValue placeholder="Sélectionnez votre localisation" />
                  </SelectTrigger>
                  <SelectContent className="bg-vynal-purple-darkest border-vynal-purple-secondary/30 text-vynal-text-primary">
                    <SelectItem value="africa">Afrique</SelectItem>
                    <SelectItem value="europe">Europe</SelectItem>
                    <SelectItem value="americas">Amériques</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-6 mb-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-vynal-text-primary">
                    Années d'expérience: <span className="font-semibold text-vynal-accent-primary">{experience[0]}</span>
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-vynal-text-secondary">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-vynal-purple-secondary/90 text-vynal-text-primary border-vynal-purple-secondary">
                        <p>Plus vous avez d'expérience, plus vous pouvez facturer</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Slider 
                  defaultValue={[3]} 
                  min={0} 
                  max={15} 
                  step={1} 
                  value={experience}
                  onValueChange={setExperience} 
                  className="my-4"
                />
                <div className="flex justify-between text-xs text-vynal-text-secondary">
                  <span>Débutant</span>
                  <span>Expert</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-vynal-text-primary">
                    Niveau de spécialisation: <span className="font-semibold text-vynal-accent-primary">{specialization[0]}%</span>
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-vynal-text-secondary">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-vynal-purple-secondary/90 text-vynal-text-primary border-vynal-purple-secondary">
                        <p>Être spécialisé dans une niche permet de facturer plus cher</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Slider 
                  defaultValue={[50]} 
                  min={0} 
                  max={100} 
                  step={5} 
                  value={specialization}
                  onValueChange={setSpecialization} 
                  className="my-4"
                />
                <div className="flex justify-between text-xs text-vynal-text-secondary">
                  <span>Généraliste</span>
                  <span>Ultra-spécialisé</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="expenses" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex justify-between">
                  <Label htmlFor="expenses" className="text-vynal-text-primary mb-2 flex items-center">
                    Dépenses mensuelles
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-vynal-text-secondary">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-vynal-purple-secondary/90 text-vynal-text-primary border-vynal-purple-secondary">
                        <p>Incluez tous vos frais fixes : loyer, nourriture, transport, loisirs...</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    {currency === "EUR" ? (
                      <Euro className="h-4 w-4 text-vynal-text-secondary" />
                    ) : currency === "XOF" ? (
                      <span className="text-xs font-semibold text-vynal-text-secondary">FCFA</span>
                    ) : (
                      <DollarSign className="h-4 w-4 text-vynal-text-secondary" />
                    )}
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={expenses}
                    onChange={(e) => setExpenses(Number(e.target.value))}
                    className={`${currency === "XOF" ? "pl-14" : "pl-10"} bg-vynal-purple-darkest/50 border-vynal-purple-secondary/30 text-vynal-text-primary focus:ring-vynal-accent-primary focus-visible:ring-vynal-accent-primary`}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <Label htmlFor="hours" className="text-vynal-text-primary mb-2 flex items-center">
                    Heures travaillées par mois
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-vynal-text-secondary">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-vynal-purple-secondary/90 text-vynal-text-primary border-vynal-purple-secondary">
                        <p>Ne comptez que les heures effectivement facturables</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={300}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="bg-vynal-purple-darkest/50 border-vynal-purple-secondary/30 text-vynal-text-primary focus:ring-vynal-accent-primary focus-visible:ring-vynal-accent-primary"
                />
              </div>
            </div>
            
            <div className="space-y-6 mb-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-vynal-text-primary">
                    Localisation
                  </Label>
                </div>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="w-full h-12 text-base bg-vynal-purple-darkest/50 border-vynal-purple-secondary/30 text-vynal-text-primary focus:ring-vynal-accent-primary">
                    <SelectValue placeholder="Sélectionnez votre localisation" />
                  </SelectTrigger>
                  <SelectContent className="bg-vynal-purple-darkest border-vynal-purple-secondary/30 text-vynal-text-primary">
                    <SelectItem value="africa">Afrique</SelectItem>
                    <SelectItem value="europe">Europe</SelectItem>
                    <SelectItem value="americas">Amériques</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="rounded-lg bg-vynal-purple-darkest/80 p-4 border border-vynal-purple-secondary/20 mt-6">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-vynal-accent-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-vynal-text-secondary">
                  Cette méthode utilise la formule: Tarif horaire = (Dépenses mensuelles × 1.5) ÷ (Heures travaillées par mois × 0.7). Le facteur 1.5 prend en compte l'épargne et les imprévus, tandis que le facteur 0.7 tient compte du fait que vous ne facturerez pas 100% de votre temps.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <div className="mt-6">
            <div className="flex items-center justify-end gap-4 mb-6">
              <Label htmlFor="currency" className="text-vynal-text-primary">Devise</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-28 h-12 text-base bg-vynal-purple-darkest/50 border-vynal-purple-secondary/30 text-vynal-text-primary focus:ring-vynal-accent-primary">
                  <SelectValue placeholder="XOF" />
                </SelectTrigger>
                <SelectContent className="bg-vynal-purple-darkest border-vynal-purple-secondary/30 text-vynal-text-primary">
                  <SelectItem value="XOF">FCFA</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative overflow-hidden">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-vynal-purple-dark/50 backdrop-blur-sm z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-vynal-accent-primary" />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-vynal-purple-secondary/10 border-vynal-purple-secondary/20 hover:bg-vynal-purple-secondary/20 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-vynal-text-primary">Tarif horaire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-vynal-accent-primary">
                      {formatCurrency(hourlyRate)}
                    </p>
                    <p className="text-sm text-vynal-text-secondary mt-1">par heure</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-vynal-purple-secondary/10 border-vynal-purple-secondary/20 hover:bg-vynal-purple-secondary/20 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-vynal-text-primary">Tarif journalier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-vynal-accent-primary">
                      {formatCurrency(dailyRate)}
                    </p>
                    <p className="text-sm text-vynal-text-secondary mt-1">par jour (8h)</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-vynal-purple-secondary/10 border-vynal-purple-secondary/20 hover:bg-vynal-purple-secondary/20 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-vynal-text-primary">Revenu mensuel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-vynal-accent-primary">
                      {formatCurrency(monthlyRate)}
                    </p>
                    <p className="text-sm text-vynal-text-secondary mt-1">par mois ({hours}h)</p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Bouton de partage */}
            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                className="border-vynal-purple-secondary/30 text-vynal-text-primary hover:bg-vynal-purple-secondary/20"
                onClick={shareResults}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Partager mes résultats
              </Button>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-vynal-purple-secondary/5 px-6 py-4 border-t border-vynal-purple-secondary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-sm text-vynal-text-secondary">
            <Info className="h-4 w-4 inline-block mr-1 mb-0.5" /> 
            Ces estimations sont des recommandations basées sur les pratiques du marché.
          </p>
          <Button 
            variant="outline" 
            className="border-vynal-purple-secondary/30 text-vynal-text-primary hover:bg-vynal-purple-secondary/20"
            onClick={() => {
              // Réinitialiser les valeurs
              setSector("web-dev");
              setLocation("africa");
              setExperience([3]);
              setSpecialization([50]);
              setHours(160);
              setExpenses(150000);
            }}
          >
            Réinitialiser
          </Button>
        </CardFooter>
      </Tabs>
    </Card>
  );
} 