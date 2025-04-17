import * as React from "react"
import { 
  FileText, 
  FileImage, 
  FileArchive, 
  FileAudio, 
  FileVideo, 
  FileCode, 
  File,
  FileType,
  FileSpreadsheet as FileSpreadsheetIcon
} from "lucide-react"

interface FileIconProps extends React.HTMLAttributes<HTMLDivElement> {
  extension?: string
  fileType?: string
}

export function FileIcon({ extension, fileType, className, ...props }: FileIconProps) {
  const getIconByExtension = () => {
    if (!extension && !fileType) return <File className={className} />;
    
    // Normalize extension and remove dot if present
    const ext = extension?.toLowerCase().replace(/^\./, '') || '';
    const type = fileType?.toLowerCase() || '';
    
    // Check file type first
    if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) {
      return <FileImage className={className} />;
    }
    
    if (type.includes('audio') || ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
      return <FileAudio className={className} />;
    }
    
    if (type.includes('video') || ['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv'].includes(ext)) {
      return <FileVideo className={className} />;
    }
    
    if (type.includes('pdf') || ext === 'pdf') {
      return <FileText className={className} />;
    }
    
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
      return <FileArchive className={className} />;
    }
    
    if (['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'php', 'py', 'rb', 'java', 'c', 'cpp', 'h', 'cs'].includes(ext)) {
      return <FileCode className={className} />;
    }
    
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
      return <FileSpreadsheetIcon className={className} />;
    }
    
    if (['doc', 'docx', 'txt', 'rtf', 'md', 'odt'].includes(ext)) {
      return <FileText className={className} />;
    }
    
    // Default file icon
    return <File className={className} />;
  };
  
  return getIconByExtension();
} 