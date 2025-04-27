import { createClient } from '@/lib/supabase/client';

/**
 * Crée un wallet pour un utilisateur s'il n'en a pas déjà un
 * @param userId ID de l'utilisateur pour lequel créer un wallet
 * @returns L'ID du wallet créé ou existant, ou null en cas d'erreur
 */
export async function createWalletIfNotExists(userId: string): Promise<string | null> {
  const supabase = createClient();
  console.log(`Vérification/création du wallet pour l'utilisateur ${userId}`);
  
  try {
    // D'abord, vérifions si l'utilisateur a déjà un wallet
    const { data: existingWallet, error: fetchError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    // Si un wallet existe déjà, on le retourne
    if (existingWallet && existingWallet.id) {
      console.log(`L'utilisateur ${userId} a déjà un wallet: ${existingWallet.id}`);
      return existingWallet.id;
    }
    
    // Si l'erreur n'est pas "pas de résultat", c'est une vraie erreur
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Erreur lors de la vérification du wallet:", fetchError);
      return null;
    }
    
    // Créer un nouveau wallet pour l'utilisateur
    console.log(`Création d'un nouveau wallet pour l'utilisateur ${userId}`);
    const { data: newWallet, error: insertError } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        balance: 0
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error("Erreur lors de la création du wallet:", insertError);
      
      // En cas d'erreur de violation de contrainte unique, cela pourrait signifier
      // qu'un wallet a été créé entre-temps (race condition), donc on réessaie de récupérer
      if (insertError.code === '23505') { // Code PostgreSQL pour violation de contrainte unique
        const { data: retryWallet, error: retryError } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (!retryError && retryWallet) {
          console.log(`Wallet récupéré après erreur de duplication: ${retryWallet.id}`);
          return retryWallet.id;
        }
      }
      
      return null;
    }
    
    console.log(`Nouveau wallet créé avec succès: ${newWallet.id}`);
    return newWallet.id;
  } catch (err) {
    console.error("Exception dans createWalletIfNotExists:", err);
    return null;
  }
} 