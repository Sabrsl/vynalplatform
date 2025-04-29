import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { 
  FileText, 
  FileImage, 
  FileCode, 
  FileArchive, 
  FileAudio, 
  FileVideo, 
  File,
  FileSpreadsheet,
  FilePieChart,
  FileSliders,
  FileDigit,
  FilePenLine,
  FileKey,
  FileX,
  FileQuestion
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  /**
   * Nom du fichier (utilisé pour détecter l'extension)
   */
  fileName?: string; 
  
  /**
   * Extension de fichier explicite (prioritaire sur l'extension détectée du fileName)
   */
  extension?: string;
  
  /**
   * Classes CSS additionnelles
   */
  className?: string;
  
  /**
   * Taille de l'icône
   */
  size?: number;
  
  /**
   * Désactiver les couleurs et utiliser une couleur uniforme
   */
  monochrome?: boolean;
  
  /**
   * Texte alternatif pour l'accessibilité
   */
  alt?: string;
  
  /**
   * Indique si le fichier est invalide ou corrompu
   */
  isInvalid?: boolean;
  
  /**
   * Indique si le fichier est inconnu
   */
  isUnknown?: boolean;
  
  /**
   * Gestionnaire d'événement de clic sur l'icône
   */
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}

/**
 * Définition des mappings d'extensions avec mémo pour éviter les recréations inutiles
 */
const getFileTypeMappings = () => {
  return {
    // Documents texte
    text: ['doc', 'docx', 'txt', 'rtf', 'odt', 'pages', 'md', 'markdown'],
    
    // PDFs
    pdf: ['pdf'],
    
    // Images
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'heic', 'raw', 'psd', 'ai'],
    
    // Code
    code: ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'less', 'php', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'go', 'rb', 'rs', 'swift', 'kt', 'json', 'xml', 'yml', 'yaml', 'toml', 'sh', 'bash', 'sql'],
    
    // Archives
    archive: ['zip', 'rar', 'tar', 'gz', 'bz2', '7z', 'iso', 'dmg', 'pkg'],
    
    // Audio
    audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma', 'midi', 'aiff'],
    
    // Vidéo
    video: ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv', 'mpg', 'mpeg', 'm4v', '3gp'],
    
    // Tableurs
    spreadsheet: ['xls', 'xlsx', 'csv', 'tsv', 'ods', 'numbers'],
    
    // Présentations
    presentation: ['ppt', 'pptx', 'odp', 'key'],
    
    // Données
    data: ['db', 'dbf', 'sqlite', 'sql', 'mdb', 'accdb', 'json', 'xml'],
    
    // Securité
    security: ['key', 'pem', 'crt', 'cer', 'p12', 'pfx', 'sig', 'asc', 'gpg', 'keychain'],
    
    // Ebook
    ebook: ['epub', 'mobi', 'azw', 'fb2', 'lit'],
    
    // Font
    font: ['ttf', 'otf', 'woff', 'woff2', 'eot']
  };
};

/**
 * Composant optimisé pour afficher une icône de fichier basée sur l'extension
 * - Support des thèmes clair/sombre
 * - Performance optimisée avec useMemo
 * - Support étendu des formats de fichiers
 * - Options avancées de personnalisation
 */
