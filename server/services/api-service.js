const logger = require('../utils/logger');
const ImprovedDeviceScanner = require('../improved-device-scanner');
const { validateMacAddress, validateMistralParams, validatePayloadSize } = require('../middleware/validation');

class ApiService {
    constructor() {
        this.deviceCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Endpoint de santé
    async healthCheck(req, res) {
        try {
            const healthData = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0'
            };

            logger.info(`🏥 Health check depuis ${req.ip}`);
            res.json(healthData);
        } catch (error) {
            logger.errorWithContext(error, { endpoint: '/health', ip: req.ip });
            res.status(500).json({
                error: 'Erreur lors du health check',
                code: 'HEALTH_CHECK_ERROR'
            });
        }
    }

    // Endpoint de scan WiFi
    async scanNetworks(req, res) {
        try {
            logger.scan('info', `Scan WiFi demandé par IP: ${req.ip}`);

            let networks;
            try {
                // Utiliser node-wifi directement pour scanner les réseaux
                const wifi = require('node-wifi');
                networks = await wifi.scan();

                // Nettoyer et valider les données
                networks = this.validateAndSanitizeNetworks(networks);

                logger.scan('info', `Scan WiFi réussi: ${networks.length} réseaux détectés`);
            } catch (scanError) {
                logger.warn('Fallback vers données de test:', scanError.message);

                // Fallback vers les données de test
                const testNetworks = require('../test-networks');
                networks = this.validateAndSanitizeNetworks(testNetworks);
            }

            res.json(networks);
        } catch (error) {
            logger.errorWithContext(error, { endpoint: '/networks', ip: req.ip });
            res.status(500).json({
                error: process.env.NODE_ENV === 'production'
                    ? 'Erreur interne du serveur'
                    : error.message,
                code: 'NETWORK_SCAN_ERROR'
            });
        }
    }

    // Endpoint de scan rapide des appareils
    async scanDevicesFast(req, res) {
        try {
            logger.scan('info', `Scan rapide demandé par IP: ${req.ip}`);

            const scanner = new ImprovedDeviceScanner();
            const devices = await scanner.scanConnectedDevices('fast');

            // Valider et formater les données
            const validatedDevices = this.validateAndFormatDevices(devices);

            logger.scan('info', `Scan rapide terminé: ${validatedDevices.length} appareils`);
            res.json(validatedDevices);
        } catch (error) {
            logger.errorWithContext(error, { endpoint: '/devices/fast', ip: req.ip });
            res.status(500).json({
                error: process.env.NODE_ENV === 'production'
                    ? 'Erreur interne du serveur'
                    : error.message,
                code: 'FAST_SCAN_ERROR'
            });
        }
    }

    // Endpoint de scan complet des appareils
    async scanDevicesComplete(req, res) {
        try {
            logger.scan('info', `Scan complet demandé par IP: ${req.ip}`);

            const scanner = new ImprovedDeviceScanner();
            const devices = await scanner.scanConnectedDevices('complete');

            // Valider et formater les données
            const validatedDevices = this.validateAndFormatDevices(devices);

            logger.scan('info', `Scan complet terminé: ${validatedDevices.length} appareils`);
            res.json(validatedDevices);
        } catch (error) {
            logger.errorWithContext(error, { endpoint: '/devices/complete', ip: req.ip });
            res.status(500).json({
                error: process.env.NODE_ENV === 'production'
                    ? 'Erreur interne du serveur'
                    : error.message,
                code: 'COMPLETE_SCAN_ERROR'
            });
        }
    }

    // Endpoint de compteur d'appareils avec cache
    async getDeviceCount(req, res) {
        try {
            const now = Date.now();
            const cacheKey = 'device_count';
            const cached = this.deviceCache.get(cacheKey);

            // Si le cache est valide, retourner la valeur en cache
            if (cached && (now - cached.timestamp) < this.cacheTimeout) {
                logger.performance('info', 'Compteur d\'appareils servi depuis le cache');
                return res.json({
                    count: cached.count,
                    cached: true,
                    timestamp: cached.timestamp
                });
            }

            // Sinon, faire un scan rapide et mettre en cache
            const scanner = new ImprovedDeviceScanner();
            const devices = await scanner.scanConnectedDevices('fast');
            const validatedDevices = this.validateAndFormatDevices(devices);

            const cacheData = {
                count: validatedDevices.length,
                timestamp: now
            };

            this.deviceCache.set(cacheKey, cacheData);

            logger.performance('info', `Compteur d'appareils mis à jour: ${validatedDevices.length}`);
            res.json({
                count: cacheData.count,
                cached: false,
                timestamp: cacheData.timestamp
            });
        } catch (error) {
            logger.errorWithContext(error, { endpoint: '/devices/count', ip: req.ip });

            // En cas d'erreur, retourner la valeur en cache si disponible
            const cached = this.deviceCache.get('device_count');
            res.json({
                count: cached?.count || 0,
                cached: true,
                error: true,
                message: 'Erreur lors du scan, utilisation du cache'
            });
        }
    }

    // Endpoint de test pour les appareils
    async getTestDevices(req, res) {
        try {
            logger.scan('info', `Données de test demandées par IP: ${req.ip}`);

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

            const validatedDevices = this.validateAndFormatDevices(testDevices);
            res.json(validatedDevices);
        } catch (error) {
            logger.errorWithContext(error, { endpoint: '/devices/test', ip: req.ip });
            res.status(500).json({
                error: 'Erreur lors de la récupération des données de test',
                code: 'TEST_DATA_ERROR'
            });
        }
    }

    // Validation et nettoyage des réseaux WiFi
    validateAndSanitizeNetworks(networks) {
        if (!Array.isArray(networks)) {
            logger.warn('❌ Les données de réseaux ne sont pas un tableau');
            return [];
        }

        return networks.map(network => {
            return {
                ssid: this.sanitizeString(network.ssid),
                signalStrength: this.sanitizeNumber(network.signalStrength, 0, 100),
                frequency: this.sanitizeNumber(network.frequency, 0, 100000),
                security: this.sanitizeString(network.security),
                channel: this.sanitizeNumber(network.channel, 1, 165),
                bssid: this.sanitizeMac(network.bssid)
            };
        }).filter(network => network.ssid && network.bssid);
    }

    // Validation et formatage des appareils
    validateAndFormatDevices(devices) {
        if (!Array.isArray(devices)) {
            logger.warn('❌ Les données d\'appareils ne sont pas un tableau');
            return [];
        }

        return devices.map(device => {
            return {
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
        }).filter(device => device.ip && device.mac);
    }

    // Méthodes de sanitisation
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

    sanitizeString(str) {
        if (!str || typeof str !== 'string') return null;
        return str.length > 100 ? str.substring(0, 100) : str;
    }

    sanitizeNumber(num, min, max) {
        const number = Number(num);
        if (isNaN(number)) return null;
        return Math.max(min, Math.min(max, number));
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

    // Nettoyage du cache
    clearCache() {
        this.deviceCache.clear();
        logger.info('🧹 Cache des appareils nettoyé');
    }

    // Statistiques du service
    getStats() {
        return {
            cacheSize: this.deviceCache.size,
            cacheTimeout: this.cacheTimeout,
            uptime: process.uptime()
        };
    }
}

module.exports = ApiService; 