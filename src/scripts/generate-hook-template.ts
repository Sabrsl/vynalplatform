/**
 * Script pour générer des templates de hooks basés sur le modèle
 * 
 * Exemple d'utilisation:
 * ```
 * npx ts-node src/scripts/generate-hook-template.ts --resource=orders --table=orders --fields=id,client_id,freelance_id,service_id,status,created_at
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function singular(str: string): string {
  if (str.endsWith('s')) {
    return str.slice(0, -1);
  }
  return str;
}

function main() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};
  
  args.forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    params[key] = value;
  });
  
  if (!params.resource) {
    console.error('Erreur: Veuillez spécifier un nom de ressource avec --resource=');
    process.exit(1);
  }
  
  const resourceName = params.resource.toLowerCase();
  const tableName = params.table || resourceName;
  const fields = params.fields ? params.fields.split(',') : ['id', 'created_at'];
  
  const singularResource = singular(resourceName);
  const capitalizedSingular = capitalizeFirstLetter(singularResource);
  
  const template = `import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { getCachedData, setCachedData } from '@/lib/optimizations/cache';

export interface ${capitalizedSingular} {
${fields.map(field => `  ${field}: string;`).join('\n')}
}

export interface ${capitalizedSingular}Summary {
  total_count: number;
}

interface UseClient${capitalizeFirstLetter(resourceName)}Options {
  limit?: number;
  useCache?: boolean;
  search?: string;
}

/**
 * Hook pour récupérer les ${resourceName} d'un client
 */
export function useClient${capitalizeFirstLetter(resourceName)}(options: UseClient${capitalizeFirstLetter(resourceName)}Options = {}) {
  const { limit = 10, useCache = true, search = '' } = options;
  const { user } = useAuth();
  const [${resourceName}, set${capitalizeFirstLetter(resourceName)}] = useState<${capitalizedSingular}[]>([]);
  const [summary, setSummary] = useState<${capitalizedSingular}Summary>({
    total_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Clé de cache unique
  const cacheKey = useMemo(() => {
    if (!useCache || !user?.id) return '';
    return \`client_${resourceName}_\${user.id}_limit_\${limit}_search_\${search}\`;
  }, [user?.id, limit, search, useCache]);

  const summaryKey = useMemo(() => {
    if (!useCache || !user?.id) return '';
    return \`client_${resourceName}_summary_\${user.id}\`;
  }, [user?.id, useCache]);

  // Filtrer les ${resourceName} en fonction de la recherche
  const filter${capitalizeFirstLetter(resourceName)} = useCallback((items: ${capitalizedSingular}[]) => {
    if (!search) return items;
    
    const searchLower = search.toLowerCase();
    return items.filter(item => {
      // Personnaliser la logique de recherche selon les champs de l'item
      return Object.values(item).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(searchLower)
      );
    });
  }, [search]);

  // Fonction pour récupérer les ${resourceName}
  const fetch${capitalizeFirstLetter(resourceName)} = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    setIsRefreshing(true);

    try {
      // Vérifier le cache si activé et pas de forceRefresh
      if (useCache && !forceRefresh) {
        const cachedData = getCachedData<${capitalizedSingular}[]>(cacheKey);
        const cachedSummary = getCachedData<${capitalizedSingular}Summary>(summaryKey);
        
        if (cachedData && cachedSummary) {
          console.log("[Client${capitalizeFirstLetter(resourceName)}] Utilisation des données en cache");
          set${capitalizeFirstLetter(resourceName)}(filter${capitalizeFirstLetter(resourceName)}(cachedData));
          setSummary(cachedSummary);
          setLoading(false);
          setIsRefreshing(false);
          return;
        }
      }

      // Construire la requête
      let query = supabase
        .from('${tableName}')
        .select(\`
          *
        \`)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
        
      // Appliquer la limite seulement si nécessaire
      if (limit > 0) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[Client${capitalizeFirstLetter(resourceName)}] Erreur:", error);
        setError(error.message);
      } else if (data) {
        // Mettre en cache les données complètes
        if (useCache) {
          setCachedData(cacheKey, data, { expiry: 5 * 60 * 1000 }); // Cache de 5 minutes
        }
        
        // Filtrer et mettre à jour l'état
        set${capitalizeFirstLetter(resourceName)}(filter${capitalizeFirstLetter(resourceName)}(data));

        // Calculer les statistiques
        await fetch${capitalizedSingular}Summary();
      }
    } catch (err) {
      console.error("[Client${capitalizeFirstLetter(resourceName)}] Exception:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, cacheKey, limit, useCache, summaryKey, filter${capitalizeFirstLetter(resourceName)}]);

  // Fonction pour récupérer le résumé
  const fetch${capitalizedSingular}Summary = useCallback(async () => {
    if (!user) return;

    try {
      // Vérifier le cache
      if (useCache) {
        const cachedSummary = getCachedData<${capitalizedSingular}Summary>(summaryKey);
        if (cachedSummary) {
          console.log("[Client${capitalizeFirstLetter(resourceName)}] Utilisation du résumé en cache");
          setSummary(cachedSummary);
          return;
        }
      }

      // Total des éléments
      const { data: totalData, error: totalError } = await supabase
        .from('${tableName}')
        .select('count')
        .eq('client_id', user.id);
        
      if (totalError) throw totalError;
      
      // Composer les statistiques
      const summaryData: ${capitalizedSingular}Summary = {
        total_count: totalData[0]?.count || 0
      };
      
      // Mettre à jour l'état et le cache
      setSummary(summaryData);
      if (useCache) {
        setCachedData(summaryKey, summaryData, { expiry: 10 * 60 * 1000 }); // Cache de 10 minutes
      }
    } catch (err) {
      console.error("[Client${capitalizeFirstLetter(resourceName)}] Exception lors du calcul des statistiques:", err);
    }
  }, [user, useCache, summaryKey]);

  // Charger les données au montage du composant
  useEffect(() => {
    fetch${capitalizeFirstLetter(resourceName)}();
  }, [fetch${capitalizeFirstLetter(resourceName)}]);

  return {
    ${resourceName},
    summary,
    loading,
    error,
    isRefreshing,
    refresh: () => fetch${capitalizeFirstLetter(resourceName)}(true)
  };
}
`;

  const outputDir = path.join(process.cwd(), 'src', 'hooks');
  const outputFile = path.join(outputDir, `useClient${capitalizeFirstLetter(resourceName)}.ts`);
  
  // Vérifier si le répertoire existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Écrire le fichier
  fs.writeFileSync(outputFile, template);
  
  console.log(`Hook généré avec succès: ${outputFile}`);
}

main(); 