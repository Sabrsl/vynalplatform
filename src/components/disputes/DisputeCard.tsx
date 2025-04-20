import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DisputeWithDetails } from '@/lib/supabase/disputes';
import { AlertTriangle, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Étendre l'interface pour inclure les champs de date optionnels
interface DisputeWithTimestamps extends DisputeWithDetails {
  resolved_at?: string;
  closed_at?: string;
}

interface DisputeCardProps {
  dispute: DisputeWithTimestamps;
  isClient: boolean;
}

export function DisputeCard({ dispute, isClient }: DisputeCardProps) {
  // Détermine la couleur du badge en fonction du statut
  const getStatusBadge = () => {
    switch (dispute.status) {
      case 'open':
        return (
          <Badge className="bg-white text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30 text-[10px] sm:text-xs">
            <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
            Ouvert
          </Badge>
        );
      case 'resolved':
        return (
          <Badge className="bg-white text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30 text-[10px] sm:text-xs">
            <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
            Résolu
          </Badge>
        );
      case 'closed':
        return (
          <Badge className="bg-white text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30 text-[10px] sm:text-xs">
            <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
            Fermé
          </Badge>
        );
      default:
        return (
          <Badge className="bg-white text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30 text-[10px] sm:text-xs">
            {dispute.status}
          </Badge>
        );
    }
  };

  // Formater la date relative
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
  
  // Formater la date complète (jour, mois, année, heure, minute)
  const formatFullDate = (dateString: string) => {
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

  // Déterminer le nom de l'autre partie
  const otherPartyName = isClient 
    ? dispute.freelance.full_name || dispute.freelance.username || 'Prestataire'
    : dispute.client.full_name || dispute.client.username || 'Client';

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-vynal-accent-primary/40 border-slate-200 dark:border-vynal-purple-secondary/20">
      <CardContent className="p-0">
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-vynal-purple-secondary/20">
          <div className="flex justify-between items-start mb-1 sm:mb-2">
            <div className="flex items-center">
              <div className="mr-1.5 sm:mr-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 dark:text-vynal-text-secondary" />
              </div>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-vynal-text-secondary">
                Ouverte le {formatRelativeDate(dispute.created_at)}
              </span>
            </div>
            {getStatusBadge()}
          </div>
          
          <h3 className="font-semibold text-slate-800 mt-1 sm:mt-2 mb-1 dark:text-vynal-text-primary line-clamp-2 text-[11px] sm:text-sm">
            {dispute.reason.length > 50 ? dispute.reason.substring(0, 50) + '...' : dispute.reason}
          </h3>
          
          {/* Afficher la date de résolution si le litige est résolu */}
          {dispute.status === 'resolved' && dispute.resolved_at && (
            <div className="flex items-center mt-1">
              <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 text-emerald-500 dark:text-emerald-400" />
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-vynal-text-secondary">
                Résolu le {formatFullDate(dispute.resolved_at)}
              </span>
            </div>
          )}
          
          {/* Afficher la date de fermeture si le litige est fermé */}
          {dispute.status === 'closed' && dispute.closed_at && (
            <div className="flex items-center mt-1">
              <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 text-slate-500 dark:text-slate-400" />
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-vynal-text-secondary">
                Fermé le {formatFullDate(dispute.closed_at)}
              </span>
            </div>
          )}
          
          <div className="mt-1 sm:mt-2">
            <div className="flex justify-between text-[10px] sm:text-xs">
              <span className="text-slate-500 dark:text-vynal-text-secondary">
                <span className="font-medium text-slate-700 dark:text-vynal-text-primary">Avec:</span> {otherPartyName}
              </span>
              <span className="text-slate-500 dark:text-vynal-text-secondary">
                <span className="font-medium text-slate-700 dark:text-vynal-text-primary">ID:</span> {dispute.id.substring(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-2 sm:p-3 flex justify-start bg-white dark:bg-transparent border-t border-slate-100 dark:border-vynal-purple-secondary/10">
        <Link href={`/dashboard/disputes/${dispute.id}`} passHref>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-[10px] sm:text-xs h-7 sm:h-8 bg-gradient-to-r from-pink-100 to-pink-50 hover:from-pink-200 hover:to-pink-100 border-pink-200 text-pink-600 dark:bg-gradient-to-r dark:from-vynal-accent-primary/10 dark:to-vynal-accent-secondary/5 dark:border-vynal-accent-primary/30 dark:text-vynal-accent-secondary dark:hover:bg-vynal-accent-primary/20"
          >
            <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-1.5" />
            Voir les détails
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 