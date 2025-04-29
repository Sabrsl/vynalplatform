import React, { useMemo, memo } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DisputeWithDetails } from '@/lib/supabase/disputes';
import { AlertTriangle, Clock, CheckCircle, XCircle, ExternalLink, Shield } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Étendre l'interface pour inclure les champs de date optionnels
interface DisputeWithTimestamps extends DisputeWithDetails {
  resolved_at?: string;
  closed_at?: string;
}

interface DisputeCardProps {
  dispute: DisputeWithTimestamps;
  isClient: boolean;
}

function DisputeCard({ dispute, isClient }: DisputeCardProps) {
  // Détermine la couleur du badge en fonction du statut (mémorisé pour éviter les re-rendus inutiles)
  const statusBadge = useMemo(() => {
    switch (dispute.status) {
      case 'open':
        return (
          <Badge className="bg-white/90 text-amber-600 border-amber-200 shadow-sm shadow-amber-100/20 
                         dark:bg-vynal-purple-dark/30 dark:border-amber-500/30 dark:text-amber-400
                         text-[9px] sm:text-[10px] py-0.5 pl-1 pr-1.5">
            <motion.span 
              initial={{ scale: 0.8 }} 
              animate={{ scale: [0.8, 1.1, 1] }}
              transition={{ duration: 0.4 }}
              className="flex items-center"
            >
              <AlertTriangle className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5" strokeWidth={2.5} />
              Ouvert
            </motion.span>
          </Badge>
        );
      case 'resolved':
        return (
          <Badge className="bg-white/90 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-100/20 
                         dark:bg-vynal-purple-dark/30 dark:border-emerald-500/30 dark:text-emerald-400
                         text-[9px] sm:text-[10px] py-0.5 pl-1 pr-1.5">
            <motion.span 
              initial={{ scale: 0.8 }} 
              animate={{ scale: [0.8, 1.1, 1] }}
              transition={{ duration: 0.4 }}
              className="flex items-center"
            >
              <CheckCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5" strokeWidth={2.5} />
              Résolu
            </motion.span>
          </Badge>
        );
      case 'closed':
        return (
          <Badge className="bg-white/90 text-slate-600 border-slate-200 shadow-sm shadow-slate-100/20 
                         dark:bg-vynal-purple-dark/30 dark:border-slate-400/30 dark:text-slate-400
                         text-[9px] sm:text-[10px] py-0.5 pl-1 pr-1.5">
            <motion.span 
              initial={{ scale: 0.8 }} 
              animate={{ scale: [0.8, 1.1, 1] }}
              transition={{ duration: 0.4 }}
              className="flex items-center"
            >
              <XCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5" strokeWidth={2.5} />
              Fermé
            </motion.span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-white/90 text-slate-600 border-slate-200 shadow-sm shadow-slate-100/20 
                         dark:bg-vynal-purple-dark/30 dark:border-slate-400/30 dark:text-slate-400
                         text-[9px] sm:text-[10px] py-0.5 pl-1 pr-1.5">
            {dispute.status}
          </Badge>
        );
    }
  }, [dispute.status]);

  // Formater la date relative (mémorisée)
  const formattedRelativeDate = useMemo(() => {
    const formatRelativeDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return "Aujourd'hui";
      } else if (diffDays === 1) {
        return "Hier";
      } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
      } else {
        return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
      }
    };
    
    return formatRelativeDate(dispute.created_at);
  }, [dispute.created_at]);
  
  // Formater la date complète (mémorisée)
  const formatFullDate = useMemo(() => {
    return (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };
  }, []);

  // Déterminer le nom de l'autre partie (mémorisé)
  const otherPartyName = useMemo(() => {
    return isClient 
      ? dispute.freelance.full_name || dispute.freelance.username || 'Prestataire'
      : dispute.client.full_name || dispute.client.username || 'Client';
  }, [isClient, dispute.freelance, dispute.client]);

  // Format simplifié de l'ID pour l'affichage
  const shortenedId = useMemo(() => {
    return dispute.id.substring(0, 8) + '...';
  }, [dispute.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ translateY: -4 }}
      className="transition-all duration-300"
    >
      <Card className="overflow-hidden transition-all hover:shadow-lg border-slate-200 
                     hover:border-indigo-200 bg-white/95 backdrop-blur-sm
                     dark:bg-vynal-purple-dark/30 dark:border-vynal-purple-secondary/30 
                     dark:hover:border-vynal-accent-primary/30">
        <CardContent className="p-0">
          <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-vynal-purple-secondary/20">
            <div className="flex justify-between items-start mb-1 sm:mb-2">
              <div className="flex items-center">
                <div className="mr-1.5 sm:mr-2 bg-slate-50 dark:bg-vynal-purple-secondary/20 p-1 rounded-full">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400 dark:text-vynal-text-secondary" strokeWidth={2.5} />
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-vynal-text-secondary font-medium">
                  Ouverte le {formattedRelativeDate}
                </span>
              </div>
              {statusBadge}
            </div>
            
            <h3 className="font-semibold text-slate-800 dark:text-vynal-text-primary mt-1 sm:mt-2 mb-1 line-clamp-2 text-[10px] sm:text-xs">
              {dispute.reason.length > 50 ? dispute.reason.substring(0, 50) + '...' : dispute.reason}
            </h3>
            
            {/* Afficher la date de résolution si le litige est résolu */}
            {dispute.status === 'resolved' && dispute.resolved_at && (
              <div className="flex items-center mt-1 bg-emerald-50 dark:bg-emerald-900/10 py-0.5 px-1.5 rounded-md w-fit">
                <CheckCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-1 text-emerald-500 dark:text-emerald-400" strokeWidth={2.5} />
                <span className="text-[8px] sm:text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Résolu le {formatFullDate(dispute.resolved_at)}
                </span>
              </div>
            )}
            
            {/* Afficher la date de fermeture si le litige est fermé */}
            {dispute.status === 'closed' && dispute.closed_at && (
              <div className="flex items-center mt-1 bg-slate-50 dark:bg-slate-800/10 py-0.5 px-1.5 rounded-md w-fit">
                <XCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-1 text-slate-500 dark:text-slate-400" strokeWidth={2.5} />
                <span className="text-[8px] sm:text-[9px] text-slate-600 dark:text-slate-400 font-medium">
                  Fermé le {formatFullDate(dispute.closed_at)}
                </span>
              </div>
            )}
            
            <div className="mt-1.5 sm:mt-2">
              <div className="flex justify-between text-[9px] sm:text-[10px]">
                <div className="flex items-center bg-slate-50 dark:bg-vynal-purple-secondary/20 py-0.5 px-1.5 rounded-md">
                  <Shield className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-1 text-indigo-500 dark:text-indigo-400" strokeWidth={2.5} />
                  <span className="text-slate-700 dark:text-vynal-text-primary font-medium">{otherPartyName}</span>
                </div>
                
                <div className="flex items-center bg-slate-50 dark:bg-vynal-purple-secondary/20 py-0.5 px-1.5 rounded-md">
                  <span className="font-medium text-slate-500 dark:text-vynal-text-secondary">ID:</span> 
                  <span className="ml-1 text-slate-700 dark:text-vynal-text-primary">{shortenedId}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-2 sm:p-3 flex justify-start bg-white/50 dark:bg-vynal-purple-secondary/10 backdrop-blur-md border-t border-slate-100 dark:border-vynal-purple-secondary/20">
          <Link href={`/dashboard/disputes/${dispute.id}`} passHref>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-[9px] sm:text-[10px] h-6 sm:h-7 
                        bg-gradient-to-r from-vynal-accent-primary/10 to-vynal-accent-secondary/5 
                        hover:from-vynal-accent-primary/20 hover:to-vynal-accent-secondary/10 
                        border-vynal-accent-primary/30 text-vynal-accent-primary
                        dark:from-vynal-accent-primary/20 dark:to-vynal-accent-secondary/10
                        dark:hover:from-vynal-accent-primary/30 dark:hover:to-vynal-accent-secondary/20
                        dark:border-vynal-accent-primary/30 dark:text-vynal-accent-primary
                        shadow-sm hover:shadow"
            >
              <ExternalLink className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-1" strokeWidth={2.5} />
              Voir les détails
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// Mémoisation du composant pour éviter les re-rendus inutiles
export default memo(DisputeCard);