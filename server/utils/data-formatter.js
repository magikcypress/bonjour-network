const logger = require('./logger');

class DataFormatter {
    constructor() {
        this.validDeviceTypes = ['Router', 'Smartphone', 'Laptop', 'Desktop', 'Tablet', 'IoT', 'Unknown'];
        this.validSecurityTypes = ['WPA', 'WPA2', 'WPA3', 'WEP', 'Open', 'Unknown'];
    }

    /**
     * Formate les données d'appareils selon le format attendu par le frontend
     */
    formatDevices(devices) {
        if (!Array.isArray(devices)) {
            logger.warn('❌ Les données reçues ne sont pas un tableau');
            return [];
        }

        return devices.map(device => this.formatDevice(device)).filter(device => device !== null);
    }

    /**
     * Formate un appareil individuel
     */
    formatDevice(device) {
        try {
            // Fusion intelligente des données fabricant
            const manufacturerInfo = this.mergeManufacturerData(device);

            // Validation et nettoyage des données de base
            const formattedDevice = {
                ip: this.sanitizeIp(device.ip),
                mac: this.sanitizeMac(device.mac),
                hostname: this.sanitizeHostname(device.hostname),
                deviceType: this.sanitizeDeviceType(device.deviceType),
                lastSeen: this.sanitizeTimestamp(device.lastSeen),
                isActive: Boolean(device.isActive),
                isLocal: Boolean(device.isLocal),
                manufacturer: manufacturerInfo.manufacturer,
                manufacturerInfo: manufacturerInfo,
                discoveredBy: this.sanitizeString(device.discoveredBy),
                source: this.sanitizeString(device.source),
                security: this.sanitizeSecurity(device.security)
            };

            // Vérifier que l'IP est présente (obligatoire)
            if (!formattedDevice.ip) {
                logger.warn(`❌ Appareil ignoré - IP manquante: ${JSON.stringify(device)}`);
                return null;
            }

            // MAC est optionnelle mais recommandée
            if (!formattedDevice.mac) {
                logger.info(`⚠️ Appareil sans MAC accepté: ${formattedDevice.ip}`);
                formattedDevice.mac = 'N/A';
            }

            return formattedDevice;
        } catch (error) {
            logger.error('❌ Erreur lors du formatage d\'un appareil:', error);
            return null;
        }
    }

    /**
     * Fusion intelligente des données fabricant
     */
    mergeManufacturerData(device) {
        // Priorité 1: Données directes du scanner
        if (device.manufacturer && device.manufacturer !== 'Unknown Manufacturer') {
            return {
                identified: true,
                manufacturer: this.sanitizeString(device.manufacturer),
                confidence: device.manufacturerConfidence || 0.8,
                source: device.manufacturerSource || 'scanner'
            };
        }

        // Priorité 2: Données manufacturerInfo existantes
        if (device.manufacturerInfo && device.manufacturerInfo.identified) {
            return this.formatManufacturerInfo(device.manufacturerInfo);
        }

        // Priorité 3: Valeurs par défaut
        return {
            identified: false,
            manufacturer: 'Unknown',
            confidence: 0,
            source: 'unknown'
        };
    }

