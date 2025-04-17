"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full overflow-hidden">
      {service.image_url && (
        <div className="relative h-48 w-full">
          <Image
            src={service.image_url}
            alt={service.title}
            fill
            className="object-cover"
          />
          {service.category && (
            <div className="absolute top-2 left-2">
              <Badge variant="outline" className="bg-white/80 text-slate-800 hover:bg-white/90">
                {service.category}
              </Badge>
            </div>
          )}
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl line-clamp-2">{service.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <div className="flex items-center gap-1">
                <div className="relative h-6 w-6 rounded-full overflow-hidden">
                  {service.freelance.avatar_url ? (
                    <Image
                      src={service.freelance.avatar_url}
                      alt={service.freelance.username || service.freelance.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-200 flex items-center justify-center text-xs">
                      {service.freelance.full_name?.charAt(0) || service.freelance.username?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
                <span className="text-sm">{service.freelance.full_name || service.freelance.username}</span>
                {service.freelance.rating && (
                  <div className="flex items-center ml-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-slate-600 ml-0.5">{service.freelance.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
            {service.price.toFixed(2)} €
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-sm text-slate-600 line-clamp-3 mb-4">
          {service.description}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-indigo-600" />
            <span>{service.delivery_time} jours</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-indigo-600" />
            <span>Livraison rapide</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
            <span>Révisions incluses</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
            <span>Garantie satisfait</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 