/**
 * Déclarations de types pour les services de cryptographie
 * Ces déclarations pointent vers l'implémentation officielle dans src/lib/security/server-crypto-service.ts
 */

// Ré-exporter l'interface depuis le module officiel
import { ServerCryptoService } from '@/lib/security/server-crypto-service';
export { ServerCryptoService };

// Ne pas déclarer de fonctions d'implémentation dans les fichiers de définition
// Utilisez directement l'importation depuis le module officiel
// import { createServerCryptoService } from '@/lib/security/server-crypto-service';