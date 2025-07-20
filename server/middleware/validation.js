const logger = require('../utils/logger');

// Validation des modes de scan
function validateScanMode(mode) {
    const validModes = ['fast', 'complete'];
    return validModes.includes(mode);
}

// Validation des adresses MAC
function validateMacAddress(mac) {
    if (!mac || typeof mac !== 'string') return false;
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
}

// Validation des adresses IP
function validateIpAddress(ip) {
    if (!ip || typeof ip !== 'string') return false;
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
}

// Validation des paramètres Mistral AI
function validateMistralParams(params) {
    if (!params || typeof params !== 'object') return false;

    const requiredFields = ['apiKey', 'endpoint'];
    return requiredFields.every(field => params[field] && typeof params[field] === 'string');
}

// Validation de la taille du payload
function validatePayloadSize(payload, maxSize = 1024 * 1024) { // 1MB par défaut
    if (!payload) return true;

    const payloadSize = JSON.stringify(payload).length;
    return payloadSize <= maxSize;
}

// Validation des origines CORS
function validateOrigin(origin) {
    if (!origin) return false;

    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    return allowedOrigins.some(allowed => origin.startsWith(allowed.trim()));
}

// Validation des tokens d'authentification
function validateAuthToken(token) {
    if (!token || typeof token !== 'string') return false;

    // Vérification basique du format JWT
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    return jwtRegex.test(token);
}

// Validation des paramètres de requête
function validateQueryParams(params, allowedParams) {
    if (!params || typeof params !== 'object') return false;

    const providedParams = Object.keys(params);
    return providedParams.every(param => allowedParams.includes(param));
}

// Validation des données de scan
function validateScanData(data) {
    if (!data || typeof data !== 'object') return false;

    const requiredFields = ['mode'];
    const validModes = ['fast', 'complete'];

    return requiredFields.every(field => data[field]) &&
        validModes.includes(data.mode);
}

// Middleware de validation des données de scan
function validateScanRequest(req, res, next) {
    try {
        const { mode } = req.body;

        if (!validateScanMode(mode)) {
            logger.securityThreat('Mode de scan invalide', {
                ip: req.ip,
                mode: mode
            });
            return res.status(400).json({
                error: 'Mode de scan invalide',
                code: 'INVALID_SCAN_MODE',
                allowedModes: ['fast', 'complete']
            });
        }

        next();
    } catch (error) {
        logger.errorWithContext(error, {
            middleware: 'validateScanRequest',
            ip: req.ip
        });
        res.status(500).json({
            error: 'Erreur de validation',
            code: 'VALIDATION_ERROR'
        });
    }
}

// Middleware de validation des paramètres de requête
function validateQueryParamsMiddleware(allowedParams) {
    return (req, res, next) => {
        try {
            if (!validateQueryParams(req.query, allowedParams)) {
                logger.securityThreat('Paramètres de requête invalides', {
                    ip: req.ip,
                    query: req.query
                });
                return res.status(400).json({
                    error: 'Paramètres de requête invalides',
                    code: 'INVALID_QUERY_PARAMS',
                    allowedParams
                });
            }

            next();
        } catch (error) {
            logger.errorWithContext(error, {
                middleware: 'validateQueryParams',
                ip: req.ip
            });
            res.status(500).json({
                error: 'Erreur de validation',
                code: 'VALIDATION_ERROR'
            });
        }
    };
}

// Middleware de validation de la taille du payload
function validatePayloadSizeMiddleware(maxSize = 1024 * 1024) {
    return (req, res, next) => {
        try {
            if (!validatePayloadSize(req.body, maxSize)) {
                logger.securityThreat('Payload trop volumineux', {
                    ip: req.ip,
                    size: JSON.stringify(req.body).length
                });
                return res.status(413).json({
                    error: 'Payload trop volumineux',
                    code: 'PAYLOAD_TOO_LARGE',
                    maxSize: maxSize
                });
            }

            next();
        } catch (error) {
            logger.errorWithContext(error, {
                middleware: 'validatePayloadSize',
                ip: req.ip
            });
            res.status(500).json({
                error: 'Erreur de validation',
                code: 'VALIDATION_ERROR'
            });
        }
    };
}

// Middleware de validation des origines
function validateOriginMiddleware(req, res, next) {
    try {
        const origin = req.headers.origin;

        if (!validateOrigin(origin)) {
            logger.securityThreat('Origine non autorisée', {
                ip: req.ip,
                origin: origin
            });
            return res.status(403).json({
                error: 'Origine non autorisée',
                code: 'UNAUTHORIZED_ORIGIN'
            });
        }

        next();
    } catch (error) {
        logger.errorWithContext(error, {
            middleware: 'validateOrigin',
            ip: req.ip
        });
        res.status(500).json({
            error: 'Erreur de validation',
            code: 'VALIDATION_ERROR'
        });
    }
}

// Middleware de validation des tokens d'authentification
function validateAuthTokenMiddleware(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!validateAuthToken(token)) {
            logger.securityThreat('Token d\'authentification invalide', {
                ip: req.ip
            });
            return res.status(401).json({
                error: 'Token d\'authentification invalide',
                code: 'INVALID_AUTH_TOKEN'
            });
        }

        next();
    } catch (error) {
        logger.errorWithContext(error, {
            middleware: 'validateAuthToken',
            ip: req.ip
        });
        res.status(500).json({
            error: 'Erreur de validation',
            code: 'VALIDATION_ERROR'
        });
    }
}

// Middleware de validation des données d'appareil
function validateDeviceDataMiddleware(req, res, next) {
    try {
        const { ip, mac } = req.body;

        if (ip && !validateIpAddress(ip)) {
            logger.securityThreat('Adresse IP invalide', {
                ip: req.ip,
                deviceIp: ip
            });
            return res.status(400).json({
                error: 'Adresse IP invalide',
                code: 'INVALID_IP_ADDRESS'
            });
        }

        if (mac && !validateMacAddress(mac)) {
            logger.securityThreat('Adresse MAC invalide', {
                ip: req.ip,
                deviceMac: mac
            });
            return res.status(400).json({
                error: 'Adresse MAC invalide',
                code: 'INVALID_MAC_ADDRESS'
            });
        }

        next();
    } catch (error) {
        logger.errorWithContext(error, {
            middleware: 'validateDeviceData',
            ip: req.ip
        });
        res.status(500).json({
            error: 'Erreur de validation',
            code: 'VALIDATION_ERROR'
        });
    }
}

module.exports = {
    validateScanMode,
    validateMacAddress,
    validateIpAddress,
    validateMistralParams,
    validatePayloadSize,
    validateOrigin,
    validateAuthToken,
    validateQueryParams,
    validateScanData,
    validateScanRequest,
    validateQueryParamsMiddleware,
    validatePayloadSizeMiddleware,
    validateOriginMiddleware,
    validateAuthTokenMiddleware,
    validateDeviceDataMiddleware
}; 