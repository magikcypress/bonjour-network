/**
 * Configuration CORS sécurisée pour WiFi Tracker
 */

const corsConfig = {
    // Configuration pour le développement
    development: {
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin',
            'X-Client-Version'
        ],
        exposedHeaders: [
            'X-Total-Count',
            'X-Page-Count'
        ],
        maxAge: 86400, // 24 heures
        optionsSuccessStatus: 200
    },

    // Configuration pour la production
    production: {
        origin: [
            'https://votre-domaine.com',
            'https://www.votre-domaine.com'
        ],
        credentials: true,
        methods: ['GET', 'POST'],
        allowedHeaders: [
            'Content-Type',
            'Authorization'
        ],
        exposedHeaders: [
            'X-Total-Count'
        ],
        maxAge: 86400,
        optionsSuccessStatus: 200
    },

    // Configuration pour les tests
    test: {
        origin: ['http://localhost:3000'],
        credentials: false,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        maxAge: 0
    }
};

/**
 * Obtient la configuration CORS selon l'environnement
 * @param {string} env - L'environnement (development, production, test)
 * @returns {Object} Configuration CORS
 */
function getCorsConfig(env = process.env.NODE_ENV || 'development') {
    return corsConfig[env] || corsConfig.development;
}

/**
 * Middleware CORS personnalisé avec validation d'origine
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
function customCorsMiddleware(req, res, next) {
    const config = getCorsConfig();
    const origin = req.headers.origin;

    // Vérifier l'origine
    if (origin && !config.origin.includes(origin)) {
        return res.status(403).json({
            error: 'Origine non autorisée',
            code: 'CORS_ORIGIN_NOT_ALLOWED'
        });
    }

    // Définir les headers CORS
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Credentials', config.credentials);
    res.header('Access-Control-Allow-Methods', config.methods.join(', '));
    res.header('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
    res.header('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
    res.header('Access-Control-Max-Age', config.maxAge);

    // Gérer les requêtes preflight
    if (req.method === 'OPTIONS') {
        return res.status(config.optionsSuccessStatus).end();
    }

    next();
}

/**
 * Middleware de sécurité pour les headers
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
function securityHeaders(req, res, next) {
    // Headers de sécurité de base
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Headers de sécurité supplémentaires en production
    if (process.env.NODE_ENV === 'production') {
        res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
    }

    next();
}

/**
 * Middleware de validation des méthodes HTTP
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
function validateHttpMethod(req, res, next) {
    const allowedMethods = ['GET', 'POST', 'OPTIONS'];

    if (!allowedMethods.includes(req.method)) {
        return res.status(405).json({
            error: 'Méthode HTTP non autorisée',
            code: 'METHOD_NOT_ALLOWED',
            allowed: allowedMethods
        });
    }

    next();
}

/**
 * Middleware de limitation de taille des requêtes
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
function requestSizeLimit(req, res, next) {
    const maxSize = 1024 * 1024; // 1MB

    if (req.headers['content-length'] &&
        parseInt(req.headers['content-length']) > maxSize) {
        return res.status(413).json({
            error: 'Taille de requête trop importante',
            code: 'REQUEST_TOO_LARGE',
            maxSize: '1MB'
        });
    }

    next();
}

/**
 * Middleware de validation des types de contenu
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
function validateContentType(req, res, next) {
    const allowedTypes = ['application/json', 'application/x-www-form-urlencoded'];

    if (req.method === 'POST' && req.headers['content-type']) {
        const contentType = req.headers['content-type'].split(';')[0];

        if (!allowedTypes.includes(contentType)) {
            return res.status(415).json({
                error: 'Type de contenu non supporté',
                code: 'UNSUPPORTED_MEDIA_TYPE',
                allowed: allowedTypes
            });
        }
    }

    next();
}

/**
 * Middleware de logging des requêtes CORS
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
function corsLogging(req, res, next) {
    const origin = req.headers.origin;
    const method = req.method;
    const path = req.path;

    console.log(`[CORS] ${method} ${path} - Origin: ${origin || 'Unknown'}`);

    next();
}

module.exports = {
    getCorsConfig,
    customCorsMiddleware,
    securityHeaders,
    validateHttpMethod,
    requestSizeLimit,
    validateContentType,
    corsLogging
}; 