const FileIcon: React.FC<FileIconProps> = ({ 
  fileName = '', 
  extension: explicitExtension,
  className,
  size = 24,
  monochrome = false,
  alt,
  isInvalid = false,
  isUnknown = false,
  onClick
}) => {
  // Support du thème
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Utilise l'extension explicite ou l'extrait du nom de fichier
  const extension = useMemo(() => {
    if (explicitExtension) return explicitExtension.toLowerCase();
    return fileName.split('.').pop()?.toLowerCase() || '';
  }, [fileName, explicitExtension]);
  
  // Détermine le type de fichier et l'icône associée - calcul mémoïsé
  const { fileType, icon } = useMemo(() => {
    // Traitement des cas spéciaux d'abord
    if (isInvalid) {
      return { 
        fileType: 'invalid', 
        icon: <FileX size={size} className={cn(
          monochrome ? '' : (isDarkMode ? 'text-red-400' : 'text-red-500'),
          className
        )} />
      };
    }
    
    if (isUnknown) {
      return { 
        fileType: 'unknown', 
        icon: <FileQuestion size={size} className={cn(
          monochrome ? '' : (isDarkMode ? 'text-gray-400' : 'text-gray-500'),
          className
        )} />
      };
    }
    
    // Obtenir les mappings complets
    const mappings = getFileTypeMappings();
    
    // Trouver le type de fichier correspondant à l'extension
    let foundType = '';
    for (const [type, extensions] of Object.entries(mappings)) {
      if (extensions.includes(extension)) {
        foundType = type;
        break;
      }
    }
    
    // Fonction pour obtenir la couleur appropriée selon le mode
    const getColor = (lightColor: string, darkColor: string) => {
      if (monochrome) return '';
      return isDarkMode ? darkColor : lightColor;
    };
    
    // Attribution des icônes et couleurs selon le type
    switch (foundType) {
      case 'text':
        return { 
          fileType: 'text',
          icon: <FileText size={size} className={cn(getColor('text-blue-500', 'text-blue-400'), className)} />
        };
      case 'pdf':
        return { 
          fileType: 'pdf',
          icon: <FileText size={size} className={cn(getColor('text-red-600', 'text-red-400'), className)} />
        };
      case 'image':
        return { 
          fileType: 'image',
          icon: <FileImage size={size} className={cn(getColor('text-green-500', 'text-green-400'), className)} />
        };
      case 'code':
        return { 
          fileType: 'code',
          icon: <FileCode size={size} className={cn(getColor('text-purple-500', 'text-purple-400'), className)} />
        };
      case 'archive':
        return { 
          fileType: 'archive',
          icon: <FileArchive size={size} className={cn(getColor('text-yellow-500', 'text-yellow-400'), className)} />
        };
      case 'audio':
        return { 
          fileType: 'audio',
          icon: <FileAudio size={size} className={cn(getColor('text-amber-500', 'text-amber-400'), className)} />
        };
      case 'video':
        return { 
          fileType: 'video',
          icon: <FileVideo size={size} className={cn(getColor('text-pink-500', 'text-pink-400'), className)} />
        };
      case 'spreadsheet':
        return { 
          fileType: 'spreadsheet',
          icon: <FileSpreadsheet size={size} className={cn(getColor('text-emerald-500', 'text-emerald-400'), className)} />
        };
      case 'presentation':
        return { 
          fileType: 'presentation',
          icon: <FileSliders size={size} className={cn(getColor('text-orange-500', 'text-orange-400'), className)} />
        };
      case 'data':
        return { 
          fileType: 'data',
          icon: <FilePieChart size={size} className={cn(getColor('text-cyan-500', 'text-cyan-400'), className)} />
        };
      case 'security':
        return { 
          fileType: 'security',
          icon: <FileKey size={size} className={cn(getColor('text-indigo-500', 'text-indigo-400'), className)} />
        };
      case 'ebook':
        return { 
          fileType: 'ebook',
          icon: <FilePenLine size={size} className={cn(getColor('text-fuchsia-500', 'text-fuchsia-400'), className)} />
        };
      case 'font':
        return { 
          fileType: 'font',
          icon: <FileDigit size={size} className={cn(getColor('text-lime-500', 'text-lime-400'), className)} />
        };
      default:
        return { 
          fileType: 'generic',
          icon: <File size={size} className={cn(getColor('text-gray-500', 'text-gray-400'), className)} />
        };
    }
  }, [extension, className, size, monochrome, isDarkMode, isInvalid, isUnknown]);
  
  // Rendu avec support d'accessibilité
  return (
    <span 
      className="inline-flex items-center justify-center" 
      title={alt || `Fichier ${fileName || extension}`}
      role="img" 
      aria-label={alt || `Type de fichier: ${fileType}`}
    >
      {React.cloneElement(icon, { onClick })}
    </span>
  );
};

export { FileIcon, type FileIconProps };
export default FileIcon;