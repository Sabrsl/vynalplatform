/**
 * RequestCoordinator
 * 
 * Utilitaire pour coordonner les requêtes et éviter les appels multiples simultanés
 * Réduit la charge sur l'API en regroupant les requêtes similaires
 */

// Types de priorités de requêtes
type RequestPriority = 'high' | 'medium' | 'low';

// Interface pour les requêtes en cours
interface PendingRequest {
  id: string;
  priority: RequestPriority;
  timestamp: number;
  promise: Promise<any>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

class RequestCoordinator {
  // Stockage des requêtes en cours
  private pendingRequests: Map<string, PendingRequest> = new Map();
  
  // Délais de débounce par priorité (en ms)
  private debounceTimeouts: Record<RequestPriority, number> = {
    high: 100,     // 100ms pour les requêtes prioritaires
    medium: 500,   // 500ms pour les requêtes moyennes
    low: 1000      // 1s pour les requêtes de faible priorité
  };
  
  // Délais minimum entre les requêtes du même type
  private minRequestInterval: Record<RequestPriority, number> = {
    high: 5000,     // 5s pour les requêtes prioritaires
    medium: 15000,  // 15s pour les requêtes moyennes
    low: 30000      // 30s pour les requêtes de faible priorité
  };
  
  // Historique des requêtes récentes
  private requestHistory: Map<string, number> = new Map();
  
  // Timeouts pour le debounce
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Planifie une requête avec coordination
   * 
   * @param requestId - Identifiant unique de la requête
   * @param requestFn - Fonction à exécuter
   * @param priority - Priorité de la requête
   * @returns Promise avec le résultat de la requête
   */
  public scheduleRequest<T>(
    requestId: string,
    requestFn: () => Promise<T>,
    priority: RequestPriority = 'medium'
  ): Promise<T> {
    // Vérifier si une requête du même type a été faite récemment
    const lastRequestTime = this.requestHistory.get(requestId) || 0;
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    // Si une requête similaire existe déjà et est en cours, retourner sa promesse
    if (this.pendingRequests.has(requestId)) {
      return this.pendingRequests.get(requestId)!.promise as Promise<T>;
    }
    
    // Si une requête similaire a été faite récemment, vérifier l'intervalle minimum
    if (timeSinceLastRequest < this.minRequestInterval[priority]) {
      console.log(`[RequestCoordinator] Requête ${requestId} ignorée (intervalle: ${timeSinceLastRequest}ms < ${this.minRequestInterval[priority]}ms)`);
      
      // Créer une promesse qui sera résolue immédiatement
      return Promise.resolve(null) as Promise<T>;
    }
    
    // Annuler le timeout existant si présent
    if (this.timeouts.has(requestId)) {
      clearTimeout(this.timeouts.get(requestId)!);
      this.timeouts.delete(requestId);
    }
    
    // Créer une nouvelle promesse
    let resolvePromise: (value: T) => void = () => {};
    let rejectPromise: (reason?: any) => void = () => {};
    
    const promise = new Promise<T>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    
    // Enregistrer la requête en attente
    const pendingRequest: PendingRequest = {
      id: requestId,
      priority,
      timestamp: now,
      promise,
      resolve: resolvePromise,
      reject: rejectPromise
    };
    
    this.pendingRequests.set(requestId, pendingRequest);
    
    // Définir un timeout pour le debounce
    const timeout = setTimeout(() => {
      this.executeRequest(requestId, requestFn);
    }, this.debounceTimeouts[priority]);
    
    this.timeouts.set(requestId, timeout);
    
    return promise;
  }
  
  /**
   * Exécute une requête et gère son résultat
   * 
   * @param requestId - Identifiant de la requête
   * @param requestFn - Fonction à exécuter
   */
  private async executeRequest<T>(requestId: string, requestFn: () => Promise<T>): Promise<void> {
    this.timeouts.delete(requestId);
    
    // Vérifier que la requête existe toujours
    if (!this.pendingRequests.has(requestId)) {
      return;
    }
    
    const request = this.pendingRequests.get(requestId)!;
    
    try {
      // Exécuter la requête
      const result = await requestFn();
      
      // Mettre à jour l'historique des requêtes
      this.requestHistory.set(requestId, Date.now());
      
      // Résoudre la promesse
      request.resolve(result);
    } catch (error) {
      // Rejeter la promesse en cas d'erreur
      request.reject(error);
    } finally {
      // Supprimer la requête des requêtes en cours
      this.pendingRequests.delete(requestId);
    }
  }
  
  /**
   * Annule toutes les requêtes en attente
   */
  public cancelAllRequests(): void {
    // Nettoyer les timeouts
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    
    // Rejeter toutes les promesses
    for (const request of this.pendingRequests.values()) {
      request.reject(new Error('Request cancelled'));
    }
    this.pendingRequests.clear();
  }
  
  /**
   * Réinitialise l'historique des requêtes
   */
  public clearHistory(): void {
    this.requestHistory.clear();
  }
}

// Exporter une instance unique pour toute l'application
const requestCoordinator = new RequestCoordinator();
export default requestCoordinator; 