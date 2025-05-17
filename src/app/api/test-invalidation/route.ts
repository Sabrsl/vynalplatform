import { NextRequest, NextResponse } from 'next/server';
import { eventEmitter, EVENTS } from '@/lib/utils/events';

/**
 * API endpoint pour tester l'invalidation du cache des pages statiques
 * Cette API est uniquement à des fins de test et ne devrait pas être exposée en production
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page');
  
  if (!page) {
    return NextResponse.json(
      { error: "Le paramètre 'page' est requis" },
      { status: 400 }
    );
  }
  
  // Vérifier quelle page invalider
  let event = '';
  let pagePath = '';
  
  switch (page.toLowerCase()) {
    case 'faq':
      event = EVENTS.INVALIDATE_FAQ;
      pagePath = '/faq';
      break;
    case 'about':
      event = EVENTS.INVALIDATE_ABOUT;
      pagePath = '/about';
      console.log(`📢 Demande d'invalidation pour la page À propos`);
      break;
    case 'how-it-works':
      event = EVENTS.INVALIDATE_HOW_IT_WORKS;
      pagePath = '/how-it-works';
      console.log(`📢 Demande d'invalidation pour la page Comment ça marche`);
      break;
    case 'freelance':
      event = EVENTS.INVALIDATE_FREELANCE;
      pagePath = '/devenir-freelance';
      console.log(`📢 Demande d'invalidation pour la page Devenir freelance`);
      break;
    case 'status':
      event = EVENTS.INVALIDATE_STATUS;
      pagePath = '/status';
      console.log(`📢 Demande d'invalidation du cache pour la page Statut`);
      break;
    case 'contact':
      event = EVENTS.INVALIDATE_CONTACT;
      pagePath = '/contact';
      console.log(`📢 Demande d'invalidation pour la page Contact`);
      break;
    case 'terms':
      event = EVENTS.INVALIDATE_TERMS;
      pagePath = '/terms-of-service';
      console.log(`📢 Demande d'invalidation pour la page Conditions d'utilisation`);
      break;
    case 'privacy':
      event = EVENTS.INVALIDATE_PRIVACY;
      pagePath = '/privacy-policy';
      console.log(`📢 Demande d'invalidation pour la page Politique de confidentialité`);
      break;
    case 'code-of-conduct':
      event = EVENTS.INVALIDATE_CODE_OF_CONDUCT;
      pagePath = '/code-of-conduct';
      console.log(`📢 Demande d'invalidation pour la page Code de conduite`);
      break;
    case 'all':
      event = EVENTS.INVALIDATE_STATIC_PAGES;
      pagePath = 'toutes les pages statiques';
      break;
    default:
      return NextResponse.json(
        { error: "Page invalide. Valeurs acceptées: 'faq', 'about', 'how-it-works', 'freelance', 'status', 'contact', 'terms', 'privacy', 'code-of-conduct', 'all'" },
        { status: 400 }
      );
  }
  
  // Émettre l'événement d'invalidation
  console.log(`🔄 Test d'invalidation pour: ${pagePath}`);
  eventEmitter.emit(event);
  
  return NextResponse.json({
    success: true,
    message: `Invalidation du cache pour: ${pagePath}`,
    timestamp: new Date().toISOString()
  });
} 