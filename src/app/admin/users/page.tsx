"use client";

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  MoreHorizontal, 
  Search, 
  RefreshCw, 
  UserPlus, 
  User, 
  UserCheck, 
  UserX, 
  Filter
} from 'lucide-react';

// Données factices pour démonstration
const USERS_DATA = [
  { 
    id: '1', 
    name: 'Jean Dupont', 
    email: 'jean.dupont@example.com', 
    role: 'client',
    status: 'active',
    createdAt: '2023-10-15',
    lastActive: '2023-11-28',
  },
  { 
    id: '2', 
    name: 'Marie Martin', 
    email: 'marie.martin@example.com', 
    role: 'freelance',
    status: 'active',
    createdAt: '2023-09-22',
    lastActive: '2023-11-25',
  },
  { 
    id: '3', 
    name: 'Pierre Richard', 
    email: 'pierre.richard@example.com', 
    role: 'admin',
    status: 'active',
    createdAt: '2023-08-05',
    lastActive: '2023-11-27',
  },
  { 
    id: '4', 
    name: 'Sophie Moreau', 
    email: 'sophie.moreau@example.com', 
    role: 'freelance',
    status: 'pending',
    createdAt: '2023-11-10',
    lastActive: '2023-11-10',
  },
  { 
    id: '5', 
    name: 'Lucas Bernard', 
    email: 'lucas.bernard@example.com', 
    role: 'client',
    status: 'inactive',
    createdAt: '2023-07-18',
    lastActive: '2023-10-05',
  },
  { 
    id: '6', 
    name: 'Emma Petit', 
    email: 'emma.petit@example.com', 
    role: 'freelance',
    status: 'active',
    createdAt: '2023-10-28',
    lastActive: '2023-11-26',
  },
  { 
    id: '7', 
    name: 'Thomas Durand', 
    email: 'thomas.durand@example.com', 
    role: 'client',
    status: 'active',
    createdAt: '2023-09-12',
    lastActive: '2023-11-15',
  },
  { 
    id: '8', 
    name: 'Chloé Leroy', 
    email: 'chloe.leroy@example.com', 
    role: 'freelance',
    status: 'suspended',
    createdAt: '2023-08-30',
    lastActive: '2023-11-02',
  },
];

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  
  // Filtrer les utilisateurs en fonction des critères
  const filteredUsers = USERS_DATA.filter(user => {
    const matchesSearch = 
      searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === null || user.role === selectedRole;
    const matchesStatus = selectedStatus === null || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Fonction pour obtenir la couleur du badge de statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'inactive': return 'bg-gray-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Fonction pour obtenir l'icône de rôle
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <User className="h-4 w-4 text-primary mr-1" />;
      case 'freelance': return <UserCheck className="h-4 w-4 text-blue-500 mr-1" />;
      case 'client': return <UserPlus className="h-4 w-4 text-green-500 mr-1" />;
      default: return <User className="h-4 w-4 mr-1" />;
    }
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRole(null);
    setSelectedStatus(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground">
          Gérez les utilisateurs de la plateforme, modifiez leurs informations et leurs droits.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Utilisateurs</CardTitle>
              <CardDescription>
                Liste complète des utilisateurs enregistrés sur la plateforme
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-[130px] justify-between">
                    {selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : "Rôle"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedRole(null)}>
                    Tous les rôles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedRole('client')}>
                    Client
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedRole('freelance')}>
                    Freelance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedRole('admin')}>
                    Admin
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-[130px] justify-between">
                    {selectedStatus ? selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1) : "Statut"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedStatus(null)}>
                    Tous les statuts
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('active')}>
                    Actif
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('pending')}>
                    En attente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('inactive')}>
                    Inactif
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('suspended')}>
                    Suspendu
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tableau des utilisateurs */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date inscription</TableHead>
                  <TableHead>Dernière activité</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusColor(user.status)} text-white`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.createdAt}</TableCell>
                      <TableCell>{user.lastActive}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Voir détails</DropdownMenuItem>
                            <DropdownMenuItem>Modifier</DropdownMenuItem>
                            <DropdownMenuItem>Changer rôle</DropdownMenuItem>
                            <DropdownMenuItem>Changer statut</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 