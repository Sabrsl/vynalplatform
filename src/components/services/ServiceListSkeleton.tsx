"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceListSkeletonProps {
  count?: number;
  className?: string;
}

const ServiceListSkeleton = ({ count = 3, className = "" }: ServiceListSkeletonProps) => {
  return (
    <div className={`w-full space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card 
          key={index}
          className="w-full bg-white dark:bg-vynal-purple-darkest/80 border border-gray-100 dark:border-vynal-purple-secondary/20 overflow-hidden"
        >
          <CardContent className="p-0">
            <div className="flex w-full h-20 sm:h-28">              {/* Miniature du service (placeholder) */}              <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 rounded-l-md overflow-hidden bg-gray-100 dark:bg-vynal-purple-darkest/50">                <Skeleton className="w-full h-full" />                                {/* Badge de prix (placeholder) */}                <div className="absolute bottom-1 left-1">                  <Skeleton className="h-4 sm:h-5 w-12 sm:w-14 rounded-full" />                </div>              </div>                            {/* Contenu du service (placeholder format compact) */}              <div className="flex flex-col flex-grow p-2 sm:p-3 relative overflow-hidden">                {/* Titre (placeholder) */}                <div className="flex items-start justify-between">                  <Skeleton className="h-4 sm:h-5 w-3/4" />                </div>                                {/* Description courte (placeholder) */}                <div className="mt-1">                  <Skeleton className="h-2.5 sm:h-3 w-full" />                </div>                                {/* Rangée d'informations (placeholder) */}                <div className="flex items-center justify-between mt-1 sm:mt-2">                  <div className="flex items-center">                    <Skeleton className="h-2 sm:h-3 w-16 sm:w-20" />                    <div className="mx-1" />                    <Skeleton className="h-2 sm:h-3 w-16 sm:w-24" />                  </div>                                    <div className="flex items-center">                    <Skeleton className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full mr-0.5 sm:mr-1" />                    <Skeleton className="h-2 sm:h-3 w-12 sm:w-16" />                  </div>                </div>                                {/* Indicateurs et évaluation (placeholder) */}                <div className="flex items-center justify-between mt-1 sm:mt-2">                  <div className="flex items-center gap-1 sm:gap-2">                    <Skeleton className="h-2 sm:h-3 w-8 sm:w-12" />                    <Skeleton className="h-2 sm:h-3 w-10 sm:w-14" />                  </div>                                    <div>                    <Skeleton className="h-2 sm:h-3 w-12 sm:w-16" />                  </div>                </div>              </div>            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ServiceListSkeleton; 