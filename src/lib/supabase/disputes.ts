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
  
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      client:profiles!client_id(id, username, full_name, avatar_url),
      freelance:profiles!freelance_id(id, username, full_name, avatar_url),
      order:orders!order_id(
        id, 
        service_id,
        service:services(
          id,
          title
        )
      )
    `)
    .or(`client_id.eq.${userId},freelance_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching disputes:', error);
    return [];
  }

  // Transformer les données pour avoir la bonne structure
  const transformedData = data.map(dispute => {
    return {
      ...dispute,
      order: {
        ...dispute.order,
        service_title: dispute.order?.service?.title
      }
    };
  });

  return transformedData as unknown as DisputeWithDetails[];
}

/**
 * Récupère une dispute par son ID
 */
export async function getDisputeById(disputeId: string): Promise<DisputeWithDetails | null> {
  const supabase = createClientComponentClient<Database>();
  
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      client:profiles!client_id(id, username, full_name, avatar_url),
      freelance:profiles!freelance_id(id, username, full_name, avatar_url),
      order:orders!order_id(
        id, 
        service_id,
        service:services(
          id,
          title
        )
      )
    `)
    .eq('id', disputeId)
    .single();

  if (error) {
    console.error('Error fetching dispute:', error);
    return null;
  }

  // Transformer les données pour avoir la bonne structure
  const transformedData = {
    ...data,
    order: {
      ...data.order,
      service_title: data.order?.service?.title
    }
  };

  return transformedData as unknown as DisputeWithDetails;
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
}

/**
 * Récupère les messages d'une dispute
 */
export async function getDisputeMessages(disputeId: string): Promise<DisputeMessage[]> {
  const supabase = createClientComponentClient<Database>();
  
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
}

/**
 * Upload un fichier attaché à un message de dispute
 */
export async function uploadDisputeAttachment(
  disputeId: string,
  file: File
): Promise<string | null> {
  const supabase = createClientComponentClient<Database>();
  const fileName = `${Date.now()}-${file.name}`;
  
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
      client:profiles!client_id(id, username, full_name, avatar_url),
      freelance:profiles!freelance_id(id, username, full_name, avatar_url),
      order:orders!order_id(
        id, 
        service_id,
        service:services(
          id,
          title
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all disputes:', error);
    return [];
  }

  // Transformer les données pour avoir la bonne structure
  const transformedData = data.map(dispute => {
    return {
      ...dispute,
      order: {
        ...dispute.order,
        service_title: dispute.order?.service?.title
      }
    };
  });

  return transformedData as unknown as DisputeWithDetails[];
} 