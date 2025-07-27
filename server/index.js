const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const wifi = require('node-wifi');
const path = require('path');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
// Correctif pour les avertissements de dépréciation
require('./utils/deprecation-fix');

const DeviceScanner = require('./device-scanner');
const ImprovedDeviceScanner = require('./improved-device-scanner');
const MistralAIService = require('./mistral-ai-service');
const ManufacturerService = require('./manufacturer-service');
const DataFormatter = require('./utils/data-formatter');
const NetworkDetector = require('./utils/network-detector');

// Import des modules de sécurité
const EnvironmentValidator = require('./config/environment');
const { customCorsMiddleware, securityHeaders, validateHttpMethod, requestSizeLimit, validateContentType } = require('./config/cors');
const { validateMacAddress, validateMistralParams, validatePayloadSize } = require('./middleware/validation');

require('dotenv').config();

// Validation de l'environnement au démarrage
const config = EnvironmentValidator.getConfig();
EnvironmentValidator.printConfigSummary(config);

const app = express();
const server = http.createServer(app);

// Configuration du trust proxy pour express-rate-limit
app.set('trust proxy', 1);

// Configuration Socket.IO sécurisée
const corsOrigins = config.CORS_ORIGIN.split(',').map(origin => origin.trim());
const io = socketIo(server, {
    cors: {
        origin: corsOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Gestion des événements Socket.IO
io.on('connection', (socket) => {
    console.log('🔌 Client Socket.IO connecté:', socket.id);

    socket.on('start-scan', async (data) => {
        console.log('📡 Démarrage du scan via Socket.IO:', data);
        const { mode, type = 'devices' } = data;

        try {
            if (type === 'networks') {
                // Scan des réseaux WiFi
                console.log('📡 Scan des réseaux WiFi...');
                const networks = await wifi.scan();
                socket.emit('scan-complete', { networks });
            } else {
                // Scan des devices (par défaut)
                console.log(`🔍 Démarrage du scan des devices en mode: ${mode}`);
                console.log(`🔌 Instance io disponible: ${io ? 'OUI' : 'NON'}`);
                console.log(`🔌 Socket ID: ${socket.id}`);

                const scanner = new ImprovedDeviceScanner(io);
                const rawDevices = await scanner.scanConnectedDevices(mode);

                // Formater les données selon le format attendu par le frontend
                const dataFormatter = new DataFormatter();
                const devices = dataFormatter.formatDevices(rawDevices);

                console.log(`✅ Scan terminé: ${devices.length} appareils détectés`);
                socket.emit('scan-complete', { devices });
            }
        } catch (error) {
            console.error('Erreur lors du scan:', error);
            socket.emit('scan-error', { error: error.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client Socket.IO déconnecté:', socket.id);
    });
});

// Configuration du logging sécurisé
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'bonjour-network' },
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

// Configuration du rate limiting - Plus permissif pour le développement
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limite chaque IP à 500 requêtes par fenêtre (augmenté)
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

// Configuration CORS simplifiée pour le développement
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-Client-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Middleware de sécurité (après CORS)
app.use(securityHeaders);
app.use(requestSizeLimit);
app.use(validateContentType);
app.use(express.json({ limit: '1mb' }));

// Appliquer le rate limiting
app.use(limiter);

// Validation des méthodes HTTP (simplifiée)
app.use((req, res, next) => {
    const allowedMethods = ['GET', 'POST', 'OPTIONS'];

    if (!allowedMethods.includes(req.method)) {
        return res.status(405).json({
            error: 'Méthode HTTP non autorisée',
            code: 'METHOD_NOT_ALLOWED',
            allowed: allowedMethods
        });
    }
    next();
});

// Initialiser WiFi
wifi.init({
    iface: null // Utilise l'interface par défaut
});



// Routes API
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/network-info', async (req, res) => {
    try {
        const networkDetector = new NetworkDetector();
        const connectionInfo = await networkDetector.detectConnectionType();

        res.json({
            connectionType: connectionInfo.connectionType,
            activeInterface: connectionInfo.activeInterface,
            wifiInterfaces: connectionInfo.wifiInterfaces,
            ethernetInterfaces: connectionInfo.ethernetInterfaces,
            canScanWifi: connectionInfo.canScanWifi,
            canScanEthernet: connectionInfo.canScanEthernet,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur lors de l\'obtention des infos réseau:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/networks', async (req, res) => {
    try {
        logger.info(`Scan WiFi demandé par IP: ${req.ip}`);
        let networks;

        // Scanner les VRAIS réseaux WiFi extérieurs
        try {
            const RealNoSudoWiFiScanner = require('./real-no-sudo-scanner');
            const scanner = new RealNoSudoWiFiScanner();

            // Scanner les vrais réseaux WiFi
            networks = await scanner.scanNetworks();

            // Formater les réseaux pour correspondre au format attendu
            networks = networks.map(network => ({
                ssid: network.ssid || 'Réseau caché',
                bssid: network.bssid || 'N/A',
                mode: 'infrastructure',
                channel: network.channel || 1,
                frequency: network.frequency || 2412,
                signal_level: network.rssi || -70,
                signalStrength: network.signalStrength || 30, // Ajouté pour la validation
                quality: network.signalStrength || 30,
                security: network.security || 'WPA2',
                security_flags: [network.security || 'WPA2-PSK-CCMP']
            }));

            logger.info(`Scan WiFi RÉEL: ${networks.length} réseaux détectés`);
        } catch (realScanError) {
            logger.warn('Erreur lors du scan WiFi:', realScanError.message);
            networks = [];
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



// Endpoint d'optimisation WiFi (supprimé lors du nettoyage)
// app.get('/api/optimization', async (req, res) => {
//     try {
//         const optimizer = new WiFiOptimizer();
//         const report = await optimizer.generateOptimizationReport();
//         res.json(report);
//     } catch (error) {
//         console.error('Erreur lors de l\'optimisation:', error);
//         res.status(500).json({
//             error: process.env.NODE_ENV === 'production'
//                 ? 'Erreur interne du serveur'
//                 : error.message
//         });
//     }
// });

// Endpoint pour scanner les appareils connectés (scan complet par défaut)
app.get('/api/devices', async (req, res) => {
    try {
        // Utiliser le scanner amélioré pour une meilleure cohérence
        const scanner = new ImprovedDeviceScanner(io);
        const rawDevices = await scanner.scanConnectedDevices('complete');

        // Formater les données selon le format attendu par le frontend
        const dataFormatter = new DataFormatter();
        const devices = dataFormatter.formatDevices(rawDevices);

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
        // Utiliser le scanner amélioré pour une meilleure détection
        const scanner = new ImprovedDeviceScanner(io);
        const rawDevices = await scanner.scanConnectedDevices('fast');

        // Formater les données selon le format attendu par le frontend
        const dataFormatter = new DataFormatter();
        const devices = dataFormatter.formatDevices(rawDevices);

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
        // Utiliser le scanner amélioré pour une meilleure cohérence
        const scanner = new ImprovedDeviceScanner(io);
        const rawDevices = await scanner.scanConnectedDevices('complete');

        // Formater les données selon le format attendu par le frontend
        const dataFormatter = new DataFormatter();
        const devices = dataFormatter.formatDevices(rawDevices);

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

// Endpoint de cache pour les compteurs d'appareils (plus rapide)
let deviceCache = { count: 0, lastUpdate: null };
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

app.get('/api/devices/count', async (req, res) => {
    try {
        const now = Date.now();

        // Si le cache est valide, retourner la valeur en cache
        if (deviceCache.lastUpdate && (now - deviceCache.lastUpdate) < CACHE_DURATION) {
            return res.json({ count: deviceCache.count, cached: true });
        }

        // Pour l'instant, retourner une valeur fixe pour éviter les timeouts
        // TODO: Implémenter un vrai scan en arrière-plan
        deviceCache = {
            count: 5, // Valeur temporaire
            lastUpdate: now
        };

        res.json({ count: deviceCache.count, cached: false });
    } catch (error) {
        console.error('Erreur lors du scan des compteurs:', error);
        // En cas d'erreur, retourner la valeur en cache si disponible
        res.json({ count: deviceCache.count || 0, cached: true, error: true });
    }
});

// Endpoint de débogage pour voir les données exactes
app.get('/api/devices/debug', async (req, res) => {
    try {
        console.log('🔍 Endpoint de débogage appelé');

        // Récupérer les données réelles
        const scanner = new ImprovedDeviceScanner(io);
        const rawDevices = await scanner.scanConnectedDevices('fast');

        console.log('📊 Données brutes:', rawDevices.length, 'appareils');

        // Formater avec DataFormatter
        const dataFormatter = new DataFormatter();
        const formattedDevices = dataFormatter.formatDevices(rawDevices);

        console.log('📋 Données formatées:', formattedDevices.length, 'appareils');

        // Log détaillé du premier appareil
        if (formattedDevices.length > 0) {
            const first = formattedDevices[0];
            console.log('📱 Premier appareil formaté:', {
                ip: first.ip,
                manufacturer: first.manufacturer,
                deviceType: first.deviceType,
                manufacturerInfo: first.manufacturerInfo
            });
        }

        res.json({
            rawCount: rawDevices.length,
            formattedCount: formattedDevices.length,
            devices: formattedDevices,
            debug: {
                timestamp: new Date().toISOString(),
                endpoint: '/api/devices/debug'
            }
        });

    } catch (error) {
        console.error('❌ Erreur endpoint debug:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint de test pour les appareils (données de test)
app.get('/api/devices/test', (req, res) => {
    const testDevices = [
        {
            ip: '192.168.1.1',
            mac: 'aa:bb:cc:dd:ee:ff',
            hostname: 'router.local',
            deviceType: 'Router',
            lastSeen: new Date().toISOString(),
            isActive: true,
            manufacturer: 'TP-Link',
            manufacturerInfo: {
                identified: true,
                manufacturer: 'TP-Link',
                confidence: 0.9,
                source: 'test'
            }
        },
        {
            ip: '192.168.1.2',
            mac: '11:22:33:44:55:66',
            hostname: 'iphone.local',
            deviceType: 'Smartphone',
            lastSeen: new Date().toISOString(),
            isActive: true,
            manufacturer: 'Apple',
            manufacturerInfo: {
                identified: true,
                manufacturer: 'Apple',
                confidence: 0.95,
                source: 'test'
            }
        },
        {
            ip: '192.168.1.3',
            mac: 'aa:11:bb:22:cc:33',
            hostname: 'macbook.local',
            deviceType: 'Laptop',
            lastSeen: new Date().toISOString(),
            isActive: true,
            manufacturer: 'Apple',
            manufacturerInfo: {
                identified: true,
                manufacturer: 'Apple',
                confidence: 0.9,
                source: 'test'
            }
        }
    ];

    // Utiliser le DataFormatter pour formater les données de test
    const dataFormatter = new DataFormatter();
    const formattedDevices = dataFormatter.formatDevices(testDevices);

    console.log('🧪 Données de test formatées:', formattedDevices);
    res.json(formattedDevices);
});

// Endpoint pour comparer les deux scanners
app.get('/api/devices/compare', async (req, res) => {
    try {
        const startTime = Date.now();

        // Scanner original (utiliser ImprovedDeviceScanner comme fallback)
        const originalScanner = new ImprovedDeviceScanner(io);
        const originalStart = Date.now();
        const originalDevices = await originalScanner.scanConnectedDevices('fast');
        const originalTime = Date.now() - originalStart;

        // Scanner amélioré
        const improvedScanner = new ImprovedDeviceScanner(io);
        const improvedStart = Date.now();
        const improvedDevices = await improvedScanner.scanConnectedDevices('fast');
        const improvedTime = Date.now() - improvedStart;

        const totalTime = Date.now() - startTime;

        // Analyser la qualité des données
        const originalQuality = analyzeDeviceQuality(originalDevices);
        const improvedQuality = analyzeDeviceQuality(improvedDevices);

        res.json({
            comparison: {
                original: {
                    count: originalDevices.length,
                    time: originalTime,
                    devices: originalDevices,
                    quality: originalQuality
                },
                improved: {
                    count: improvedDevices.length,
                    time: improvedTime,
                    devices: improvedDevices,
                    quality: improvedQuality
                },
                totalTime: totalTime,
                improvements: {
                    qualityScore: improvedQuality.avgQualityScore - originalQuality.avgQualityScore,
                    manufacturerImprovement: improvedQuality.withManufacturer - originalQuality.withManufacturer,
                    hostnameImprovement: improvedQuality.withHostname - originalQuality.withHostname
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de la comparaison des scanners:', error);
        res.status(500).json({
            error: process.env.NODE_ENV === 'production'
                ? 'Erreur interne du serveur'
                : error.message
        });
    }
});

// Fonction pour analyser la qualité des appareils
function analyzeDeviceQuality(devices) {
    const withMac = devices.filter(d => d.mac && d.mac !== 'N/A').length;
    const withHostname = devices.filter(d => d.hostname && d.hostname !== 'Unknown').length;
    const withManufacturer = devices.filter(d => d.manufacturer && d.manufacturer !== 'Unknown Manufacturer').length;
    const withDeviceType = devices.filter(d => d.deviceType && d.deviceType !== 'Unknown').length;

    // Calculer le score qualité moyen
    const qualityScores = devices.map(d => {
        let score = 0;
        if (d.mac && d.mac !== 'N/A') score += 5;
        if (d.hostname && d.hostname !== 'Unknown') score += 3;
        if (d.manufacturer && d.manufacturer !== 'Unknown Manufacturer') score += 2;
        if (d.deviceType && d.deviceType !== 'Unknown') score += 2;
        if (d.manufacturerIdentified) score += 3;
        if (d.qualityScore) score += d.qualityScore;
        return score;
    });

    const avgQualityScore = qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0;

    return {
        total: devices.length,
        withMac,
        withHostname,
        withManufacturer,
        withDeviceType,
        avgQualityScore: Math.round(avgQualityScore * 10) / 10
    };
}

// Endpoint pour scanner avec choix du scanner (original ou amélioré)
app.get('/api/devices/scan/:mode/:scanner', async (req, res) => {
    try {
        const { mode, scanner } = req.params;

        if (!['fast', 'complete'].includes(mode)) {
            return res.status(400).json({ error: 'Mode invalide. Utilisez "fast" ou "complete"' });
        }

        if (!['original', 'improved'].includes(scanner)) {
            return res.status(400).json({ error: 'Scanner invalide. Utilisez "original" ou "improved"' });
        }

        let devices;
        const startTime = Date.now();

        if (scanner === 'original') {
            const deviceScanner = new ImprovedDeviceScanner(io);
            devices = await deviceScanner.scanConnectedDevices(mode);
        } else {
            const improvedScanner = new ImprovedDeviceScanner(io);
            devices = await improvedScanner.scanConnectedDevices(mode);
        }

        const scanTime = Date.now() - startTime;

        res.json({
            devices,
            metadata: {
                mode,
                scanner,
                scanTime,
                deviceCount: devices.length,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error(`Erreur lors du scan ${req.params.mode} avec ${req.params.scanner}:`, error);
        res.status(500).json({
            error: process.env.NODE_ENV === 'production'
                ? 'Erreur interne du serveur'
                : error.message
        });
    }
});

// Endpoint pour tester le scanner amélioré (maintenu pour compatibilité)
app.get('/api/devices/improved', async (req, res) => {
    try {
        const scanner = new ImprovedDeviceScanner(io);
        const devices = await scanner.scanConnectedDevices('fast');
        res.json(devices);
    } catch (error) {
        console.error('Erreur lors du scan amélioré:', error);
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

// État global pour le scan en temps réel
let realTimeScanEnabled = false;
let realTimeScanInterval = null;
let scanCount = 0;
const MAX_SCANS = 5; // Arrêter après 5 scans
const SCAN_TIMEOUT = 300000; // 5 minutes maximum

// Fonction pour scanner périodiquement
async function scanNetworks() {
    // Vérification stricte de l'état
    if (!realTimeScanEnabled || scanCount >= MAX_SCANS) {
        console.log('🛑 Scan automatique désactivé ou limite atteinte, arrêt du scan');
        if (realTimeScanInterval) {
            clearInterval(realTimeScanInterval);
            realTimeScanInterval = null;
        }
        return;
    }

    try {
        console.log(`🔄 Exécution du scan automatique ${scanCount + 1}/${MAX_SCANS}...`);

        let networks;

        // Détecter la plateforme et utiliser la méthode appropriée
        const platform = process.platform;
        console.log(`🖥️ Plateforme détectée: ${platform}`);

        if (platform === 'darwin') {
            // macOS: Utiliser RealNoSudoWiFiScanner (méthode originale qui fonctionne)
            try {
                console.log('🍎 macOS détecté - Utilisation de RealNoSudoWiFiScanner...');
                const RealNoSudoWiFiScanner = require('./real-no-sudo-scanner');
                const scanner = new RealNoSudoWiFiScanner();
                networks = await scanner.scanNetworks();

                // Filtrer et formater les réseaux pour correspondre au format attendu
                networks = networks
                    .filter(network => {
                        // Filtrer les réseaux système et les réseaux avec données incomplètes
                        const isSystemNetwork = ['awdl0', 'p2p', 'direct'].some(sys =>
                            network.ssid && network.ssid.toLowerCase().includes(sys)
                        );
                        const hasValidData = network.ssid && network.ssid.trim() !== '' &&
                            network.ssid !== 'N/A' && network.ssid !== 'Unknown';

                        return !isSystemNetwork && hasValidData;
                    })
                    .map(network => ({
                        ssid: network.ssid || 'Réseau caché',
                        bssid: network.bssid && network.bssid !== 'N/A' ? network.bssid : null,
                        mode: 'infrastructure',
                        channel: network.channel || 1,
                        frequency: network.frequency || 2412,
                        signal_level: network.rssi || -70,
                        signalStrength: network.signalStrength !== null && network.signalStrength !== undefined ? network.signalStrength : 30,
                        quality: network.signalStrength || 30,
                        security: network.security && network.security !== 'Unknown' ? network.security : 'WPA2',
                        security_flags: [network.security && network.security !== 'Unknown' ? network.security : 'WPA2-PSK-CCMP']
                    }));

                logger.info(`Scan WiFi macOS: ${networks.length} réseaux détectés`);
            } catch (macosError) {
                logger.warn('Erreur lors du scan WiFi macOS:', macosError.message);
                networks = [];
            }
        } else {
            // Linux (Raspberry Pi): Utiliser node-wifi
            try {
                console.log('🐧 Linux détecté - Utilisation de node-wifi...');
                networks = await wifi.scan();

                // Formater les réseaux pour correspondre au format attendu
                networks = networks.map(network => ({
                    ssid: network.ssid || 'Réseau caché',
                    bssid: network.bssid || 'N/A',
                    mode: network.mode || 'infrastructure',
                    channel: network.channel || 1,
                    frequency: network.frequency || 2412,
                    signal_level: network.signal_level || -70,
                    signalStrength: network.signalStrength || 30,
                    quality: network.quality || 30,
                    security: network.security || 'WPA2',
                    security_flags: network.security_flags || [network.security || 'WPA2-PSK-CCMP']
                }));

                logger.info(`Scan WiFi Linux: ${networks.length} réseaux détectés`);
            } catch (linuxError) {
                logger.warn('Erreur lors du scan WiFi Linux:', linuxError.message);
                networks = [];
            }
        }

        // Émettre les réseaux mis à jour
        io.emit('networks-updated', networks);
        console.log(`📡 Réseaux émis aux clients: ${networks.length} réseaux`);

        // Incrémenter le compteur de scans
        scanCount++;
        console.log(`📊 Scan ${scanCount}/${MAX_SCANS} terminé`);

        // Arrêter automatiquement après MAX_SCANS scans
        if (scanCount >= MAX_SCANS) {
            console.log(`🛑 Arrêt automatique après ${MAX_SCANS} scans`);
            stopRealTimeScan();
            return;
        }
    } catch (error) {
        console.error('Erreur lors du scan automatique:', error);
    }
}

// Fonction pour démarrer le scan en temps réel
function startRealTimeScan() {
    if (realTimeScanEnabled) {
        console.log('⚠️ Le scan en temps réel est déjà actif');
        return;
    }

    // Nettoyer l'intervalle existant s'il y en a un
    if (realTimeScanInterval) {
        console.log('🧹 Nettoyage de l\'intervalle existant');
        clearInterval(realTimeScanInterval);
        realTimeScanInterval = null;
    }

    realTimeScanEnabled = true;
    scanCount = 0; // Réinitialiser le compteur
    console.log('🔄 Démarrage du scan en temps réel');

    // Scanner immédiatement
    scanNetworks();

    // Puis scanner toutes les 30 secondes
    realTimeScanInterval = setInterval(() => {
        console.log('⏰ Intervalle de scan déclenché');
        // Vérification stricte avant d'exécuter le scan
        if (realTimeScanEnabled && scanCount < MAX_SCANS) {
            scanNetworks();
        } else {
            console.log('🛑 Scan désactivé ou limite atteinte, nettoyage de l\'intervalle');
            if (realTimeScanInterval) {
                clearInterval(realTimeScanInterval);
                realTimeScanInterval = null;
            }
            // Forcer l'arrêt si nécessaire
            if (realTimeScanEnabled) {
                stopRealTimeScan();
            }
        }
    }, 30000);

    // Arrêter automatiquement après SCAN_TIMEOUT
    setTimeout(() => {
        if (realTimeScanEnabled) {
            console.log('🛑 Arrêt automatique après timeout de 5 minutes');
            stopRealTimeScan();
        }
    }, SCAN_TIMEOUT);

    // Notifier tous les clients
    io.emit('real-time-scan-status', { enabled: true });
}

// Fonction pour arrêter le scan en temps réel
function stopRealTimeScan() {
    console.log('🛑 Arrêt du scan en temps réel demandé');

    realTimeScanEnabled = false;
    scanCount = 0; // Réinitialiser le compteur

    if (realTimeScanInterval) {
        console.log('🧹 Nettoyage de l\'intervalle de scan');
        clearInterval(realTimeScanInterval);
        realTimeScanInterval = null;
    }

    // Notifier tous les clients
    io.emit('real-time-scan-status', { enabled: false });
}

// Fonction pour obtenir le statut du scan en temps réel
function getRealTimeScanStatus() {
    // Vérifier la cohérence de l'état
    if (!realTimeScanEnabled && realTimeScanInterval) {
        console.log('⚠️ État incohérent détecté, nettoyage de l\'intervalle');
        clearInterval(realTimeScanInterval);
        realTimeScanInterval = null;
    }

    return {
        enabled: realTimeScanEnabled,
        interval: realTimeScanInterval ? 30000 : null,
        scanCount: scanCount,
        maxScans: MAX_SCANS
    };
}

// Socket.IO pour les mises à jour en temps réel
io.on('connection', (socket) => {
    console.log('🔌 Client connecté - Socket ID:', socket.id);

    // Envoyer le statut actuel du scan en temps réel
    socket.emit('real-time-scan-status', getRealTimeScanStatus());

    socket.on('request-scan', async () => {
        console.log('📡 Événement request-scan reçu du client - Socket ID:', socket.id);
        await scanNetworks();
    });

    socket.on('start-real-time-scan', () => {
        console.log('📡 Démarrage du scan en temps réel demandé par:', socket.id);
        startRealTimeScan();
    });

    socket.on('stop-real-time-scan', () => {
        console.log('📡 Arrêt du scan en temps réel demandé par:', socket.id);
        stopRealTimeScan();
    });

    socket.on('get-real-time-scan-status', () => {
        console.log('📡 Statut du scan en temps réel demandé par:', socket.id);
        // Envoyer le statut seulement si le client n'a pas déjà reçu la réponse
        const status = getRealTimeScanStatus();
        socket.emit('real-time-scan-status', status);
    });

    socket.on('start-scan', async (data) => {
        console.log('📡 Événement start-scan reçu du client - Socket ID:', socket.id, 'Mode:', data.mode);
        try {
            const scanner = new ImprovedDeviceScanner(io);
            const devices = await scanner.scanConnectedDevices(data.mode);

            // L'événement scan-complete est envoyé automatiquement par ImprovedDeviceScanner
            console.log(`✅ Scan ${data.mode} terminé: ${devices.length} appareils détectés`);
        } catch (error) {
            console.error('❌ Erreur lors du scan:', error);
            // L'événement scan-error est envoyé automatiquement par ImprovedDeviceScanner
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