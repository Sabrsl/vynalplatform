"use client";

import React, { useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Briefcase, CheckCircle, Award, Calendar, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/utils";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import Link from 'next/link';

// Type pour représenter un talent (freelance)
export interface Talent {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  skills?: Array<{ name: string }>;
  location?: string;
  hourly_rate?: number;
  currency_code?: string;
  rating?: number;
  review_count?: number;
  is_certified?: boolean;
  certification_type?: 'standard' | 'premium' | 'expert' | null;
  completed_projects?: number;
  years_experience?: number;
  availability?: 'available' | 'limited' | 'unavailable';
  response_time?: number; // en heures
  services_count?: number;
  title?: string; // Titre professionnel (ex: AI Consultant)
  specialty?: string; // Spécialité du freelance
}

interface TalentCardProps {
  talent: Talent;
  isPriority?: boolean;
  className?: string;
  onView?: (talentId: string) => void;
}

// Badge pour Top Rated ou Top Rated Plus
const TopRatedBadge = memo(({ type }: { type?: 'standard' | 'plus' }) => {
  const isPlus = type === 'plus';
  const bgColor = isPlus 
    ? 'bg-vynal-accent-primary/20 dark:bg-vynal-accent-primary/10' 
    : 'bg-slate-100/40 dark:bg-slate-800/30';
  const textColor = isPlus 
    ? 'text-vynal-accent-primary font-medium' 
    : 'text-slate-800 dark:text-vynal-text-primary';
  
  return (
    <Badge className={`${bgColor} ${textColor} text-xs py-1 px-2 rounded-lg border border-vynal-accent-primary/30 dark:border-vynal-accent-primary/20 hover:bg-vynal-accent-primary/25 dark:hover:bg-vynal-accent-primary/20 transition-all duration-200`}>
      {isPlus ? 'Certifié Expert' : 'Top Rated'}
    </Badge>
  );
});

TopRatedBadge.displayName = 'TopRatedBadge';

// Composant d'évaluation (rating) avec nombre de jobs
const RatingWithJobs = memo(({ rating, reviewCount }: { rating?: number; reviewCount?: number }) => {
  const displayRating = rating || 0;
  const displayReviewCount = reviewCount || 0;
  return (
    <div className="flex items-center text-sm my-2 text-slate-700 dark:text-vynal-text-secondary justify-center">
      {[0,1,2,3,4].map(idx => (
        <Star
          key={idx}
          className={
            displayReviewCount === 0
              ? "h-4 w-4 text-slate-400 dark:text-slate-700"
              : idx < Math.round(displayRating)
                ? "h-4 w-4 text-vynal-accent-primary fill-vynal-accent-primary"
                : "h-4 w-4 text-slate-400 dark:text-slate-700"
          }
        />
      ))}
      <span className="ml-1 text-xs text-slate-600 dark:text-vynal-text-secondary">({displayReviewCount})</span>
    </div>
  );
});

RatingWithJobs.displayName = 'RatingWithJobs';

// Composant principal TalentCard
function TalentCard({
  talent,
  isPriority = false,
  className = "",
  onView
}: TalentCardProps) {
  const router = useRouter();
  const [avatarError, setAvatarError] = useState(false);
  
  const handleAvatarError = useCallback(() => {
    setAvatarError(true);
  }, []);
  
  const handleCardClick = useCallback(() => {
    if (onView && talent.id) {
      onView(talent.id);
    } else if (talent.id) {
      router.push(`/profile/id/${talent.id}`);
    }
  }, [talent.id, onView, router]);
  
  // Préparation des informations à afficher
  const displayName = talent.full_name || talent.username || "Freelance";
  const displayTitle = talent.specialty || talent.title || "Consultant(e)";
  const initials = displayName.charAt(0).toUpperCase();
  const nbServices = talent.services_count || 0;
  
  // Déterminer si le talent est Top Rated ou Top Rated Plus
  const topRatedType = talent.is_certified 
    ? (talent.certification_type === 'expert' ? 'plus' : 'standard') 
    : undefined;
  
  // Calculer le prix pour 30 minutes
  const price30Min = talent.hourly_rate ? (talent.hourly_rate / 2) : 50;
  
  return (
    <Card 
      className={cn(
        "overflow-hidden border-2 border-slate-300/85 dark:border-slate-700/30 bg-white/40 dark:bg-slate-900/30 hover:border-slate-400/85 dark:hover:border-slate-700/40 hover:shadow-lg dark:hover:shadow-sm transition-all duration-200 cursor-pointer backdrop-blur-sm rounded-lg h-[340px] w-full shadow-lg dark:shadow-sm",
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-3 flex flex-col h-full">
        <div className="flex flex-col items-center text-center flex-grow space-y-2">
          {/* Avatar du freelance */}
          <Avatar 
            className="h-14 w-14 mb-2 border-2 border-white/50 dark:border-slate-700/30 shadow-sm"
          >
            <AvatarImage
              src={!avatarError ? talent.avatar_url : undefined}
              alt={`Photo de profil de ${displayName} - ${displayTitle}`}
              onError={handleAvatarError}
              width={56}
              height={56}
              loading={isPriority ? "eager" : "lazy"}
              decoding="async"
              sizes="(max-width: 768px) 56px, 56px"
            />
            <AvatarFallback className="text-lg bg-vynal-accent-primary/20 dark:bg-vynal-accent-primary/10 text-vynal-accent-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          {/* Nom et titre */}
          <h3 className="text-sm font-bold text-slate-900 dark:text-vynal-text-primary">
            {displayName}
          </h3>
          <p className="text-slate-700 dark:text-vynal-text-secondary text-xs">{displayTitle}</p>
          {/* Nombre de services */}
          <p className="text-xs text-slate-700 dark:text-vynal-text-secondary">{nbServices} service{nbServices > 1 ? 's' : ''}</p>
          
          {/* Badge Top Rated */}
          {topRatedType && (
            <div className="my-1">
              <TopRatedBadge type={topRatedType} />
            </div>
          )}
          
          {/* Évaluation avec étoiles et nombre d'avis */}
          <RatingWithJobs 
            rating={talent.rating} 
            reviewCount={talent.review_count}
          />
          
          {/* Bio courte */}
          {talent.bio && (
            <p className="text-[10px] text-slate-700 dark:text-vynal-text-secondary line-clamp-3 h-12 min-h-[48px]">
              {talent.bio}
            </p>
          )}
        </div>
        
        {/* Bouton voir */}
        <Button 
          variant="outline" 
          className="w-full border-vynal-accent-primary/40 dark:border-vynal-accent-primary/30 text-vynal-accent-primary hover:bg-vynal-accent-primary/25 dark:hover:bg-vynal-accent-primary/20 py-1 text-xs h-8 mt-3"
        >
          Voir
        </Button>
      </CardContent>
    </Card>
  );
}

export default memo(TalentCard); 