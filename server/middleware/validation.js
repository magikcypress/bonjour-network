const CommandValidator = require('../security/command-validator');

/**
 * Middleware de validation des adresses MAC
 */
const validateMacAddress = (req, res, next) => {
    const { mac } = req.body;

    if (!mac) {
        return res.status(400).json({
            error: 'Adresse MAC requise',
            code: 'MISSING_MAC'
        });
    }

    if (!CommandValidator.isValidMac(mac)) {
        return res.status(400).json({
            error: 'Format d\'adresse MAC invalide',
            code: 'INVALID_MAC_FORMAT',
            expected: 'XX:XX:XX:XX:XX:XX ou XX-XX-XX-XX-XX-XX'
        });
    }

    next();
};

/**
 * Middleware de validation des adresses IP
 */
const validateIpAddress = (req, res, next) => {
    const { ip } = req.body;

    if (!ip) {
        return res.status(400).json({
            error: 'Adresse IP requise',
            code: 'MISSING_IP'
        });
    }

    if (!CommandValidator.isValidIp(ip)) {
        return res.status(400).json({
            error: 'Format d\'adresse IP invalide',
            code: 'INVALID_IP_FORMAT',
            expected: 'XXX.XXX.XXX.XXX'
        });
    }

    next();
};

/**
 * Middleware de validation des commandes système
 */
const validateSystemCommand = (req, res, next) => {
    const { command } = req.body;

    if (!command) {
        return res.status(400).json({
            error: 'Commande requise',
            code: 'MISSING_COMMAND'
        });
    }

    if (!CommandValidator.validate(command)) {
        return res.status(403).json({
            error: 'Commande non autorisée',
            code: 'UNAUTHORIZED_COMMAND'
        });
    }

    next();
};

/**
 * Middleware de validation des paramètres de scan
 */
const validateScanParams = (req, res, next) => {
    const { scanMode, networkRange, timeout } = req.body;

    // Validation du mode de scan
    if (scanMode && !['fast', 'complete'].includes(scanMode)) {
        return res.status(400).json({
            error: 'Mode de scan invalide',
            code: 'INVALID_SCAN_MODE',
            allowed: ['fast', 'complete']
        });
    }

    // Validation de la plage réseau
    if (networkRange && !CommandValidator.isValidIp(networkRange.split('/')[0])) {
        return res.status(400).json({
            error: 'Plage réseau invalide',
            code: 'INVALID_NETWORK_RANGE'
        });
    }

    // Validation du timeout
    if (timeout && (isNaN(timeout) || timeout < 1000 || timeout > 60000)) {
        return res.status(400).json({
            error: 'Timeout invalide',
            code: 'INVALID_TIMEOUT',
            allowed: '1000-60000 ms'
        });
    }

    next();
};

/**
 * Middleware de validation des paramètres d'optimisation
 */
const validateOptimizationParams = (req, res, next) => {
    const { channel, frequency, security } = req.body;

    // Validation du canal
    if (channel && (isNaN(channel) || channel < 1 || channel > 165)) {
        return res.status(400).json({
            error: 'Canal invalide',
            code: 'INVALID_CHANNEL',
            allowed: '1-165'
        });
    }

    // Validation de la fréquence
    if (frequency && !['2.4', '5', '6'].includes(frequency)) {
        return res.status(400).json({
            error: 'Fréquence invalide',
            code: 'INVALID_FREQUENCY',
            allowed: ['2.4', '5', '6']
        });
    }

    // Validation de la sécurité
    if (security && !['WPA', 'WPA2', 'WPA3', 'WEP', 'Open'].includes(security)) {
        return res.status(400).json({
            error: 'Type de sécurité invalide',
            code: 'INVALID_SECURITY',
            allowed: ['WPA', 'WPA2', 'WPA3', 'WEP', 'Open']
        });
    }

    next();
};

/**
 * Middleware de validation des paramètres Mistral AI
 */
const validateMistralParams = (req, res, next) => {
    const { devices, batchSize } = req.body;

    // Validation des appareils
    if (devices && !Array.isArray(devices)) {
        return res.status(400).json({
            error: 'Liste d\'appareils invalide',
            code: 'INVALID_DEVICES_ARRAY'
        });
    }

    // Validation de la taille du lot
    if (batchSize && (isNaN(batchSize) || batchSize < 1 || batchSize > 50)) {
        return res.status(400).json({
            error: 'Taille de lot invalide',
            code: 'INVALID_BATCH_SIZE',
            allowed: '1-50'
        });
    }

    next();
};

