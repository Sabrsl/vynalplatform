"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Clock, DollarSign, CheckCircle, Calendar, Star } from "lucide-react";

interface ServiceSummaryProps {
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    delivery_time: number;
    freelance: {
      username: string;
      full_name: string;
      avatar_url?: string;
      rating?: number;
    };
    image_url?: string;
    category?: string;
  };
}

export function ServiceSummary({ service }: ServiceSummaryProps) {
  return (
    <Card className="w-full overflow-hidden bg-white/70 dark:bg-slate-900/30 border-slate-300 dark:border-slate-700/30 shadow-sm">
      {service.image_url && (
        <div className="relative h-48 w-full">
          <Image
            src={service.image_url}
            alt={service.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={true}
          />
          {service.category && (
            <div className="absolute top-2 left-2">
              <Badge
                variant="outline"
                className="bg-white/70 dark:bg-slate-800/40 text-slate-800 dark:text-vynal-text-primary border-slate-300 dark:border-slate-700/30 hover:bg-white/80 dark:hover:bg-slate-800/50"
              >
                {service.category}
              </Badge>
            </div>
          )}
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl line-clamp-2 text-slate-800 dark:text-vynal-text-primary">
              {service.title}
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <div className="flex items-center gap-1">
                <div className="relative h-6 w-6 rounded-full overflow-hidden">
                  {service.freelance.avatar_url ? (
                    <Image
                      src={service.freelance.avatar_url}
                      alt={
                        service.freelance.username ||
                        service.freelance.full_name
                      }
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-white/50 dark:bg-slate-800/25 flex items-center justify-center text-xs text-slate-800 dark:text-vynal-text-secondary">
                      {service.freelance.full_name?.charAt(0) ||
                        service.freelance.username?.charAt(0) ||
                        "U"}
                    </div>
                  )}
                </div>
                <span className="text-sm text-slate-800 dark:text-vynal-text-secondary font-medium">
                  {service.freelance.full_name || service.freelance.username}
                </span>
                {service.freelance.rating && (
                  <div className="flex items-center ml-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-xs text-slate-800 dark:text-vynal-text-secondary ml-0.5 font-medium">
                      {service.freelance.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="bg-slate-100/70 dark:bg-slate-800/30 text-slate-800 dark:text-vynal-text-secondary border-slate-300 dark:border-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-800/40 font-medium"
          >
            {service.price.toFixed(2)} €
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-sm text-slate-800 dark:text-vynal-text-secondary line-clamp-3 mb-4">
          {service.description}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-slate-800 dark:text-vynal-text-secondary">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-vynal-accent-primary dark:text-vynal-accent-primary" />
            <span className="font-medium">{service.delivery_time} jours</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-vynal-accent-primary dark:text-vynal-accent-primary" />
            <span className="font-medium">Livraison rapide</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-1 text-vynal-accent-primary dark:text-vynal-accent-primary" />
            <span className="font-medium">Révisions incluses</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-vynal-accent-primary dark:text-vynal-accent-primary" />
            <span className="font-medium">Garantie satisfait</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
