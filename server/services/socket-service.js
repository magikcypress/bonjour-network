const logger = require('../utils/logger');
const DeviceScanner = require('../device-scanner');
const ImprovedDeviceScanner = require('../improved-device-scanner');
const { validateScanMode } = require('../middleware/validation');

class SocketService {
    constructor(io) {
        this.io = io;
        this.activeScans = new Map();
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            logger.info(`🔌 Client Socket.IO connecté: ${socket.id}`);

            // Authentification et validation
            this.handleConnection(socket);

            // Gestion des événements de scan
            socket.on('start-scan', (data) => this.handleStartScan(socket, data));
            socket.on('cancel-scan', () => this.handleCancelScan(socket));
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    handleConnection(socket) {
        // Validation de l'origine de la connexion
        const origin = socket.handshake.headers.origin;
        if (!this.isValidOrigin(origin)) {
            logger.warn(`❌ Connexion rejetée depuis une origine invalide: ${origin}`);
            socket.disconnect();
            return;
        }

        // Limiter le nombre de connexions par IP
        const clientIp = socket.handshake.address;
        const connectionsFromIp = this.getConnectionsFromIp(clientIp);
        if (connectionsFromIp > 5) {
            logger.warn(`❌ Trop de connexions depuis l'IP: ${clientIp}`);
            socket.disconnect();
            return;
        }

        logger.info(`✅ Connexion validée pour ${socket.id} depuis ${clientIp}`);
    }

    async handleStartScan(socket, data) {
        try {
            // Validation des données
            const { mode } = data;
            if (!validateScanMode(mode)) {
                socket.emit('scan-error', {
                    error: 'Mode de scan invalide',
                    code: 'INVALID_SCAN_MODE'
                });
                return;
            }

            // Vérifier si un scan est déjà en cours
            if (this.activeScans.has(socket.id)) {
                socket.emit('scan-error', {
                    error: 'Un scan est déjà en cours',
                    code: 'SCAN_IN_PROGRESS'
                });
                return;
            }

            logger.info(`📡 Démarrage du scan ${mode} pour ${socket.id}`);

            // Marquer le scan comme actif
            this.activeScans.set(socket.id, { mode, startTime: Date.now() });

            let devices;
            if (mode === 'fast') {
                devices = await this.performFastScan(socket);
            } else {
                devices = await this.performCompleteScan(socket);
            }

            // Nettoyer le scan actif
            this.activeScans.delete(socket.id);

            // Valider et formater les données
            const validatedDevices = this.validateAndFormatDevices(devices);

            socket.emit('scan-complete', {
                devices: validatedDevices,
                scanMode: mode,
                deviceCount: validatedDevices.length
            });

            logger.info(`✅ Scan ${mode} terminé pour ${socket.id}: ${validatedDevices.length} appareils`);

        } catch (error) {
            logger.error(`❌ Erreur lors du scan pour ${socket.id}:`, error);
            this.activeScans.delete(socket.id);
            socket.emit('scan-error', {
                error: error.message,
                code: 'SCAN_ERROR'
            });
        }
    }

    async performFastScan(socket) {
        // Données de test sécurisées pour le mode rapide
        const testDevices = [
            {
                ip: '192.168.1.1',
                mac: 'aa:bb:cc:dd:ee:ff',
                hostname: 'router.local',
                deviceType: 'Router',
                lastSeen: new Date().toISOString(),
                isActive: true,
                isLocal: false,
                manufacturerInfo: {
                    identified: true,
                    manufacturer: 'TP-Link',
                    confidence: 0.95,
                    source: 'local'
                },
                discoveredBy: 'arp',
                source: 'test',
                security: 'WPA2'
            },
            {
                ip: '192.168.1.2',
                mac: '11:22:33:44:55:66',
                hostname: 'iphone.local',
                deviceType: 'Smartphone',
                lastSeen: new Date().toISOString(),
                isActive: true,
                isLocal: false,
                manufacturerInfo: {
                    identified: true,
                    manufacturer: 'Apple',
                    confidence: 0.98,
                    source: 'local'
                },
                discoveredBy: 'netstat',
                source: 'test',
                security: 'WPA3'
            },
            {
                ip: '192.168.1.3',
                mac: 'aa:11:bb:22:cc:33',
                hostname: 'macbook.local',
                deviceType: 'Laptop',
                lastSeen: new Date().toISOString(),
                isActive: true,
                isLocal: true,
                manufacturerInfo: {
                    identified: true,
                    manufacturer: 'Apple',
                    confidence: 0.92,
                    source: 'local'
                },
                discoveredBy: 'ifconfig',
                source: 'test',
                security: 'WPA2'
            }
        ];

        // Simuler le temps de scan avec progression
        await this.simulateScanProgress(socket, 'fast');

        return testDevices;
    }

    async performCompleteScan(socket) {
        try {
            const scanner = new ImprovedDeviceScanner(this.io);
            return await scanner.scanConnectedDevices('complete');
        } catch (error) {
            logger.error('Erreur lors du scan complet:', error);
            throw new Error('Échec du scan complet');
        }
    }

    async simulateScanProgress(socket, mode) {
        const steps = mode === 'fast' ? 3 : 7;
        const stepTime = mode === 'fast' ? 500 : 2000;

        for (let i = 0; i < steps; i++) {
            await new Promise(resolve => setTimeout(resolve, stepTime));
            socket.emit('scan-progress', {
                step: `step_${i + 1}`,
                progress: ((i + 1) / steps) * 100,
                message: `Étape ${i + 1}/${steps}`
            });
        }
    }

    validateAndFormatDevices(devices) {
        if (!Array.isArray(devices)) {
            logger.warn('❌ Les données reçues ne sont pas un tableau');
            return [];
        }

        return devices.map(device => {
            // Validation et nettoyage des données
            const validatedDevice = {
                ip: this.sanitizeIp(device.ip),
                mac: this.sanitizeMac(device.mac),
                hostname: this.sanitizeHostname(device.hostname),
                deviceType: this.sanitizeDeviceType(device.deviceType),
                lastSeen: device.lastSeen || new Date().toISOString(),
                isActive: Boolean(device.isActive),
                isLocal: Boolean(device.isLocal),
                manufacturerInfo: this.validateManufacturerInfo(device.manufacturerInfo),
                discoveredBy: this.sanitizeString(device.discoveredBy),
                source: this.sanitizeString(device.source),
                security: this.sanitizeString(device.security)
            };

            return validatedDevice;
        }).filter(device => device.ip && device.mac); // Filtrer les appareils invalides
    }

    sanitizeIp(ip) {
        if (!ip || typeof ip !== 'string') return null;
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip) ? ip : null;
    }

