"use client";

import React, { useState, useEffect } from 'react';
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

// Interface pour les conversations
interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_time: string;
  status?: 'active' | 'reported' | 'closed';
  is_contact_form?: boolean;
  contact_name?: string;
  contact_email?: string;
}

// Interface pour les messages
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_name?: string;
  sender_email?: string;
  subject?: string;
  is_contact_form?: boolean;
  is_admin?: boolean;
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
const getStatusBadge = (status: string = 'active') => {
  switch (status) {
    case 'active': 
      return <Badge variant="outline" className="bg-green-500 text-white">Active</Badge>;
    case 'reported': 
      return <Badge variant="outline" className="bg-amber-500 text-white">Signalée</Badge>;
    case 'closed': 
      return <Badge variant="outline" className="bg-gray-500 text-white">Fermée</Badge>;
    default: 
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function MessagingPage() {
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [showConversationDialog, setShowConversationDialog] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Charger les conversations depuis Supabase
  useEffect(() => {
    async function fetchConversations() {
      try {
        setLoading(true);
        
        // Requête pour récupérer toutes les conversations
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .order('last_message_time', { ascending: false });

        if (error) {
          throw error;
        }

        // Pour chaque conversation, vérifier s'il s'agit d'un message de contact
        const conversationsWithDetails = await Promise.all(
          data.map(async (conversation: any) => {
            // Vérifier si cette conversation contient un message de contact
            const { data: firstMessage } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conversation.id)
              .order('created_at', { ascending: true })
              .limit(1)
              .single();

            if (firstMessage && firstMessage.sender_id === 'contact') {
              return {
                ...conversation,
                is_contact_form: true,
                contact_name: firstMessage.sender_name,
                contact_email: firstMessage.sender_email
              };
            }
            
            return conversation;
          })
        );

        // Filtrer pour ne garder que les messages de contact
        const contactConversations = conversationsWithDetails.filter(
          (conversation) => conversation.is_contact_form === true
        );

        setConversations(contactConversations);
      } catch (error) {
        console.error('Erreur lors du chargement des messages de contact:', error);
        setError('Impossible de charger les messages de contact. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();
  }, [supabase]);

  // Charger les messages d'une conversation
  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      // Transformer les données pour inclure le nom de l'expéditeur
      const transformedData = data.map((message: any) => {
        // Cas spécial pour les messages du formulaire de contact
        if (message.sender_id === 'contact') {
          return {
            ...message,
            sender_name: message.sender_name || `${message.sender_email || 'Contact'}`,
            is_contact_form: true
          };
        } 
        // Cas spécial pour les messages administratifs
        else if (message.sender_id === 'admin') {
          return {
            ...message,
            sender_name: 'Admin',
            is_admin: true
          };
        } 
        // Cas normal pour les messages des utilisateurs
        else {
          return {
            ...message,
            sender_name: message.profiles?.full_name || 'Utilisateur inconnu'
          };
        }
      });

      setMessages(transformedData);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les messages',
        variant: 'destructive'
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Ouvrir la boîte de dialogue de conversation
  const openConversationDialog = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setAdminMessage('');
    setShowConversationDialog(true);
    loadMessages(conversation.id);
  };

  // Envoyer un message administratif
  const sendAdminMessage = async () => {
    if (!currentConversation || !adminMessage.trim()) return;

    try {
      setIsSending(true);
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversation.id,
          sender_id: 'admin', // Utiliser un ID spécial pour l'admin
          content: adminMessage,
          read: false
        });

      if (error) {
        throw error;
      }

      // Mettre à jour la conversation avec le nouveau timestamp
      await supabase
        .from('conversations')
        .update({
          last_message_time: new Date().toISOString()
        })
        .eq('id', currentConversation.id);

      // Recharger les messages
      loadMessages(currentConversation.id);
      setAdminMessage('');
      
      toast({
        title: 'Message envoyé',
        description: 'Votre message a été envoyé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Marquer une conversation comme fermée
  const closeConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'closed' })
        .eq('id', conversationId);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setConversations(conversations.map(conv => 
        conv.id === conversationId ? { ...conv, status: 'closed' } : conv
      ));

      setShowConversationDialog(false);
      
      toast({
        title: 'Conversation fermée',
        description: 'La conversation a été fermée avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la fermeture de la conversation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de fermer la conversation',
        variant: 'destructive'
      });
    }
  };

  // Filtrer les conversations selon les critères
  const filteredConversations = conversations.filter(conversation => {
    // Pour la recherche, on vérifie dans le nom de contact ou email
    const matchesSearch = searchTerm === '' || 
      (conversation.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       conversation.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = activeTab === 'all' || conversation.status === activeTab;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-sm font-bold mb-2 text-gray-800 dark:text-vynal-text-primary">Messages de contact</h1>
        <p className="text-xs text-gray-500 dark:text-vynal-text-secondary">
          Gérez les messages reçus via le formulaire de contact de la plateforme.
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
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Actualiser
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
            <span>En attente</span>
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex gap-1 text-xs">
            <X className="h-3 w-3" />
            <span>Traités</span>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Liste des messages de contact</CardTitle>
            <CardDescription className="text-xs">
              {filteredConversations.length} message(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Type</TableHead>
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
                  ) : filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                      <TableRow key={conversation.id}>
                        <TableCell className="font-medium text-xs">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-green-500" />
                            Formulaire de contact
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {conversation.contact_name || 'Contact'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {conversation.contact_email || 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs">{formatDate(conversation.last_message_time)}</TableCell>
                        <TableCell className="text-xs">{getStatusBadge(conversation.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => openConversationDialog(conversation)}
                          >
                            <Eye className="h-3 w-3" />
                            <span className="sr-only">Voir les messages</span>
                          </Button>
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

      {/* Dialogue de message de contact */}
      <Dialog open={showConversationDialog} onOpenChange={setShowConversationDialog}>
        <DialogContent className="max-w-3xl" aria-describedby="conversation-description">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-semibold">
              {currentConversation && `Message de contact de ${currentConversation.contact_name}`}
            </DialogTitle>
            <DialogDescription id="conversation-description" className="text-xs flex justify-between">
              <span>
                Date: {currentConversation && formatDate(currentConversation.last_message_time)}
              </span>
              <span>
                Statut: {currentConversation && getStatusBadge(currentConversation.status)}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-3">
            <ScrollArea className="h-[300px] rounded-md border p-4">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-xs">Chargement des messages...</span>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`p-3 rounded-lg ${
                        message.sender_id === 'admin' 
                          ? 'bg-blue-50 ml-auto mr-0 max-w-[80%]' 
                          : 'bg-gray-50 mr-auto ml-0 max-w-[80%]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-semibold ${
                          message.sender_id === 'admin' 
                            ? 'text-blue-600' 
                            : message.sender_id === 'contact' 
                              ? 'text-green-600' 
                              : ''
                        }`}>
                          {message.sender_id === 'admin' 
                            ? 'Admin' 
                            : message.sender_id === 'contact' 
                              ? `Contact: ${message.sender_name}` 
                              : message.sender_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      {message.subject && message.sender_id === 'contact' && (
                        <div className="mb-1 text-xs font-medium text-gray-700">
                          Sujet: {message.subject}
                        </div>
                      )}
                      {message.sender_email && message.sender_id === 'contact' && (
                        <div className="mb-1 text-xs italic text-gray-600">
                          Email: {message.sender_email}
                        </div>
                      )}
                      <p className="text-xs">{message.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <AlertCircle className="h-5 w-5 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Aucun message trouvé</p>
                </div>
              )}
            </ScrollArea>
            
            <Separator className="my-4" />
            
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Répondre en tant qu'administrateur..."
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    className="min-h-[80px] text-xs"
                  />
                </div>
                <Button
                  onClick={sendAdminMessage}
                  disabled={isSending || !adminMessage.trim()}
                  size="sm"
                  className="mb-1"
                >
                  {isSending ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  <span className="ml-1 text-xs">Envoyer</span>
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConversationDialog(false)}
              size="sm"
              className="text-xs"
            >
              Fermer
            </Button>
            {currentConversation && currentConversation.status !== 'closed' && (
              <Button 
                variant="destructive"
                onClick={() => currentConversation && closeConversation(currentConversation.id)}
                size="sm"
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Marquer comme traité
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 