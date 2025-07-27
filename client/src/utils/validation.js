// Utilitaires de validation pour le client

/**
 * Validation des adresses IP
 */
export function validateIpAddress(ip) {
    if (!ip || typeof ip !== 'string') return false;
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
}

/**
 * Validation des adresses MAC
 */
export function validateMacAddress(mac) {
    if (!mac || typeof mac !== 'string') return false;
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
}

/**
 * Validation des modes de scan
 */
export function validateScanMode(mode) {
    const validModes = ['fast', 'complete'];
    return validModes.includes(mode);
}

/**
 * Validation des types d'appareils
 */
export function validateDeviceType(deviceType) {
    if (!deviceType || typeof deviceType !== 'string') return false;
    const validTypes = ['Router', 'Smartphone', 'Laptop', 'Desktop', 'Tablet', 'IoT', 'Unknown'];
    return validTypes.includes(deviceType);
}

/**
 * Validation des chaînes de caractères
 */
export function validateString(str, maxLength = 100) {
    if (!str || typeof str !== 'string') return false;
    return str.trim().length > 0 && str.length <= maxLength;
}

/**
 * Validation des nombres
 */
export function validateNumber(num, min = 0, max = 100) {
    const number = Number(num);
    if (isNaN(number)) return false;
    return number >= min && number <= max;
}

/**
 * Validation des timestamps
 */
export function validateTimestamp(timestamp) {
    if (!timestamp) return false;
    try {
        const date = new Date(timestamp);
        return !isNaN(date.getTime());
    } catch (error) {
        return false;
    }
}

/**
 * Validation des informations de fabricant
 */
export function validateManufacturerInfo(manufacturerInfo) {
    if (!manufacturerInfo || typeof manufacturerInfo !== 'object') return false;

    const requiredFields = ['identified', 'manufacturer', 'confidence', 'source'];
    const hasAllFields = requiredFields.every(field => manufacturerInfo.hasOwnProperty(field));

    if (!hasAllFields) return false;

    // Validation des types
    const isValidIdentified = typeof manufacturerInfo.identified === 'boolean';
    const isValidManufacturer = validateString(manufacturerInfo.manufacturer, 50);
    const isValidConfidence = validateNumber(manufacturerInfo.confidence, 0, 1);
    const isValidSource = validateString(manufacturerInfo.source, 20);

    return isValidIdentified && isValidManufacturer && isValidConfidence && isValidSource;
}

/**
 * Validation d'un appareil complet
 */
export function validateDevice(device) {
    if (!device || typeof device !== 'object') return false;

    // Champs requis minimaux (seulement IP)
    const hasRequiredFields = device.ip;
    if (!hasRequiredFields) {
        console.warn('❌ Appareil rejeté - IP manquante:', device);
        return false;
    }

    // Validation des champs de base
    const isValidIp = validateIpAddress(device.ip);
    const isValidMac = device.mac && device.mac !== 'N/A' ? validateMacAddress(device.mac) : true;

    if (!isValidIp) {
        console.warn('❌ Appareil rejeté - IP invalide:', device);
        return false;
    }

    if (!isValidMac) {
        console.warn('⚠️ Appareil avec MAC invalide accepté:', device.ip);
    }

    // Les autres champs sont optionnels avec des valeurs par défaut
    return true;
}

/**
 * Validation d'un réseau WiFi
 */
export function validateNetwork(network) {
    if (!network || typeof network !== 'object') return false;

    // Champs requis (sans bssid car optionnel)
    const requiredFields = ['ssid', 'signalStrength', 'frequency', 'security', 'channel'];
    const hasAllFields = requiredFields.every(field => network.hasOwnProperty(field));

    if (!hasAllFields) return false;

    // Validation des champs individuels avec conversion des types
    const isValidSsid = validateString(network.ssid, 32);
    const isValidSignalStrength = validateNumber(parseInt(network.signalStrength), 0, 100); // Convertir en nombre
    const isValidFrequency = validateNumber(parseInt(network.frequency), 0, 100000); // Convertir en nombre
    const isValidSecurity = validateString(network.security, 20);
    const isValidChannel = validateNumber(parseInt(network.channel), 1, 165); // Convertir en nombre

    // BSSID est optionnel et peut être null
    const isValidBssid = !network.bssid || network.bssid === null || validateMacAddress(network.bssid);

    // Accepter "Unknown" comme sécurité valide
    const isAcceptableSecurity = network.security === 'Unknown' || isValidSecurity;

    return isValidSsid && isValidSignalStrength && isValidFrequency &&
        isAcceptableSecurity && isValidChannel && isValidBssid;
}

/**
 * Sanitisation des données d'appareil
 */
export function sanitizeDevice(device) {
    if (!device || typeof device !== 'object') return null;

    try {
        // Validation des champs requis
        if (!validateIpAddress(device.ip)) {
            console.warn('❌ Appareil ignoré - IP invalide:', device);
            return null;
        }

        // MAC est optionnelle
        const mac = device.mac && device.mac !== 'N/A' ? device.mac.toLowerCase() : 'N/A';

        return {
            ip: device.ip,
            mac: mac,
            hostname: validateString(device.hostname, 50) ? device.hostname.trim() : 'Unknown',
            deviceType: validateDeviceType(device.deviceType) ? device.deviceType : 'Unknown',
            lastSeen: validateTimestamp(device.lastSeen) ? device.lastSeen : new Date().toISOString(),
            isActive: Boolean(device.isActive),
            isLocal: Boolean(device.isLocal),
            manufacturer: validateString(device.manufacturer, 50) ? device.manufacturer.trim() : null,
            manufacturerInfo: sanitizeManufacturerInfo(device.manufacturerInfo),
            discoveredBy: validateString(device.discoveredBy, 20) ? device.discoveredBy.trim() : 'scan',
            source: validateString(device.source, 20) ? device.source.trim() : 'network',
            security: validateString(device.security, 20) ? device.security.trim() : 'Unknown'
        };
    } catch (error) {
        console.error('❌ Erreur lors de la sanitisation d\'un appareil:', error);
        return null;
    }
}

