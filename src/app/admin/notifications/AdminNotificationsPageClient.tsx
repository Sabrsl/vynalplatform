"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// Liste des types de notification (côté client uniquement)
const EMAIL_NOTIFICATION_TYPES = {
  'new_message': { subject: 'Nouveau message sur Vynal Platform' },
  'unread_message_reminder': { subject: 'Message non lu sur Vynal Platform' },
  'order_confirmed': { subject: 'Confirmation de votre commande - Vynal Platform' },
  'order_delivered': { subject: 'Votre commande a été livrée - Vynal Platform' },
  'new_order': { subject: 'Nouvelle commande reçue - Vynal Platform' },
  'dispute_message': { subject: 'Mise à jour de votre litige - Vynal Platform' },
  'dispute_opened': { subject: 'Un litige a été ouvert - Vynal Platform' },
  'dispute_resolved': { subject: 'Litige résolu - Vynal Platform' },
};

export function AdminNotificationsPageClient() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProcessed, setLastProcessed] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testType, setTestType] = useState('new_message');
  const [testContent, setTestContent] = useState('Ceci est un message de test');
  const [isSendingTest, setIsSendingTest] = useState(false);
  
  // Vérifier les notifications en attente
  const checkPendingNotifications = async () => {
    try {
      // Utiliser la fonctionnalité de comptage de Supabase
      const { count, data, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .is('emailed', null);
      
      if (error) {
        throw error;
      }
      
      // Le count est directement retourné par Supabase
      setPendingCount(count !== null ? count : 0);
    } catch (err) {
      console.error('Erreur lors de la vérification des notifications:', err);
      setError('Erreur lors de la vérification des notifications en attente');
    }
  };
  
  // Processus de traitement des notifications via API
  const processNotifications = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'processNotifications'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du traitement des notifications');
      }
      
      setLastProcessed(new Date().toISOString());
      await checkPendingNotifications();
      return true;
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du traitement des notifications');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Envoi d'email de test via API
  const sendTestEmail = async (userId: string, type: string, content?: string) => {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendTemplate',
          to: testEmail,
          subject: EMAIL_NOTIFICATION_TYPES[type as keyof typeof EMAIL_NOTIFICATION_TYPES]?.subject || 'Test Vynal',
          templatePath: `src/templates/email/client/${type}.html`,
          variables: {
            userName: 'Test User',
            notificationContent: content || 'Contenu de test',
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'email');
      }
      
      const data = await response.json();
      return data.success;
    } catch (err) {
      console.error('Erreur:', err);
      return false;
    }
  };
  
  // Vérifier initialement les notifications en attente
  useEffect(() => {
    checkPendingNotifications();
    
    // Auto-vérification périodique
    const interval = setInterval(() => {
      checkPendingNotifications();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Fonction pour traiter manuellement les notifications
  const handleProcessNotifications = async () => {
    const success = await processNotifications();
    if (success) {
      toast({
        title: "Traitement réussi",
        description: "Les notifications ont été traitées avec succès.",
        variant: "default",
      });
    } else {
      toast({
        title: "Erreur",
        description: error || "Erreur lors du traitement des notifications.",
        variant: "destructive",
      });
    }
  };
  
  // Fonction pour envoyer un email de test
  const handleSendTestEmail = async () => {
    if (!testEmail || !testType) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSendingTest(true);
    
    try {
      // Récupérer l'ID de l'utilisateur à partir de son email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', testEmail)
        .single();
      
      if (userError || !userData) {
        toast({
          title: "Utilisateur non trouvé",
          description: "Aucun utilisateur trouvé avec cet email.",
          variant: "destructive",
        });
        setIsSendingTest(false);
        return;
      }
      
      // Envoyer l'email de test
      const success = await sendTestEmail(userData.id, testType, testContent);
      
      if (success) {
        toast({
          title: "Email envoyé",
          description: `Un email a été envoyé à ${testEmail}.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Échec de l'envoi",
          description: "Impossible d'envoyer l'email. Vérifiez les logs pour plus de détails.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'email de test:", err);
      toast({
        title: "Erreur serveur",
        description: "Une erreur s'est produite lors de l'envoi de l'email.",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Gestion des notifications</h1>
      
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="test">Test d'email</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques des notifications</CardTitle>
                <CardDescription>État actuel du service de notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Notifications en attente:</span>
                    <span>{pendingCount !== null ? pendingCount : 'Chargement...'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Dernier traitement:</span>
                    <span>{lastProcessed ? new Date(lastProcessed).toLocaleString() : 'Jamais'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">État:</span>
                    <span className={`font-semibold ${isProcessing ? 'text-amber-500' : 'text-green-500'}`}>
                      {isProcessing ? 'Traitement en cours...' : 'Prêt'}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={checkPendingNotifications} variant="outline">
                  Actualiser
                </Button>
                <Button onClick={handleProcessNotifications} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement...
                    </>
                  ) : (
                    "Traiter les notifications"
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Statut du service</CardTitle>
                <CardDescription>Informations sur le service d'emails</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Service d'email:</span>
                    <span className="text-green-500 font-semibold">Actif</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Provider:</span>
                    <span>{process.env.NEXT_PUBLIC_EMAIL_PROVIDER || 'SMTP'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Auto-processing:</span>
                    <span>Activé (toutes les 60 secondes)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Envoyer un email de test</CardTitle>
              <CardDescription>
                Testez l'envoi d'emails de notification à un utilisateur spécifique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email du destinataire</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="utilisateur@exemple.com" 
                    value={testEmail} 
                    onChange={(e) => setTestEmail(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Type de notification</Label>
                  <Select value={testType} onValueChange={setTestType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(EMAIL_NOTIFICATION_TYPES).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Contenu (optionnel)</Label>
                  <Input 
                    id="content" 
                    value={testContent} 
                    onChange={(e) => setTestContent(e.target.value)} 
                    placeholder="Contenu de la notification" 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSendTestEmail} disabled={isSendingTest || !testEmail || !testType}>
                {isSendingTest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...
                  </>
                ) : (
                  "Envoyer l'email de test"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres des notifications</CardTitle>
              <CardDescription>
                Configurer les options de notification par email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ces paramètres sont définis dans la configuration serveur et ne peuvent pas être modifiés via l'interface utilisateur.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="emailTypes">Types de notifications avec emails</Label>
                  <ul className="text-sm">
                    {Object.entries(EMAIL_NOTIFICATION_TYPES).map(([type, config]) => (
                      <li key={type} className="flex justify-between py-1 border-b border-gray-100">
                        <span>{type}</span>
                        <span className="text-gray-500">{config.subject}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 