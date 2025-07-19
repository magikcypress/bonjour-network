const io = require('socket.io-client');

console.log('🔍 Test du Socket.IO...');

const socket = io('http://localhost:5001');

socket.on('connect', () => {
    console.log('✅ Connecté au serveur Socket.IO');

    // Écouter les mises à jour de réseaux
    socket.on('networks-updated', (networks) => {
        console.log(`📡 Réseaux mis à jour: ${networks.length} réseaux détectés`);
        console.log('Premiers réseaux:', networks.slice(0, 3).map(n => n.ssid));
    });

    // Demander un scan
    console.log('📡 Demande de scan via Socket.IO...');
    socket.emit('request-scan');

    // Attendre 5 secondes puis se déconnecter
    setTimeout(() => {
        console.log('🔌 Déconnexion...');
        socket.disconnect();
        process.exit(0);
    }, 5000);
});

socket.on('disconnect', () => {
    console.log('❌ Déconnecté du serveur');
});

socket.on('connect_error', (error) => {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
}); 