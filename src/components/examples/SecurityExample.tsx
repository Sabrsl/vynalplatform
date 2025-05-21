'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

/**
 * Exemple d'utilisation des API de sécurité
 * Ce composant montre comment utiliser les API pour chiffrer et déchiffrer des données
 * sensibles côté serveur uniquement.
 */
export default function SecurityExample() {
  const [inputValue, setInputValue] = useState('');
  const [encryptedValue, setEncryptedValue] = useState('');
  const [decryptedValue, setDecryptedValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Chiffre les données via l'API
   */
  const encryptData = async () => {
    if (!inputValue) {
      setError('Veuillez entrer une valeur à chiffrer');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/security/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: inputValue }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du chiffrement');
      }

      setEncryptedValue(result.encryptedValue);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors du chiffrement');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Déchiffre les données via l'API
   */
  const decryptData = async () => {
    if (!encryptedValue) {
      setError('Aucune donnée chiffrée à déchiffrer');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/security/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedValue }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du déchiffrement');
      }

      setDecryptedValue(
        typeof result.value === 'object'
          ? JSON.stringify(result.value)
          : result.value
      );
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors du déchiffrement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Exemple de chiffrement côté serveur</CardTitle>
        <CardDescription>
          Cette démo utilise le service de cryptographie côté serveur pour chiffrer et déchiffrer des données sensibles.
          Les opérations sont effectuées uniquement sur le serveur pour une sécurité maximale.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="encrypt" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encrypt">Chiffrer</TabsTrigger>
            <TabsTrigger value="decrypt">Déchiffrer</TabsTrigger>
          </TabsList>

          <TabsContent value="encrypt" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="value-to-encrypt" className="text-sm font-medium">
                Valeur à chiffrer
              </label>
              <Input
                id="value-to-encrypt"
                placeholder="Entrez du texte ou des données JSON"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>

            <Button 
              onClick={encryptData} 
              disabled={isLoading || !inputValue}
              className="w-full"
            >
              {isLoading ? 'Chiffrement en cours...' : 'Chiffrer'}
            </Button>

            {encryptedValue && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium">Valeur chiffrée :</p>
                <div className="p-3 bg-gray-100 rounded-md text-xs overflow-auto break-all">
                  {encryptedValue}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="decrypt" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="value-to-decrypt" className="text-sm font-medium">
                Valeur à déchiffrer
              </label>
              <Input
                id="value-to-decrypt"
                placeholder="Collez la valeur chiffrée ici"
                value={encryptedValue}
                onChange={(e) => setEncryptedValue(e.target.value)}
              />
            </div>

            <Button 
              onClick={decryptData} 
              disabled={isLoading || !encryptedValue}
              className="w-full"
            >
              {isLoading ? 'Déchiffrement en cours...' : 'Déchiffrer'}
            </Button>

            {decryptedValue && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium">Valeur déchiffrée :</p>
                <div className="p-3 bg-gray-100 rounded-md text-xs overflow-auto">
                  {decryptedValue}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col items-start text-xs text-gray-500 space-y-2">
        <p>
          <strong>Note de sécurité:</strong> Les données sensibles ne devraient jamais être stockées côté client.
          Utilisez toujours le service de cryptographie côté serveur via ces API.
        </p>
        <p>
          <strong>Exemple d'utilisation:</strong> Pour une API d'ajout de carte bancaire, chiffrez les détails
          côté serveur avant de les stocker dans votre base de données.
        </p>
      </CardFooter>
    </Card>
  );
} 