import { createClient } from '@/lib/supabase/client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

export type Dispute = Database['public']['Tables']['disputes']['Row'];
export type DisputeInsert = Database['public']['Tables']['disputes']['Insert'];
export type DisputeUpdate = Database['public']['Tables']['disputes']['Update'];

export type DisputeWithDetails = Dispute & {
  client: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  freelance: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  order: {
    id: string;
    service_id: string;
    service_title?: string;
  };
  resolved_at?: string;
  closed_at?: string;
};

export type DisputeMessage = {
  id: string;
  dispute_id: string;
  user_id: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
  user?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
};

/**
 * Récupère les disputes pour un utilisateur
 */
export async function getUserDisputes(userId: string): Promise<DisputeWithDetails[]> {
  const supabase = createClientComponentClient<Database>();
  
  // Simuler des données pour la démo
  const mockDisputes: DisputeWithDetails[] = [
    {
      id: "dispute-1",
      client_id: userId,
      freelance_id: "freelance-1",
      order_id: "order-1",
      reason: "Le travail livré ne correspond pas aux exigences spécifiées dans le cahier des charges",
      status: "open",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_by: null,
      resolution: null,
      client: {
        id: userId,
        username: "clientuser",
        full_name: "Jean Martin",
        avatar_url: "/avatars/jean.jpg"
      },
      freelance: {
        id: "freelance-1",
        username: "designpro",
        full_name: "Marie Dupont",
        avatar_url: "/avatars/marie.jpg"
      },
      order: {
        id: "order-1",
        service_id: "service-1",
        service_title: "Création d'un logo professionnel"
      }
    },
    {
      id: "dispute-2",
      client_id: userId,
      freelance_id: "freelance-2",
      order_id: "order-2",
      reason: "Retard important dans la livraison qui a impacté mon planning",
      status: "resolved",
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_by: "admin-1",
      resolution: "Le prestataire a fourni une compensation et une version finale satisfaisante.",
      resolved_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      client: {
        id: userId,
        username: "clientuser",
        full_name: "Jean Martin",
        avatar_url: "/avatars/jean.jpg"
      },
      freelance: {
        id: "freelance-2",
        username: "contentwizard",
        full_name: "Lucas Bernard",
        avatar_url: "/avatars/lucas.jpg"
      },
      order: {
        id: "order-2",
        service_id: "service-2",
        service_title: "Rédaction d'un article SEO optimisé"
      }
    },
    {
      id: "dispute-3",
      client_id: userId,
      freelance_id: "freelance-3",
      order_id: "order-3",
      reason: "Le design du site web ne correspond pas aux références partagées",
      status: "closed",
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_by: null,
      resolution: "Abandon du litige après accord entre les parties.",
      closed_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      client: {
        id: userId,
        username: "clientuser",
        full_name: "Jean Martin",
        avatar_url: "/avatars/jean.jpg"
      },
      freelance: {
        id: "freelance-3",
        username: "webdev",
        full_name: "Sophie Mercier",
        avatar_url: "/avatars/sophie.jpg"
      },
      order: {
        id: "order-3",
        service_id: "service-3",
        service_title: "Création d'un site web vitrine"
      }
    },
    {
      id: "dispute-4",
      client_id: userId,
      freelance_id: "freelance-4",
      order_id: "order-4",
      reason: "La qualité des images fournies est insuffisante pour l'impression",
      status: "open",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_by: null,
      resolution: null,
      client: {
        id: userId,
        username: "clientuser",
        full_name: "Jean Martin",
        avatar_url: "/avatars/jean.jpg"
      },
      freelance: {
        id: "freelance-4",
        username: "creativedesign",
        full_name: "Élodie Petit",
        avatar_url: "/avatars/elodie.jpg"
      },
      order: {
        id: "order-4",
        service_id: "service-4",
        service_title: "Design d'une brochure commerciale"
      }
    }
  ];
  
  // Si c'est un freelance, inverser les ID
  const userInfo = await supabase.auth.getUser();
  if (userInfo.data.user?.user_metadata?.role === "freelance") {
    mockDisputes.forEach(dispute => {
      const tempId = dispute.client_id;
      dispute.client_id = dispute.freelance_id;
      dispute.freelance_id = tempId;
      
      const tempUser = dispute.client;
      dispute.client = dispute.freelance;
      dispute.freelance = tempUser;
    });
  }
  
  // Retourner les mock data au lieu de faire l'appel API
  return mockDisputes;
  
  /* Code original commenté pour la démo
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      client:client_id(id, username, full_name, avatar_url),
      freelance:freelance_id(id, username, full_name, avatar_url),
      order:order_id(id, service_id)
    `)
    .or(`client_id.eq.${userId},freelance_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching disputes:', error);
    return [];
  }

  return data as unknown as DisputeWithDetails[];
  */
}

