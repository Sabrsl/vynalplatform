"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReviewReplies, ReviewReply } from '@/hooks/useReviewReplies';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Edit, Trash2, Save, X } from 'lucide-react';

// Fonction locale de formatage de date au cas où l'import ne fonctionne pas
function formatDate(dateString: string): string {
  if (!dateString) return 'Date inconnue';
  
  const date = new Date(dateString);
  
  // Vérifiez si la date est valide
  if (isNaN(date.getTime())) return 'Date invalide';
  
  // Options pour le formatage
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  
  return new Intl.DateTimeFormat('fr-FR', options).format(date);
}

type ReviewReplyProps = {
  reviewId: string;
  freelanceId: string;
};

export default function ReviewReplyComponent({ reviewId, freelanceId }: ReviewReplyProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { reply, isLoading, submitReply, updateReply, deleteReply } = useReviewReplies({
    reviewId,
    freelanceId,
  });

  const isOwner = user?.id === freelanceId;

  const handleSubmit = async () => {
    if (!replyContent.trim()) return;

    try {
      await submitReply(replyContent);
      setReplyContent('');
    } catch (error) {
      console.error('Erreur lors de la soumission de la réponse:', error);
    }
  };

  const handleUpdate = async () => {
    if (!replyContent.trim()) return;

    try {
      await updateReply(replyContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la réponse:', error);
    }
  };

  const startEditing = () => {
    if (reply) {
      setReplyContent(reply.content);
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setReplyContent('');
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette réponse?')) return;

    try {
      await deleteReply();
    } catch (error) {
      console.error('Erreur lors de la suppression de la réponse:', error);
    }
  };

  // Si l'utilisateur n'est pas le freelance concerné et qu'il n'y a pas de réponse, ne rien afficher
  if (!isOwner && !reply) return null;

  return (
    <div className="mt-4 pl-4 border-l-2 border-vynal-purple-secondary/30">
      {reply ? (
        <>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea 
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Votre réponse"
                className="min-h-[100px] bg-vynal-purple-secondary/10"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={handleUpdate}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Enregistrer
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={cancelEditing}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-vynal-accent-primary text-sm">
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  <span>Réponse du freelance · {formatDate(reply.created_at)}</span>
                </div>
                {isOwner && (
                  <div className="flex gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-vynal-text-secondary hover:text-vynal-accent-primary"
                      onClick={startEditing}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-vynal-text-secondary hover:text-red-500"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-vynal-text-secondary text-sm leading-relaxed">{reply.content}</p>
            </div>
          )}
        </>
      ) : isOwner && (
        <div className="space-y-2">
          <Textarea 
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Répondez à cet avis..."
            className="min-h-[100px] bg-vynal-purple-secondary/10"
          />
          <Button 
            size="sm" 
            variant="default" 
            onClick={handleSubmit}
            disabled={isLoading || !replyContent.trim()}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Répondre
          </Button>
        </div>
      )}
    </div>
  );
} 