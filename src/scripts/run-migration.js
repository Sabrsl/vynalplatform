// Script pour exécuter la migration SQL
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Charger les variables d'environnement
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

// Vérifier si les variables d'environnement sont définies
const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ Les variables d'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies",
  );
  process.exit(1);
}

// Chemin vers le fichier de migration
const migrationPath = path.join(__dirname, "add-welcome-email-sent-field.sql");

// Vérifier si le fichier existe
if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Le fichier de migration ${migrationPath} n'existe pas`);
  process.exit(1);
}

// Lire le contenu du fichier SQL
const sqlContent = fs.readFileSync(migrationPath, "utf8");

console.log(
  "📦 Démarrage de la migration pour ajouter le champ welcome_email_sent à la table profiles",
);

try {
  // Utiliser psql pour exécuter la migration
  // Vous pouvez remplacer cette commande par celle qui correspond à votre environnement
  const dbUrl = NEXT_PUBLIC_SUPABASE_URL.replace("https://", "");
  const command = `echo "${sqlContent}" | npx supabase-cli db execute --db-url postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@${dbUrl}:5432/postgres`;

  // Version alternative avec la CLI Supabase
  // const command = `echo "${sqlContent}" | supabase db execute --db-url postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@${dbUrl}:5432/postgres`;

  execSync(command, { stdio: "inherit" });

  console.log("✅ Migration terminée avec succès");
} catch (error) {
  console.error(
    "❌ Erreur lors de l'exécution de la migration:",
    error.message,
  );
  process.exit(1);
}
