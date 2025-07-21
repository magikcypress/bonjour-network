#!/usr/bin/env node

/**
 * Test de connexion Socket.IO simple
 * Pour diagnostiquer le problème de connexion
 */

const io = require('socket.io-client');

async function testSocketConnection() {
    console.log('🔍 Test de connexion Socket.IO...');

    const socket = io('http://localhost:5001', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: false
    });

    // Événements de connexion
    socket.on('connect', () => {
        console.log('✅ Socket.IO connecté avec succès !');
        console.log(`🔌 Socket ID: ${socket.id}`);
        console.log(`🌐 URL: http://localhost:5001`);
        console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);

        // Tester un événement simple
        socket.emit('get-real-time-scan-status');
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Erreur de connexion Socket.IO:');
        console.error('   Message:', error.message);
        console.error('   Type:', error.type);
        console.error('   Description:', error.description);
        console.error('   Context:', error.context);
    });

    socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO déconnecté:', reason);
    });

    // Événements de test
    socket.on('real-time-scan-status', (data) => {
        console.log('📡 Événement real-time-scan-status reçu:', data);
    });

    // Timeout pour éviter que le script tourne indéfiniment
    setTimeout(() => {
        console.log('⏰ Timeout atteint, fermeture de la connexion...');
        socket.disconnect();
        process.exit(0);
    }, 5000);
}

// Lancer le test
testSocketConnection().catch(console.error); 