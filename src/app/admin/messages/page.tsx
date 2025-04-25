"use client";

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Inbox, 
  Send, 
  Archive, 
  Trash2, 
  Mail, 
  MailOpen, 
  Star, 
  Reply, 
  User, 
  Clock, 
  Tag,
  AlertCircle,
  Filter,
  X
} from 'lucide-react';

// Données factices pour démonstration
const MESSAGES_DATA = [
  {
    id: '1',
    subject: 'Problème de paiement sur la plateforme',
    content: 'Bonjour, je rencontre un problème lors du paiement d\'un service. Ma carte est débitée mais la transaction n\'apparaît pas comme terminée. Pourriez-vous m\'aider à résoudre ce problème ? Merci d\'avance. Cordialement, Jean Dupont',
    sender: {
      name: 'Jean Dupont',
      email: 'jean.dupont@example.com'
    },
    date: '2023-11-28T14:30:00',
    read: false,
    starred: false,
    category: 'support',
    archived: false,
    replies: []
  },
  {
    id: '2',
    subject: 'Demande d\'information sur vos services',
    content: 'Bonjour, je souhaiterais obtenir plus d\'informations sur la possibilité de proposer mes services en tant que freelance sur votre plateforme. Quels sont les critères d\'acceptation et les commissions prélevées ? En vous remerciant par avance pour votre réponse. Bien cordialement, Marie Martin',
    sender: {
      name: 'Marie Martin',
      email: 'marie.martin@example.com'
    },
    date: '2023-11-27T11:15:00',
    read: true,
    starred: true,
    category: 'info',
    archived: false,
    replies: [
      {
        id: 'r1',
        content: 'Bonjour Marie, nous vous remercions pour votre intérêt pour notre plateforme. Pour devenir freelance, vous devez d\'abord créer un compte et remplir votre profil avec vos compétences et expériences. La commission est de 10% sur chaque transaction. N\'hésitez pas si vous avez d\'autres questions. Cordialement, L\'équipe Support',
        sender: {
          name: 'Support Vynal',
          email: 'support@vynal.com'
        },
        date: '2023-11-27T15:30:00'
      }
    ]
  },
  {
    id: '3',
    subject: 'Suggestion d\'amélioration',
    content: 'Bonjour, j\'utilise votre plateforme depuis plusieurs mois et j\'ai quelques suggestions d\'amélioration à vous proposer : 1) Ajouter une fonction de chat en direct entre clients et freelances 2) Améliorer le système de recherche pour filtrer par compétences spécifiques 3) Proposer un système de recommandation de services. Merci pour votre attention, Lucas Bernard',
    sender: {
      name: 'Lucas Bernard',
      email: 'lucas.bernard@example.com'
    },
    date: '2023-11-26T09:45:00',
    read: true,
    starred: false,
    category: 'suggestion',
    archived: false,
    replies: []
  },
  {
    id: '4',
    subject: 'Signalement d\'un service frauduleux',
    content: 'Bonjour, je souhaite signaler un service qui me semble frauduleux sur votre plateforme. Le freelance "DesignPro123" propose des logos à des prix très bas mais semble utiliser des designs volés d\'autres sites. Je pense qu\'il serait nécessaire de vérifier l\'authenticité de son travail. Cordialement, Thomas Durand',
    sender: {
      name: 'Thomas Durand',
      email: 'thomas.durand@example.com'
    },
    date: '2023-11-25T16:20:00',
    read: false,
    starred: true,
    category: 'abuse',
    archived: false,
    replies: []
  },
  {
    id: '5',
    subject: 'Problème technique sur le site',
    content: 'Bonjour, j\'ai constaté un bug sur votre site. Lorsque j\'essaie de télécharger des fichiers de plus de 5 Mo dans la messagerie, j\'obtiens une erreur 500. Pourriez-vous résoudre ce problème ? Je travaille avec plusieurs clients qui m\'envoient des fichiers volumineux. Merci d\'avance, Emma Petit',
    sender: {
      name: 'Emma Petit',
      email: 'emma.petit@example.com'
    },
    date: '2023-11-24T13:10:00',
    read: true,
    starred: false,
    category: 'bug',
    archived: false,
    replies: [
      {
        id: 'r2',
        content: 'Bonjour Emma, merci pour votre signalement. Nous avons identifié le problème et allons procéder à une correction dans les prochaines 24h. En attendant, vous pouvez partager vos fichiers via des services comme WeTransfer ou Google Drive. Nous vous tiendrons informée dès que le problème sera résolu. Cordialement, L\'équipe Technique',
        sender: {
          name: 'Support Technique',
          email: 'tech@vynal.com'
        },
        date: '2023-11-24T15:45:00'
      }
    ]
  },
  {
    id: '6',
    subject: 'Demande de partenariat',
    content: 'Bonjour, je représente l\'agence DigitalCreative et nous serions intéressés par un partenariat avec votre plateforme. Nous avons plus de 50 freelances dans notre réseau et souhaiterions discuter d\'une possible collaboration. Pourriez-vous me contacter pour en discuter plus en détail ? Bien cordialement, Sophie Moreau, Directrice des Partenariats',
    sender: {
      name: 'Sophie Moreau',
      email: 'sophie.moreau@digitalcreative.com'
    },
    date: '2023-11-23T10:05:00',
    read: true,
    starred: true,
    category: 'partnership',
    archived: false,
    replies: []
  }
];

