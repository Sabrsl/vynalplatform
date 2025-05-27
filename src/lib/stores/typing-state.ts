/**
 * Gestion locale des indicateurs de frappe (sans base de données)
 */

interface TypingUser {
  userId: string;
  timestamp: number;
  timeout?: NodeJS.Timeout;
}

class TypingStateManager {
  private typingByConversation = new Map<string, Map<string, TypingUser>>();
  private listeners = new Set<
    (conversationId: string, typingUsers: string[]) => void
  >();

  private readonly TYPING_TIMEOUT = 3000; // 3 secondes

  /**
   * Définir l'état de frappe d'un utilisateur
   */
  setTyping(conversationId: string, userId: string, isTyping: boolean): void {
    if (!this.typingByConversation.has(conversationId)) {
      this.typingByConversation.set(conversationId, new Map());
    }

    const conversationTyping = this.typingByConversation.get(conversationId)!;

    if (isTyping) {
      // Supprimer l'ancien timeout s'il existe
      const existing = conversationTyping.get(userId);
      if (existing?.timeout) {
        clearTimeout(existing.timeout);
      }

      // Créer un nouveau timeout pour arrêter automatiquement le typing
      const timeout = setTimeout(() => {
        this.setTyping(conversationId, userId, false);
      }, this.TYPING_TIMEOUT);

      conversationTyping.set(userId, {
        userId,
        timestamp: Date.now(),
        timeout,
      });
    } else {
      // Supprimer l'utilisateur de la liste des utilisateurs en train de taper
      const existing = conversationTyping.get(userId);
      if (existing?.timeout) {
        clearTimeout(existing.timeout);
      }
      conversationTyping.delete(userId);
    }

    // Notifier les listeners
    this.notifyListeners(conversationId);
  }

  /**
   * Obtenir la liste des utilisateurs en train de taper
   */
  getTypingUsers(conversationId: string): string[] {
    const conversationTyping = this.typingByConversation.get(conversationId);
    if (!conversationTyping) return [];

    // Nettoyer les entrées expirées
    const now = Date.now();
    const expired: string[] = [];

    for (const [userId, typingUser] of conversationTyping.entries()) {
      if (now - typingUser.timestamp > this.TYPING_TIMEOUT) {
        expired.push(userId);
      }
    }

    expired.forEach((userId) => {
      const typingUser = conversationTyping.get(userId);
      if (typingUser?.timeout) {
        clearTimeout(typingUser.timeout);
      }
      conversationTyping.delete(userId);
    });

    return Array.from(conversationTyping.keys());
  }

  /**
   * S'abonner aux changements d'état de frappe
   */
  subscribe(
    callback: (conversationId: string, typingUsers: string[]) => void,
  ): () => void {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Nettoyer tous les indicateurs de frappe pour une conversation
   */
  clearConversation(conversationId: string): void {
    const conversationTyping = this.typingByConversation.get(conversationId);
    if (conversationTyping) {
      // Nettoyer tous les timeouts
      for (const typingUser of conversationTyping.values()) {
        if (typingUser.timeout) {
          clearTimeout(typingUser.timeout);
        }
      }
      conversationTyping.clear();
      this.notifyListeners(conversationId);
    }
  }

  /**
   * Nettoyer tout
   */
  clear(): void {
    for (const conversationTyping of this.typingByConversation.values()) {
      for (const typingUser of conversationTyping.values()) {
        if (typingUser.timeout) {
          clearTimeout(typingUser.timeout);
        }
      }
    }
    this.typingByConversation.clear();
    this.listeners.clear();
  }

  private notifyListeners(conversationId: string): void {
    const typingUsers = this.getTypingUsers(conversationId);
    this.listeners.forEach((listener) => {
      try {
        listener(conversationId, typingUsers);
      } catch (error) {
        console.error("Erreur dans le listener de typing:", error);
      }
    });
  }
}

// Instance globale
export const typingState = new TypingStateManager();

// Hook React pour utiliser l'état de frappe
import { useState, useEffect } from "react";

export function useTypingState(conversationId: string, currentUserId?: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    // Initialiser avec l'état actuel
    setTypingUsers(typingState.getTypingUsers(conversationId));

    // S'abonner aux changements
    const unsubscribe = typingState.subscribe(
      (changedConversationId, users) => {
        if (changedConversationId === conversationId) {
          // Filtrer l'utilisateur actuel de la liste
          const filteredUsers = currentUserId
            ? users.filter((userId) => userId !== currentUserId)
            : users;
          setTypingUsers(filteredUsers);
        }
      },
    );

    return unsubscribe;
  }, [conversationId, currentUserId]);

  const setIsTyping = (userId: string, isTyping: boolean) => {
    typingState.setTyping(conversationId, userId, isTyping);
  };

  return { typingUsers, setIsTyping };
}
