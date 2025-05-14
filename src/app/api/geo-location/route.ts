import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export const dynamic = 'force-dynamic';

/**
 * API endpoint pour récupérer les informations de géolocalisation de l'utilisateur.
 * Ces données sont extraites des en-têtes Cloudflare présents dans les requêtes Supabase.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Récupérer les en-têtes pour l'analyse
    const headers = Object.fromEntries(req.headers.entries());
    
    // En-têtes Cloudflare importants
    const cfIpCountry = headers['cf-ipcountry'] || '';
    const cfConnectingIp = headers['cf-connecting-ip'] || headers['x-real-ip'] || headers['x-forwarded-for'] || '';
    const cfRay = headers['cf-ray'] || '';
    
    // Récupérer l'utilisateur actuel
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;
    
    let userCountry = cfIpCountry || 'SN'; // Par défaut: Sénégal (zone FCFA)
    let userContinentCode = 'AF'; // Par défaut: Afrique
    let geoData: Record<string, any> = {};
    
    // Si nous avons un utilisateur authentifié, essayer de récupérer ses préférences de devise
    if (userId) {
      // Récupérer les préférences utilisateur depuis la table profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('country, continent, currency_preference')
        .eq('id', userId)
        .single();
      
      if (profileData) {
        // Utiliser la préférence de devise de l'utilisateur si elle existe
        if (profileData.currency_preference) {
          return NextResponse.json({
            country: profileData.country || userCountry,
            continent: profileData.continent || userContinentCode,
            currency: profileData.currency_preference,
            source: 'user_preference'
          }, { status: 200 });
        }
        
        // Sinon, utiliser le pays enregistré dans le profil si disponible
        if (profileData.country) {
          userCountry = profileData.country;
          userContinentCode = profileData.continent || 'AF';
        }
      }
    }
    
    // Si nous avons un événement Supabase avec des infos CF détaillées
    // Utiliser les informations fournies par Cloudflare via les headers
    if (cfIpCountry) {
      geoData = {
        country: cfIpCountry,
        ip: cfConnectingIp,
        ray: cfRay,
        source: 'cloudflare_headers'
      };
    } else {
      // Essayer de détecter via d'autres moyens (en développement)
      geoData = {
        country: userCountry,
        continent: userContinentCode,
        ip: cfConnectingIp || req.headers.get('x-forwarded-for') || 'unknown',
        source: 'fallback'
      };
    }
    
    // En développement, permettre de simuler différents pays
    const url = new URL(req.url);
    const testCountry = url.searchParams.get('country');
    
    if (testCountry && process.env.NODE_ENV === 'development') {
      geoData.country = testCountry;
      geoData.source = 'test_param';
    }
    
    console.log('Geo-location données détectées:', geoData);
    
    return NextResponse.json(geoData, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de géolocalisation:', error);
    
    // En cas d'erreur, retourner le pays par défaut (Sénégal - zone FCFA)
    return NextResponse.json(
      { country: 'SN', error: 'Erreur de détection', source: 'error_fallback' },
      { status: 500 }
    );
  }
}

/**
 * Dans un environnement Cloudflare, les données disponibles incluent:
 * - cf-ipcountry: Code ISO du pays (ex: "FR", "US", "MA")
 * - cf-connecting-ip: Adresse IP du client
 * - cf-ray: Identifiant unique de la requête Cloudflare
 * 
 * Supabase inclut ces informations dans les événements de logging,
 * comme montré dans l'exemple de payload fourni.
 */