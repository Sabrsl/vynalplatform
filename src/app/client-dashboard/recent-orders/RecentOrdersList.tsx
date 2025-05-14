import { CURRENCY_CHANGE_EVENT } from "@/lib/utils/currency-updater";
import { useEffect, useState } from "react";

const RecentOrdersList = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleCurrencyChange = () => {
      console.log("RecentOrdersList: Mise à jour des prix suite au changement de devise");
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    
    return () => {
      window.removeEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    };
  }, []);

  return (
    <div className="recent-orders">
      {/* Code de la liste des commandes récentes */}
      <p>Liste des commandes récentes (Mise à jour: {refreshTrigger})</p>
    </div>
  );
};

export default RecentOrdersList; 