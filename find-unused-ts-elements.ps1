# Script pour détecter et corriger les éléments inutilisés dans les fichiers TypeScript
# Ce script génère un rapport et sauvegarde les fichiers avant modification

# Configuration
$sourceDir = "src"
$outputReport = "unused-elements-report.md"
$backupDir = "backup-ts-files-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Créer le répertoire de sauvegarde
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

# Initialiser le rapport
"# Rapport d'éléments inutilisés dans le code TypeScript" | Out-File -FilePath $outputReport
"*Généré le $(Get-Date)*`n" | Out-File -FilePath $outputReport -Append

# Patterns pour trouver les imports inutilisés (forme simplifiée)
$importPattern = 'import\s+\{([^}]+)\}\s+from'

# Liste des problèmes exacts depuis le message d'erreur
$problems = @(
    @{ File = "src/.../stores/useMessagingStore.ts"; Line = 3 },
    @{ File = "src/.../stores/useMessagingStore.ts"; Line = 2 },
    @{ File = "src/.../stores/useNotificationStore.ts"; Line = 6 },
    @{ File = "src/.../supabase/admin.ts"; Line = 2 },
    @{ File = "src/.../services/systemStatusService.ts"; Line = 252 },
    @{ File = "src/.../services/systemStatusService.ts"; Line = 226 },
    @{ File = "src/.../services/servicesRefreshService.ts"; Line = 7 },
    @{ File = "src/.../security/audit.ts"; Line = 60 },
    @{ File = "src/.../search/queryBuilder.ts"; Line = 1 },
    @{ File = "src/lib/optimizations.ts"; Line = 61 },
    @{ File = "src/.../optimizations/safeCache.ts"; Line = 6 },
    @{ File = "src/.../optimizations/invalidation.ts"; Line = 6 },
    @{ File = "src/.../optimizations/invalidation.ts"; Line = 1 },
    @{ File = "src/.../optimizations/index.ts"; Line = 20 },
    @{ File = "src/.../optimizations/index.ts"; Line = 19 },
    @{ File = "src/.../optimizations/index.ts"; Line = 7 },
    @{ File = "src/.../optimizations/freelance-cache.ts"; Line = 6 },
    @{ File = "src/lib/forbidden-words.ts"; Line = 832 },
    @{ File = "src/lib/image-processor.ts"; Line = 314 },
    @{ File = "src/lib/email.ts"; Line = 287 },
    @{ File = "src/lib/email.ts"; Line = 15 },
    @{ File = "src/lib/email.ts"; Line = 12 },
    @{ File = "src/lib/email.ts"; Line = 6 },
    @{ File = "src/.../hooks/use-vynal-payment.ts"; Line = 27 }
)

# Statistiques
$totalFiles = 0
$totalFixed = 0

Write-Host "Recherche des fichiers problématiques..."

# Créer une table de hachage pour éviter les doublons
$processedFiles = @{}

