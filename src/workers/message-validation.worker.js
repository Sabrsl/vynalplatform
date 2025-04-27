/* 
 * Worker pour la validation des messages
 * Ce worker traite la validation des messages en arrière-plan
 * pour ne pas bloquer l'interface utilisateur
 */

// Liste de mots simples à filtrer (une implémentation basique pour le worker)
const forbiddenWords = [
  'badword1',
  'badword2',
  'badword3'
];

// Fonction pour vérifier si un message contient des mots interdits
function containsForbiddenWords(message) {
  const lowercaseMessage = message.toLowerCase();
  const foundWords = [];
  
  forbiddenWords.forEach(word => {
    if (lowercaseMessage.includes(word.toLowerCase())) {
      foundWords.push(word);
    }
  });
  
  return {
    hasForbiddenWords: foundWords.length > 0,
    foundWords: foundWords,
    possibleQuoteOrReport: message.includes('"') || message.includes("'"),
    severity: foundWords.length > 2 ? 'high' : foundWords.length > 0 ? 'medium' : 'none',
    recommendedAction: foundWords.length > 2 ? 'block' : foundWords.length > 0 ? 'censor' : null
  };
}

// Fonction pour censurer un message
function censorMessage(message) {
  let censoredMessage = message;
  
  forbiddenWords.forEach(word => {
    // Remplacer le mot par des astérisques
    censoredMessage = censoredMessage.replace(
      new RegExp(word, 'gi'),
      '*'.repeat(word.length)
    );
  });
  
  return censoredMessage;
}

// Traiter les messages reçus du thread principal
self.onmessage = function(e) {
  const { content, options = {} } = e.data;
  
  // Options par défaut
  const {
    maxLength = 5000,
    minLength = 1,
    censorInsteadOfBlock = false,
    allowLowSeverityWords = false,
    allowQuotedWords = false
  } = options;
  
  // Résultat par défaut
  const result = {
    isValid: true,
    censored: false,
    message: content,
    originalMessage: content,
    errors: [],
    warningMessage: null,
    shouldNotifyModerator: false
  };
  
  // Vérifier si le message est vide
  if (!content || content.trim() === '') {
    result.isValid = false;
    result.errors.push('Le message ne peut pas être vide');
    self.postMessage(result);
    return;
  }
  
  // Vérifier la longueur minimale
  if (content.trim().length < minLength) {
    result.isValid = false;
    result.errors.push(`Le message doit contenir au moins ${minLength} caractère(s)`);
  }
  
  // Vérifier la longueur maximale
  if (content.length > maxLength) {
    result.isValid = false;
    result.errors.push(`Le message ne doit pas dépasser ${maxLength} caractères`);
  }
  
  // Vérifier les mots interdits
  const forbiddenWordsCheck = containsForbiddenWords(content);
  
  if (forbiddenWordsCheck.hasForbiddenWords) {
    // Déterminer si le message doit être bloqué en fonction du contexte
    let shouldBlock = true;
    
    // Si c'est une citation et que l'option est activée, ne pas bloquer
    if (forbiddenWordsCheck.possibleQuoteOrReport && allowQuotedWords) {
      shouldBlock = false;
    }
    
    // Si ce sont des mots de faible gravité et que l'option est activée, ne pas bloquer
    if (forbiddenWordsCheck.severity === 'low' && allowLowSeverityWords) {
      shouldBlock = false;
    }
    
    if (shouldBlock && !censorInsteadOfBlock) {
      result.isValid = false;
      result.errors.push(`Le message contient des mots inappropriés : ${forbiddenWordsCheck.foundWords.join(', ')}`);
    } else {
      // Censurer le message
      result.message = censorMessage(content);
      result.censored = result.message !== content;
      
      if (forbiddenWordsCheck.severity === 'high') {
        result.shouldNotifyModerator = true;
        result.warningMessage = 'Ce message contient du contenu qui pourrait être inapproprié.';
      }
    }
  }
  
  // Renvoyer le résultat au thread principal
  self.postMessage(result);
}; 