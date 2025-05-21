'use client';

import React from 'react';
import { useVersionCheck } from '@/hooks/useVersionCheck';
import { UpdateNotification } from './UpdateNotification';

interface VersionCheckerProps {
  checkInterval?: number; // Intervalle en ms (par défaut: 15 minutes)
}

/**
 * Composant client qui vérifie périodiquement les mises à jour
 * et affiche une notification si une nouvelle version est disponible
 */
export default function VersionChecker({ checkInterval }: VersionCheckerProps) {
  const { hasUpdate, newVersion, applyUpdate } = useVersionCheck(checkInterval);
  
  return (
    <UpdateNotification 
      show={hasUpdate} 
      onUpdate={applyUpdate} 
      version={newVersion} 
    />
  );
} 