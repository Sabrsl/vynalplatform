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
    <div className="max-w-4xl mx-auto py-6 md:py-12 px-3 md:px-8 bg-white/30 dark:bg-slate-900/30 rounded-lg shadow-sm backdrop-blur-sm border border-slate-200 dark:border-slate-700/30">
      <div className="mb-6 md:mb-8">
        <Link href="/dashboard/wallet" passHref>
          <Button variant="ghost" size="sm" className="mb-4 text-slate-700 dark:text-vynal-text-primary">
            <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            Retour au portefeuille
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Conditions de retrait</h1>
        <p className="text-xs md:text-sm text-slate-600 dark:text-vynal-text-secondary">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>
      
      <div className="prose prose-sm md:prose-base lg:prose-lg mx-auto">
        <div className="bg-white/40 dark:bg-slate-800/40 p-3 md:p-4 rounded-lg border border-slate-200/50 dark:border-slate-700/20 mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-vynal-text-primary mt-0">Points importants à retenir</h2>
          <ul className="list-disc pl-4 md:pl-5 space-y-1 text-slate-600 dark:text-vynal-text-secondary text-sm md:text-base">
            <li>Montant minimum de retrait : <strong className="text-slate-700 dark:text-vynal-text-primary">2000 {CURRENCY.symbol}</strong></li>
            <li>Frais de service : <strong className="text-slate-700 dark:text-vynal-text-primary">20%</strong> sur tous les retraits</li>
            <li>Délai de traitement : <strong className="text-slate-700 dark:text-vynal-text-primary">24h</strong> pour les méthodes de paiement mobile, <strong className="text-slate-700 dark:text-vynal-text-primary">3-5 jours</strong> pour les virements bancaires</li>
            <li>Les frais comprennent : frais de transfert, traitement et services tiers</li>
            <li>Les retraits ne peuvent être annulés une fois confirmés</li>
          </ul>
        </div>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">1. Modalités générales</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Les présentes conditions de retrait régissent la procédure par laquelle les freelances peuvent retirer les fonds accumulés
          sur leur portefeuille Vynal Platform. En demandant un retrait, vous acceptez de vous conformer intégralement aux présentes conditions.
        </p>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vynal Platform se réserve le droit de modifier ces conditions à tout moment. Les modifications entreront en vigueur dès leur publication
          sur la plateforme. Il est de votre responsabilité de consulter régulièrement ces conditions pour vous tenir informé des éventuelles modifications.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">2. Éligibilité aux retraits</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">2.1 Critères d'éligibilité</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Pour pouvoir effectuer un retrait, vous devez :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Être un freelance actif et vérifié sur Vynal Platform</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Avoir complété votre profil et vos informations de paiement</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Disposer d'un solde disponible suffisant (minimum 2000 {CURRENCY.symbol})</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">N'avoir aucune procédure de litige en cours concernant les fonds à retirer</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Respecter toutes les lois applicables relatives aux transactions financières</li>
        </ul>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">2.2 Vérification d'identité</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Pour des raisons de sécurité et de conformité aux réglementations financières, Vynal Platform peut exiger une vérification d'identité
          supplémentaire avant de traiter certaines demandes de retrait, notamment pour :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les retraits dépassant un certain montant (généralement 500 000 {CURRENCY.symbol})</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les comptes présentant des activités inhabituelles</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les comptes récemment créés effectuant leur premier retrait</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les retraits vers des méthodes de paiement nouvellement ajoutées</li>
        </ul>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">3. Montants et limites</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">3.1 Montant minimum de retrait</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Le montant minimum pouvant être retiré est de <strong className="text-slate-700 dark:text-vynal-text-primary">2000 {CURRENCY.symbol}</strong>. Cette limite a été établie pour optimiser
          les coûts de traitement et garantir la viabilité économique du service pour toutes les parties concernées.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">3.2 Limites maximales</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Les limites maximales de retrait sont les suivantes :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Limite par transaction</strong> : 5 000 000 {CURRENCY.symbol}</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Limite quotidienne</strong> : 10 000 000 {CURRENCY.symbol}</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Limite mensuelle</strong> : 50 000 000 {CURRENCY.symbol}</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Pour les montants supérieurs, veuillez contacter notre service client pour organiser un retrait personnalisé.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">4. Frais et déductions</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">4.1 Structure des frais</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Un taux fixe de <strong className="text-slate-700 dark:text-vynal-text-primary">20%</strong> est appliqué à tous les retraits effectués sur Vynal Platform. Ces frais couvrent :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les frais de transfert, variables selon la méthode de paiement choisie</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les frais de traitement administratif et technique</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les frais des services tiers et prestataires de paiement</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">La maintenance et l'amélioration des systèmes de paiement sécurisés</li>
        </ul>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">4.2 Calcul du montant net</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Le montant net que vous recevrez sera calculé comme suit :
        </p>
        <div className="bg-white/40 dark:bg-slate-800/40 p-3 md:p-4 rounded-lg border border-slate-200/50 dark:border-slate-700/20 my-3 md:my-4">
          <p className="font-mono text-xs md:text-sm lg:text-base text-slate-700 dark:text-vynal-text-primary">
            Montant net = Montant brut - (Montant brut × 20%)
          </p>
          <p className="text-xs md:text-sm text-slate-600 dark:text-vynal-text-secondary mt-2">
            Exemple : Pour un retrait de 10 000 {CURRENCY.symbol}, les frais seront de 2 000 {CURRENCY.symbol} (20%), 
            et le montant net reçu sera de 8 000 {CURRENCY.symbol}.
          </p>
        </div>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">4.3 Taxes et impôts</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Les freelances sont responsables de déclarer leurs revenus et de payer les taxes et impôts applicables conformément 
          aux lois fiscales de leur pays de résidence. Vynal Platform ne retient pas d'impôts sur les retraits, sauf si la loi l'exige expressément.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">5. Méthodes de retrait</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">5.1 Options disponibles</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vynal Platform propose plusieurs méthodes de retrait, chacune avec ses propres caractéristiques :
        </p>
        <div className="overflow-x-auto -mx-3 md:mx-0">
          <table className="min-w-full border border-slate-200 dark:border-slate-700/30 my-3 md:my-4 text-xs md:text-sm lg:text-base">
            <thead>
              <tr className="bg-white/40 dark:bg-slate-800/40">
                <th className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-left text-slate-800 dark:text-vynal-text-primary">Méthode</th>
                <th className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-left text-slate-800 dark:text-vynal-text-primary">Délai de traitement</th>
                <th className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-left text-slate-800 dark:text-vynal-text-primary">Disponibilité</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-slate-600 dark:text-vynal-text-secondary">Virement bancaire</td>
                <td className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-slate-600 dark:text-vynal-text-secondary">3-5 jours ouvrés</td>
                <td className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-slate-600 dark:text-vynal-text-secondary">Tous pays</td>
              </tr>
              <tr>
                <td className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-slate-600 dark:text-vynal-text-secondary">Orange Money</td>
                <td className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-slate-600 dark:text-vynal-text-secondary">Sous 24h</td>
                <td className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-slate-600 dark:text-vynal-text-secondary">Sénégal et pays couverts</td>
              </tr>
              <tr>
                <td className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-slate-600 dark:text-vynal-text-secondary">Free Money</td>
                <td className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-slate-600 dark:text-vynal-text-secondary">Sous 24h</td>
                <td className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-slate-600 dark:text-vynal-text-secondary">Sénégal</td>
              </tr>
              <tr>
                <td className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-slate-600 dark:text-vynal-text-secondary">Wave</td>
                <td className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-slate-600 dark:text-vynal-text-secondary">Sous 24h</td>
                <td className="border border-slate-200/50 dark:border-slate-700/20 px-2 md:px-4 py-1 md:py-2 text-slate-600 dark:text-vynal-text-secondary">Sénégal et pays couverts</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">5.2 Délais de traitement</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Les délais de traitement indiqués sont estimatifs et peuvent varier en fonction de facteurs externes. 
          Pour toutes les méthodes de paiement mobile (Wave, Orange Money, Free Money), les paiements sont traités 
          dans un délai maximum de 24 heures. Les virements bancaires prennent généralement 3 à 5 jours ouvrés.
        </p>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Les facteurs suivants peuvent influencer les délais de traitement :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Le système bancaire et les jours ouvrés dans votre pays</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les vérifications de sécurité supplémentaires</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">La disponibilité des services de paiement tiers</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les problèmes techniques imprévus</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vynal Platform s'efforce de traiter toutes les demandes de retrait dans les délais indiqués, mais ne peut être tenue 
          responsable des retards causés par des facteurs échappant à son contrôle direct.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">6. Processus de retrait</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">6.1 Initiation d'un retrait</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Pour initier un retrait, suivez ces étapes :
        </p>
        <ol className="list-decimal pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Connectez-vous à votre compte Vynal Platform</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Accédez à la section "Portefeuille" de votre tableau de bord</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Cliquez sur le bouton "Retirer des fonds"</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Saisissez le montant que vous souhaitez retirer (minimum 2000 {CURRENCY.symbol})</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Sélectionnez votre méthode de retrait préférée</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Vérifiez le récapitulatif et confirmez le retrait</li>
        </ol>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">6.2 Validation et traitement</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Une fois votre demande soumise :
        </p>
        <ol className="list-decimal pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Vynal Platform vérifiera l'éligibilité de votre demande</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Si des vérifications supplémentaires sont nécessaires, vous en serez informé par email</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Une fois validée, votre demande sera traitée selon les délais applicables à la méthode choisie</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Vous recevrez une confirmation par email lorsque le paiement aura été effectué</li>
        </ol>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">6.3 Annulations et modifications</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Une fois qu'une demande de retrait a été confirmée, elle ne peut généralement pas être annulée ou modifiée. 
          Dans des circonstances exceptionnelles, si le paiement n'a pas encore été traité, vous pouvez contacter notre 
          service client pour demander une annulation, sans garantie qu'elle puisse être effectuée.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">7. Sécurité et conformité</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">7.1 Mesures de sécurité</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Pour protéger votre compte et vos fonds, Vynal Platform a mis en place plusieurs mesures de sécurité :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Authentification à deux facteurs pour les opérations de retrait</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Notifications par email pour toute demande de retrait</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Vérifications automatisées pour détecter les activités inhabituelles</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Systèmes de chiffrement pour la protection des données financières</li>
        </ul>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">7.2 Conformité réglementaire</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vynal Platform se conforme aux réglementations financières applicables, notamment en matière de :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Lutte contre le blanchiment d'argent (LCB-FT)</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Connaissance client (KYC)</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Protection des données personnelles</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Réglementations des services de paiement</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          En conséquence, nous pouvons être amenés à demander des informations supplémentaires ou à suspendre temporairement 
          une demande de retrait si nous détectons des activités inhabituelles ou si des vérifications supplémentaires sont nécessaires.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">8. Résolution des problèmes</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">8.1 Paiements non reçus</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Si vous n'avez pas reçu votre paiement dans les délais prévus (en tenant compte des délais spécifiques à chaque méthode), 
          veuillez suivre ces étapes :
        </p>
        <ol className="list-decimal pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Vérifiez le statut de votre retrait dans la section "Historique des transactions" de votre portefeuille</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Assurez-vous que les informations de paiement que vous avez fournies sont correctes</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Vérifiez votre compte bancaire ou mobile money pour confirmer que les fonds n'ont pas été reçus</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Contactez notre service client en fournissant l'ID de transaction indiqué dans l'historique</li>
        </ol>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">8.2 Support et assistance</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Pour toute question ou problème concernant vos retraits, notre équipe de support est disponible pour vous aider :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Par email : <a href="mailto:support@vynalplatform.com" className="text-vynal-accent-primary hover:underline transition-all duration-200">support@vynalplatform.com</a></li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Via le formulaire de contact sur notre site web</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Par le chat en direct disponible dans votre tableau de bord (pendant les heures d'ouverture)</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Lors de votre contact, veuillez toujours inclure votre ID de transaction et tout détail pertinent pour nous permettre 
          de résoudre votre problème plus rapidement.
        </p>
        
        <div className="mt-6 md:mt-8 p-3 md:p-4 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-slate-200/50 dark:border-slate-700/20 transition-all duration-200">
          <p className="text-xs md:text-sm text-slate-600 dark:text-vynal-text-secondary">
            <strong className="text-slate-700 dark:text-vynal-text-primary">Documents complémentaires :</strong>
          </p>
          <ul className="list-disc pl-4 md:pl-5 mt-2 text-xs md:text-sm space-y-1">
            <li><a href="/terms-of-service" className="text-vynal-accent-primary hover:underline transition-all duration-200">Conditions d'utilisation</a></li>
            <li><a href="/privacy-policy" className="text-vynal-accent-primary hover:underline transition-all duration-200">Politique de confidentialité</a></li>
            <li><a href="/code-of-conduct" className="text-vynal-accent-primary hover:underline transition-all duration-200">Code de conduite</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
} 