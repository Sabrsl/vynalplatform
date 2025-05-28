# Script pour détecter et commenter les imports et éléments inutilisés dans les fichiers TypeScript
# Ce script parcourt le code pour trouver les imports qui ne sont pas utilisés ailleurs dans le fichier

# Configuration
$sourceDir = "src"
$outputReport = "unused-elements-report.md"
$backupDir = "backup-ts-files-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Créer le répertoire de sauvegarde
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

# Initialiser le rapport
"# Rapport d'éléments inutilisés dans le code TypeScript" | Out-File $outputReport
"*Généré le $(Get-Date)*`n" | Out-File $outputReport -Append
"Ce rapport liste les éléments inutilisés qui ont été commentés dans le code.\n" | Out-File $outputReport -Append

# Statistiques
$totalFixed = 0
$totalProblems = 0
$processedFiles = @{}

# Rechercher manuellement les fichiers spécifiés dans les problèmes
$problemFiles = @(
    # Chercher les chemins complets en fonction des informations partielles
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*useMessagingStore.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*useNotificationStore.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*admin.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*systemStatusService.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*servicesRefreshService.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*audit.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*queryBuilder.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*optimizations.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*safeCache.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*invalidation.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*index.ts" -Filter "*optimization*" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*freelance-cache.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*forbidden-words.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*image-processor.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*email.ts" -ErrorAction SilentlyContinue),
    (Get-ChildItem -Path $sourceDir -Recurse -Include "*use-vynal-payment.ts" -ErrorAction SilentlyContinue)
)

Write-Host "Recherche des fichiers problématiques..."

# Traiter chaque fichier
foreach ($fileSet in $problemFiles) {
    foreach ($file in $fileSet) {
        if ($null -eq $file) { continue }
        
        $fullPath = $file.FullName
        if ($processedFiles.ContainsKey($fullPath)) { continue }
        
        $processedFiles[$fullPath] = $true
        $relativePath = $fullPath.Substring((Get-Location).Path.Length + 1)
        
        Write-Host "Traitement de $relativePath"
        
        # Faire une sauvegarde du fichier
        $backupFile = Join-Path -Path $backupDir -ChildPath $file.Name
        Copy-Item -Path $fullPath -Destination $backupFile -Force
        
        # Lire le contenu du fichier
        $content = Get-Content -Path $fullPath -Raw
        $lines = Get-Content -Path $fullPath
        $modified = $false
        $fileProblems = 0
        
        # Nouvelle version du fichier
        $newContent = @()
        
        # Parcourir chaque ligne du fichier
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            $lineNumber = $i + 1
            
            # Vérifier s'il s'agit d'une ligne d'import
            if ($line -match 'import\s+\{([^}]+)\}\s+from\s+[''"]([^''"]*)[''"]\s*;?') {
                $importList = $Matches[1]
                $importSource = $Matches[2]
                
                # Séparer les imports
                $imports = $importList -split "," | ForEach-Object { $_.Trim() }
                $unusedImports = @()
                
                # Vérifier chaque import
                foreach ($import in $imports) {
                    # Extraire le nom de l'import (sans alias)
                    $importName = $import
                    if ($import -match '(.*?)\s+as\s+') {
                        $importName = $Matches[1].Trim()
                    }
                    
                    # Vérifier si l'import est utilisé ailleurs dans le fichier
                    $pattern = "\b$([regex]::Escape($importName))\b"
                    $contentWithoutImport = $content -replace $line, ""
                    $usageCount = [regex]::Matches($contentWithoutImport, $pattern).Count
                    
                    # Si l'import n'est pas utilisé, l'ajouter à la liste
                    if ($usageCount -eq 0) {
                        $unusedImports += $importName
                    }
                }
                
                # Si des imports inutilisés ont été trouvés
                if ($unusedImports.Count -gt 0) {
                    $modified = $true
                    $fileProblems += $unusedImports.Count
                    $totalProblems += $unusedImports.Count
                    
                    # Ajouter au rapport
                    if ($fileProblems -eq $unusedImports.Count) { # Premier problème trouvé dans ce fichier
                        "`n## $relativePath" | Out-File $outputReport -Append
                    }
                    
                    foreach ($unusedImport in $unusedImports) {
                        "- Ligne $lineNumber : Import inutilisé `"$unusedImport`" de `"$importSource`"" | Out-File $outputReport -Append
                    }
                    
                    # Commenter la ligne
                    $newContent += "// $line // Imports inutilisés: $($unusedImports -join ', ')"
                } else {
                    $newContent += $line
                }
            } else {
                $newContent += $line
            }
        }
        
        # Si des modifications ont été apportées, écrire le fichier
        if ($modified) {
            $totalFixed++
            Set-Content -Path $fullPath -Value $newContent -Encoding UTF8
            Write-Host "  $fileProblems imports inutilisés trouvés et commentés"
        } else {
            Write-Host "  Aucun import inutilisé trouvé"
        }
    }
}

# Résumé
"`n## Résumé" | Out-File $outputReport -Append
"- Fichiers corrigés : $totalFixed" | Out-File $outputReport -Append
"- Éléments inutilisés commentés : $totalProblems" | Out-File $outputReport -Append
"- Sauvegardes créées dans : $backupDir" | Out-File $outputReport -Append

Write-Host "Traitement terminé."
Write-Host "- Fichiers corrigés : $totalFixed"
Write-Host "- Éléments inutilisés commentés : $totalProblems"
Write-Host "- Rapport généré : $outputReport"
Write-Host "- Sauvegardes créées dans : $backupDir" 