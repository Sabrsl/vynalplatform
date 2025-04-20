import React from 'react';
import { 
  FileText, 
  FileImage, 
  FileCode, 
  FileArchive, 
  FileAudio, 
  FileVideo, 
  File 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  fileName?: string; 
  className?: string;
}

const FileIcon: React.FC<FileIconProps> = ({ fileName = '', className }) => {
  // Obtenir l'extension du fichier
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Sélectionner l'icône en fonction de l'extension
  const getIcon = () => {
    // Documents texte
    if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
      return <FileText className={cn('text-blue-500', className)} />;
    }
    
    // PDFs
    if (extension === 'pdf') {
      return <FileText className={cn('text-red-500', className)} />;
    }
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
      return <FileImage className={cn('text-green-500', className)} />;
    }
    
    // Code
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'php', 'py', 'java', 'c', 'cpp', 'json', 'xml'].includes(extension)) {
      return <FileCode className={cn('text-purple-500', className)} />;
    }
    
    // Archives
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(extension)) {
      return <FileArchive className={cn('text-yellow-500', className)} />;
    }
    
    // Audio
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension)) {
      return <FileAudio className={cn('text-amber-500', className)} />;
    }
    
    // Vidéo
    if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm'].includes(extension)) {
      return <FileVideo className={cn('text-pink-500', className)} />;
    }
    
    // Fichier générique
    return <File className={cn('text-gray-500', className)} />;
  };
  
  return getIcon();
};

export { FileIcon, type FileIconProps };
export default FileIcon; 