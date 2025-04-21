import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURRENCY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Conditions de retrait | Vynal Platform",
  description: "Conditions et modalités de retrait des fonds sur Vynal Platform",
};

export default function WithdrawalTerms() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/dashboard/wallet" passHref>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au portefeuille
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-4">Conditions de retrait</h1>
        <p className="text-sm text-gray-500">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>
      
      <div className="prose prose-lg mx-auto">
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-8">
          <h2 className="text-xl font-semibold text-amber-800 mt-0">Points importants à retenir</h2>
          <ul className="list-disc pl-5 space-y-1 text-amber-700">
            <li>Montant minimum de retrait : <strong>2000 {CURRENCY.symbol}</strong></li>
            <li>Frais de service : <strong>20%</strong> sur tous les retraits</li>
            <li>Délai de traitement : <strong>24h</strong> pour les méthodes de paiement mobile, <strong>3-5 jours</strong> pour les virements bancaires</li>
            <li>Les frais comprennent : frais de transfert, traitement et services tiers</li>
            <li>Les retraits ne peuvent être annulés une fois confirmés</li>
          </ul>
        </div>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Modalités générales</h2>
        <p>
          Les présentes conditions de retrait régissent la procédure par laquelle les freelances peuvent retirer les fonds accumulés
          sur leur portefeuille Vynal Platform. En demandant un retrait, vous acceptez de vous conformer intégralement aux présentes conditions.
        </p>
        <p>
          Vynal Platform se réserve le droit de modifier ces conditions à tout moment. Les modifications entreront en vigueur dès leur publication
          sur la plateforme. Il est de votre responsabilité de consulter régulièrement ces conditions pour vous tenir informé des éventuelles modifications.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">2. Éligibilité aux retraits</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">2.1 Critères d'éligibilité</h3>
        <p>
          Pour pouvoir effectuer un retrait, vous devez :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Être un freelance actif et vérifié sur Vynal Platform</li>
          <li>Avoir complété votre profil et vos informations de paiement</li>
          <li>Disposer d'un solde disponible suffisant (minimum 2000 {CURRENCY.symbol})</li>
          <li>N'avoir aucune procédure de litige en cours concernant les fonds à retirer</li>
          <li>Respecter toutes les lois applicables relatives aux transactions financières</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-6 mb-3">2.2 Vérification d'identité</h3>
        <p>
          Pour des raisons de sécurité et de conformité aux réglementations financières, Vynal Platform peut exiger une vérification d'identité
          supplémentaire avant de traiter certaines demandes de retrait, notamment pour :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Les retraits dépassant un certain montant (généralement 500 000 {CURRENCY.symbol})</li>
          <li>Les comptes présentant des activités inhabituelles</li>
          <li>Les comptes récemment créés effectuant leur premier retrait</li>
          <li>Les retraits vers des méthodes de paiement nouvellement ajoutées</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">3. Montants et limites</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">3.1 Montant minimum de retrait</h3>
        <p>
          Le montant minimum pouvant être retiré est de <strong>2000 {CURRENCY.symbol}</strong>. Cette limite a été établie pour optimiser
          les coûts de traitement et garantir la viabilité économique du service pour toutes les parties concernées.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">3.2 Limites maximales</h3>
        <p>
          Les limites maximales de retrait sont les suivantes :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Limite par transaction</strong> : 5 000 000 {CURRENCY.symbol}</li>
          <li><strong>Limite quotidienne</strong> : 10 000 000 {CURRENCY.symbol}</li>
          <li><strong>Limite mensuelle</strong> : 50 000 000 {CURRENCY.symbol}</li>
        </ul>
        <p>
          Pour les montants supérieurs, veuillez contacter notre service client pour organiser un retrait personnalisé.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">4. Frais et déductions</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">4.1 Structure des frais</h3>
        <p>
          Un taux fixe de <strong>20%</strong> est appliqué à tous les retraits effectués sur Vynal Platform. Ces frais couvrent :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Les frais de transfert, variables selon la méthode de paiement choisie</li>
          <li>Les frais de traitement administratif et technique</li>
          <li>Les frais des services tiers et prestataires de paiement</li>
          <li>La maintenance et l'amélioration des systèmes de paiement sécurisés</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-6 mb-3">4.2 Calcul du montant net</h3>
        <p>
          Le montant net que vous recevrez sera calculé comme suit :
        </p>
        <div className="bg-gray-100 p-4 rounded-lg my-4">
          <p className="font-mono">
            Montant net = Montant brut - (Montant brut × 20%)
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Exemple : Pour un retrait de 10 000 {CURRENCY.symbol}, les frais seront de 2 000 {CURRENCY.symbol} (20%), 
            et le montant net reçu sera de 8 000 {CURRENCY.symbol}.
          </p>
        </div>
        
        <h3 className="text-lg font-medium mt-6 mb-3">4.3 Taxes et impôts</h3>
        <p>
          Les freelances sont responsables de déclarer leurs revenus et de payer les taxes et impôts applicables conformément 
          aux lois fiscales de leur pays de résidence. Vynal Platform ne retient pas d'impôts sur les retraits, sauf si la loi l'exige expressément.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">5. Méthodes de retrait</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">5.1 Options disponibles</h3>
        <p>
          Vynal Platform propose plusieurs méthodes de retrait, chacune avec ses propres caractéristiques :
        </p>
        <table className="min-w-full border border-gray-200 my-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 px-4 py-2 text-left">Méthode</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Délai de traitement</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Disponibilité</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 px-4 py-2">Virement bancaire</td>
              <td className="border border-gray-200 px-4 py-2">3-5 jours ouvrés</td>
              <td className="border border-gray-200 px-4 py-2">Tous pays</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-2">Orange Money</td>
              <td className="border border-gray-200 px-4 py-2">Sous 24h</td>
              <td className="border border-gray-200 px-4 py-2">Sénégal et pays couverts</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-2">Free Money</td>
              <td className="border border-gray-200 px-4 py-2">Sous 24h</td>
              <td className="border border-gray-200 px-4 py-2">Sénégal</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-2">Wave</td>
              <td className="border border-gray-200 px-4 py-2">Sous 24h</td>
              <td className="border border-gray-200 px-4 py-2">Sénégal et pays couverts</td>
            </tr>
          </tbody>
        </table>
        
        <h3 className="text-lg font-medium mt-6 mb-3">5.2 Délais de traitement</h3>
        <p>
          Les délais de traitement indiqués sont estimatifs et peuvent varier en fonction de facteurs externes. 
          Pour toutes les méthodes de paiement mobile (Wave, Orange Money, Free Money), les paiements sont traités 
          dans un délai maximum de 24 heures. Les virements bancaires prennent généralement 3 à 5 jours ouvrés.
        </p>
        <p>
          Les facteurs suivants peuvent influencer les délais de traitement :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Le système bancaire et les jours ouvrés dans votre pays</li>
          <li>Les vérifications de sécurité supplémentaires</li>
          <li>La disponibilité des services de paiement tiers</li>
          <li>Les problèmes techniques imprévus</li>
        </ul>
        <p>
          Vynal Platform s'efforce de traiter toutes les demandes de retrait dans les délais indiqués, mais ne peut être tenue 
          responsable des retards causés par des facteurs échappant à son contrôle direct.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">6. Processus de retrait</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">6.1 Initiation d'un retrait</h3>
        <p>
          Pour initier un retrait, suivez ces étapes :
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Connectez-vous à votre compte Vynal Platform</li>
          <li>Accédez à la section "Portefeuille" de votre tableau de bord</li>
          <li>Cliquez sur le bouton "Retirer des fonds"</li>
          <li>Saisissez le montant que vous souhaitez retirer (minimum 2000 {CURRENCY.symbol})</li>
          <li>Sélectionnez votre méthode de retrait préférée</li>
          <li>Vérifiez le récapitulatif et confirmez le retrait</li>
        </ol>
        
        <h3 className="text-lg font-medium mt-6 mb-3">6.2 Validation et traitement</h3>
        <p>
          Une fois votre demande soumise :
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Vynal Platform vérifiera l'éligibilité de votre demande</li>
          <li>Si des vérifications supplémentaires sont nécessaires, vous en serez informé par email</li>
          <li>Une fois validée, votre demande sera traitée selon les délais applicables à la méthode choisie</li>
          <li>Vous recevrez une confirmation par email lorsque le paiement aura été effectué</li>
        </ol>
        
        <h3 className="text-lg font-medium mt-6 mb-3">6.3 Annulations et modifications</h3>
        <p>
          Une fois qu'une demande de retrait a été confirmée, elle ne peut généralement pas être annulée ou modifiée. 
          Dans des circonstances exceptionnelles, si le paiement n'a pas encore été traité, vous pouvez contacter notre 
          service client pour demander une annulation, sans garantie qu'elle puisse être effectuée.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">7. Sécurité et conformité</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">7.1 Mesures de sécurité</h3>
        <p>
          Pour protéger votre compte et vos fonds, Vynal Platform a mis en place plusieurs mesures de sécurité :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Authentification à deux facteurs pour les opérations de retrait</li>
          <li>Notifications par email pour toute demande de retrait</li>
          <li>Vérifications automatisées pour détecter les activités inhabituelles</li>
          <li>Systèmes de chiffrement pour la protection des données financières</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-6 mb-3">7.2 Conformité réglementaire</h3>
        <p>
          Vynal Platform se conforme aux réglementations financières applicables, notamment en matière de :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Lutte contre le blanchiment d'argent (LCB-FT)</li>
          <li>Connaissance client (KYC)</li>
          <li>Protection des données personnelles</li>
          <li>Réglementations des services de paiement</li>
        </ul>
        <p>
          En conséquence, nous pouvons être amenés à demander des informations supplémentaires ou à suspendre temporairement 
          une demande de retrait si nous détectons des activités inhabituelles ou si des vérifications supplémentaires sont nécessaires.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">8. Résolution des problèmes</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">8.1 Paiements non reçus</h3>
        <p>
          Si vous n'avez pas reçu votre paiement dans les délais prévus (en tenant compte des délais spécifiques à chaque méthode), 
          veuillez suivre ces étapes :
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Vérifiez le statut de votre retrait dans la section "Historique des transactions" de votre portefeuille</li>
          <li>Assurez-vous que les coordonnées de paiement fournies sont correctes</li>
          <li>Attendez 1-2 jours ouvrés supplémentaires pour tenir compte des délais interbancaires</li>
          <li>Si le problème persiste, contactez notre service client avec le numéro de référence de votre retrait</li>
        </ol>
        
        <h3 className="text-lg font-medium mt-6 mb-3">8.2 Demandes de retrait rejetées</h3>
        <p>
          Une demande de retrait peut être rejetée pour plusieurs raisons :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Solde insuffisant</li>
          <li>Informations de paiement incomplètes ou incorrectes</li>
          <li>Compte non vérifié ou restrictions temporaires</li>
          <li>Activités suspectes détectées</li>
          <li>Non-respect des conditions d'utilisation de la plateforme</li>
        </ul>
        <p>
          En cas de rejet, vous recevrez une notification expliquant la raison et les mesures à prendre pour résoudre le problème.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">9. Modification des conditions</h2>
        <p>
          Vynal Platform se réserve le droit de modifier ces conditions de retrait à tout moment. Les modifications entreront 
          en vigueur dès leur publication sur la plateforme. Pour les modifications importantes, nous vous informerons par email 
          ou par notification sur la plateforme.
        </p>
        <p>
          Les modifications peuvent concerner :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Les frais et les taux appliqués</li>
          <li>Les montants minimums et maximums</li>
          <li>Les méthodes de retrait disponibles</li>
          <li>Les exigences de vérification</li>
          <li>Les délais de traitement</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">10. Contact et assistance</h2>
        <p>
          Pour toute question ou préoccupation concernant les retraits, plusieurs options s'offrent à vous :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Service client</strong> : Contactez-nous via le formulaire de contact disponible sur la plateforme</li>
          <li><strong>Email</strong> : Envoyez vos questions à <a href="mailto:support@vynalplatform.com" className="text-indigo-600 hover:underline">support@vynalplatform.com</a></li>
          <li><strong>Centre d'aide</strong> : Consultez notre centre d'aide en ligne pour obtenir de l'assistance</li>
        </ul>
        <p>
          Notre équipe d'assistance est disponible du lundi au vendredi, de 9h à 18h (GMT), et s'efforcera de répondre 
          à toutes les demandes dans un délai de 24 heures ouvrées.
        </p>
        
        <div className="border-t border-gray-200 mt-12 pt-8">
          <p className="text-sm text-center text-gray-500">
            En effectuant un retrait sur Vynal Platform, vous confirmez avoir lu, compris et accepté les présentes conditions de retrait.
          </p>
        </div>
      </div>
    </div>
  );
} 