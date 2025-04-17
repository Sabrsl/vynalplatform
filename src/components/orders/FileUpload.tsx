"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, File, Paperclip } from "lucide-react";

interface FileUploadProps {
  onChange: (files: FileList | null) => void;
  label?: string;
  description?: string;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // en Mo
}

export function FileUpload({
  onChange,
  label = "Téléverser des fichiers",
  description = "Glissez-déposez ou cliquez pour téléverser",
  multiple = true,
  accept = "*/*",
  maxFiles = 5,
  maxSize = 10, // 10 Mo par défaut
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = [];
    setError(null);
    
    // Vérifier le nombre de fichiers
    if (files.length > maxFiles) {
      setError(`Vous ne pouvez pas téléverser plus de ${maxFiles} fichiers à la fois`);
      return validFiles;
    }
    
    // Vérifier la taille de chaque fichier
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileSizeMB = file.size / (1024 * 1024);
      
      if (fileSizeMB > maxSize) {
        setError(`Le fichier ${file.name} dépasse la taille maximale de ${maxSize} Mo`);
        return [];
      }
      
      validFiles.push(file);
    }
    
    return validFiles;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
        onChange(e.dataTransfer.files);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
        onChange(e.target.files);
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    
    // Créer un nouveau FileList à partir des fichiers restants
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    onChange(dataTransfer.files.length > 0 ? dataTransfer.files : null);
  };

  const onButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="file-upload" className="flex items-center gap-1.5">
          <Paperclip className="h-4 w-4" />
          {label}
        </Label>
      )}
      
      <div
        onDragEnter={handleDrag}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragActive 
            ? "border-indigo-500 bg-indigo-50" 
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <Input
          ref={inputRef}
          id="file-upload"
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center py-4" onClick={onButtonClick}>
          <Upload className="h-10 w-10 text-slate-400 mb-2" />
          <p className="text-sm font-medium">{description}</p>
          <p className="text-xs text-slate-500 mt-1">
            {multiple ? `Maximum ${maxFiles} fichiers, ${maxSize} Mo chacun` : `Maximum ${maxSize} Mo`}
          </p>
        </div>
        
        {error && (
          <p className="text-xs text-red-500 mt-2">{error}</p>
        )}
        
        {/* Zones invisibles pour gérer le drag & drop */}
        {dragActive && (
          <div
            className="absolute inset-0 w-full h-full"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          />
        )}
      </div>
      
      {/* Liste des fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Fichiers sélectionnés ({selectedFiles.length})</p>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-lg bg-slate-50">
                <div className="flex items-center overflow-hidden">
                  <File className="h-4 w-4 text-indigo-600 mr-2 shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-slate-500 ml-2 shrink-0">
                    {(file.size / (1024 * 1024)).toFixed(2)} Mo
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 