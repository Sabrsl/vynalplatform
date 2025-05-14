import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, CheckCircle2, RefreshCw, AlertTriangle, Info } from "lucide-react";
import useCurrency from "@/hooks/useCurrency";
import { toast } from "sonner";
import { triggerCurrencyChangeEvent, validatePaymentCurrency } from "@/lib/utils/currency-updater";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Liste des devises principales à afficher en priorité
const MAIN_CURRENCIES = ['XOF', 'EUR', 'USD', 'GBP', 'MAD', 'XAF'];

interface CurrencySelectorProps {
  className?: string;
  onSuccess?: () => void;
  showDetails?: boolean;
}

export default function CurrencySelector({ 
  className, 
  onSuccess,
  showDetails = false
}: CurrencySelectorProps) {
  const { currency, updateUserCurrencyPreference, loading, getUserCountry } = useCurrency();
  const [availableCurrencies, setAvailableCurrencies] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currency.code);
  const [isChanging, setIsChanging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Charger les devises disponibles depuis le fichier JSON
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const response = await fetch('/data/currencies.json');
        const data = await response.json();
        
        // Trier les devises: d'abord les principales, puis le reste par ordre alphabétique
        const mainCurrencies = MAIN_CURRENCIES
          .map(code => data.find((c: any) => c.code === code))
          .filter(Boolean);
        
        const otherCurrencies = data
          .filter((c: any) => !MAIN_CURRENCIES.includes(c.code))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        setAvailableCurrencies([...mainCurrencies, ...otherCurrencies]);
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des devises:', error);
        setIsLoading(false);
      }
    };
    
    loadCurrencies();
  }, []);

  // Mettre à jour la devise sélectionnée quand le hook de devise change
  useEffect(() => {
    if (currency.code) {
      setSelectedCurrency(currency.code);
    }
  }, [currency.code]);

  // Vérifier la compatibilité de la devise avec le pays de l'utilisateur
  useEffect(() => {
    const checkCurrencyForCountry = () => {
      const userCountry = getUserCountry();
      
      if (userCountry && selectedCurrency) {
        const validation = validatePaymentCurrency(selectedCurrency, userCountry);
        
        if (!validation.isValid) {
          setValidationWarning(validation.message || null);
        } else {
          setValidationWarning(null);
        }
      }
    };
    
    checkCurrencyForCountry();
  }, [selectedCurrency, getUserCountry]);

  // Gérer le changement de devise
  const handleCurrencyChange = async (value: string) => {
    if (value === currency.code) return;
    
    setSelectedCurrency(value);
    setIsChanging(true);
    
    try {
      // Mettre à jour la préférence de devise
      await updateUserCurrencyPreference(value);
      
      // Notification de succès avec indication de mise à jour globale
      toast.success(
        <div className="flex flex-col gap-1">
          <div className="font-medium">Devise mise à jour: {value}</div>
          <div className="text-xs opacity-80">Tous les prix de l'application ont été convertis.</div>
        </div>,
        {
          duration: 4000,
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />
        }
      );
      
      // Déclencher une propagation globale du changement
      triggerCurrencyChangeEvent(value);
      
      // Callback de succès si fourni
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('Erreur lors du changement de devise:', error);
      toast.error("Erreur lors du changement de devise", {
        duration: 3000,
      });
    } finally {
      setIsChanging(false);
    }
  };

  // Forcer un rafraîchissement complet de la devise
  const handleRefreshCurrency = async () => {
    setIsChanging(true);
    try {
      // Rafraîchir la détection de devise
      await updateUserCurrencyPreference(currency.code);
      
      toast.success(
        <div className="flex flex-col gap-1">
          <div className="font-medium">Taux de change actualisés</div>
          <div className="text-xs opacity-80">Les taux de conversion ont été mis à jour.</div>
        </div>,
        { duration: 3000 }
      );
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erreur lors de l\'actualisation des taux:', error);
      toast.error("Erreur lors de l'actualisation des taux", {
        duration: 3000,
      });
    } finally {
      setIsChanging(false);
    }
  };

  // Style du bouton de changement
  const buttonClassName = "px-2 py-1 h-8 text-xs rounded-md";
  
  // Afficher l'avertissement de manière plus visible si la devise n'est pas adaptée au paiement
  const renderValidationWarning = () => {
    if (!validationWarning) return null;
    
    return (
      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700 dark:text-amber-400">
          <p>{validationWarning}</p>
          <p className="mt-1 text-[10px] opacity-80">
            Vous pouvez continuer à visualiser les prix dans cette devise, mais les paiements seront traités conformément aux réglementations locales.
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className={`${className} overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm transition-all`}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="h-4 w-4 text-vynal-secondary" />
          Devise
        </CardTitle>
        <CardDescription className="text-xs">
          Choisissez la devise dans laquelle vous souhaitez voir les prix
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {isLoading || loading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-vynal-primary" />
            <span className="ml-2 text-sm">Chargement des devises...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-grow">
                <Select
                  value={selectedCurrency}
                  onValueChange={handleCurrencyChange}
                  disabled={isChanging}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Sélectionner une devise">
                      {selectedCurrency && availableCurrencies.find(c => c.code === selectedCurrency) ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{availableCurrencies.find(c => c.code === selectedCurrency)?.symbol}</span>
                          <span>{selectedCurrency}</span>
                          <span className="text-xs text-muted-foreground">
                            ({availableCurrencies.find(c => c.code === selectedCurrency)?.name})
                          </span>
                        </div>
                      ) : (
                        "Sélectionner une devise"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-sm py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono min-w-[20px]">{c.symbol}</span>
                          <span className="font-medium">{c.code}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                            {c.name}
                          </span>
                          {c.rate_fixed && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1 py-0.5 rounded-sm">fixe</span>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">
                                  Taux de change fixe avec le FCFA
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isChanging ? (
                <Button variant="ghost" size="sm" disabled className={buttonClassName}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              ) : selectedCurrency === currency.code ? (
                <Button variant="outline" size="sm" 
                  onClick={handleRefreshCurrency}
                  title="Actualiser les taux de change"
                  className={buttonClassName}
                >
                  <RefreshCw className="h-4 w-4 text-vynal-primary" />
                </Button>
              ) : null}
            </div>

            {renderValidationWarning()}
            
            {showDetails && (
              <div className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/30 rounded-md mt-4">
                <Info className="h-4 w-4 text-vynal-primary flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="text-slate-700 dark:text-vynal-text-primary">Taux de conversion: <span className="font-medium">1 {currency.code} = {(1/currency.rate_to_xof).toFixed(2)} XOF</span></p>
                  <p className="text-slate-600 dark:text-vynal-text-secondary text-[10px]">Dernière mise à jour: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}