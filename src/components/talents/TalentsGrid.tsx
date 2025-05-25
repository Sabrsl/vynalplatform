"use client";

import React, { memo } from 'react';
import TalentCard, { Talent } from './TalentCard';
import { cn } from "@/lib/utils";

interface TalentsGridProps {
  talents: Talent[];
  className?: string;
  isPriority?: boolean;
  onViewTalent?: (talentId: string) => void;
}

function TalentsGrid({
  talents,
  className = "",
  isPriority = false,
  onViewTalent
}: TalentsGridProps) {
  if (!talents || talents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-gray-600 mb-2">
          Aucun talent ne correspond à votre recherche
        </p>
        <p className="text-sm text-gray-500">
          Essayez de modifier vos filtres ou votre requête
        </p>
      </div>
    );
  }

  const enhancedTalents = talents.map(talent => ({
    ...talent,
    specialty: talent.specialty || talent.title,
    hourly_rate: talent.hourly_rate || 100,
    is_certified: talent.is_certified !== undefined ? talent.is_certified : true,
    certification_type: talent.certification_type || 'standard',
    completed_projects: talent.completed_projects || 0,
    services_count: talent.services_count || 0,
    rating: talent.rating || 0,
    review_count: talent.review_count || 0
  }));

  return (
    <div 
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3",
        className
      )}
    >
      {enhancedTalents.map((talent, index) => (
        <TalentCard
          key={talent.id || index}
          talent={talent}
          isPriority={isPriority && index < 8}
          onView={onViewTalent}
          className="h-[340px]"
        />
      ))}
    </div>
  );
}

export default memo(TalentsGrid); 