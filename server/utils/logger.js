const winston = require('winston');
const path = require('path');

// Configuration du logging sécurisé
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: {
        service: 'wifi-tracker',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Ajouter le transport console en développement
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Fonction pour logger les événements de sécurité
logger.security = (level, message, meta = {}) => {
    logger.log(level, `🔒 ${message}`, { ...meta, type: 'security' });
};

// Fonction pour logger les événements de performance
logger.performance = (level, message, meta = {}) => {
    logger.log(level, `⚡ ${message}`, { ...meta, type: 'performance' });
};

// Fonction pour logger les événements de scan
logger.scan = (level, message, meta = {}) => {
    logger.log(level, `📡 ${message}`, { ...meta, type: 'scan' });
};

// Fonction pour logger les erreurs avec contexte
logger.errorWithContext = (error, context = {}) => {
    logger.error('❌ Erreur avec contexte', {
        error: error.message,
        stack: error.stack,
        ...context
    });
};

// Fonction pour logger les tentatives d'attaque
logger.securityThreat = (threat, details = {}) => {
    logger.warn(`🚨 Tentative d'attaque détectée: ${threat}`, {
        ...details,
        type: 'security_threat',
        timestamp: new Date().toISOString(),
        ip: details.ip || 'unknown'
    });
};

module.exports = logger; 