const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const wifi = require('node-wifi');
const path = require('path');
const WiFiOptimizer = require('./optimization');
const RealWiFiScanner = require('./real-wifi-scanner');
const SimpleWiFiScanner = require('./simple-wifi-scanner');
const NoSudoWiFiScanner = require('./no-sudo-scanner');
const RealNoSudoWiFiScanner = require('./real-no-sudo-scanner');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialiser WiFi
wifi.init({
    iface: null // Utilise l'interface par défaut
});



// Routes API
app.get('/api/networks', async (req, res) => {
    try {
        let networks;

        // Essayer de scanner les VRAIS réseaux WiFi sans sudo
        try {
            const scanner = new RealNoSudoWiFiScanner();
            networks = await scanner.scanNetworks();

            // Retourner les réseaux sans blocage
            networks = networks.map(network => ({
                ...network
            }));

            console.log(`Scan WiFi RÉEL sans sudo: ${networks.length} réseaux détectés`);
        } catch (realScanError) {
            console.log('Fallback vers données de test:', realScanError.message);

            // Fallback vers les données de test
            const testNetworks = require('./test-networks');
            networks = testNetworks.map(network => ({
                ...network
            }));
        }

        res.json(networks);
    } catch (error) {
        console.error('Erreur lors du scan:', error);
        res.status(500).json({ error: 'Erreur lors du scan des réseaux' });
    }
});



// Endpoint d'optimisation WiFi
app.get('/api/optimization', async (req, res) => {
    try {
        const optimizer = new WiFiOptimizer();
        const report = await optimizer.generateOptimizationReport();
        res.json(report);
    } catch (error) {
        console.error('Erreur lors de l\'optimisation:', error);
        res.status(500).json({ error: 'Erreur lors de l\'optimisation' });
    }
});

// Fonction pour scanner périodiquement
async function scanNetworks() {
    try {
        let networks;

        // Essayer de scanner les VRAIS réseaux WiFi sans sudo
        try {
            const scanner = new RealNoSudoWiFiScanner();
            networks = await scanner.scanNetworks();

            // Retourner les réseaux sans blocage
            networks = networks.map(network => ({
                ...network
            }));

            console.log(`Scan automatique RÉEL sans sudo: ${networks.length} réseaux détectés`);
        } catch (realScanError) {
            console.log('Fallback vers données de test pour scan automatique');

            // Fallback vers les données de test
            const testNetworks = require('./test-networks');
            networks = testNetworks.map(network => ({
                ...network
            }));
        }

        io.emit('networks-updated', networks);
    } catch (error) {
        console.error('Erreur lors du scan automatique:', error);
    }
}

// Socket.IO pour les mises à jour en temps réel
io.on('connection', (socket) => {
    console.log('🔌 Client connecté - Socket ID:', socket.id);

    socket.on('request-scan', async () => {
        console.log('📡 Événement request-scan reçu du client - Socket ID:', socket.id);
        await scanNetworks();
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client déconnecté - Socket ID:', socket.id);
    });
});

// Scan automatique toutes les 30 secondes
setInterval(scanNetworks, 30000);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
}); 