/**
 * Sanitisation des informations de fabricant
 */
export function sanitizeManufacturerInfo(manufacturerInfo) {
    if (!validateManufacturerInfo(manufacturerInfo)) {
        return {
            identified: false,
            manufacturer: 'Unknown',
            confidence: 0,
            source: 'unknown'
        };
    }

    return {
        identified: Boolean(manufacturerInfo.identified),
        manufacturer: manufacturerInfo.manufacturer.trim(),
        confidence: Math.max(0, Math.min(1, Number(manufacturerInfo.confidence) || 0)),
        source: manufacturerInfo.source.trim()
    };
}

/**
 * Validation d'un tableau d'appareils
 */
export function validateDevices(devices) {
    if (!Array.isArray(devices)) {
        console.warn('❌ Les données d\'appareils ne sont pas un tableau');
        return [];
    }

    return devices
        .map(device => sanitizeDevice(device))
        .filter(device => device !== null && validateDevice(device));
}

/**
 * Validation d'un tableau de réseaux
 */
export function validateNetworks(networks) {
    if (!Array.isArray(networks)) {
        console.warn('❌ Les données de réseaux ne sont pas un tableau');
        return [];
    }

    console.log(`🔍 Validation de ${networks.length} réseaux...`);

    const validatedNetworks = networks.filter(network => {
        const isValid = validateNetwork(network);
        if (!isValid) {
            console.warn('❌ Réseau rejeté:', network);
        }
        return isValid;
    });

    console.log(`✅ ${validatedNetworks.length} réseaux validés sur ${networks.length}`);

    return validatedNetworks;
}

/**
 * Validation des paramètres de scan
 */
export function validateScanParams(params) {
    if (!params || typeof params !== 'object') return false;

    const { mode } = params;
    return validateScanMode(mode);
}

/**
 * Validation des données de réponse API
 */
export function validateApiResponse(response) {
    if (!response || typeof response !== 'object') return false;

    // Vérifier la structure de base
    const hasData = response.hasOwnProperty('data');
    const hasStatus = response.hasOwnProperty('status');

    return hasData && hasStatus;
}

/**
 * Validation des erreurs API
 */
export function validateApiError(error) {
    if (!error || typeof error !== 'object') return false;

    const hasMessage = error.hasOwnProperty('message');
    const hasCode = error.hasOwnProperty('code');

    return hasMessage && hasCode;
}

/**
 * Génération d'un rapport de validation
 */
export function generateValidationReport(data, type = 'device') {
    const report = {
        type,
        timestamp: new Date().toISOString(),
        total: 0,
        valid: 0,
        invalid: 0,
        errors: []
    };

    if (Array.isArray(data)) {
        report.total = data.length;

        data.forEach((item, index) => {
            const isValid = type === 'device' ? validateDevice(item) : validateNetwork(item);

            if (isValid) {
                report.valid++;
            } else {
                report.invalid++;
                report.errors.push({
                    index,
                    item: JSON.stringify(item),
                    reason: 'Validation failed'
                });
            }
        });
    } else {
        report.errors.push({
            reason: 'Data is not an array'
        });
    }

    return report;
}

/**
 * Validation des données de connectivité
 */
export function validateConnectivity(connectivity) {
    if (!connectivity || typeof connectivity !== 'object') return false;

    const hasApi = connectivity.hasOwnProperty('api');
    const hasSocket = connectivity.hasOwnProperty('socket');
    const hasLastCheck = connectivity.hasOwnProperty('lastCheck');

    if (!hasApi || !hasSocket || !hasLastCheck) return false;

    const isValidApi = typeof connectivity.api === 'boolean';
    const isValidSocket = typeof connectivity.socket === 'boolean';
    const isValidLastCheck = connectivity.lastCheck === null ||
        (typeof connectivity.lastCheck === 'string' && !isNaN(Date.parse(connectivity.lastCheck)));

    return isValidApi && isValidSocket && isValidLastCheck;
}

/**
 * Validation des données de progression de scan
 */
export function validateScanProgress(scanProgress) {
    if (!scanProgress || typeof scanProgress !== 'object') return false;

    const hasIsActive = scanProgress.hasOwnProperty('isActive');
    const hasProgress = scanProgress.hasOwnProperty('progress');
    const hasStep = scanProgress.hasOwnProperty('step');
    const hasMessage = scanProgress.hasOwnProperty('message');

    if (!hasIsActive || !hasProgress || !hasStep || !hasMessage) return false;

    const isValidIsActive = typeof scanProgress.isActive === 'boolean';
    const isValidProgress = typeof scanProgress.progress === 'number' &&
        scanProgress.progress >= 0 && scanProgress.progress <= 100;
    const isValidStep = typeof scanProgress.step === 'string';
    const isValidMessage = typeof scanProgress.message === 'string';

    return isValidIsActive && isValidProgress && isValidStep && isValidMessage;
} 