/**
 * Récupère une dispute par son ID
 */
export async function getDisputeById(disputeId: string): Promise<DisputeWithDetails | null> {
  const supabase = createClientComponentClient<Database>();
  
  // Simuler des données pour la démo
  const mockDisputes: Record<string, DisputeWithDetails> = {
    "dispute-1": {
      id: "dispute-1",
      client_id: "client-1",
      freelance_id: "freelance-1",
      order_id: "order-1",
      reason: "Le travail livré ne correspond pas aux exigences spécifiées dans le cahier des charges",
      status: "open",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_by: null,
      resolution: null,
      client: {
        id: "client-1",
        username: "clientuser",
        full_name: "Jean Martin",
        avatar_url: "/avatars/jean.jpg"
      },
      freelance: {
        id: "freelance-1",
        username: "designpro",
        full_name: "Marie Dupont",
        avatar_url: "/avatars/marie.jpg"
      },
      order: {
        id: "order-1",
        service_id: "service-1",
        service_title: "Création d'un logo professionnel"
      }
    },
    "dispute-2": {
      id: "dispute-2",
      client_id: "client-1",
      freelance_id: "freelance-2",
      order_id: "order-2",
      reason: "Retard important dans la livraison qui a impacté mon planning",
      status: "resolved",
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_by: "admin-1",
      resolution: "Le prestataire a fourni une compensation et une version finale satisfaisante.",
      resolved_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      client: {
        id: "client-1",
        username: "clientuser",
        full_name: "Jean Martin",
        avatar_url: "/avatars/jean.jpg"
      },
      freelance: {
        id: "freelance-2",
        username: "contentwizard",
        full_name: "Lucas Bernard",
        avatar_url: "/avatars/lucas.jpg"
      },
      order: {
        id: "order-2",
        service_id: "service-2",
        service_title: "Rédaction d'un article SEO optimisé"
      }
    },
    "dispute-3": {
      id: "dispute-3",
      client_id: "client-1",
      freelance_id: "freelance-3",
      order_id: "order-3",
      reason: "Le design du site web ne correspond pas aux références partagées",
      status: "closed",
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_by: null,
      resolution: "Abandon du litige après accord entre les parties.",
      closed_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      client: {
        id: "client-1",
        username: "clientuser",
        full_name: "Jean Martin",
        avatar_url: "/avatars/jean.jpg"
      },
      freelance: {
        id: "freelance-3",
        username: "webdev",
        full_name: "Sophie Mercier",
        avatar_url: "/avatars/sophie.jpg"
      },
      order: {
        id: "order-3",
        service_id: "service-3",
        service_title: "Création d'un site web vitrine"
      }
    },
    "dispute-4": {
      id: "dispute-4",
      client_id: "client-1",
      freelance_id: "freelance-4",
      order_id: "order-4",
      reason: "La qualité des images fournies est insuffisante pour l'impression",
      status: "open",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_by: null,
      resolution: null,
      client: {
        id: "client-1",
        username: "clientuser",
        full_name: "Jean Martin",
        avatar_url: "/avatars/jean.jpg"
      },
      freelance: {
        id: "freelance-4",
        username: "creativedesign",
        full_name: "Élodie Petit",
        avatar_url: "/avatars/elodie.jpg"
      },
      order: {
        id: "order-4",
        service_id: "service-4",
        service_title: "Design d'une brochure commerciale"
      }
    }
  };
  
  // Retourner la dispute fictive correspondante
  return mockDisputes[disputeId] || null;
  
  /* Code original commenté pour la démo
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      client:client_id(id, username, full_name, avatar_url),
      freelance:freelance_id(id, username, full_name, avatar_url),
      order:order_id(id, service_id)
    `)
    .eq('id', disputeId)
    .single();

  if (error) {
    console.error('Error fetching dispute:', error);
    return null;
  }

  return data as unknown as DisputeWithDetails;
  */
}

