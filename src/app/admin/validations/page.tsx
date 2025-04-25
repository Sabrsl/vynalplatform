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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  Package, 
  Eye, 
  User, 
  Calendar
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

// Données factices pour démonstration
const SERVICES_DATA = [
  {
    id: '1',
    title: 'Développement de site web e-commerce',
    description: 'Création d\'un site e-commerce complet avec panier, paiement et gestion des stocks.',
    price: 1200,
    freelanceName: 'Marie Martin',
    freelanceId: '2',
    category: 'Développement web',
    submittedAt: '2023-11-20',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Design de logo et identité visuelle',
    description: 'Création d\'un logo professionnel et charte graphique complète pour votre entreprise.',
    price: 450,
    freelanceName: 'Emma Petit',
    freelanceId: '6', 
    category: 'Design graphique',
    submittedAt: '2023-11-22',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Rédaction de contenu SEO',
    description: 'Rédaction d\'articles optimisés pour le référencement naturel sur votre thématique.',
    price: 80,
    freelanceName: 'Chloé Leroy',
    freelanceId: '8',
    category: 'Rédaction',
    submittedAt: '2023-11-15',
    status: 'pending',
  },
  {
    id: '4',
    title: 'Développement d\'application mobile',
    description: 'Création d\'une application mobile native pour iOS et Android avec fonctionnalités avancées.',
    price: 3500,
    freelanceName: 'Sophie Moreau',
    freelanceId: '4',
    category: 'Développement mobile',
    submittedAt: '2023-11-18',
    status: 'pending',
  },
  {
    id: '5',
    title: 'Montage vidéo professionnel',
    description: 'Montage de vidéos promotionnelles pour votre entreprise avec effets et animations.',
    price: 350,
    freelanceName: 'Marie Martin',
    freelanceId: '2',
    category: 'Vidéo',
    submittedAt: '2023-11-25',
    status: 'pending',
  },
];

// Composant de carte de service
const ServiceCard = ({ 
  service, 
  onValidate, 
  onReject 
}: { 
  service: any, 
  onValidate: (id: string, feedback?: string) => void, 
  onReject: (id: string, reason: string) => void 
}) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showViewDialog, setShowViewDialog] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{service.title}</CardTitle>
          <Badge variant="outline" className="bg-yellow-500 text-white">
            En attente
          </Badge>
        </div>
        <CardDescription>
          <div className="flex items-center gap-1 text-sm">
            <Package className="h-3 w-3" />
            <span>{service.category}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {service.description}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-muted-foreground" />
            <span>{service.freelanceName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span>Soumis le {service.submittedAt}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <div className="text-lg font-semibold">
          {service.price} €
        </div>
        <div className="flex gap-2">
          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Détails
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{service.title}</DialogTitle>
                <DialogDescription>
                  Détails complets du service
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Freelance</h4>
                    <p className="text-sm">{service.freelanceName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Catégorie</h4>
                    <p className="text-sm">{service.category}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Prix</h4>
                    <p className="text-sm">{service.price} €</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Date de soumission</h4>
                    <p className="text-sm">{service.submittedAt}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm">{service.description}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Images du service</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Placeholder pour les images */}
                    {[1, 2, 3].map((_, i) => (
                      <div 
                        key={i} 
                        className="aspect-video bg-muted rounded-md flex items-center justify-center"
                      >
                        <span className="text-xs text-muted-foreground">Image {i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowViewDialog(false)}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            variant="default" 
            size="sm" 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => onValidate(service.id)}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Valider
          </Button>

          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Refuser
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refuser le service</DialogTitle>
                <DialogDescription>
                  Veuillez indiquer la raison du refus. Cette information sera transmise au freelance.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea
                  placeholder="Raison du refus..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRejectDialog(false)}
                >
                  Annuler
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    onReject(service.id, rejectionReason);
                    setShowRejectDialog(false);
                    setRejectionReason('');
                  }}
                  disabled={!rejectionReason.trim()}
                >
                  Confirmer le refus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default function ValidationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState(SERVICES_DATA);
  const [activeTab, setActiveTab] = useState('pending');

  // Filtrer les services en fonction des critères
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      searchTerm === '' || 
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.freelanceName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = service.status === activeTab;

    return matchesSearch && matchesStatus;
  });

  // Gérer la validation d'un service
  const handleValidate = (id: string, feedback?: string) => {
    setServices(prevServices => 
      prevServices.map(service => 
        service.id === id 
          ? { ...service, status: 'approved', feedback } 
          : service
      )
    );
  };

  // Gérer le refus d'un service
  const handleReject = (id: string, reason: string) => {
    setServices(prevServices => 
      prevServices.map(service => 
        service.id === id 
          ? { ...service, status: 'rejected', rejectionReason: reason } 
          : service
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Validation des services</h1>
        <p className="text-muted-foreground">
          Examinez et validez les services soumis par les freelances avant leur publication.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un service..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">
            {filteredServices.length} service(s) en attente
          </span>
        </div>
      </div>

      <Tabs defaultValue="pending" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex gap-1">
            <Clock className="h-4 w-4" />
            <span>En attente</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex gap-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>Validés</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex gap-1">
            <XCircle className="h-4 w-4" />
            <span>Refusés</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          {filteredServices.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map(service => (
                <ServiceCard 
                  key={service.id} 
                  service={service} 
                  onValidate={handleValidate}
                  onReject={handleReject}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
                <p>Aucun service en attente de validation.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="approved">
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <p>Les services validés apparaîtront ici.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rejected">
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40">
              <XCircle className="h-8 w-8 text-red-500 mb-2" />
              <p>Les services refusés apparaîtront ici.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 