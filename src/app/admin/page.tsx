"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, Users, Package, AlertTriangle, MessageCircle } from 'lucide-react';

// Composant de statistique
const StatCard = ({ title, value, icon, description, trend }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  trend: 'up' | 'down' | 'neutral';
}) => {
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
      <CardFooter>
        <span className={`text-xs font-medium flex items-center gap-1 ${trendColor}`}>
          {trendIcon} {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{trend !== 'neutral' && '2.5%'} depuis le mois dernier
        </span>
      </CardFooter>
    </Card>
  );
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord administrateur</h1>
        <p className="text-muted-foreground">
          Bienvenue dans l'interface d'administration. Gérez votre plateforme et suivez les statistiques.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Statistiques principales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Utilisateurs actifs"
              value="1,248"
              icon={<Users className="h-4 w-4" />}
              description="Utilisateurs actifs ce mois-ci"
              trend="up"
            />
            <StatCard
              title="Services en attente"
              value="23"
              icon={<Package className="h-4 w-4" />}
              description="Services à valider"
              trend="down"
            />
            <StatCard
              title="Alertes système"
              value="4"
              icon={<AlertTriangle className="h-4 w-4" />}
              description="Alertes requérant attention"
              trend="neutral"
            />
            <StatCard
              title="Messages non lus"
              value="18"
              icon={<MessageCircle className="h-4 w-4" />}
              description="Messages du formulaire de contact"
              trend="up"
            />
          </div>

          {/* Activité récente et validations en attente */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>10 dernières activités sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <div key={index} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {index % 2 === 0 ? "Nouvel utilisateur inscrit" : "Nouveau service créé"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Il y a {Math.floor(Math.random() * 60)} minutes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Services à valider</CardTitle>
                <CardDescription>Services récemment soumis par des freelances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <div key={index} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          Service de {index % 3 === 0 ? "développement" : index % 3 === 1 ? "design" : "rédaction"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Soumis il y a {Math.floor(Math.random() * 24)} heures
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des performances</CardTitle>
              <CardDescription>
                Visualisez les tendances et performances de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground flex flex-col items-center">
                <TrendingUp className="h-16 w-16 mb-2" />
                <p>Graphiques d'analyse seront intégrés ici</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Rapports</CardTitle>
              <CardDescription>
                Générez et consultez les rapports administratifs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {["Utilisateurs", "Services", "Transactions", "Performance", "Alertes", "Audit"].map((report, index) => (
                  <Card key={index} className="hover:bg-accent/50 cursor-pointer transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">{report}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Rapport détaillé sur {report.toLowerCase()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 