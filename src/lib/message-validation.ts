import { containsForbiddenWords, censorMessage } from './forbidden-words';

/**
 * Interface pour le résultat de validation d'un message
 */
export interface MessageValidationResult {
  isValid: boolean;
  censored: boolean;
  message: string;
  originalMessage: string;
  errors: string[];
  forbiddenWords?: string[];
  possibleQuoteOrReport?: boolean;
  severity?: 'high' | 'medium' | 'low' | 'none';
  recommendedAction?: 'block' | 'warn' | 'censor' | 'notify_mod';
  shouldNotifyModerator?: boolean;
  warningMessage?: string;
}

/**
 * Options de validation de message
 */
export interface MessageValidationOptions {
  allowEmpty?: boolean;
  maxLength?: number;
  minLength?: number;
  censorInsteadOfBlock?: boolean;
  ignoreContextExceptions?: boolean;
  allowLowSeverityWords?: boolean;
  allowQuotedWords?: boolean;
  respectRecommendedActions?: boolean;
}

/**
 * Valide un message en vérifiant s'il contient des mots interdits et respecte les contraintes de longueur
 * @param message Le message à valider
 * @param options Options de validation
 * @returns Résultat de la validation
 */
export function validateMessage(
  message: string,
  options: MessageValidationOptions = {}
): MessageValidationResult {
  const {
    allowEmpty = false,
    maxLength = 5000,
    minLength = 1,
    censorInsteadOfBlock = false,
    allowLowSeverityWords = false,
    allowQuotedWords = false,
    respectRecommendedActions = true
  } = options;

  const result: MessageValidationResult = {
    isValid: true,
    censored: false,
    message: message,
    originalMessage: message,
    errors: [],
    shouldNotifyModerator: false
  };

  // Vérifier si le message est vide
  if (!message || message.trim() === '') {
    if (!allowEmpty) {
      result.isValid = false;
      result.errors.push('Le message ne peut pas être vide');
    }
    return result;
  }

  // Vérifier la longueur minimale
  if (message.trim().length < minLength) {
    result.isValid = false;
    result.errors.push(`Le message doit contenir au moins ${minLength} caractère(s)`);
  }

  // Vérifier la longueur maximale
  if (message.length > maxLength) {
    result.isValid = false;
    result.errors.push(`Le message ne doit pas dépasser ${maxLength} caractères`);
  }

  // Vérifier les mots interdits avec la nouvelle API contextuelle
  const forbiddenWordsCheck = containsForbiddenWords(message);
  
  result.forbiddenWords = forbiddenWordsCheck.foundWords;
  result.possibleQuoteOrReport = forbiddenWordsCheck.possibleQuoteOrReport;
  result.severity = forbiddenWordsCheck.severity;
  result.recommendedAction = forbiddenWordsCheck.recommendedAction;
  
  // Si respectRecommendedActions est activé, utiliser l'action recommandée
  if (respectRecommendedActions && forbiddenWordsCheck.hasForbiddenWords && forbiddenWordsCheck.recommendedAction) {
    switch (forbiddenWordsCheck.recommendedAction) {
      case 'block':
        // Bloquer le message quelle que soit l'option censorInsteadOfBlock
        result.isValid = false;
        result.errors.push(
          `Le message contient du contenu interdit : ${forbiddenWordsCheck.foundWords.join(', ')}`
        );
        break;
        
      case 'warn':
        // Autoriser le message mais inclure un avertissement
        result.warningMessage = `Attention: Ce message contient des mots qui pourraient être inappropriés dans certains contextes: ${forbiddenWordsCheck.foundWords.join(', ')}`;
        break;
        
      case 'censor':
        // Censurer le contenu problématique
        result.message = censorMessage(message);
        result.censored = result.message !== message;
        break;
        
      case 'notify_mod':
        // Autoriser le message mais notifier un modérateur
        result.shouldNotifyModerator = true;
        // Censurer également le message pour les autres utilisateurs
        result.message = censorMessage(message);
        result.censored = result.message !== message;
        break;
    }
  } else {
    // Comportement traditionnel si nous n'utilisons pas les actions recommandées
    // Déterminer si le message doit être bloqué en fonction du contexte et de la gravité
    let shouldBlock = forbiddenWordsCheck.hasForbiddenWords;
    
    // Si c'est une citation et que l'option est activée, ne pas bloquer
    if (shouldBlock && forbiddenWordsCheck.possibleQuoteOrReport && allowQuotedWords) {
      shouldBlock = false;
    }
    
    // Si ce sont des mots de faible gravité et que l'option est activée, ne pas bloquer
    if (shouldBlock && forbiddenWordsCheck.severity === 'low' && allowLowSeverityWords) {
      shouldBlock = false;
    }
    
    if (shouldBlock) {
      if (censorInsteadOfBlock) {
        // Censurer le message au lieu de le bloquer
        result.message = censorMessage(message);
        result.censored = result.message !== message;
      } else {
        // Bloquer le message
        result.isValid = false;
        
        // Message d'erreur personnalisé selon la gravité
        if (forbiddenWordsCheck.possibleQuoteOrReport) {
          result.errors.push(
            `Le message contient des mots inappropriés. Si vous citez quelqu'un, veuillez utiliser le bouton "Signaler" à la place.`
          );
        } else if (forbiddenWordsCheck.severity === 'high') {
          result.errors.push(
            `Le message contient du contenu interdit : ${forbiddenWordsCheck.foundWords.join(', ')}`
          );
        } else {
          result.errors.push(
            `Le message contient des mots inappropriés : ${forbiddenWordsCheck.foundWords.join(', ')}`
          );
        }
      }
    }
  }

  return result;
}

/**
 * Vérifie rapidement si un message est valide sans retourner les détails complets
 * @param message Le message à vérifier
 * @param options Options de validation
 * @returns true si le message est valide, false sinon
 */
export function isMessageValid(
  message: string,
  options: MessageValidationOptions = {}
): boolean {
  return validateMessage(message, options).isValid;
} 