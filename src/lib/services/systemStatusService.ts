import { 
    SystemFeature, 
    SystemIncident, 
    IncidentUpdate,
    FeatureStatus,
    IncidentStatus,
    IncidentSeverity
  } from '@/types/system-status';
  import fs from 'fs/promises';
  import path from 'path';
  
  // Chemin du fichier JSON pour le stockage des données
  const STORAGE_PATH = process.env.NODE_ENV === 'production' 
    ? '/data/system-status.json' 
    : './public/data/system-status.json';
  
  // Vérifie si le code s'exécute côté serveur ou client
  const isServer = typeof window === 'undefined';
  
  /**
   * Service pour gérer le statut du système
   * Ce service fournit des méthodes pour interroger et mettre à jour
   * les informations relatives à l'état des fonctionnalités du système.
   */
  export class SystemStatusService {
    // Cache des données en mémoire pour éviter des appels réseau répétés
    private static cache: {
      features?: SystemFeature[];
      incidents?: SystemIncident[];
      lastUpdated?: number;
    } = {};
  
    // Délai d'expiration du cache en ms (30 secondes)
    private static CACHE_EXPIRY = 30 * 1000;
  
    /**
     * S'assure que le fichier de stockage existe
     */
    private static async ensureStorageFile() {
      if (isServer) {
        try {
          // Vérifie si le fichier existe
          await fs.access(STORAGE_PATH);
        } catch (error) {
          // Le fichier n'existe pas, créer le répertoire et le fichier
          try {
            // Créer le répertoire parent si nécessaire
            const dirPath = path.dirname(STORAGE_PATH);
            await fs.mkdir(dirPath, { recursive: true });
            
            // Créer le fichier avec une structure de données vide
            const initialData = {
              features: [],
              incidents: [],
              last_updated: new Date().toISOString()
            };
            
            await fs.writeFile(STORAGE_PATH, JSON.stringify(initialData, null, 2), 'utf8');
            console.log("Fichier de stockage créé:", STORAGE_PATH);
          } catch (createError) {
            console.error("Erreur lors de la création du fichier de stockage:", createError);
            // En cas d'erreur de création, utiliser un cache en mémoire temporaire
            if (!this.cache.features) this.cache.features = [];
            if (!this.cache.incidents) this.cache.incidents = [];
            this.cache.lastUpdated = Date.now();
          }
        }
      }
    }
  
    /**
     * Charge les données depuis le fichier JSON
     */
    private static async loadData() {
      try {
        if (isServer) {
          // S'assurer que le fichier existe avant de le lire
          await this.ensureStorageFile();
          
          // Côté serveur, lire le fichier
          console.log("Tentative de lecture du fichier:", STORAGE_PATH);
          try {
            const data = await fs.readFile(STORAGE_PATH, 'utf8');
            console.log("Fichier lu avec succès");
            const parsedData = JSON.parse(data);
            
            this.cache.features = parsedData.features || [];
            this.cache.incidents = parsedData.incidents || [];
            this.cache.lastUpdated = Date.now();
            
            return parsedData;
          } catch (readError) {
            console.error("Erreur de lecture, utilisation des données en cache:", readError);
            // En cas d'erreur de lecture, utiliser le cache ou des données vides
            if (!this.cache.features) this.cache.features = [];
            if (!this.cache.incidents) this.cache.incidents = [];
            this.cache.lastUpdated = Date.now();
            
            return {
              features: this.cache.features,
              incidents: this.cache.incidents
            };
          }
        } else {
          // Côté client, faire une requête à l'API
          const response = await fetch('/api/status');
          const data = await response.json();
          
          this.cache.features = data.features || [];
          this.cache.incidents = [...(data.active_incidents || []), ...(data.resolved_incidents || [])];
          this.cache.lastUpdated = Date.now();
          
          return {
            features: this.cache.features,
            incidents: this.cache.incidents
          };
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        // En cas d'erreur, retourner des données vides
        if (!this.cache.features) this.cache.features = [];
        if (!this.cache.incidents) this.cache.incidents = [];
        this.cache.lastUpdated = Date.now();
        
        return { 
          features: this.cache.features, 
          incidents: this.cache.incidents 
        };
      }
    }
  
    /**
     * Sauvegarde les données dans le fichier JSON
     */
    private static async saveData() {
      try {
        if (isServer) {
          // S'assurer que le fichier existe avant d'écrire
          await this.ensureStorageFile();
          
          // Côté serveur, écrire dans le fichier
          console.log("Tentative d'écriture dans le fichier:", STORAGE_PATH);
          const data = {
            features: this.cache.features,
            incidents: this.cache.incidents,
            last_updated: new Date().toISOString()
          };
          
          try {
            await fs.writeFile(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf8');
            console.log("Fichier écrit avec succès");
          } catch (writeError) {
            console.error("Erreur d'écriture, données conservées uniquement en cache:", writeError);
          }
        } else {
          // Côté client, on ne peut pas écrire directement dans le fichier
          console.warn("Tentative d'écriture côté client. Utilisez les API endpoints.");
        }
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des données:", error);
      }
    }
  
    /**
     * Récupère toutes les fonctionnalités du système.
     * 
     * @returns Une promesse contenant la liste des fonctionnalités
     */
    static async getFeatures(): Promise<SystemFeature[]> {
      try {
        // Si les données sont en cache et le cache n'a pas expiré, les retourner
        const now = Date.now();
        if (
          this.cache.features && 
          this.cache.lastUpdated && 
          now - this.cache.lastUpdated < this.CACHE_EXPIRY
        ) {
          console.log("Utilisation du cache pour getFeatures");
          return this.cache.features;
        }
  
        // Charger les données depuis le fichier
        const data = await this.loadData();
        return this.cache.features || [];
      } catch (error) {
        console.error("Erreur lors de la récupération des fonctionnalités:", error);
        return this.cache.features || [];
      }
    }
    
    /**
     * Récupère tous les incidents du système.
     * 
     * @returns Une promesse contenant la liste des incidents
     */
    static async getIncidents(): Promise<SystemIncident[]> {
      try {
        // Si les données sont en cache et le cache n'a pas expiré, les retourner
        const now = Date.now();
        if (
          this.cache.incidents && 
          this.cache.lastUpdated && 
          now - this.cache.lastUpdated < this.CACHE_EXPIRY
        ) {
          console.log("Utilisation du cache pour getIncidents");
          return this.cache.incidents;
        }
  
        // Charger les données depuis le fichier
        const data = await this.loadData();
        return this.cache.incidents || [];
      } catch (error) {
        console.error("Erreur lors de la récupération des incidents:", error);
        return this.cache.incidents || [];
      }
    }
  
    /**
     * Met à jour le statut d'une fonctionnalité.
     * 
     * @param featureId Identifiant de la fonctionnalité
     * @param status Nouveau statut
     * @returns La fonctionnalité mise à jour
     */
    static async updateFeatureStatus(
      featureId: string, 
      status: FeatureStatus
    ): Promise<SystemFeature> {
      try {
        // S'assurer que les fonctionnalités sont chargées
        if (!this.cache.features) {
          await this.getFeatures();
        }
        
        if (!this.cache.features) {
          this.cache.features = [];
        }
        
        // Trouver la fonctionnalité
        const featureIndex = this.cache.features.findIndex(f => f.id === featureId);
        if (featureIndex === -1) {
          throw new Error(`Fonctionnalité non trouvée avec l'ID: ${featureId}`);
        }
        
        // Mettre à jour la fonctionnalité
        const updatedFeature: SystemFeature = {
          ...this.cache.features[featureIndex],
          status,
          last_updated: new Date().toISOString()
        };
        
        this.cache.features[featureIndex] = updatedFeature;
        
        // Sauvegarder les modifications
        await this.saveData();
        
        return updatedFeature;
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
        throw error;
      }
    }
    
    /**
     * Récupère une fonctionnalité par son identifiant.
     * 
     * @param featureId Identifiant de la fonctionnalité
     * @returns La fonctionnalité ou null si non trouvée
     */
    static async getFeatureById(featureId: string): Promise<SystemFeature | null> {
      try {
        // S'assurer que les fonctionnalités sont chargées
        if (!this.cache.features) {
          await this.getFeatures();
        }
        
        if (!this.cache.features) {
          return null;
        }
        
        // Trouver la fonctionnalité
        const feature = this.cache.features.find(f => f.id === featureId);
        return feature || null;
      } catch (error) {
        console.error("Erreur lors de la récupération de la fonctionnalité:", error);
        throw error;
      }
    }
    
    /**
     * Récupère les incidents liés à une fonctionnalité.
     * 
     * @param featureId Identifiant de la fonctionnalité
     * @returns Liste des incidents liés
     */
    static async getIncidentsByFeatureId(featureId: string): Promise<SystemIncident[]> {
      try {
        // S'assurer que les incidents sont chargés
        if (!this.cache.incidents) {
          await this.getIncidents();
        }
        
        if (!this.cache.incidents) {
          return [];
        }
        
        // Filtrer les incidents par fonctionnalité
        const incidents = this.cache.incidents.filter(i => i.feature_id === featureId);
        
        // Trier par date (les plus récents d'abord)
        return incidents.sort((a, b) => 
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );
      } catch (error) {
        console.error("Erreur lors de la récupération des incidents:", error);
        throw error;
      }
    }
  
    /**
     * Crée un nouvel incident pour une fonctionnalité.
     * 
     * @param incidentData Données de l'incident
     * @returns L'incident créé
     */
    static async createIncident(incidentData: {
      feature_id: string;
      title: string;
      description: string;
      severity: IncidentSeverity;
      status: IncidentStatus;
      message: string; // Premier message de mise à jour
    }): Promise<SystemIncident> {
      try {
        // S'assurer que les incidents et les fonctionnalités sont chargés
        if (!this.cache.incidents || !this.cache.features) {
          await this.getIncidents();
          await this.getFeatures();
        }
        
        if (!this.cache.incidents) {
          this.cache.incidents = [];
        }
        
        if (!this.cache.features) {
          this.cache.features = [];
        }
        
        // Générer un ID unique
        const incidentId = Date.now().toString();
        const updateId = `${incidentId}-1`;
        
        // Créer la première mise à jour
        const update: IncidentUpdate = {
          id: updateId,
          incident_id: incidentId,
          message: incidentData.message,
          status: incidentData.status,
          created_at: new Date().toISOString()
        };
        
        // Créer l'incident
        const newIncident: SystemIncident = {
          id: incidentId,
          feature_id: incidentData.feature_id,
          title: incidentData.title,
          description: incidentData.description,
          status: incidentData.status,
          severity: incidentData.severity,
          started_at: new Date().toISOString(),
          resolved_at: null,
          updates: [update]
        };
        
        // Ajouter l'incident à la liste
        this.cache.incidents.push(newIncident);
        
        // Mise à jour automatique du statut de la fonctionnalité en fonction de la gravité
        let featureStatus: FeatureStatus = 'functional';
        if (incidentData.severity === 'critical' || incidentData.severity === 'high') {
          featureStatus = 'down';
        } else if (incidentData.severity === 'medium') {
          featureStatus = 'degraded';
        }
        
        // Trouver et mettre à jour la fonctionnalité
        const featureIndex = this.cache.features.findIndex(f => f.id === incidentData.feature_id);
        if (featureIndex !== -1) {
          this.cache.features[featureIndex] = {
            ...this.cache.features[featureIndex],
            status: featureStatus,
            last_updated: new Date().toISOString()
          };
        }
        
        // Sauvegarder les modifications
        await this.saveData();
        
        return newIncident;
      } catch (error) {
        console.error("Erreur lors de la création d'un incident:", error);
        throw error;
      }
    }
  
    /**
     * Ajoute une mise à jour à un incident existant.
     * 
     * @param incidentId Identifiant de l'incident
     * @param updateData Données de la mise à jour
     * @returns L'incident mis à jour
     */
    static async addIncidentUpdate(
      incidentId: string,
      updateData: {
        message: string;
        status: IncidentStatus;
        resolve?: boolean; // Si true, marque l'incident comme résolu
      }
    ): Promise<SystemIncident> {
      try {
        // S'assurer que les incidents et les fonctionnalités sont chargés
        if (!this.cache.incidents || !this.cache.features) {
          await this.getIncidents();
          await this.getFeatures();
        }
        
        if (!this.cache.incidents || !this.cache.features) {
          throw new Error("Impossible de charger les données");
        }
        
        // Trouver l'incident
        const incidentIndex = this.cache.incidents.findIndex(i => i.id === incidentId);
        if (incidentIndex === -1) {
          throw new Error(`Incident non trouvé avec l'ID: ${incidentId}`);
        }
        
        const incident = this.cache.incidents[incidentIndex];
        
        // Générer un ID unique pour la mise à jour
        const updateId = `${incidentId}-${incident.updates.length + 1}`;
        
        // Créer la mise à jour
        const newUpdate: IncidentUpdate = {
          id: updateId,
          incident_id: incidentId,
          message: updateData.message,
          status: updateData.status,
          created_at: new Date().toISOString()
        };
        
        // Mettre à jour l'incident
        const updatedIncident: SystemIncident = {
          ...incident,
          status: updateData.status,
          resolved_at: updateData.resolve ? new Date().toISOString() : incident.resolved_at,
          updates: [...incident.updates, newUpdate]
        };
        
        // Mettre à jour le cache
        this.cache.incidents[incidentIndex] = updatedIncident;
        
        // Trouver la fonctionnalité associée
        const featureIndex = this.cache.features.findIndex(f => f.id === incident.feature_id);
        if (featureIndex !== -1) {
          // Si l'incident est résolu, mettre à jour le statut de la fonctionnalité
          if (updateData.resolve) {
            this.cache.features[featureIndex] = {
              ...this.cache.features[featureIndex],
              status: 'functional',
              last_updated: new Date().toISOString()
            };
          } 
          // Si on passe d'investigation à surveillance, améliorer le statut de la fonctionnalité
          else if (updateData.status === 'monitoring' && incident.status === 'investigating') {
            const feature = this.cache.features[featureIndex];
            if (feature.status === 'down') {
              this.cache.features[featureIndex] = {
                ...feature,
                status: 'degraded',
                last_updated: new Date().toISOString()
              };
            }
          }
        }
        
        // Sauvegarder les modifications
        await this.saveData();
        
        return updatedIncident;
      } catch (error) {
        console.error("Erreur lors de la mise à jour de l'incident:", error);
        throw error;
      }
    }
    
    /**
     * Efface le cache en mémoire
     */
    static clearCache(): void {
      this.cache = {};
    }
  }
  
  export default SystemStatusService;