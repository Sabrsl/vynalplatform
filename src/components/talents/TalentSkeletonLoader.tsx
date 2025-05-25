"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TalentSkeletonLoaderProps {
  count?: number;
  grid?: boolean;
  className?: string;
}

export default function TalentSkeletonLoader({
  count = 6,
  grid = false,
  className = ""
}: TalentSkeletonLoaderProps) {
  const skeletons = Array.from({ length: count }).map((_, index) => (
    <Card 
      key={index}
      className="overflow-hidden border-2 border-slate-200/80 dark:border-slate-700/30 bg-white/40 dark:bg-slate-900/30 backdrop-blur-sm rounded-lg h-[340px] w-full shadow-lg dark:shadow-sm"
    >
      <CardContent className="p-3 flex flex-col h-full">
        <div className="flex flex-col items-center text-center flex-grow space-y-2">
          {/* Avatar skeleton */}
          <Skeleton className="h-14 w-14 rounded-full mb-2 border-2 border-white/50 dark:border-slate-700/30" />
          
          {/* Nom et titre */}
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-20 mb-1" />
          
          {/* Nombre de services */}
          <Skeleton className="h-3 w-16 mb-1" />
          
          {/* Badge Top Rated */}
          <Skeleton className="h-5 w-24 rounded-lg mb-1" />
          
          {/* Rating */}
          <div className="flex items-center justify-center space-x-1 my-1">
            {[1,2,3,4,5].map((_, i) => (
              <Skeleton key={i} className="h-4 w-4 rounded-full" />
            ))}
            <Skeleton className="h-3 w-8 ml-1" />
          </div>
          
          {/* Bio */}
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-5/6 mb-1" />
        </div>
        
        {/* Bouton */}
        <Skeleton className="h-8 w-full mt-3 rounded-md" />
      </CardContent>
    </Card>
  ));

  return (
    <div 
      className={cn(
        grid 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        className
      )}
    >
      {skeletons}
    </div>
  );
} 