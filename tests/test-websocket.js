const io = require('socket.io-client');

async function testWebSocket() {
    console.log('🧪 Test de connexion WebSocket...');

    const socket = io('http://localhost:5001', {
        transports: ['websocket', 'polling'],
        timeout: 10000
    });

    socket.on('connect', () => {
        console.log('✅ WebSocket connecté:', socket.id);

        // Tester le scan en temps réel
        console.log('🔄 Test du scan en temps réel...');
        socket.emit('start-real-time-scan');

        setTimeout(() => {
            console.log('🛑 Arrêt du scan en temps réel...');
            socket.emit('stop-real-time-scan');
            socket.disconnect();
        }, 10000);
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Erreur de connexion WebSocket:', error);
    });

    socket.on('real-time-scan-status', (status) => {
        console.log('📡 Statut du scan en temps réel:', status);
    });

    socket.on('networks-updated', (networks) => {
        console.log(`📡 Réseaux mis à jour: ${networks.length} réseaux`);
    });

    socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket déconnecté:', reason);
    });

    // Timeout après 15 secondes
    setTimeout(() => {
        console.log('⏰ Timeout du test');
        socket.disconnect();
        process.exit(0);
    }, 15000);
}

testWebSocket().catch(console.error); 