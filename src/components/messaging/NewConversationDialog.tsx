"use client";

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, Send, ArrowRight, Loader2, UserCheck, UserPlus, X } from 'lucide-react';
import { useMessagingStore } from '@/lib/stores/useMessagingStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader } from '@/components/ui/loader';
import { useUser, UserProfile } from '@/hooks/useUser';

interface NewConversationDialogProps {
  onConversationCreated?: (conversationId: string) => void;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
  isFreelance?: boolean;
}

const NewConversationDialog: React.FC<NewConversationDialogProps> = ({
  onConversationCreated,
  buttonVariant = 'default',
  className = '',
  isFreelance = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const { user } = useAuth();
  const { profile } = useUser();
  const { createConversation, isLoading } = useMessagingStore();
  
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !profile) return;
    
    try {
      setIsSearching(true);
      setError(null);
      
      // Déterminer le rôle compatible
      const compatibleRole = profile.role === 'freelance' ? 'client' : 'freelance';
      
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('role', compatibleRole)
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(5);
      
      if (error) throw error;
      
      setSearchResults(data as UserProfile[] || []);
    } catch (err: any) {
      console.error('Erreur de recherche:', err);
      setError('Erreur lors de la recherche. Veuillez réessayer.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, profile]);
  
  // Sélectionner un utilisateur
  const handleSelectUser = (profile: UserProfile) => {
    setSelectedUser(profile);
    setSearchQuery('');
    setSearchResults([]);
  };
  
  // Annuler la sélection d'un utilisateur
  const handleClearSelectedUser = () => {
    setSelectedUser(null);
  };
  
  // Envoyer un message initial
  const handleSendMessage = async () => {
    if (!user?.id || !selectedUser || message.trim() === '') return;
    
    try {
      // Créer une conversation avec un message initial
      const conversationId = await createConversation(
        [user.id, selectedUser.id],
        message.trim()
      );
      
      if (conversationId && onConversationCreated) {
        onConversationCreated(conversationId);
      }
      
      // Fermer le dialogue
      setIsOpen(false);
      setSelectedUser(null);
      setMessage('');
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className={className}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle conversation
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isFreelance 
              ? "Démarrer une conversation avec un client" 
              : "Contacter un freelance"}
          </DialogTitle>
          <DialogDescription>
            {isFreelance 
              ? "Recherchez un client pour commencer une nouvelle conversation." 
              : "Trouvez un freelance pour discuter de vos projets."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="pt-4 pb-2 space-y-4">
          {/* Recherche d'utilisateurs */}
          {!selectedUser && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={`Rechercher un ${isFreelance ? 'client' : 'freelance'}...`}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-vynal-purple-mid/30 rounded-md focus:outline-none focus:ring-2 focus:ring-vynal-purple-light focus:border-transparent bg-vynal-purple-darkest/50"
                />
                <Button 
                  onClick={handleSearch}
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 text-vynal-purple-light hover:text-white hover:bg-vynal-purple-dark/30"
                  disabled={isSearching}
                >
                  {isSearching ? <Loader size="xs" variant="primary" /> : "Rechercher"}
                </Button>
              </div>
              
              {/* Résultats de recherche */}
              {searchResults.length > 0 ? (
                <div className="max-h-60 overflow-y-auto border border-vynal-purple-mid/30 rounded-md divide-y divide-vynal-purple-dark/20 bg-gradient-to-b from-vynal-purple-dark/30 to-vynal-purple-darkest/50 no-scrollbar">
                  {searchResults.map((profile) => (
                    <div 
                      key={profile.id}
                      className="flex items-center p-3 hover:bg-vynal-purple-mid/20 cursor-pointer"
                      onClick={() => handleSelectUser(profile)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={profile.avatar_url || ''} 
                          alt={profile.full_name || profile.username || 'Utilisateur'} 
                        />
                        <AvatarFallback className="bg-vynal-purple-mid/30 text-white">
                          {profile.full_name?.[0] || profile.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white">
                          {profile.full_name || profile.username || 'Utilisateur'}
                        </p>
                        <p className="text-xs text-vynal-purple-light">
                          {profile.username && `@${profile.username}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                searchQuery && !isSearching && (
                  <p className="text-sm text-gray-500 p-2">Aucun résultat trouvé</p>
                )
              )}
            </div>
          )}
          
          {/* Utilisateur sélectionné et formulaire de message */}
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-vynal-purple-dark/30 p-3 rounded-md">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={selectedUser.avatar_url || ''} 
                      alt={selectedUser.full_name || selectedUser.username || 'Utilisateur'} 
                    />
                    <AvatarFallback className="bg-vynal-purple-mid/30 text-white">
                      {selectedUser.full_name?.[0] || selectedUser.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">
                      {selectedUser.full_name || selectedUser.username || 'Utilisateur'}
                    </p>
                    <p className="text-xs text-vynal-purple-light">
                      {selectedUser.username && `@${selectedUser.username}`}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-vynal-purple-light hover:text-white hover:bg-vynal-purple-mid/20"
                  onClick={handleClearSelectedUser}
                >
                  Changer
                </Button>
              </div>
              
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="w-full p-3 text-sm border border-vynal-purple-mid/30 rounded-md focus:outline-none focus:ring-2 focus:ring-vynal-purple-light focus:border-transparent min-h-[100px] resize-none bg-vynal-purple-darkest/50"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <DialogClose asChild>
            <Button variant="outline" className="border-vynal-purple-light/50 text-vynal-purple-light hover:bg-vynal-purple-dark/20">Annuler</Button>
          </DialogClose>
          
          {selectedUser && (
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || message.trim() === ''}
              className="bg-gradient-to-r from-vynal-purple-light to-vynal-purple-mid hover:from-vynal-purple-mid hover:to-vynal-purple-dark"
            >
              {isLoading ? (
                <Loader size="xs" variant="primary" className="mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Envoi en cours...' : 'Envoyer'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog; 