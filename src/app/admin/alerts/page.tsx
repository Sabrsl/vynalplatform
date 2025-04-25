"use client";

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  CheckCircle2,
  Info,
  Search,
  RefreshCw,
  Eye,
  XCircle,
  ArrowUpDown,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Données factices pour démonstration
const ALERTS_DATA = [
  {
    id: '1',
    title: 'Problème de connexion à la base de données',
    description: 'Connexion à la base de données interrompue pendant 5 minutes',
    type: 'error',
    source: 'system',
    timestamp: '2023-11-28T10:23:15',
    status: 'active',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Trafic élevé sur le serveur',
    description: 'Le serveur connaît un pic de trafic inhabituel',
    type: 'warning',
    source: 'monitoring',
    timestamp: '2023-11-28T09:45:30',
    status: 'active',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Tâche de sauvegarde terminée',
    description: 'La sauvegarde quotidienne s\'est terminée avec succès',
    type: 'info',
    source: 'system',
    timestamp: '2023-11-28T03:15:00',
    status: 'resolved',
    priority: 'low',
  },
  {
    id: '4',
    title: 'Espace disque faible',
    description: 'Le serveur dispose de moins de 10% d\'espace disque disponible',
    type: 'warning',
    source: 'system',
    timestamp: '2023-11-27T22:10:45',
    status: 'active',
    priority: 'high',
  },
  {
    id: '5',
    title: 'Erreur de paiement',
    description: 'Plusieurs transactions ont échoué en raison d\'un problème avec le service de paiement',
    type: 'error',
    source: 'payment',
    timestamp: '2023-11-27T18:30:22',
    status: 'active',
    priority: 'high',
  },
  {
    id: '6',
    title: 'Maintenance planifiée',
    description: 'Une maintenance du système est planifiée pour demain à 02:00 UTC',
    type: 'info',
    source: 'admin',
    timestamp: '2023-11-27T15:45:10',
    status: 'active',
    priority: 'medium',
  },
  {
    id: '7',
    title: 'Tentatives de connexion suspectes',
    description: 'Plusieurs tentatives de connexion échouées détectées depuis la même adresse IP',
    type: 'warning',
    source: 'security',
    timestamp: '2023-11-27T12:20:33',
    status: 'investigating',
    priority: 'high',
  },
  {
    id: '8',
    title: 'Service de messagerie indisponible',
    description: 'Le service de messagerie est temporairement indisponible',
    type: 'error',
    source: 'system',
    timestamp: '2023-11-27T11:05:18',
    status: 'resolved',
    priority: 'high',
  },
];

// Fonction pour formater la date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Fonction pour obtenir l'icône selon le type d'alerte
const getAlertIcon = (type: string) => {
  switch (type) {
    case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'info': return <Info className="h-4 w-4 text-blue-500" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

// Fonction pour obtenir la couleur du badge selon le statut
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active': 
      return <Badge variant="outline" className="bg-red-500 text-white">Actif</Badge>;
    case 'investigating': 
      return <Badge variant="outline" className="bg-blue-500 text-white">En cours d'investigation</Badge>;
    case 'resolved': 
      return <Badge variant="outline" className="bg-green-500 text-white">Résolu</Badge>;
    default: 
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Fonction pour obtenir la couleur du badge selon la priorité
const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high': 
      return <Badge variant="outline" className="bg-red-500 text-white">Haute</Badge>;
    case 'medium': 
      return <Badge variant="outline" className="bg-amber-500 text-white">Moyenne</Badge>;
    case 'low': 
      return <Badge variant="outline" className="bg-green-500 text-white">Basse</Badge>;
    default: 
      return <Badge variant="outline">{priority}</Badge>;
  }
};

export default function AlertsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts] = useState(ALERTS_DATA);
  const [activeTab, setActiveTab] = useState('all');
  const [currentAlert, setCurrentAlert] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Filtrer les alertes selon les critères
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      searchTerm === '' || 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      activeTab === 'all' || 
      (activeTab === 'active' && alert.status === 'active') ||
      (activeTab === 'investigating' && alert.status === 'investigating') ||
      (activeTab === 'resolved' && alert.status === 'resolved');

    return matchesSearch && matchesStatus;
  });

  // Fonction pour marquer une alerte comme résolue
  const markAsResolved = (id: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === id ? { ...alert, status: 'resolved' } : alert
      )
    );
    setShowDetailsDialog(false);
  };

  // Fonction pour marquer une alerte comme en cours d'investigation
  const markAsInvestigating = (id: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === id ? { ...alert, status: 'investigating' } : alert
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alertes système</h1>
        <p className="text-muted-foreground">
          Surveillez et gérez les alertes système pour assurer le bon fonctionnement de la plateforme.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des alertes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="flex gap-1">
            <Bell className="h-4 w-4" />
            <span>Toutes</span>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex gap-1">
            <AlertCircle className="h-4 w-4" />
            <span>Actives</span>
          </TabsTrigger>
          <TabsTrigger value="investigating" className="flex gap-1">
            <Clock className="h-4 w-4" />
            <span>En investigation</span>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex gap-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>Résolues</span>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Liste des alertes</CardTitle>
            <CardDescription>
              {filteredAlerts.length} alerte(s) {activeTab !== 'all' ? activeTab : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead className="w-[140px]">
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px]">Source</TableHead>
                    <TableHead className="w-[130px]">Priorité</TableHead>
                    <TableHead className="w-[160px]">Statut</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>{getAlertIcon(alert.type)}</TableCell>
                        <TableCell className="font-medium">{alert.title}</TableCell>
                        <TableCell>{formatDate(alert.timestamp)}</TableCell>
                        <TableCell>
                          <span className="capitalize">{alert.source}</span>
                        </TableCell>
                        <TableCell>{getPriorityBadge(alert.priority)}</TableCell>
                        <TableCell>{getStatusBadge(alert.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentAlert(alert);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Détails</span>
                            </Button>
                            {alert.status !== 'resolved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsResolved(alert.id)}
                                className="text-green-500"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="sr-only">Marquer comme résolu</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Aucune alerte trouvée.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Tabs>

      {/* Dialogue de détails d'alerte */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentAlert && getAlertIcon(currentAlert?.type)} 
              {currentAlert?.title}
            </DialogTitle>
            <DialogDescription>
              Détails de l'alerte
            </DialogDescription>
          </DialogHeader>
          
          {currentAlert && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Source</h4>
                  <p className="text-sm capitalize">{currentAlert.source}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Date</h4>
                  <p className="text-sm">{formatDate(currentAlert.timestamp)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Priorité</h4>
                  <div>{getPriorityBadge(currentAlert.priority)}</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Statut</h4>
                  <div>{getStatusBadge(currentAlert.status)}</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm">{currentAlert.description}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Historique des actions</h4>
                <div className="text-sm space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  <p className="text-sm text-muted-foreground">Alerte créée le {formatDate(currentAlert.timestamp)}</p>
                  {currentAlert.status === 'investigating' && (
                    <p className="text-sm text-muted-foreground">Investigation démarrée</p>
                  )}
                  {currentAlert.status === 'resolved' && (
                    <p className="text-sm text-muted-foreground">Résolu</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDetailsDialog(false)}
            >
              Fermer
            </Button>
            {currentAlert && currentAlert.status === 'active' && (
              <Button 
                variant="default"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => markAsInvestigating(currentAlert.id)}
              >
                <Clock className="h-4 w-4 mr-2" />
                Marquer en investigation
              </Button>
            )}
            {currentAlert && currentAlert.status !== 'resolved' && (
              <Button 
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => markAsResolved(currentAlert.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marquer comme résolu
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 