/**
 * Crée une nouvelle dispute
 */
export async function createDispute(disputeData: DisputeInsert): Promise<Dispute | null> {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from('disputes')
    .insert(disputeData)
    .select()
    .single();

  if (error) {
    console.error('Error creating dispute:', error);
    return null;
  }

  return data;
}

/**
 * Met à jour une dispute
 */
export async function updateDispute(disputeId: string, updateData: DisputeUpdate): Promise<boolean> {
  const supabase = createClientComponentClient<Database>();
  
  const { error } = await supabase
    .from('disputes')
    .update(updateData)
    .eq('id', disputeId);

  if (error) {
    console.error('Error updating dispute:', error);
    return false;
  }

  return true;
}

/**
 * Ajoute un message à une dispute
 */
export async function addDisputeMessage(
  disputeId: string,
  userId: string,
  message: string,
  attachmentUrl?: string
): Promise<boolean> {
  const supabase = createClientComponentClient<Database>();
  
  // Simuler un ajout de message pour la démo
  console.log('Message ajouté (simulé):', {
    disputeId,
    userId,
    message,
    attachmentUrl
  });
  
  // Toujours renvoyer true pour simuler une réussite
  return true;
  
  /* Code original commenté pour la démo
  const { error } = await supabase
    .from('dispute_messages')
    .insert({
      dispute_id: disputeId,
      user_id: userId,
      message,
      attachment_url: attachmentUrl
    });

  if (error) {
    console.error('Error adding dispute message:', error);
    return false;
  }

  return true;
  */
}

/**
 * Récupère les messages d'une dispute
 */