# Parcourir chaque problème signalé
foreach ($problem in $problems) {
    $filePath = $problem.File
    $lineNumber = $problem.Line
    
    # Extraire le nom du fichier sans le chemin "..."
    $filePattern = $filePath -replace "src/\.\.\./", "" -replace "src/", ""
    
    Write-Host "Recherche de fichiers correspondant à: $filePattern"
    
    # Rechercher tous les fichiers qui correspondent au pattern
    $matchingFiles = Get-ChildItem -Path $sourceDir -Recurse -Include "*$filePattern" -ErrorAction SilentlyContinue
    
    if ($matchingFiles.Count -eq 0) {
        Write-Host "  Aucun fichier trouvé pour $filePattern"
        continue
    }
    
    foreach ($file in $matchingFiles) {
        $fullPath = $file.FullName
        $relativePath = $fullPath.Substring((Get-Location).Path.Length + 1)
        
        # Vérifier si on a déjà traité ce fichier
        if ($processedFiles.ContainsKey($fullPath)) {
            continue
        }
        
        $processedFiles[$fullPath] = $true
        $totalFiles++
        
        Write-Host "Traitement de $relativePath"
        
        # Faire une sauvegarde du fichier
        $backupPath = Join-Path -Path $backupDir -ChildPath $file.Name
        Copy-Item -Path $fullPath -Destination $backupPath
        
        # Lire le fichier
        $content = Get-Content -Path $fullPath -Raw
        $lines = Get-Content -Path $fullPath
        $modified = $false
        
        # Nouvelle liste de lignes pour le fichier corrigé
        $newLines = @()
        
        # Ajouter des informations au rapport pour ce fichier
        $fileProblems = @()
        
        # Analyser ligne par ligne
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            $currentLineNumber = $i + 1
            
            # Vérifier si cette ligne est signalée comme problématique
            $isProblemLine = $false
            foreach ($prob in $problems) {
                if ($prob.File -like "*$filePattern" -and $prob.Line -eq $currentLineNumber) {
                    $isProblemLine = $true
                    break
                }
            }
            
            # Si c'est une ligne d'import ET elle est problématique
            if ($line -match $importPattern -and $isProblemLine) {
                $importList = $Matches[1]
                $imports = $importList -split "," | ForEach-Object { $_.Trim() }
                
                # Vérifier chaque import
                $unusedImports = @()
                foreach ($import in $imports) {
                    # Ignorer les alias pour simplifier
                    if ($import -match "as") {
                        $import = ($import -split "as")[0].Trim()
                    }
                    
                    # Compter les occurrences (hors déclaration d'import)
                    $escapedImport = [regex]::Escape($import)
                    $pattern = "\b$escapedImport\b"
                    $contentWithoutImport = $content -replace $line, ""
                    $matches = [regex]::Matches($contentWithoutImport, $pattern)
                    
                    # Si pas d'occurrences, c'est un import inutilisé
                    if ($matches.Count -eq 0) {
                        $unusedImports += $import
                    }
                }
                
                # Si des imports inutilisés ont été trouvés
                if ($unusedImports.Count -gt 0) {
                    $modified = $true
                    $fileProblems += "- Ligne $currentLineNumber : Import(s) inutilisé(s) `"$($unusedImports -join ', ')`""
                    
                    # Commentaire pour la ligne
                    $newLines += "// $line // Imports inutilisés: $($unusedImports -join ', ')"
                } else {
                    $newLines += $line
                }
            }
            # Sinon, si c'est une ligne problématique (variables, fonctions, etc.)
            elseif ($isProblemLine) {
                $modified = $true
                $fileProblems += "- Ligne $currentLineNumber : Élément inutilisé"
                
                # Commentaire pour la ligne
                $newLines += "// $line // Élément inutilisé"
            } else {
                $newLines += $line
            }
        }
        
        # Si des problèmes ont été trouvés, les ajouter au rapport
        if ($fileProblems.Count -gt 0) {
            "`n## $relativePath" | Out-File -FilePath $outputReport -Append
            foreach ($prob in $fileProblems) {
                $prob | Out-File -FilePath $outputReport -Append
            }
        }
        
        # Si des modifications ont été apportées, écrire le fichier
        if ($modified) {
            $totalFixed++
            $newLines | Out-File -Path $fullPath -Encoding UTF8
            Write-Host "  Fichier corrigé: $relativePath"
        }
    }
}

# Résumé
"`n## Résumé" | Out-File -FilePath $outputReport -Append
"- Fichiers analysés : $totalFiles" | Out-File -FilePath $outputReport -Append
"- Fichiers corrigés : $totalFixed" | Out-File -FilePath $outputReport -Append
"- Sauvegardes créées dans : $backupDir" | Out-File -FilePath $outputReport -Append

Write-Host "Traitement terminé."
Write-Host "- Fichiers analysés : $totalFiles"
Write-Host "- Fichiers corrigés : $totalFixed"
Write-Host "- Rapport généré : $outputReport"
Write-Host "- Sauvegardes créées dans : $backupDir"
