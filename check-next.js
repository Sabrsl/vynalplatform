// Script de vérification pour Next.js
const { spawn } = require('child_process');
const http = require('http');

console.log('Démarrage du serveur Next.js...');

const nextProcess = spawn('npx', ['next', 'dev', '-p', '3002'], {
  stdio: 'inherit',
  shell: true
});

// Attendre que le serveur démarre
setTimeout(() => {
  console.log('Vérification si le serveur répond...');
  
  http.get('http://localhost:3002', (res) => {
    console.log(`Statut de la réponse: ${res.statusCode}`);
    console.log('Le serveur Next.js fonctionne correctement!');
    
    // Arrêter le processus après vérification
    nextProcess.kill();
    process.exit(0);
  }).on('error', (err) => {
    console.error('Erreur lors de la connexion au serveur Next.js:', err.message);
    console.log('Vérifiez les logs ci-dessus pour les erreurs potentielles.');
    
    // Arrêter le processus après vérification
    nextProcess.kill();
    process.exit(1);
  });
}, 10000); // Attendre 10 secondes pour le démarrage

// Gérer les erreurs du processus Next.js
nextProcess.on('error', (err) => {
  console.error('Erreur lors du démarrage du serveur Next.js:', err);
  process.exit(1);
}); 