export async function getDisputeMessages(disputeId: string): Promise<DisputeMessage[]> {
  const supabase = createClientComponentClient<Database>();
  
  // Simuler des données pour la démo
  const mockMessages: Record<string, DisputeMessage[]> = {
    "dispute-1": [
      {
        id: "msg-1",
        dispute_id: "dispute-1",
        user_id: "client-1",
        message: "Bonjour, je constate que le logo ne respecte pas les directives de ma marque. Les couleurs sont différentes de celles demandées et le style est trop complexe pour notre identité minimaliste.",
        attachment_url: null,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "client-1",
          username: "clientuser",
          full_name: "Jean Martin",
          avatar_url: "/avatars/jean.jpg"
        }
      },
      {
        id: "msg-2",
        dispute_id: "dispute-1",
        user_id: "freelance-1",
        message: "Bonjour Jean, je suis désolée pour ce malentendu. Pouvez-vous préciser quelles couleurs exactement ne correspondent pas au brief? J'ai pourtant utilisé le code hexadécimal #2E5090 que vous avez fourni pour le bleu principal.",
        attachment_url: null,
        created_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "freelance-1",
          username: "designpro",
          full_name: "Marie Dupont",
          avatar_url: "/avatars/marie.jpg"
        }
      },
      {
        id: "msg-3",
        dispute_id: "dispute-1",
        user_id: "client-1",
        message: "En fait, je voulais un bleu plus clair, plus proche de #4B72B8. Je vous avais envoyé une référence visuelle par email également. Concernant le style, notre marque privilégie des formes géométriques simples.",
        attachment_url: "https://example.com/attachments/reference.jpg",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "client-1",
          username: "clientuser",
          full_name: "Jean Martin",
          avatar_url: "/avatars/jean.jpg"
        }
      }
    ],
    "dispute-2": [
      {
        id: "msg-4",
        dispute_id: "dispute-2",
        user_id: "client-1",
        message: "Le délai de livraison de 3 jours n'a pas été respecté. J'ai attendu 7 jours pour recevoir l'article, ce qui a impacté la publication sur mon blog.",
        attachment_url: null,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "client-1",
          username: "clientuser",
          full_name: "Jean Martin",
          avatar_url: "/avatars/jean.jpg"
        }
      },
      {
        id: "msg-5",
        dispute_id: "dispute-2",
        user_id: "freelance-2",
        message: "Je m'excuse sincèrement pour ce retard. J'ai rencontré des problèmes de santé qui m'ont empêché de respecter le délai. Je comprends que cela ait impacté votre planning et je vous propose une réduction de 20% sur le prix.",
        attachment_url: null,
        created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "freelance-2",
          username: "contentwizard",
          full_name: "Lucas Bernard",
          avatar_url: "/avatars/lucas.jpg"
        }
      },
      {
        id: "msg-6",
        dispute_id: "dispute-2",
        user_id: "admin-1",
        message: "Suite à l'examen de ce litige, nous considérons que la proposition de compensation du prestataire est appropriée compte tenu des circonstances. Si vous acceptez cette résolution, veuillez nous le confirmer.",
        attachment_url: null,
        created_at: new Date(Date.now() - 8.5 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "admin-1",
          username: "admin",
          full_name: "Support Vynal",
          avatar_url: "/avatars/admin.jpg"
        }
      },
      {
        id: "msg-7",
        dispute_id: "dispute-2",
        user_id: "client-1",
        message: "J'accepte cette proposition de compensation. Merci pour votre intervention.",
        attachment_url: null,
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "client-1",
          username: "clientuser",
          full_name: "Jean Martin",
          avatar_url: "/avatars/jean.jpg"
        }
      }
    ],
    "dispute-3": [
      {
        id: "msg-8",
        dispute_id: "dispute-3",
        user_id: "client-1",
        message: "Le design du site ne correspond pas aux références que j'ai partagées. Le style est trop moderne alors que je souhaitais quelque chose de plus classique et professionnel.",
        attachment_url: null,
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "client-1",
          username: "clientuser",
          full_name: "Jean Martin",
          avatar_url: "/avatars/jean.jpg"
        }
      },
      {
        id: "msg-9",
        dispute_id: "dispute-3",
        user_id: "freelance-3",
        message: "Je comprends votre préoccupation. Après avoir relu le cahier des charges, il semble qu'il y ait eu une mauvaise interprétation de ma part concernant le style souhaité. Je vous propose de retravailler le design sans frais supplémentaires.",
        attachment_url: null,
        created_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "freelance-3",
          username: "webdev",
          full_name: "Sophie Mercier",
          avatar_url: "/avatars/sophie.jpg"
        }
      },
      {
        id: "msg-10",
        dispute_id: "dispute-3",
        user_id: "client-1",
        message: "Merci pour cette proposition. J'ai finalement décidé de faire appel à un autre prestataire pour ce projet. Nous pouvons donc clôturer ce litige.",
        attachment_url: null,
        created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "client-1",
          username: "clientuser",
          full_name: "Jean Martin",
          avatar_url: "/avatars/jean.jpg"
        }
      }
    ],
    "dispute-4": [
      {
        id: "msg-11",
        dispute_id: "dispute-4",
        user_id: "client-1",
        message: "Les images fournies pour la brochure sont en basse résolution et ne conviennent pas pour l'impression. J'ai besoin d'images en 300 DPI minimum.",
        attachment_url: null,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "client-1",
          username: "clientuser",
          full_name: "Jean Martin",
          avatar_url: "/avatars/jean.jpg"
        }
      },
      {
        id: "msg-12",
        dispute_id: "dispute-4",
        user_id: "freelance-4",
        message: "Je vais vérifier cela immédiatement. Il est possible que j'aie envoyé par erreur des versions web des images. Je vous fournirai les versions haute résolution dans la journée.",
        attachment_url: null,
        created_at: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "freelance-4",
          username: "creativedesign",
          full_name: "Élodie Petit",
          avatar_url: "/avatars/elodie.jpg"
        }
      },
      {
        id: "msg-13",
        dispute_id: "dispute-4",
        user_id: "client-1",
        message: "Merci, j'attends votre envoi. Avez-vous une idée du délai exact ?",
        attachment_url: null,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "client-1",
          username: "clientuser",
          full_name: "Jean Martin",
          avatar_url: "/avatars/jean.jpg"
        }
      },
      {
        id: "msg-14",
        dispute_id: "dispute-4",
        user_id: "freelance-4",
        message: "Je devrais pouvoir vous les envoyer d'ici ce soir, 18h au plus tard. Je vous présente encore mes excuses pour ce désagrément.",
        attachment_url: null,
        created_at: new Date(Date.now() - 3.8 * 24 * 60 * 60 * 1000).toISOString(),
        user: {
          id: "freelance-4",
          username: "creativedesign",
          full_name: "Élodie Petit",
          avatar_url: "/avatars/elodie.jpg"
        }
      }
    ]
  };
  
  // Retourner les messages fictifs correspondants
  return mockMessages[disputeId] || [
    {
      id: "msg-default",
      dispute_id: disputeId,
      user_id: "client-1",
      message: "Ouverture du litige pour cette commande.",
      attachment_url: null,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "client-1",
        username: "clientuser",
        full_name: "Jean Martin", 
        avatar_url: "/avatars/jean.jpg"
      }
    }
  ];
  
  /* Code original commenté pour la démo
  const { data, error } = await supabase
    .from('dispute_messages')
    .select(`
      id,
      dispute_id,
      user_id,
      message,
      attachment_url,
      created_at,
      user:user_id(id, username, full_name, avatar_url)
    `)
    .eq('dispute_id', disputeId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching dispute messages:', error);
    return [];
  }

  return data as unknown as DisputeMessage[];
  */
}