/**
 * Middleware de validation des headers de sécurité
 */
const validateSecurityHeaders = (req, res, next) => {
    const requiredHeaders = ['Content-Type'];
    const missingHeaders = requiredHeaders.filter(header =>
        !req.headers[header.toLowerCase()]
    );

    if (missingHeaders.length > 0) {
        return res.status(400).json({
            error: 'Headers requis manquants',
            code: 'MISSING_HEADERS',
            missing: missingHeaders
        });
    }

    next();
};

/**
 * Middleware de validation des limites de taille
 */
const validatePayloadSize = (req, res, next) => {
    const maxSize = 1024 * 1024; // 1MB

    if (req.headers['content-length'] &&
        parseInt(req.headers['content-length']) > maxSize) {
        return res.status(413).json({
            error: 'Payload trop volumineux',
            code: 'PAYLOAD_TOO_LARGE',
            maxSize: '1MB'
        });
    }

    next();
};

/**
 * Middleware de validation des paramètres de pagination
 */
const validatePagination = (req, res, next) => {
    const { page, limit } = req.query;

    if (page && (isNaN(page) || page < 1)) {
        return res.status(400).json({
            error: 'Numéro de page invalide',
            code: 'INVALID_PAGE',
            allowed: '>= 1'
        });
    }

    if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        return res.status(400).json({
            error: 'Limite invalide',
            code: 'INVALID_LIMIT',
            allowed: '1-100'
        });
    }

    next();
};

/**
 * Middleware de validation des paramètres de tri
 */
const validateSorting = (req, res, next) => {
    const { sortBy, sortOrder } = req.query;
    const allowedFields = ['ssid', 'signalStrength', 'security', 'channel', 'lastSeen'];
    const allowedOrders = ['asc', 'desc'];

    if (sortBy && !allowedFields.includes(sortBy)) {
        return res.status(400).json({
            error: 'Champ de tri invalide',
            code: 'INVALID_SORT_FIELD',
            allowed: allowedFields
        });
    }

    if (sortOrder && !allowedOrders.includes(sortOrder.toLowerCase())) {
        return res.status(400).json({
            error: 'Ordre de tri invalide',
            code: 'INVALID_SORT_ORDER',
            allowed: allowedOrders
        });
    }

    next();
};

/**
 * Middleware de validation des paramètres de filtrage
 */
const validateFiltering = (req, res, next) => {
    const { security, frequency, signalMin, signalMax } = req.query;
    const allowedSecurity = ['WPA', 'WPA2', 'WPA3', 'WEP', 'Open'];
    const allowedFrequencies = ['2.4', '5', '6'];

    if (security && !allowedSecurity.includes(security)) {
        return res.status(400).json({
            error: 'Filtre de sécurité invalide',
            code: 'INVALID_SECURITY_FILTER',
            allowed: allowedSecurity
        });
    }

    if (frequency && !allowedFrequencies.includes(frequency)) {
        return res.status(400).json({
            error: 'Filtre de fréquence invalide',
            code: 'INVALID_FREQUENCY_FILTER',
            allowed: allowedFrequencies
        });
    }

    if (signalMin && (isNaN(signalMin) || signalMin < -100 || signalMin > 0)) {
        return res.status(400).json({
            error: 'Signal minimum invalide',
            code: 'INVALID_SIGNAL_MIN',
            allowed: '-100 à 0 dBm'
        });
    }

    if (signalMax && (isNaN(signalMax) || signalMax < -100 || signalMax > 0)) {
        return res.status(400).json({
            error: 'Signal maximum invalide',
            code: 'INVALID_SIGNAL_MAX',
            allowed: '-100 à 0 dBm'
        });
    }

    if (signalMin && signalMax && parseInt(signalMin) > parseInt(signalMax)) {
        return res.status(400).json({
            error: 'Plage de signal invalide',
            code: 'INVALID_SIGNAL_RANGE',
            message: 'Le minimum doit être inférieur au maximum'
        });
    }

    next();
};

module.exports = {
    validateMacAddress,
    validateIpAddress,
    validateSystemCommand,
    validateScanParams,
    validateOptimizationParams,
    validateMistralParams,
    validateSecurityHeaders,
    validatePayloadSize,
    validatePagination,
    validateSorting,
    validateFiltering
}; 