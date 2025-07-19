const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const wifi = require('node-wifi');
const path = require('path');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const WiFiOptimizer = require('./optimization');
const RealWiFiScanner = require('./real-wifi-scanner');
const SimpleWiFiScanner = require('./simple-wifi-scanner');
const NoSudoWiFiScanner = require('./no-sudo-scanner');
const RealNoSudoWiFiScanner = require('./real-no-sudo-scanner');
const DeviceScanner = require('./device-scanner');
const MistralAIService = require('./mistral-ai-service');
const ManufacturerService = require('./manufacturer-service');

// Import des modules de sécurité
const EnvironmentValidator = require('./config/environment');
const { customCorsMiddleware, securityHeaders, validateHttpMethod, requestSizeLimit, validateContentType } = require('./config/cors');
const { validateMacAddress, validateMistralParams, validatePayloadSize } = require('./middleware/validation');
const CommandValidator = require('./security/command-validator');

require('dotenv').config();

// Validation de l'environnement au démarrage
const config = EnvironmentValidator.getConfig();
EnvironmentValidator.printConfigSummary(config);

const app = express();
const server = http.createServer(app);

// Configuration Socket.IO sécurisée
const corsOrigins = config.CORS_ORIGIN.split(',').map(origin => origin.trim());
const io = socketIo(server, {
    cors: {
        origin: corsOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Configuration du logging sécurisé
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'wifi-tracker' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

// Ajouter le transport console en développement
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Configuration du rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes par fenêtre
    message: {
        error: 'Trop de requêtes depuis cette IP',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit dépassé pour IP: ${req.ip}`);
        res.status(429).json({
            error: 'Trop de requêtes depuis cette IP',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: '15 minutes'
        });
    }
});

// Middleware de sécurité
app.use(customCorsMiddleware);
app.use(securityHeaders);
app.use(validateHttpMethod);
app.use(requestSizeLimit);
app.use(validateContentType);
app.use(express.json({ limit: '1mb' }));

// Appliquer le rate limiting
app.use(limiter);

// Initialiser WiFi
wifi.init({
    iface: null // Utilise l'interface par défaut
});



// Routes API
app.get('/api/networks', async (req, res) => {
    try {
        logger.info(`Scan WiFi demandé par IP: ${req.ip}`);
        let networks;

        // Essayer de scanner les VRAIS réseaux WiFi sans sudo
        try {
            const scanner = new RealNoSudoWiFiScanner();
            networks = await scanner.scanNetworks();

            // Retourner les réseaux sans blocage
            networks = networks.map(network => ({
                ...network
            }));

            logger.info(`Scan WiFi RÉEL sans sudo: ${networks.length} réseaux détectés`);
        } catch (realScanError) {
            logger.warn('Fallback vers données de test:', realScanError.message);

            // Fallback vers les données de test
            const testNetworks = require('./test-networks');
            networks = testNetworks.map(network => ({
                ...network
            }));
        }

        res.json(networks);
    } catch (error) {
        logger.error('Erreur lors du scan WiFi:', error);
        res.status(500).json({
            error: process.env.NODE_ENV === 'production'
                ? 'Erreur interne du serveur'
                : error.message
        });
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
        res.status(500).json({
            error: process.env.NODE_ENV === 'production'
                ? 'Erreur interne du serveur'
                : error.message
        });
    }
});

// Endpoint pour scanner les appareils connectés (scan complet par défaut)
app.get('/api/devices', async (req, res) => {
    try {
        const scanner = new DeviceScanner(io);
        const devices = await scanner.scanConnectedDevicesComplete();
        res.json(devices);
    } catch (error) {
        console.error('Erreur lors du scan des appareils:', error);
        res.status(500).json({
            error: process.env.NODE_ENV === 'production'
                ? 'Erreur interne du serveur'
                : error.message
        });
    }
});

// Endpoint pour scanner les appareils connectés (scan rapide)
app.get('/api/devices/fast', async (req, res) => {
    try {
        const scanner = new DeviceScanner(io);
        const devices = await scanner.scanConnectedDevicesFast();
        res.json(devices);
    } catch (error) {
        console.error('Erreur lors du scan rapide des appareils:', error);
        res.status(500).json({
            error: process.env.NODE_ENV === 'production'
                ? 'Erreur interne du serveur'
                : error.message
        });
    }
});

// Endpoint pour scanner les appareils connectés (scan complet)
app.get('/api/devices/complete', async (req, res) => {
    try {
        const scanner = new DeviceScanner(io);
        const devices = await scanner.scanConnectedDevicesComplete();
        res.json(devices);
    } catch (error) {
        console.error('Erreur lors du scan complet des appareils:', error);
        res.status(500).json({
            error: process.env.NODE_ENV === 'production'
                ? 'Erreur interne du serveur'
                : error.message
        });
    }
});

// Endpoint pour identifier un appareil avec Mistral AI
app.post('/api/devices/identify', validateMacAddress, async (req, res) => {
    try {
        const { mac } = req.body;

        const mistralService = new MistralAIService();
        const identification = await mistralService.identifyDevice(mac);
        res.json(identification);
    } catch (error) {
        console.error('Erreur lors de l\'identification avec Mistral AI:', error);
        res.status(500).json({
            error: process.env.NODE_ENV === 'production'
                ? 'Erreur interne du serveur'
                : error.message
        });
    }
});

// Endpoint pour identifier tous les appareils en lot
app.post('/api/devices/identify-batch', validateMistralParams, async (req, res) => {
    try {
        const { devices } = req.body;

        const mistralService = new MistralAIService();
        const identifiedDevices = await mistralService.batchIdentify(devices);
        res.json(identifiedDevices);
    } catch (error) {
        console.error('Erreur lors de l\'identification en lot:', error);
        res.status(500).json({
            error: process.env.NODE_ENV === 'production'
                ? 'Erreur interne du serveur'
                : error.message
        });
    }
});

// Initialiser le service des fabricants
const manufacturerService = new ManufacturerService();
manufacturerService.loadManufacturers();

// Endpoint pour obtenir les statistiques des fabricants
app.get('/api/manufacturers/stats', async (req, res) => {
    try {
        const stats = manufacturerService.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Endpoint pour lister tous les fabricants
app.get('/api/manufacturers', async (req, res) => {
    try {
        const manufacturers = manufacturerService.getAllManufacturers();
        res.json(manufacturers);
    } catch (error) {
        console.error('Erreur lors de la récupération des fabricants:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Endpoint pour rechercher par fabricant
app.get('/api/manufacturers/search/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const results = manufacturerService.searchByManufacturer(name);
        res.json(results);
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Endpoint pour identifier un fabricant spécifique
app.post('/api/manufacturers/identify', async (req, res) => {
    try {
        const { mac } = req.body;
        if (!mac) {
            return res.status(400).json({ error: 'Adresse MAC requise' });
        }

        const result = await manufacturerService.identifyManufacturer(mac);
        res.json(result);
    } catch (error) {
        console.error('Erreur lors de l\'identification:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Endpoint pour exporter en CSV
app.get('/api/manufacturers/export', async (req, res) => {
    try {
        const csv = manufacturerService.exportToCSV();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=manufacturers.csv');
        res.send(csv);
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
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

    socket.on('start-scan', async (data) => {
        console.log('📡 Événement start-scan reçu du client - Socket ID:', socket.id, 'Mode:', data.mode);
        try {
            const scanner = new DeviceScanner(io);
            const devices = await scanner.scanConnectedDevices(data.mode);

            // L'événement scan-complete est envoyé automatiquement par DeviceScanner
            console.log(`✅ Scan ${data.mode} terminé: ${devices.length} appareils détectés`);
        } catch (error) {
            console.error('❌ Erreur lors du scan:', error);
            // L'événement scan-error est envoyé automatiquement par DeviceScanner
        }
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client déconnecté - Socket ID:', socket.id);
    });
});

// Scan automatique désactivé pour éviter les logs en boucle
// setInterval(scanNetworks, 30000);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
}); 