/**
 * Upload un fichier attaché à un message de dispute
 */
export async function uploadDisputeAttachment(
  disputeId: string,
  fileName: string,
  file: File
): Promise<string | null> {
  const supabase = createClientComponentClient<Database>();
  
  // Simuler un upload de fichier pour la démo
  console.log('Fichier uploadé (simulé):', {
    disputeId,
    fileName,
    fileSize: file.size
  });
  
  // Retourner une URL fictive
  return `https://example.com/disputes/${disputeId}/attachments/${fileName}`;
  
  /* Code original commenté pour la démo
  const { data, error } = await supabase
    .storage
    .from('dispute-attachments')
    .upload(`${disputeId}/${fileName}`, file);

  if (error) {
    console.error('Error uploading attachment:', error);
    return null;
  }

  const { data: urlData } = supabase
    .storage
    .from('dispute-attachments')
    .getPublicUrl(`${disputeId}/${fileName}`);

  return urlData.publicUrl;
  */
}

/**
 * Récupère toutes les disputes (pour les admins)
 */
export async function getAllDisputes(): Promise<DisputeWithDetails[]> {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      client:client_id(id, username, full_name, avatar_url),
      freelance:freelance_id(id, username, full_name, avatar_url),
      order:order_id(id, service_id)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all disputes:', error);
    return [];
  }

  return data as unknown as DisputeWithDetails[];
} 