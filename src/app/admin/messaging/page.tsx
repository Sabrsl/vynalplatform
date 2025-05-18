"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  MessageSquare,
  Search,
  Flag,
  Eye,
  ArrowUpDown,
  UserCircle,
  AlertTriangle,
  CheckCircle,
  Send,
  RefreshCw,
  X,
  AlertCircle,
  Mail
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  getCachedData, 
  setCachedData, 
  CACHE_EXPIRY, 
  CACHE_KEYS
} from '@/lib/optimizations';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Interface pour les messages de contact
interface ContactMessage {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'in_progress' | 'archived' | 'completed';
  handled_by: string | null;
  handled_at: string | null;
}

// Interface pour les réponses aux messages
interface ContactMessageResponse {
  id: string;
  created_at: string;
  message_id: string;
  response_text: string;
  responded_by: string | null;
  read_at: string | null;
}

// Fonction pour formater la date
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Fonction pour obtenir le badge de statut
const getStatusBadge = (status: string = 'unread') => {
  switch (status) {
    case 'unread': 
      return <Badge variant="outline" className="bg-blue-500 text-white">Non lu</Badge>;
    case 'read': 
      return <Badge variant="outline" className="bg-green-500 text-white">Lu</Badge>;
    case 'in_progress': 
      return <Badge variant="outline" className="bg-amber-500 text-white">En cours</Badge>;
    case 'archived': 
      return <Badge variant="outline" className="bg-gray-500 text-white">Archivé</Badge>;
    case 'completed': 
      return <Badge variant="outline" className="bg-purple-500 text-white">Complété</Badge>;
    default: 
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function MessagingPage() {
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [responses, setResponses] = useState<ContactMessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentMessage, setCurrentMessage] = useState<ContactMessage | null>(null);
  const [showMessagePopover, setShowMessagePopover] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Charger les messages depuis Supabase avec cache
  const fetchMessages = useCallback(async (forceFetch = false) => {
    try {
      setLoading(true);
      
      // Vérifier s'il y a un cache récent (sauf si forceFetch est true)
      if (!forceFetch) {
        const cachedData = getCachedData<ContactMessage[]>('admin_contact_messages');
        if (cachedData) {
          setContactMessages(cachedData);
          setLoading(false);
          return;
        }
      }
      
      // Requête pour récupérer tous les messages de contact
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      console.log(`[DEBUG] Récupération de ${data.length} messages de contact au total`);
      
      // Mettre en cache les données pour 30 minutes (messages semi-dynamiques)
      setCachedData(
        'admin_contact_messages', 
        data, 
        { expiry: CACHE_EXPIRY.MEDIUM, priority: 'medium' }
      );

      setContactMessages(data);
    } catch (error) {
      console.error('Erreur lors du chargement des messages de contact:', error);
      setError('Impossible de charger les messages de contact. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Forcer le rafraîchissement des données
  const handleRefresh = () => {
    fetchMessages(true);
    toast({
      title: "Actualisation",
      description: "Les messages ont été actualisés"
    });
  };
  
  // Chargement initial
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Charger les réponses d'un message avec cache
  const loadResponses = async (messageId: string, forceFetch = false) => {
    try {
      console.log("Chargement des réponses pour le message:", messageId);
      setLoadingResponses(true);
      
      // Vérifier s'il y a un cache récent (sauf si forceFetch est true)
      if (!forceFetch) {
        const cacheKey = `admin_message_responses_${messageId}`;
        const cachedResponses = getCachedData<ContactMessageResponse[]>(cacheKey);
        if (cachedResponses) {
          console.log("Réponses trouvées en cache:", cachedResponses.length);
          setResponses(cachedResponses);
          setLoadingResponses(false);
          return;
        }
      }
      
      console.log("Pas de cache, chargement depuis Supabase...");
      const { data, error } = await supabase
        .from('contact_message_responses')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Erreur Supabase:", error);
        throw error;
      }

      console.log("Réponses chargées depuis Supabase:", data?.length || 0);
      
      // Mettre en cache les réponses pour 15 minutes
      const cacheKey = `admin_message_responses_${messageId}`;
      setCachedData(
        cacheKey, 
        data, 
        { expiry: CACHE_EXPIRY.SHORT, priority: 'low' }
      );

      setResponses(data);
      
      // Si le message est non lu, le marquer comme lu
      if (currentMessage && currentMessage.status === 'unread') {
        console.log("Mise à jour du statut du message de non lu à lu");
        await updateMessageStatus(messageId, 'read');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réponses:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les réponses',
        variant: 'destructive'
      });
    } finally {
      setLoadingResponses(false);
    }
  };

  // Mettre à jour le statut d'un message
  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      console.log(`Mise à jour du statut du message ${messageId} à "${status}"`);
      
      // Préparer les données de mise à jour
      const updateData = { 
        status: status,
        handled_at: status === 'unread' ? null : new Date().toISOString()
      };
      console.log("Données de mise à jour:", updateData);
      
      const { data, error } = await supabase
        .from('contact_messages')
        .update(updateData)
        .eq('id', messageId)
        .select();

      if (error) {
        console.error("Erreur Supabase lors de la mise à jour:", error);
        throw error;
      }
      
      console.log("Réponse Supabase après mise à jour:", data);
      
      // Mettre à jour l'état local
      setContactMessages(messages => 
        messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: status as any, handled_at: status === 'unread' ? null : new Date().toISOString() } 
            : msg
        )
      );
      
      if (currentMessage && currentMessage.id === messageId) {
        console.log("Mise à jour du message actuel");
        setCurrentMessage(prev => prev ? {...prev, status: status as any} : null);
      }
      
      // Forcer le rechargement des données après un court délai
      setTimeout(() => {
        fetchMessages(true);
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive'
      });
    }
  };

  // Ouvrir le popover du message
  const openMessagePopover = (message: ContactMessage) => {
    console.log("Ouverture du popover pour le message:", message.id);
    setCurrentMessage(message);
    setAdminResponse('');
    loadResponses(message.id);
    setShowMessagePopover(true);
  };

  // Forcer le rafraîchissement des réponses
  const refreshCurrentResponses = () => {
    if (currentMessage) {
      loadResponses(currentMessage.id, true);
      toast({
        title: "Actualisation",
        description: "Les réponses ont été actualisées"
      });
    }
  };

  // Envoyer une réponse d'administrateur
  const sendAdminResponse = async () => {
    if (!currentMessage || !adminResponse.trim()) return;

    try {
      setIsSending(true);
      const { error } = await supabase
        .from('contact_message_responses')
        .insert({
          message_id: currentMessage.id,
          response_text: adminResponse,
          responded_by: null // TODO: Ajouter l'ID du profil admin si disponible
        });

      if (error) {
        throw error;
      }

      // Mettre à jour le statut du message
      await updateMessageStatus(currentMessage.id, 'completed');

      // Recharger les réponses en ignorant le cache
      loadResponses(currentMessage.id, true);
      setAdminResponse('');
      
      // Invalider spécifiquement le cache des réponses pour ce message
      setCachedData(
        `admin_message_responses_${currentMessage.id}`,
        null,
        { expiry: 0 } // Expiration immédiate = invalidation
      );
      
      // Récupérer les messages mis à jour
      fetchMessages(true);
      
      toast({
        title: 'Réponse envoyée',
        description: 'Votre réponse a été envoyée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la réponse',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Archiver un message
  const archiveMessage = async (messageId: string) => {
    try {
      await updateMessageStatus(messageId, 'archived');
      
      // Fermer le popover
      setShowMessagePopover(false);
      
      // Récupérer les messages mis à jour
      fetchMessages(true);
      
      toast({
        title: 'Message archivé',
        description: 'Le message a été archivé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de l\'archivage du message:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'archiver le message',
        variant: 'destructive'
      });
    }
  };

  // Filtrer les messages selon les critères
  const filteredMessages = contactMessages.filter(message => {
    // Pour la recherche, on vérifie dans le nom, email ou sujet
    const matchesSearch = searchTerm === '' || 
      (`${message.first_name} ${message.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
       message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
       message.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtrer selon l'onglet actif
    const matchesStatus = activeTab === 'all' || 
      (activeTab === 'active' && (message.status === 'unread' || message.status === 'read' || message.status === 'in_progress')) ||
      (activeTab === 'closed' && (message.status === 'archived' || message.status === 'completed'));

    return matchesSearch && matchesStatus;
  });

  console.log(`[DEBUG] Filtrage: ${filteredMessages.length} messages après filtrage (tab: ${activeTab}, search: '${searchTerm}')`);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-bold text-gray-900 dark:text-white">Administration - Messagerie</h1>
        <p className="text-[9px] text-gray-600 dark:text-gray-400 mt-0.5">
          Gestion des messages et conversations
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-gray-400 dark:text-vynal-text-secondary/50" />
          <Input
            placeholder="Rechercher un message..."
            className="pl-8 h-8 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Chargement...' : 'Actualiser'}
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="h-8 text-xs"
            onClick={() => {
              // Forcer une actualisation complète en ignorant le cache
              toast({
                title: "Rechargement forcé",
                description: "Rechargement complet des données en cours...",
                variant: "default"
              });
              
              // Supprimer le cache d'abord
              localStorage.removeItem('cache_admin_contact_messages');
              
              // Puis recharger les données
              fetchMessages(true);
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 mr-1`} />
            Forcer MAJ
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="space-y-3">
        <TabsList>
          <TabsTrigger value="all" className="flex gap-1 text-xs">
            <MessageSquare className="h-3 w-3" />
            <span>Tous</span>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex gap-1 text-xs">
            <CheckCircle className="h-3 w-3" />
            <span>En cours</span>
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex gap-1 text-xs">
            <X className="h-3 w-3" />
            <span>Traités/Archivés</span>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Liste des messages de contact</CardTitle>
            <CardDescription className="text-xs">
              {filteredMessages.length} message(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Sujet</TableHead>
                    <TableHead className="text-xs">Expéditeur</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="w-[140px] text-xs">
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px] text-xs">Statut</TableHead>
                    <TableHead className="text-right w-[100px] text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-xs">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          <span className="ml-2">Chargement...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell className="font-medium text-xs">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-green-500" />
                            {message.subject}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {`${message.first_name} ${message.last_name}`}
                        </TableCell>
                        <TableCell className="text-xs">
                          {message.email}
                        </TableCell>
                        <TableCell className="text-xs">{formatDate(message.created_at)}</TableCell>
                        <TableCell className="text-xs">{getStatusBadge(message.status)}</TableCell>
                        <TableCell className="text-right">
                          <Popover open={showMessagePopover && currentMessage?.id === message.id} onOpenChange={setShowMessagePopover}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openMessagePopover(message);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                                <span className="sr-only">Voir le message</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                              className="w-[400px] p-0" 
                              align="end"
                              sideOffset={5}
                            >
                              <div className="p-3 border-b border-vynal-purple-secondary/20">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold">
                                    Message de {currentMessage?.first_name} {currentMessage?.last_name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-[9px]"
                                      onClick={refreshCurrentResponses}
                                      disabled={loadingResponses}
                                    >
                                      <RefreshCw className={`h-2.5 w-2.5 mr-1 ${loadingResponses ? 'animate-spin' : ''}`} />
                                      Actualiser
                                    </Button>
                                    {getStatusBadge(currentMessage?.status)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-3">
                                <ScrollArea className="h-[300px] rounded-md border p-4">
                                  {/* Message original */}
                                  {currentMessage ? (
                                    <div className="p-4 mb-4 rounded-lg bg-gray-50 border border-gray-200">
                                      <div className="mb-2">
                                        <h3 className="text-sm font-medium">{currentMessage.subject}</h3>
                                        <div className="mt-1 text-xs text-gray-500">
                                          De: {currentMessage.first_name} {currentMessage.last_name} ({currentMessage.email})
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">
                                          Date: {formatDate(currentMessage.created_at)}
                                        </div>
                                      </div>
                                      <div className="mt-2 text-sm whitespace-pre-wrap">
                                        {currentMessage.message}
                                      </div>
                                    </div>
                                  ) : null}
                                  
                                  {/* Réponses */}
                                  {loadingResponses ? (
                                    <div className="flex justify-center items-center h-[100px]">
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                      <span className="ml-2 text-xs">Chargement des réponses...</span>
                                    </div>
                                  ) : responses.length > 0 ? (
                                    <div className="space-y-4">
                                      {responses.map((response) => (
                                        <div 
                                          key={response.id} 
                                          className="bg-blue-50 ml-auto mr-0 max-w-[80%] p-3 rounded-lg"
                                        >
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold text-blue-600">
                                              Admin
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              {formatDate(response.created_at)}
                                            </span>
                                          </div>
                                          <p className="text-xs">{response.response_text}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </ScrollArea>
                                
                                <Separator className="my-4" />
                                
                                <div className="space-y-3">
                                  <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                      <Textarea
                                        placeholder="Répondre en tant qu'administrateur..."
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        className="min-h-[80px] text-[9px]"
                                      />
                                    </div>
                                    <Button
                                      onClick={sendAdminResponse}
                                      disabled={isSending || !adminResponse.trim()}
                                      size="sm"
                                      className="mb-1"
                                    >
                                      {isSending ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Send className="h-3 w-3" />
                                      )}
                                      <span className="ml-1 text-[9px]">Envoyer</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div className="p-2 flex justify-between">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setShowMessagePopover(false)}
                                  size="sm"
                                  className="text-xs"
                                >
                                  Fermer
                                </Button>
                                {currentMessage && currentMessage.status !== 'archived' && currentMessage.status !== 'completed' && (
                                  <Button 
                                    variant="destructive"
                                    onClick={() => currentMessage && archiveMessage(currentMessage.id)}
                                    size="sm"
                                    className="text-xs"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Archiver
                                  </Button>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-xs">
                        Aucun message de contact trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
} 