// Fonction pour formater la date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const messageDate = new Date(date);
  messageDate.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(today.getTime() - messageDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
};

// Fonction pour obtenir la couleur de la catégorie
const getCategoryBadge = (category: string) => {
  switch (category) {
    case 'support': 
      return <Badge variant="outline" className="bg-blue-500 text-white">Support</Badge>;
    case 'info': 
      return <Badge variant="outline" className="bg-green-500 text-white">Information</Badge>;
    case 'bug': 
      return <Badge variant="outline" className="bg-red-500 text-white">Bug</Badge>;
    case 'suggestion': 
      return <Badge variant="outline" className="bg-purple-500 text-white">Suggestion</Badge>;
    case 'abuse': 
      return <Badge variant="outline" className="bg-amber-500 text-white">Signalement</Badge>;
    case 'partnership': 
      return <Badge variant="outline" className="bg-indigo-500 text-white">Partenariat</Badge>;
    default: 
      return <Badge variant="outline">Autre</Badge>;
  }
};

type Message = {
  id: string;
  subject: string;
  content: string;
  sender: {
    name: string;
    email: string;
  };
  date: string;
  read: boolean;
  starred: boolean;
  category: string;
  archived: boolean;
  replies: Array<{
    id: string;
    content: string;
    sender: {
      name: string;
      email: string;
    };
    date: string;
  }>;
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>(MESSAGES_DATA);
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Filtrer les messages selon les critères
  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      searchTerm === '' || 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      (activeTab === 'inbox' && !message.archived) ||
      (activeTab === 'archived' && message.archived) ||
      (activeTab === 'starred' && message.starred);

    const matchesCategory = categoryFilter === null || message.category === categoryFilter;

    return matchesSearch && matchesTab && matchesCategory;
  });

  // Marquer un message comme lu
  const markAsRead = (id: string) => {
    setMessages(prevMessages =>
      prevMessages.map(message =>
        message.id === id ? { ...message, read: true } : message
      )
    );
  };

  // Marquer un message comme favoris ou non
  const toggleStar = (id: string) => {
    setMessages(prevMessages =>
      prevMessages.map(message =>
        message.id === id ? { ...message, starred: !message.starred } : message
      )
    );
  };

  // Archiver un message
  const archiveMessage = (id: string) => {
    setMessages(prevMessages =>
      prevMessages.map(message =>
        message.id === id ? { ...message, archived: true } : message
      )
    );
    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
    }
  };

  // Désarchiver un message
  const unarchiveMessage = (id: string) => {
    setMessages(prevMessages =>
      prevMessages.map(message =>
        message.id === id ? { ...message, archived: false } : message
      )
    );
  };

  // Supprimer un message (dans un environnement réel, ce serait plutôt un soft delete)
  const deleteMessage = (id: string) => {
    setMessages(prevMessages => 
      prevMessages.filter(message => message.id !== id)
    );
    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
    }
  };

  // Répondre à un message
  const replyToMessage = () => {
    if (!selectedMessage || !replyText.trim()) return;

    const newReply = {
      id: `r${Date.now()}`,
      content: replyText,
      sender: {
        name: 'Support Vynal',
        email: 'support@vynal.com'
      },
      date: new Date().toISOString()
    };

    setMessages(prevMessages =>
      prevMessages.map(message =>
        message.id === selectedMessage.id
          ? { ...message, replies: [...message.replies, newReply], read: true }
          : message
      )
    );

    // Mettre à jour également le message sélectionné
    setSelectedMessage({
      ...selectedMessage,
      replies: [...selectedMessage.replies, newReply],
      read: true
    });

    setReplyText('');
    setShowReplyForm(false);
  };

  // Ouvrir un message
  const openMessage = (message: Message) => {
    markAsRead(message.id);
    setSelectedMessage(message);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messagerie</h1>
        <p className="text-muted-foreground">
          Gérez les messages reçus via le formulaire de contact de la plateforme.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[500px]">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex flex-col">
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="inbox" onValueChange={setActiveTab} className="h-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                  <TabsTrigger 
                    value="inbox" 
                    className="flex-1 data-[state=active]:bg-muted rounded-none py-2 px-3"
                  >
                    <div className="flex items-center gap-2">
                      <Inbox className="h-4 w-4" />
                      <span>Boîte de réception</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="starred" 
                    className="flex-1 data-[state=active]:bg-muted rounded-none py-2 px-3"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span>Favoris</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="archived" 
                    className="flex-1 data-[state=active]:bg-muted rounded-none py-2 px-3"
                  >
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4" />
                      <span>Archivés</span>
                    </div>
                  </TabsTrigger>
                </TabsList>

                {activeTab === 'inbox' && (
                  <div className="flex items-center gap-2 p-3 border-b">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select 
                      value={categoryFilter || ''} 
                      onValueChange={(value) => setCategoryFilter(value || null)}
                    >
                      <SelectTrigger className="h-8 border-none shadow-none w-full focus:ring-0 pl-0">
                        <SelectValue placeholder="Filtrer par catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Toutes les catégories</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="info">Information</SelectItem>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="suggestion">Suggestion</SelectItem>
                        <SelectItem value="abuse">Signalement</SelectItem>
                        <SelectItem value="partnership">Partenariat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                      <div 
                        key={message.id}
                        className={`flex flex-col border-b cursor-pointer transition-colors p-3 ${
                          selectedMessage?.id === message.id ? 'bg-muted' : 'hover:bg-muted/50'
                        } ${!message.read ? 'font-medium' : ''}`}
                        onClick={() => openMessage(message)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {!message.read ? (
                              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            ) : (
                              <div className="h-2 w-2"></div>
                            )}
                            <span className="truncate">{message.sender.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(message.date)}
                          </div>
                        </div>
                        <div className="mt-1 truncate">{message.subject}</div>
                        <div className="mt-1 flex items-center justify-between">
                          <div className="text-xs text-muted-foreground truncate">
                            {message.content.substring(0, 50)}...
                          </div>
                          <div className="flex gap-1">
                            {message.starred && (
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            )}
                            {message.replies.length > 0 && (
                              <Send className="h-3 w-3 text-blue-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <Mail className="h-8 w-8 mb-2" />
                      <p>Aucun message trouvé</p>
                    </div>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Message content */}
        <div className="flex-1">
          <Card className="h-full flex flex-col">
            {selectedMessage ? (
              <>
                <CardHeader className="pb-3 border-b">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle>{selectedMessage.subject}</CardTitle>
                      <CardDescription>
                        De: {selectedMessage.sender.name} ({selectedMessage.sender.email})
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleStar(selectedMessage.id)}
                      >
                        <Star className={`h-4 w-4 ${selectedMessage.starred ? 'text-amber-500 fill-amber-500' : ''}`} />
                      </Button>
                      {!selectedMessage.archived ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => archiveMessage(selectedMessage.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => unarchiveMessage(selectedMessage.id)}
                        >
                          <Inbox className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteMessage(selectedMessage.id)}
                        className="hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(selectedMessage.date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <div>
                      {getCategoryBadge(selectedMessage.category)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4">
                  <div className="mb-6">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <div>
                            <span className="font-medium">{selectedMessage.sender.name}</span>
                            <span className="text-muted-foreground ml-2 text-xs">{selectedMessage.sender.email}</span>
                          </div>
                        </div>
                        <div className="text-sm whitespace-pre-line">
                          {selectedMessage.content}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedMessage.replies.length > 0 && (
                    <div className="mt-8 space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-card px-2 text-xs text-muted-foreground">
                            Réponses
                          </span>
                        </div>
                      </div>

                      {selectedMessage.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Send className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between">
                              <div>
                                <span className="font-medium">{reply.sender.name}</span>
                                <span className="text-muted-foreground ml-2 text-xs">{reply.sender.email}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(reply.date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="text-sm whitespace-pre-line">
                              {reply.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showReplyForm ? (
                    <div className="mt-6 border rounded-md p-4">
                      <div className="mb-2 flex justify-between">
                        <h3 className="text-sm font-medium">Répondre</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowReplyForm(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Votre réponse..."
                        className="min-h-[150px]"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowReplyForm(false)}
                        >
                          Annuler
                        </Button>
                        <Button 
                          size="sm"
                          disabled={!replyText.trim()}
                          onClick={replyToMessage}
                        >
                          Envoyer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowReplyForm(true)}
                      >
                        <Reply className="h-4 w-4 mr-2" />
                        Répondre
                      </Button>
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-full">
                <MailOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">Aucun message sélectionné</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Sélectionnez un message dans la liste pour afficher son contenu ici.
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 