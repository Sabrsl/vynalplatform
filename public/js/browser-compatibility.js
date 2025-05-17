/**
 * Script de compatibilité pour les anciens navigateurs
 * Ce script ajoute un support pour les variables CSS et les fonctionnalités modernes
 * sur les navigateurs qui ne les supportent pas nativement
 */

(function() {
  // Détection des anciens navigateurs - version améliorée
  const isOldBrowser = !window.CSS || 
                       !window.CSS.supports || 
                       !window.CSS.supports('color', 'var(--test)') ||
                       /MSIE|Trident|Edge\/1[0-5]/.test(navigator.userAgent) ||
                       /Android 4|Android 5\.[0-1]/.test(navigator.userAgent) ||
                       /iPhone OS [456789]_/.test(navigator.userAgent) ||
                       /iPad.*OS [456789]_/.test(navigator.userAgent) ||
                       /UCBrowser/.test(navigator.userAgent) ||
                       /Opera Mini/.test(navigator.userAgent) ||
                       /Samsung.*Browser\/(4|5|6|7)/.test(navigator.userAgent);

  // Force l'activation des fallbacks en mode couleur sécurisée pour les appareils
  // qui ont des configurations particulières de couleur
  const needsColorFixes = window.matchMedia && (
    window.matchMedia('(forced-colors: active)').matches ||
    window.matchMedia('(prefers-contrast: more)').matches ||
    window.matchMedia('(monochrome)').matches ||
    window.matchMedia('(prefers-color-scheme: no-preference)').matches ||
    document.querySelector('meta[name="color-scheme"][content="only light"]') !== null
  );

  // Détection des appareils avec des problèmes connus de rendu CSS
  const hasKnownDisplayIssues = (
    // Samsung Internet ancien
    /SamsungBrowser\/[1-9]\./.test(navigator.userAgent) ||
    // UC Browser
    /UCBrowser\//.test(navigator.userAgent) ||
    // Nokia Browser
    /NokiaBrowser\//.test(navigator.userAgent) ||
    // Baidu Browser
    /baiduboxapp/.test(navigator.userAgent) ||
    // MIUI Browser
    /MiuiBrowser\//.test(navigator.userAgent) ||
    // QQ Browser
    /MQQBrowser\//.test(navigator.userAgent) ||
    // KHTML
    /KHTML/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
  );

  // Vérifier si nous devons appliquer les fallbacks
  if (isOldBrowser || needsColorFixes || hasKnownDisplayIssues) {
    // Logging avec détails spécifiques pour aider au débogage
    const reason = isOldBrowser ? "Ancien navigateur" : 
                   needsColorFixes ? "Mode d'accessibilité/contraste" : 
                   "Problèmes connus de rendu CSS";
    
    console.log("Correction de compatibilité appliquée - Raison : " + reason);
    
    // Charger le CSS de fallback de façon asynchrone pour ne pas bloquer le rendu
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = '/css/browser-fallbacks.css';
    linkElement.setAttribute('media', 'print');
    document.head.appendChild(linkElement);
    
    // Basculer vers "all" après l'insertion pour éviter le blocage du rendu
    setTimeout(() => { 
      linkElement.media = 'all';
    }, 0);
    
    // Ajouter une classe principale au document pour utiliser des sélecteurs CSS
    document.documentElement.classList.add('vynal-legacy-browser');
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('vynal-legacy-dark');
    }
    
    // Appliquer toutes les corrections nécessaires en une seule passe
    function applyComprehensiveFixesOnce() {
      const isDarkMode = document.documentElement.classList.contains('dark');
      
      // Création d'une feuille de style dynamique plutôt que des styles inline
      const styleSheet = document.createElement('style');
      document.head.appendChild(styleSheet);
      
      // Utiliser une seule sélection pour tous les éléments à traiter
      const allSelectorsNeeded = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div',
        '[class*="text-vynal-"]', '[class*="text-slate-"]',
        '[class*="bg-gradient-to-"]', 'button', '.btn',
        '.flex[class*="gap-"]', '.grid[class*="gap-"]'
      ];
      
      // Un seul querySelectorAll pour tous les éléments
      const allElements = document.querySelectorAll(allSelectorsNeeded.join(','));
      
      // Map pour stocker les éléments par type pour éviter les sélections multiples
      const elementsByType = {
        headings: [],
        paragraphs: [],
        vynalTextElements: [],
        slateTextElements: [],
        gradientElements: [],
        buttons: [],
        flexContainers: []
      };
      
      // Une seule passe pour classifier tous les éléments
      allElements.forEach(el => {
        const tagName = el.tagName.toLowerCase();
        const className = el.className || '';
        
        if (tagName.match(/^h[1-6]$/)) {
          elementsByType.headings.push(el);
        }
        
        if (tagName === 'p' || tagName === 'span' || tagName === 'div') {
          elementsByType.paragraphs.push(el);
        }
        
        if (className.includes('text-vynal-')) {
          elementsByType.vynalTextElements.push(el);
        }
        
        if (className.includes('text-slate-')) {
          elementsByType.slateTextElements.push(el);
        }
        
        if (className.includes('bg-gradient-to-')) {
          elementsByType.gradientElements.push(el);
        }
        
        if (tagName === 'button' || className.includes('btn')) {
          elementsByType.buttons.push(el);
        }
        
        if ((className.includes('flex') || className.includes('grid')) && 
            className.includes('gap-')) {
          elementsByType.flexContainers.push(el);
        }
      });
      
      // Applique les classes CSS plutôt que des styles inline
      
      // Traitement des titres
      elementsByType.headings.forEach(el => {
        el.classList.add('vynal-fallback-heading');
      });
      
      // Traitement des paragraphes et textes
      elementsByType.paragraphs.forEach(el => {
        if (!el.style.color) {
          el.classList.add('vynal-fallback-text');
        }
      });
      
      // Traitement des éléments avec des couleurs Vynal
      elementsByType.vynalTextElements.forEach(el => {
        const className = el.className;
        
        if (className.includes('text-vynal-text-primary')) {
          el.classList.add('vynal-fallback-text-primary');
        } 
        else if (className.includes('text-vynal-text-secondary')) {
          el.classList.add('vynal-fallback-text-secondary');
        }
        else if (className.includes('text-vynal-accent-primary')) {
          el.classList.add('vynal-fallback-accent-primary');
        }
        else if (className.includes('text-vynal-accent-secondary')) {
          el.classList.add('vynal-fallback-accent-secondary');
        }
      });
      
      // Traitement des éléments avec des couleurs Slate
      elementsByType.slateTextElements.forEach(el => {
        const className = el.className;
        
        if (className.includes('text-slate-600')) {
          el.classList.add('vynal-fallback-slate-600');
        }
        else if (className.includes('text-slate-700')) {
          el.classList.add('vynal-fallback-slate-700');
        }
        else if (className.includes('text-slate-800')) {
          el.classList.add('vynal-fallback-slate-800');
        }
        else if (className.includes('text-slate-900')) {
          el.classList.add('vynal-fallback-slate-900');
        }
      });
      
      // Traitement des dégradés
      elementsByType.gradientElements.forEach(el => {
        const className = el.className;
        
        // Ajouter une classe au lieu de manipuler le style directement
        el.classList.add('vynal-no-gradient');
        
        if (className.includes('bg-gradient-to-r')) {
          if (className.includes('from-vynal-accent-primary') || 
              className.includes('dark:from-vynal-accent-primary')) {
            el.classList.add('vynal-fallback-bg-accent-primary');
          } else if (className.includes('from-vynal-accent-secondary') || 
                    className.includes('dark:from-vynal-accent-secondary')) {
            el.classList.add('vynal-fallback-bg-accent-secondary');
          }
        } else if (className.includes('bg-gradient-to-b')) {
          if (className.includes('from-white')) {
            el.classList.add('vynal-fallback-bg-white');
          } else if (isDarkMode && className.includes('dark:from-vynal-purple-dark')) {
            el.classList.add('vynal-fallback-bg-purple-dark');
          }
        }
      });
      
      // Traitement des boutons
      elementsByType.buttons.forEach(el => {
        if (el.className.includes('btn-vynal-primary')) {
          el.classList.add('vynal-fallback-btn-primary');
        }
      });
      
      // Traitement des flexbox avec gap
      elementsByType.flexContainers.forEach(container => {
        const isColumn = container.classList.contains('flex-col');
        container.classList.add('vynal-no-flexbox-gap');
        
        if (isColumn) {
          container.classList.add('vynal-gap-vertical');
        } else {
          container.classList.add('vynal-gap-horizontal');
        }
        
        // Attribuer la bonne classe de gap
        if (container.classList.contains('gap-2')) {
          container.classList.add('vynal-gap-2');
        } else if (container.classList.contains('gap-3')) {
          container.classList.add('vynal-gap-3');
        } else if (container.classList.contains('gap-4')) {
          container.classList.add('vynal-gap-4');
        } else if (container.classList.contains('gap-6')) {
          container.classList.add('vynal-gap-6');
        }
      });
      
      // Ajouter une classe au body pour les corrections globales
      document.body.classList.add('vynal-legacy-fixes');
      
      // Ajouter les définitions CSS pour toutes les classes ajoutées
      styleSheet.textContent = `
        /* Couleurs de texte et arrière-plan par défaut */
        .vynal-fallback-heading { color: #1e293b; }
        .vynal-legacy-dark .vynal-fallback-heading { color: #FFFFFF; }
        
        .vynal-fallback-text { color: #475569; }
        .vynal-legacy-dark .vynal-fallback-text { color: #D6D6D6; }
        
        .vynal-fallback-text-primary { color: #2C1A4C; }
        .vynal-legacy-dark .vynal-fallback-text-primary { color: #FFFFFF; }
        
        .vynal-fallback-text-secondary { color: #555555; }
        .vynal-legacy-dark .vynal-fallback-text-secondary { color: #D6D6D6; }
        
        .vynal-fallback-accent-primary { color: #FF66B2; }
        .vynal-fallback-accent-secondary { color: #7B1FA2; }
        .vynal-legacy-dark .vynal-fallback-accent-secondary { color: #FF007F; }
        
        .vynal-fallback-slate-600 { color: #475569; }
        .vynal-fallback-slate-700 { color: #334155; }
        .vynal-fallback-slate-800 { color: #1e293b; }
        .vynal-fallback-slate-900 { color: #0f172a; }
        
        /* Arrière-plans pour remplacer les dégradés */
        .vynal-no-gradient { background-image: none !important; }
        .vynal-fallback-bg-accent-primary { background-color: #FF66B2 !important; }
        .vynal-fallback-bg-accent-secondary { background-color: #7B1FA2 !important; }
        .vynal-fallback-bg-white { background-color: #ffffff !important; }
        .vynal-fallback-bg-purple-dark { background-color: #100422 !important; }
        
        /* Styles pour les boutons */
        .vynal-fallback-btn-primary { 
          background-color: #FF66B2 !important; 
          color: #2C1A4C !important; 
        }
        
        /* Corrections pour les gaps flexbox */
        .vynal-no-flexbox-gap.vynal-gap-vertical > *:not(:first-child) { margin-top: 8px; }
        .vynal-no-flexbox-gap.vynal-gap-horizontal > *:not(:first-child) { margin-left: 8px; }
        
        .vynal-no-flexbox-gap.vynal-gap-2.vynal-gap-vertical > *:not(:first-child) { margin-top: 8px; }
        .vynal-no-flexbox-gap.vynal-gap-2.vynal-gap-horizontal > *:not(:first-child) { margin-left: 8px; }
        
        .vynal-no-flexbox-gap.vynal-gap-3.vynal-gap-vertical > *:not(:first-child) { margin-top: 12px; }
        .vynal-no-flexbox-gap.vynal-gap-3.vynal-gap-horizontal > *:not(:first-child) { margin-left: 12px; }
        
        .vynal-no-flexbox-gap.vynal-gap-4.vynal-gap-vertical > *:not(:first-child) { margin-top: 16px; }
        .vynal-no-flexbox-gap.vynal-gap-4.vynal-gap-horizontal > *:not(:first-child) { margin-left: 16px; }
        
        .vynal-no-flexbox-gap.vynal-gap-6.vynal-gap-vertical > *:not(:first-child) { margin-top: 24px; }
        .vynal-no-flexbox-gap.vynal-gap-6.vynal-gap-horizontal > *:not(:first-child) { margin-left: 24px; }
        
        /* Correction globale du body */
        .vynal-legacy-fixes { background-color: #ffffff; }
        .vynal-legacy-dark .vynal-legacy-fixes { background-color: #100422; }
      `;
    }
    
    // Support pour le mode sombre amélioré
    function addDarkModeSupport() {
      // Vérifier si le navigateur préfère le mode sombre
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.add('vynal-legacy-dark');
        document.body.dataset.theme = 'dark';
      }
      
      // Pour les navigateurs qui ne supportent pas prefers-color-scheme
      if (!window.matchMedia || !window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Ajouter un bouton de bascule basique pour le mode sombre si nécessaire
        const toggleExists = document.querySelector('[data-theme-toggle]');
        
        if (!toggleExists) {
          const toggle = document.createElement('button');
          toggle.setAttribute('data-theme-toggle', 'true');
          toggle.textContent = 'Mode sombre';
          toggle.style.position = 'fixed';
          toggle.style.bottom = '10px';
          toggle.style.right = '10px';
          toggle.style.zIndex = '9999';
          toggle.style.padding = '5px 10px';
          toggle.style.backgroundColor = '#333';
          toggle.style.color = '#fff';
          toggle.style.border = 'none';
          toggle.style.borderRadius = '5px';
          
          toggle.addEventListener('click', function() {
            document.documentElement.classList.toggle('dark');
            document.documentElement.classList.toggle('vynal-legacy-dark');
            document.body.dataset.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            this.textContent = document.documentElement.classList.contains('dark') ? 
                               'Mode clair' : 'Mode sombre';
          });
          
          document.body.appendChild(toggle);
        }
      }
    }

    // Méthode de vérification finale unifiée
    function verifyRendering() {
      const body = document.body;
      const computedBodyStyle = window.getComputedStyle(body);
      
      // Vérifier si le corps a une couleur de fond, sinon en appliquer une via une classe
      if (computedBodyStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || 
          computedBodyStyle.backgroundColor === 'transparent') {
        body.classList.add('vynal-legacy-fixes');
      }
      
      // Vérifier aléatoirement quelques éléments de texte pour s'assurer qu'ils ont une couleur
      const textElements = document.querySelectorAll('h1, h2, h3, p');
      let problemsFound = false;
      
      for (let i = 0; i < Math.min(5, textElements.length); i++) {
        const randomIndex = Math.floor(Math.random() * textElements.length);
        const el = textElements[randomIndex];
        const computedStyle = window.getComputedStyle(el);
        
        if (computedStyle.color === 'rgba(0, 0, 0, 0)' || 
            computedStyle.color === 'transparent') {
          problemsFound = true;
          break;
        }
      }
      
      // Si des problèmes sont trouvés, appliquer une correction via une classe d'urgence plutôt que des styles inline
      if (problemsFound) {
        console.log("Problèmes persistants de rendu détectés, application d'une classe d'urgence");
        document.documentElement.classList.add('vynal-emergency-fixes');
        
        // Ajouter des styles d'urgence en un seul bloc
        const emergencyStyle = document.createElement('style');
        emergencyStyle.id = 'emergency-styles';
        emergencyStyle.textContent = `
          .vynal-emergency-fixes * { color: #1e293b !important; }
          .vynal-emergency-fixes.dark * { color: #FFFFFF !important; }
          .vynal-emergency-fixes a, .vynal-emergency-fixes button { color: #FF66B2 !important; }
        `;
        document.head.appendChild(emergencyStyle);
      }
    }

    // Initialisation unique pour toutes les corrections
    function initializeFallbacks() {
      applyComprehensiveFixesOnce();
      addDarkModeSupport();
      
      // Vérification finale après un court délai
      setTimeout(verifyRendering, 500);
    }

    // Attendre que la page soit chargée pour appliquer les corrections
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeFallbacks);
    } else {
      initializeFallbacks();
    }
  }
})(); 