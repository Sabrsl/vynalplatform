"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Users, FileText, BarChart, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const isFreelance = user?.user_metadata?.role === "freelance";

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Tableau de bord
      </h1>
      <p className="text-muted-foreground mb-8">
        Bienvenue sur votre espace personnel {isFreelance ? "freelance" : "client"}.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isFreelance ? "Revenus totaux" : "Dépenses totales"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(0)}</div>
            <p className="text-xs text-muted-foreground">
              +0% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isFreelance ? "Commandes reçues" : "Commandes passées"}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              0 en cours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isFreelance ? "Services publiés" : "Freelances contactés"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {isFreelance ? "0 actifs" : "0 favoris"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isFreelance ? "Taux de satisfaction" : "Satisfaction moyenne"}
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              0 avis
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>
              Vos dernières interactions sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 text-muted-foreground">
              Aucune activité récente à afficher
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Accès rapide aux fonctionnalités principales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isFreelance ? (
                <>
                  <a href="/dashboard/services/new" className="flex justify-between items-center p-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                    <span className="font-medium">Créer un nouveau service</span>
                    <ArrowUpRight className="h-5 w-5" />
                  </a>
                  <a href="/dashboard/orders" className="flex justify-between items-center p-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                    <span className="font-medium">Voir mes commandes en cours</span>
                    <ArrowUpRight className="h-5 w-5" />
                  </a>
                </>
              ) : (
                <>
                  <a href="/services" className="flex justify-between items-center p-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                    <span className="font-medium">Explorer les services</span>
                    <ArrowUpRight className="h-5 w-5" />
                  </a>
                  <a href="/dashboard/orders" className="flex justify-between items-center p-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                    <span className="font-medium">Voir mes commandes</span>
                    <ArrowUpRight className="h-5 w-5" />
                  </a>
                </>
              )}
              <a href="/dashboard/profile" className="flex justify-between items-center p-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <span className="font-medium">Compléter mon profil</span>
                <ArrowUpRight className="h-5 w-5" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 