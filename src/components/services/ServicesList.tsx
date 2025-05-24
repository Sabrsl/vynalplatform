"use client";

import React, { memo, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronRight, ImageIcon, Clock, Check } from "lucide-react";
import { CertificationBadge } from '@/components/ui/certification-badge';
import { PriceDisplay } from './PriceDisplay';
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ServiceWithFreelanceAndCategories } from "@/hooks/useServices";

// Types
interface ExtendedService extends ServiceWithFreelanceAndCategories {
  images?: string[];
  short_description?: string;
  admin_notes?: string | null;
  slug?: string;
  delivery_time?: number;
  revision_count?: number;
  bookings_count?: number;
}

interface ServicesListProps {
  services: ExtendedService[];
  className?: string;
  showStatusBadge?: boolean;
  isPriority?: boolean;
}

interface ServiceListItemProps {
  service: ExtendedService;
  showStatusBadge?: boolean;
  isPriority?: boolean;
}

// Constants
const STATUS_STYLES = {
  approved: "bg-green-500/80 text-white border-green-500/50",
  pending: "bg-amber-500/80 text-white border-amber-500/50",
  rejected: "bg-red-500/80 text-white border-red-500/50"
} as const;

const STATUS_LABELS = {
  approved: 'Approuvé',
  pending: 'En attente',
  rejected: 'Rejeté'
} as const;

// Custom hooks
const useImageError = () => {
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  const handleError = (key: string) => {
    setErrors(prev => ({ ...prev, [key]: true }));
  };
  
  const hasError = (key: string) => errors[key] || false;
  
  return { handleError, hasError };
};

// Memoized components
const ServiceRating = memo(({ service }: { service: ExtendedService }) => (
  <div className="flex items-center">
    <div className="flex">
      {[...Array(5)].map((_, idx) => (
        <Star
          key={idx}
          className={cn(
            "w-2 h-2 sm:w-2.5 sm:h-2.5",
            idx < (service.rating || 0)
              ? "text-pink-500 fill-pink-500"
              : "text-pink-200 dark:text-pink-300/50"
          )}
        />
      ))}
    </div>
    <span className="ml-0.5 text-[7px] sm:text-[9px] text-gray-500 dark:text-vynal-text-secondary">
      ({service.bookings_count || 0})
    </span>
  </div>
));

ServiceRating.displayName = 'ServiceRating';

const ServiceMetrics = memo(({ deliveryTime, revisionCount }: { deliveryTime?: number; revisionCount?: number; }) => {
  if (!deliveryTime && !revisionCount) return null;
  
  return (
    <div className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-[9px] text-gray-500 dark:text-vynal-text-secondary">
      {deliveryTime && (
        <div className="flex items-center">
          <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" />
          <span>{deliveryTime}j</span>
        </div>
      )}
      {revisionCount && (
        <div className="flex items-center">
          <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" />
          <span>{revisionCount} rév.</span>
        </div>
      )}
    </div>
  );
});

ServiceMetrics.displayName = 'ServiceMetrics';

const ServiceListItem = memo<ServiceListItemProps>(({ 
  service, 
  showStatusBadge = false,
  isPriority = false
}) => {
  const { handleError, hasError } = useImageError();
  
  // Memoized values
  const mainImage = useMemo(() => 
    service.images?.[0] || null,
    [service.images]
  );
  
  const serviceUrl = useMemo(() => 
    service.slug 
      ? `/services/${service.slug}` 
      : `/services/details/${service.id}`,
    [service.slug, service.id]
  );
  
  const profileInitial = useMemo(() => 
    service.profiles?.full_name?.[0] || 
    service.profiles?.username?.[0] || 
    'V',
    [service.profiles]
  );
  
  const profileName = useMemo(() => 
    service.profiles?.full_name || 
    service.profiles?.username || 
    'Vendeur',
    [service.profiles]
  );

  const cleanDescription = useMemo(() => {
    const desc = service.short_description || service.description || '';
    return desc.replace(/^introduction\s*:?\s*/i, '').trim();
  }, [service.short_description, service.description]);

  return (
    <Card className="w-full bg-white/30 dark:bg-slate-900/30 shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 dark:border-slate-700/30 overflow-hidden">
      <Link 
        href={serviceUrl} 
        className="focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary/50 group"
        prefetch={isPriority}
      >
        <CardContent className="p-0">
          <div className="flex w-full h-20 sm:h-28">
            {/* Service Thumbnail */}
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 rounded-l-md overflow-hidden bg-white/20 dark:bg-slate-800/25">
              {!hasError('main') && mainImage ? (
                <Image
                  src={mainImage}
                  alt={service.title}
                  className="object-cover w-full h-full"
                  width={112}
                  height={112}
                  onError={() => handleError('main')}
                  priority={isPriority}
                  loading={isPriority ? 'eager' : 'lazy'}
                  sizes="(max-width: 640px) 80px, 112px"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-white/20 dark:bg-slate-800/25">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 dark:text-vynal-text-secondary/60"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
              
              {/* Price Badge */}
              <div className="absolute bottom-1 left-1">
                <PriceDisplay 
                  price={service.price}
                  variant="badge"
                  showFixedIndicator={false}
                  badgeClassName="bg-white/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/30 text-slate-700 dark:text-vynal-text-primary"
                />
              </div>
            </div>
            
            {/* Service Content */}
            <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between bg-white/25 dark:bg-slate-900/20">
              <div>
                <h3 className="text-[10px] sm:text-sm font-medium text-slate-800 dark:text-vynal-text-primary line-clamp-1">
                  {service.title}
                </h3>
                <p className="text-[8px] sm:text-xs text-slate-600 dark:text-vynal-text-secondary line-clamp-2 mt-0.5">
                  {cleanDescription}
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  <Avatar className="w-4 h-4 sm:w-5 sm:h-5 border border-slate-200 dark:border-slate-700/30">
                    <AvatarImage src={service.profiles?.avatar_url || ''} />
                    <AvatarFallback className="text-[8px] sm:text-[10px] bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-vynal-text-primary">
                      {profileInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[8px] sm:text-[10px] text-slate-600 dark:text-vynal-text-secondary">
                    {profileName}
                  </span>
                  {service.profiles?.is_certified && service.profiles?.certification_type && (
                    <CertificationBadge 
                      type={service.profiles.certification_type as 'standard' | 'premium' | 'expert'} 
                      size="xs"
                    />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <ServiceRating service={service} />
                  <ServiceMetrics 
                    deliveryTime={service.delivery_time}
                    revisionCount={service.revision_count}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
});

ServiceListItem.displayName = 'ServiceListItem';

// Main component
const ServicesList: React.FC<ServicesListProps> = ({
  services,
  className = "",
  showStatusBadge = false,
  isPriority = false
}) => {
  if (!services?.length) {
    return (
      <div className="w-full p-8 text-center">
        <p className="text-gray-500 dark:text-vynal-text-secondary">
          Aucun service disponible
        </p>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {services.map((service, index) => (
        <ServiceListItem
          key={service.id}
          service={service}
          showStatusBadge={showStatusBadge}
          isPriority={isPriority && index < 5}
        />
      ))}
    </div>
  );
};

export default memo(ServicesList);