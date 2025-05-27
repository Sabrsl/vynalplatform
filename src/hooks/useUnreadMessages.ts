import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { smartCache } from "@/lib/cache/smart-cache";
import requestCoordinator from "@/lib/optimizations/requestCoordinator";

interface UnreadCounts {
  total: number;
  byConversation: Record<string, number>;
}

// Augmenter drastiquement la durée de throttle
const THROTTLE_DURATION = 20 * 60 * 1000; // 20 minutes au lieu de 10
const VISIBILITY_THROTTLE = 10 * 60 * 1000; // 10 minutes pour les changements de visibilité

export const useUnreadMessages = (userId: string | undefined) => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    total: 0,
    byConversation: {},
  });

  const isActiveRef = useRef(true);
  const initializingRef = useRef(false);
  const lastVisibilityUpdate = useRef(0);

  // Fonction pour charger les compteurs avec les services existants optimisés
  const loadUnreadCounts = useCallback(
    async (force = false) => {
      if (!userId || initializingRef.current)
        return Promise.resolve({ total: 0, byConversation: {} });

      initializingRef.current = true;

      try {
        // Utiliser requestCoordinator pour éviter les requêtes simultanées
        const data = await requestCoordinator.scheduleRequest(
          `unread_counts_${userId}`,
          async () => {
            // Utiliser smartCache pour le cache intelligent
            return smartCache.get(
              `unread_counts_full_${userId}`,
              "unread_counts",
              async () => {
                const { data, error } = await supabase
                  .from("conversation_participants")
                  .select("conversation_id, unread_count")
                  .eq("participant_id", userId);

                if (error) {
                  console.error(
                    "Erreur lors du chargement des compteurs:",
                    error,
                  );
                  return { total: 0, byConversation: {} };
                }

                // Traiter les données
                const byConversation: Record<string, number> = {};
                let total = 0;

                data?.forEach((item) => {
                  byConversation[item.conversation_id] = item.unread_count || 0;
                  total += item.unread_count || 0;
                });

                return { total, byConversation };
              },
              force,
            );
          },
          "medium", // Priorité moyenne
        );

        // Mettre à jour l'état uniquement si le composant est toujours monté
        if (isActiveRef.current && data) {
          setUnreadCounts(data);

          // Émettre un événement global moins fréquent
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("vynal:messages-update", {
                detail: { counts: data, timestamp: Date.now() },
              }),
            );
          }
        }

        return data;
      } catch (error) {
        console.error("Erreur lors du chargement des compteurs:", error);
        return { total: 0, byConversation: {} };
      } finally {
        initializingRef.current = false;
      }
    },
    [userId],
  );

  // Fonction pour marquer comme lu (optimisée avec les services existants)
  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!userId) return;

      try {
        // Mise à jour locale immédiate pour une UX réactive
        setUnreadCounts((prev) => {
          const newByConversation = { ...prev.byConversation };
          const oldUnread = newByConversation[conversationId] || 0;
          newByConversation[conversationId] = 0;

          const newCounts = {
            total: Math.max(0, prev.total - oldUnread),
            byConversation: newByConversation,
          };

          // Mettre à jour le cache immédiatement
          smartCache.set(
            `unread_counts_full_${userId}`,
            newCounts,
            "unread_counts",
          );

          return newCounts;
        });

        // Coordonner la mise à jour en base
        await requestCoordinator.scheduleRequest(
          `mark_read_${conversationId}_${userId}`,
          async () => {
            const { error } = await supabase
              .from("conversation_participants")
              .update({ unread_count: 0 })
              .eq("conversation_id", conversationId)
              .eq("participant_id", userId);

            if (error) throw error;
          },
          "high", // Priorité haute car action utilisateur directe
        );
      } catch (error) {
        console.error("Erreur lors du marquage comme lu:", error);
        // Recharger les données en cas d'erreur
        loadUnreadCounts(true);
      }
    },
    [userId, loadUnreadCounts],
  );

  // Fonction pour incrémenter le compteur non lu
  const incrementUnread = useCallback(
    (conversationId: string, increment = 1) => {
      setUnreadCounts((prev) => {
        const newByConversation = { ...prev.byConversation };
        newByConversation[conversationId] =
          (newByConversation[conversationId] || 0) + increment;

        return {
          total: prev.total + increment,
          byConversation: newByConversation,
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (!userId) {
      // Reset l'état si pas d'userId
      setUnreadCounts({ total: 0, byConversation: {} });
      return;
    }

    isActiveRef.current = true;

    // Charger les compteurs au démarrage seulement si pas en cache
    loadUnreadCounts();

    // S'abonner aux mises à jour ULTRA rarement
    let subscription: RealtimeChannel | undefined;

    // Throttler ultra agressivement les événements de subscription
    let lastSubscriptionUpdate = 0;

    subscription = supabase
      .channel(`unread-minimal-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
          filter: `participant_id=eq.${userId}`,
        },
        (payload) => {
          // Throttler ultra agressivement
          const now = Date.now();
          if (now - lastSubscriptionUpdate > THROTTLE_DURATION) {
            lastSubscriptionUpdate = now;
            // Délai très long pour éviter les pics
            setTimeout(() => {
              if (isActiveRef.current) {
                loadUnreadCounts(false); // Utiliser le cache
              }
            }, 15000); // 15 secondes de délai
          }
          return undefined;
        },
      )
      .subscribe();

    // Événement de visibilité ultra restrictif
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActiveRef.current) {
        const now = Date.now();
        // Seulement si la dernière mise à jour était il y a plus de 10 minutes
        if (now - lastVisibilityUpdate.current > VISIBILITY_THROTTLE) {
          lastVisibilityUpdate.current = now;
          // Long délai pour éviter les requêtes au retour d'onglet
          setTimeout(() => {
            if (isActiveRef.current) {
              loadUnreadCounts(false);
            }
          }, 5000); // 5 secondes de délai
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActiveRef.current = false;
      if (subscription) {
        subscription.unsubscribe();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userId, loadUnreadCounts]);

  return {
    unreadCounts,
    markAsRead,
    incrementUnread,
    refresh: () => loadUnreadCounts(true),
  };
};