    sanitizeMac(mac) {
        if (!mac || typeof mac !== 'string') return null;
        const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        return macRegex.test(mac) ? mac.toLowerCase() : null;
    }

    sanitizeHostname(hostname) {
        if (!hostname || typeof hostname !== 'string') return 'Unknown';
        return hostname.length > 50 ? hostname.substring(0, 50) : hostname;
    }

    sanitizeDeviceType(deviceType) {
        if (!deviceType || typeof deviceType !== 'string') return 'Unknown';
        const validTypes = ['Router', 'Smartphone', 'Laptop', 'Desktop', 'Tablet', 'IoT', 'Unknown'];
        return validTypes.includes(deviceType) ? deviceType : 'Unknown';
    }

    validateManufacturerInfo(manufacturerInfo) {
        if (!manufacturerInfo || typeof manufacturerInfo !== 'object') {
            return {
                identified: false,
                manufacturer: 'Unknown',
                confidence: 0,
                source: 'unknown'
            };
        }

        return {
            identified: Boolean(manufacturerInfo.identified),
            manufacturer: this.sanitizeString(manufacturerInfo.manufacturer) || 'Unknown',
            confidence: Math.max(0, Math.min(1, Number(manufacturerInfo.confidence) || 0)),
            source: this.sanitizeString(manufacturerInfo.source) || 'unknown'
        };
    }

    sanitizeString(str) {
        if (!str || typeof str !== 'string') return null;
        return str.length > 100 ? str.substring(0, 100) : str;
    }

    handleCancelScan(socket) {
        if (this.activeScans.has(socket.id)) {
            this.activeScans.delete(socket.id);
            logger.info(`🚫 Scan annulé pour ${socket.id}`);
            socket.emit('scan-cancelled');
        }
    }

    handleDisconnect(socket) {
        // Nettoyer les scans actifs
        if (this.activeScans.has(socket.id)) {
            this.activeScans.delete(socket.id);
            logger.info(`🧹 Nettoyage du scan pour ${socket.id}`);
        }
        logger.info(`🔌 Client Socket.IO déconnecté: ${socket.id}`);
    }

    isValidOrigin(origin) {
        if (!origin) return false;
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
        return allowedOrigins.some(allowed => origin.startsWith(allowed.trim()));
    }

    getConnectionsFromIp(ip) {
        let count = 0;
        this.io.sockets.sockets.forEach(socket => {
            if (socket.handshake.address === ip) count++;
        });
        return count;
    }

    getActiveScansCount() {
        return this.activeScans.size;
    }

    getStats() {
        return {
            activeConnections: this.io.sockets.sockets.size,
            activeScans: this.activeScans.size,
            uptime: process.uptime()
        };
    }
}

module.exports = SocketService; 