import { NextRequest, NextResponse } from 'next/server';
import { STATIC_PAGES } from '@/lib/optimizations/static-invalidation';

/**
 * API endpoint pour vérifier le statut des pages statiques
 * Cette API fournit des informations sur la configuration de cache des pages
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    staticPages: STATIC_PAGES,
    faqConfig: {
      path: STATIC_PAGES.FAQ,
      isCached: true,
      revalidationPeriod: '30 jours (2592000 secondes)',
      isDynamic: false,
      isStatic: true,
      forceStatic: true
    },
    aboutConfig: {
      path: STATIC_PAGES.ABOUT,
      isCached: true,
      revalidationPeriod: '30 jours (2592000 secondes)',
      isDynamic: false,
      isStatic: true,
      forceStatic: true
    },
    howItWorksConfig: {
      path: STATIC_PAGES.HOW_IT_WORKS,
      isCached: true,
      revalidationPeriod: '30 jours (2592000 secondes)',
      isDynamic: false,
      isStatic: true,
      forceStatic: true
    },
    freelanceConfig: {
      path: STATIC_PAGES.FREELANCE,
      isCached: true,
      revalidationPeriod: '30 jours (2592000 secondes)',
      isDynamic: false,
      isStatic: true,
      forceStatic: true
    },
    statusConfig: {
      path: STATIC_PAGES.STATUS,
      isCached: true,
      revalidationPeriod: '30 jours (2592000 secondes)',
      isDynamic: true,
      isStatic: false,
      forceStatic: false,
      usesJsonData: true,
      dataSource: '/public/data/system-status.json'
    },
    contactConfig: {
      path: STATIC_PAGES.CONTACT,
      isCached: true,
      revalidationPeriod: '30 jours (2592000 secondes)',
      isDynamic: false,
      isStatic: true,
      forceStatic: true,
      hasClientForm: true
    },
    termsConfig: {
      path: STATIC_PAGES.TERMS,
      isCached: true,
      revalidationPeriod: '30 jours (2592000 secondes)',
      isDynamic: false,
      isStatic: true,
      forceStatic: true
    },
    privacyConfig: {
      path: STATIC_PAGES.PRIVACY,
      isCached: true,
      revalidationPeriod: '30 jours (2592000 secondes)',
      isDynamic: false,
      isStatic: true,
      forceStatic: true
    },
    codeOfConductConfig: {
      path: STATIC_PAGES.CODE_OF_CONDUCT,
      isCached: true,
      revalidationPeriod: '30 jours (2592000 secondes)',
      isDynamic: false,
      isStatic: true,
      forceStatic: true
    },
    homeConfig: {
      path: STATIC_PAGES.HOME,
      isCached: true,
      revalidationPeriod: '30 jours (2592000 secondes)',
      isDynamic: true,
      isStatic: false,
      forceStatic: false,
      isHome: true,
      priority: 'high'
    },
    timestamp: new Date().toISOString()
  });
} 