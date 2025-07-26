/**
 * Configuration et validation des variables d'environnement
 */

class EnvironmentValidator {
    // Variables d'environnement requises
    static requiredVars = [
        'NODE_ENV',
        'PORT'
    ];

    // Variables d'environnement optionnelles avec valeurs par défaut
    static optionalVars = {
        'MISTRAL_AI_URL': 'https://api.mistral.ai',
        'MISTRAL_AI_KEY': null, // Requis si utilisé
        'JWT_SECRET': null, // Requis si authentification activée
        'WIFI_SCAN_INTERVAL': '30000',
        'DEVICE_SCAN_INTERVAL': '60000',
        'LOG_LEVEL': 'info',
        'REQUEST_TIMEOUT': '30000',
        'SCAN_TIMEOUT': '10000',
        'CORS_ORIGIN': 'http://localhost:3000,http://localhost:3001,http://localhost:5001'
    };

    // Validation des types et formats
    static validators = {
        'NODE_ENV': (value) => ['development', 'production', 'test'].includes(value),
        'PORT': (value) => {
            const port = parseInt(value);
            return port >= 1 && port <= 65535;
        },
        'MISTRAL_AI_URL': (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        },
        'MISTRAL_AI_KEY': (value) => {
            return value && value.length >= 32;
        },
        'JWT_SECRET': (value) => {
            return value && value.length >= 32;
        },
        'WIFI_SCAN_INTERVAL': (value) => {
            const interval = parseInt(value);
            return interval >= 1000 && interval <= 300000;
        },
        'DEVICE_SCAN_INTERVAL': (value) => {
            const interval = parseInt(value);
            return interval >= 1000 && interval <= 600000;
        },
        'LOG_LEVEL': (value) => {
            return ['error', 'warn', 'info', 'debug'].includes(value);
        },
        'REQUEST_TIMEOUT': (value) => {
            const timeout = parseInt(value);
            return timeout >= 1000 && timeout <= 120000;
        },
        'SCAN_TIMEOUT': (value) => {
            const timeout = parseInt(value);
            return timeout >= 1000 && timeout <= 60000;
        }
    };

    /**
     * Valide toutes les variables d'environnement
     * @returns {Object} Résultat de la validation
     */
    static validate() {
        const errors = [];
        const warnings = [];
        const config = {};

        // Vérifier les variables requises
        for (const varName of this.requiredVars) {
            const value = process.env[varName];

            if (!value) {
                errors.push(`Variable d'environnement manquante: ${varName}`);
                continue;
            }

            // Valider le format si un validateur existe
            if (this.validators[varName] && !this.validators[varName](value)) {
                errors.push(`Format invalide pour ${varName}: ${value}`);
                continue;
            }

            config[varName] = value;
        }

        // Vérifier les variables optionnelles
        for (const [varName, defaultValue] of Object.entries(this.optionalVars)) {
            let value = process.env[varName];

            if (!value) {
                if (defaultValue !== null) {
                    config[varName] = defaultValue;
                    warnings.push(`Variable ${varName} non définie, utilisation de la valeur par défaut: ${defaultValue}`);
                } else {
                    warnings.push(`Variable optionnelle non définie: ${varName}`);
                }
                continue;
            }

            // Valider le format si un validateur existe
            if (this.validators[varName] && !this.validators[varName](value)) {
                errors.push(`Format invalide pour ${varName}: ${value}`);
                continue;
            }

            config[varName] = value;
        }

        // Vérifications de sécurité spécifiques
        this.performSecurityChecks(config, errors, warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            config
        };
    }

