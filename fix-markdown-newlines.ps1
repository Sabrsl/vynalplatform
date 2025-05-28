# Script pour ajouter une ligne vide à la fin des fichiers Markdown
# Ce script corrige l'avertissement "Warn when a line feed at the end of a file is missing" de Remark-lint

$mdFiles = Get-ChildItem -Path "src" -Recurse -Filter "*.md"

foreach ($file in $mdFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Vérifier si le fichier se termine déjà par une ligne vide
    if ($content -and -not $content.EndsWith("`n")) {
        # Ajouter une ligne vide à la fin du fichier
        Add-Content -Path $file.FullName -Value ""
        Write-Host "Ligne vide ajoutée à : $($file.FullName)"
    } else {
        Write-Host "Le fichier a déjà une ligne vide à la fin : $($file.FullName)"
    }
}

Write-Host "Terminé. Tous les fichiers Markdown ont maintenant une ligne vide à la fin." 