    /**
     * Formate les informations du fabricant
     */
    formatManufacturerInfo(manufacturerInfo) {
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
            confidence: this.sanitizeConfidence(manufacturerInfo.confidence),
            source: this.sanitizeString(manufacturerInfo.source) || 'unknown'
        };
    }

    /**
     * Sanitise une adresse IP
     */
    sanitizeIp(ip) {
        if (!ip || typeof ip !== 'string') return null;

        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip) ? ip : null;
    }

    /**
     * Sanitise une adresse MAC
     */
    sanitizeMac(mac) {
        if (!mac || typeof mac !== 'string') return null;

        // Normaliser le format MAC (ajouter les deux-points si nécessaire)
        let normalizedMac = mac.replace(/[.-]/g, ':').toLowerCase();

        // Vérifier le format MAC complète (6 octets)
        const fullMacRegex = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/;
        if (fullMacRegex.test(normalizedMac)) {
            return normalizedMac;
        }

        // Essayer de formater si c'est une chaîne continue de 12 caractères
        if (normalizedMac.length === 12) {
            const formatted = normalizedMac.match(/.{2}/g).join(':');
            return fullMacRegex.test(formatted) ? formatted : null;
        }

        // Accepter les MAC partielles (moins de 6 octets mais format valide)
        const partialMacRegex = /^([0-9a-f]{2}:){1,4}[0-9a-f]{2}$/;
        if (partialMacRegex.test(normalizedMac)) {
            logger.info(`⚠️ MAC partielle acceptée: ${normalizedMac}`);
            return normalizedMac;
        }

        return null;
    }

    /**
     * Sanitise un hostname
     */
    sanitizeHostname(hostname) {
        if (!hostname || typeof hostname !== 'string') return 'Unknown';

        // Limiter la longueur
        const sanitized = hostname.trim().substring(0, 50);
        return sanitized || 'Unknown';
    }

    /**
     * Sanitise un type d'appareil
     */
    sanitizeDeviceType(deviceType) {
        if (!deviceType || typeof deviceType !== 'string') return 'Unknown';

        const type = deviceType.trim();

        // Mapping des types courants
        const typeMapping = {
            'router': 'Router',
            'gateway': 'Router',
            'phone': 'Smartphone',
            'mobile': 'Smartphone',
            'iphone': 'Smartphone',
            'android': 'Smartphone',
            'laptop': 'Laptop',
            'notebook': 'Laptop',
            'desktop': 'Desktop',
            'pc': 'Desktop',
            'computer': 'Desktop',
            'tablet': 'Tablet',
            'ipad': 'Tablet',
            'iot': 'IoT',
            'smart': 'IoT',
            'camera': 'IoT',
            'tv': 'IoT'
        };

        const lowerType = type.toLowerCase();
        for (const [key, value] of Object.entries(typeMapping)) {
            if (lowerType.includes(key)) {
                return value;
            }
        }

        return this.validDeviceTypes.includes(type) ? type : 'Unknown';
    }

    /**
     * Sanitise un timestamp
     */
    sanitizeTimestamp(timestamp) {
        if (!timestamp) return new Date().toISOString();

        try {
            const date = new Date(timestamp);
            return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
        } catch (error) {
            return new Date().toISOString();
        }
    }

    /**
     * Sanitise une chaîne de caractères
     */
    sanitizeString(str) {
        if (!str || typeof str !== 'string') return null;
        return str.trim().substring(0, 100) || null;
    }

    /**
     * Sanitise un niveau de confiance
     */
    sanitizeConfidence(confidence) {
        const num = Number(confidence);
        if (isNaN(num)) return 0;
        return Math.max(0, Math.min(1, num));
    }

    /**
     * Sanitise un type de sécurité
     */
    sanitizeSecurity(security) {
        if (!security || typeof security !== 'string') return 'Unknown';

        const sec = security.trim().toUpperCase();

        if (sec.includes('WPA3')) return 'WPA3';
        if (sec.includes('WPA2')) return 'WPA2';
        if (sec.includes('WPA')) return 'WPA';
        if (sec.includes('WEP')) return 'WEP';
        if (sec.includes('OPEN') || sec.includes('NONE')) return 'Open';

        return this.validSecurityTypes.includes(sec) ? sec : 'Unknown';
    }

    /**
     * Détermine si un appareil est local
     */
    isLocalDevice(device) {
        if (!device.ip) return false;

        // Vérifier les plages d'adresses locales
        const localRanges = [
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./,
            /^127\./
        ];

        return localRanges.some(range => range.test(device.ip));
    }

    /**
     * Détermine si un appareil est actif
     */
    isActiveDevice(device) {
        // Par défaut, considérer comme actif si on a des données récentes
        if (device.lastSeen) {
            const lastSeen = new Date(device.lastSeen);
            const now = new Date();
            const diffHours = (now - lastSeen) / (1000 * 60 * 60);
            return diffHours < 24; // Actif si vu dans les dernières 24h
        }

        return true; // Par défaut actif
    }

    /**
     * Enrichit les données avec des informations supplémentaires
     */
    enrichDeviceData(device) {
        return {
            ...device,
            isLocal: this.isLocalDevice(device),
            isActive: this.isActiveDevice(device),
            lastSeen: this.sanitizeTimestamp(device.lastSeen),
            discoveredBy: device.discoveredBy || 'scan',
            source: device.source || 'network'
        };
    }

    /**
     * Valide le format final des données
     */
    validateFormattedData(devices) {
        const requiredFields = [
            'ip', 'mac', 'hostname', 'deviceType', 'lastSeen',
            'isActive', 'isLocal', 'manufacturerInfo', 'discoveredBy', 'source'
        ];

        return devices.every(device => {
            return requiredFields.every(field => Object.prototype.hasOwnProperty.call(device, field));
        });
    }

    /**
     * Génère des statistiques sur les données formatées
     */
    generateStats(devices) {
        const stats = {
            total: devices.length,
            byType: {},
            bySecurity: {},
            local: 0,
            active: 0,
            identified: 0
        };

        devices.forEach(device => {
            // Comptage par type
            stats.byType[device.deviceType] = (stats.byType[device.deviceType] || 0) + 1;

            // Comptage par sécurité
            if (device.security) {
                stats.bySecurity[device.security] = (stats.bySecurity[device.security] || 0) + 1;
            }

            // Comptage local/actif
            if (device.isLocal) stats.local++;
            if (device.isActive) stats.active++;
            if (device.manufacturerInfo?.identified) stats.identified++;
        });

        return stats;
    }
}

module.exports = DataFormatter; 