    /**
     * Effectue des vérifications de sécurité spécifiques
     * @param {Object} config - Configuration actuelle
     * @param {Array} errors - Liste des erreurs
     * @param {Array} warnings - Liste des avertissements
     */
    static performSecurityChecks(config, errors, warnings) {
        // Vérifier les secrets en développement
        if (config.NODE_ENV === 'development') {
            if (config.JWT_SECRET === 'your-super-secure-256-bit-secret-here') {
                warnings.push('JWT_SECRET utilise la valeur par défaut - à changer en production');
            }

            if (config.MISTRAL_AI_KEY === 'your-mistral-api-key-here') {
                warnings.push('MISTRAL_AI_KEY utilise la valeur par défaut - à configurer');
            }
        }

        // Vérifier les secrets en production
        if (config.NODE_ENV === 'production') {
            if (!config.JWT_SECRET || config.JWT_SECRET.length < 32) {
                errors.push('JWT_SECRET doit être défini et avoir au moins 32 caractères en production');
            }

            if (!config.MISTRAL_AI_KEY || config.MISTRAL_AI_KEY.length < 32) {
                errors.push('MISTRAL_AI_KEY doit être défini et avoir au moins 32 caractères en production');
            }

            if (config.PORT < 1024) {
                warnings.push('Port inférieur à 1024 en production - vérifier les permissions');
            }
        }

        // Vérifier les timeouts
        if (config.REQUEST_TIMEOUT < config.SCAN_TIMEOUT) {
            warnings.push('REQUEST_TIMEOUT est inférieur à SCAN_TIMEOUT - risque de timeout');
        }

        // Vérifier les intervalles de scan
        if (config.WIFI_SCAN_INTERVAL < 5000) {
            warnings.push('WIFI_SCAN_INTERVAL très court - risque de surcharge');
        }

        if (config.DEVICE_SCAN_INTERVAL < 10000) {
            warnings.push('DEVICE_SCAN_INTERVAL très court - risque de surcharge');
        }
    }

    /**
     * Génère une configuration sécurisée pour la production
     * @returns {Object} Configuration recommandée
     */
    static generateSecureConfig() {
        return {
            NODE_ENV: 'production',
            PORT: '5001',
            MISTRAL_AI_URL: 'https://api.mistral.ai',
            MISTRAL_AI_KEY: 'your-actual-mistral-api-key-here',
            JWT_SECRET: 'your-super-secure-256-bit-jwt-secret-here',
            WIFI_SCAN_INTERVAL: '30000',
            DEVICE_SCAN_INTERVAL: '60000',
            LOG_LEVEL: 'warn',
            REQUEST_TIMEOUT: '30000',
            SCAN_TIMEOUT: '10000',
            CORS_ORIGIN: 'https://votre-domaine.com'
        };
    }

    /**
     * Valide une variable d'environnement spécifique
     * @param {string} varName - Nom de la variable
     * @param {string} value - Valeur de la variable
     * @returns {boolean} True si valide
     */
    static validateVariable(varName, value) {
        if (!this.validators[varName]) {
            return true; // Pas de validateur = toujours valide
        }

        return this.validators[varName](value);
    }

    /**
     * Obtient la configuration validée
     * @returns {Object} Configuration avec valeurs par défaut
     */
    static getConfig() {
        const validation = this.validate();

        if (!validation.isValid) {
            console.error('❌ Erreurs de configuration:');
            validation.errors.forEach(error => console.error(`  - ${error}`));
            process.exit(1);
        }

        if (validation.warnings.length > 0) {
            // Supprimer les avertissements pour les variables optionnelles avec valeurs par défaut
            const filteredWarnings = validation.warnings.filter(warning =>
                !warning.includes('non définie, utilisation de la valeur par défaut')
            );

            if (filteredWarnings.length > 0) {
                console.warn('⚠️ Avertissements de configuration:');
                filteredWarnings.forEach(warning => console.warn(`  - ${warning}`));
            }
        }

        return validation.config;
    }

    /**
     * Affiche un résumé de la configuration
     * @param {Object} config - Configuration à afficher
     */
    static printConfigSummary(config) {
        console.log('🔧 Configuration Bonjour Network:');
        console.log(`  - Environnement: ${config.NODE_ENV}`);
        console.log(`  - Port: ${config.PORT}`);
        console.log(`  - Log Level: ${config.LOG_LEVEL}`);
        console.log(`  - Scan WiFi: ${config.WIFI_SCAN_INTERVAL}ms`);
        console.log(`  - Scan Devices: ${config.DEVICE_SCAN_INTERVAL}ms`);
        console.log(`  - Timeout Request: ${config.REQUEST_TIMEOUT}ms`);
        console.log(`  - Timeout Scan: ${config.SCAN_TIMEOUT}ms`);
        console.log(`  - CORS Origin: ${config.CORS_ORIGIN}`);

        if (config.MISTRAL_AI_KEY) {
            console.log(`  - Mistral AI: Configuré`);
        } else {
            console.log(`  - Mistral AI: Non configuré`);
        }

        if (config.JWT_SECRET) {
            console.log(`  - JWT: Configuré`);
        } else {
            console.log(`  - JWT: Non configuré`);
        }
    }
}

module.exports = EnvironmentValidator; 