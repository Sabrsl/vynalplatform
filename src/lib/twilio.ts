import twilio from 'twilio';

// Créer le client Twilio avec les identifiants
export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Fonction pour envoyer un SMS de vérification
export const sendVerificationSMS = async (phoneNumber: string): Promise<{success: boolean; message: string; sid?: string}> => {
  try {
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_SERVICE_SID || '')
      .verifications.create({
        to: phoneNumber,
        channel: 'sms'
      });
    
    return {
      success: true,
      message: 'Code de vérification envoyé avec succès',
      sid: verification.sid
    };
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du SMS:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors de l\'envoi du SMS'
    };
  }
};

// Fonction pour vérifier le code reçu
export const verifyCode = async (phoneNumber: string, code: string): Promise<{success: boolean; message: string}> => {
  try {
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_SERVICE_SID || '')
      .verificationChecks.create({
        to: phoneNumber,
        code
      });
    
    if (verification.status === 'approved') {
      return {
        success: true,
        message: 'Vérification réussie'
      };
    } else {
      return {
        success: false,
        message: `La vérification a échoué avec le statut: ${verification.status}`
      };
    }
  } catch (error: any) {
    console.error('Erreur lors de la vérification du code:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors de la vérification du code'
    };
  }
}; 