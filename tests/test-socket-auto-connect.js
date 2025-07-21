#!/usr/bin/env node

/**
 * Test de connexion automatique Socket.IO
 * Simule le comportement attendu du hook useDataManager
 */

const io = require('socket.io-client');

async function testAutoConnect() {
    console.log('🔍 Test de connexion automatique Socket.IO...');

    let socket = null;
    let isConnected = false;

    // Simuler la connexion automatique
    const connectSocket = () => {
        return new Promise((resolve, reject) => {
            console.log('🔌 Tentative de connexion automatique...');

            socket = io('http://localhost:5001', {
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnection: true,
                reconnectionAttempts: 3,
                reconnectionDelay: 1000
            });

            socket.on('connect', () => {
                console.log('✅ Socket.IO connecté automatiquement !');
                console.log(`🔌 Socket ID: ${socket.id}`);
                isConnected = true;
                resolve(socket);
            });

            socket.on('connect_error', (error) => {
                console.error('❌ Erreur de connexion automatique:', error.message);
                isConnected = false;
                reject(error);
            });

            socket.on('disconnect', (reason) => {
                console.log('🔌 Socket.IO déconnecté:', reason);
                isConnected = false;
            });
        });
    };

    // Simuler le changement d'onglet vers "devices"
    console.log('📱 Simulation du changement vers l\'onglet "devices"...');

    try {
        await connectSocket();

        // Vérifier l'état de connexion
        console.log(`📊 État de connexion: ${isConnected ? 'CONNECTÉ' : 'DÉCONNECTÉ'}`);

        // Tester un événement
        socket.emit('get-real-time-scan-status');

        // Attendre la réponse
        socket.on('real-time-scan-status', (data) => {
            console.log('📡 Événement reçu:', data);
        });

    } catch (error) {
        console.error('❌ Échec de la connexion automatique:', error);
    }

    // Timeout
    setTimeout(() => {
        console.log('⏰ Fin du test...');
        if (socket) {
            socket.disconnect();
        }
        process.exit(0);
    }, 3000);
}

testAutoConnect().catch(console.error); 