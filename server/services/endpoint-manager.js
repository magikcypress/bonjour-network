const logger = require('../utils/logger');
const DataFormatter = require('../utils/data-formatter');

/**
 * Gestionnaire centralisé des endpoints pour synchroniser backend et frontend
 */
class EndpointManager {
    constructor() {
        this.dataFormatter = new DataFormatter();
        this.endpoints = new Map();
        this.responseCache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes

        this.initializeEndpoints();
    }

    /**
     * Initialise tous les endpoints disponibles
     */
    initializeEndpoints() {
        // Endpoints de santé et monitoring
        this.registerEndpoint('health', {
            method: 'GET',
            path: '/api/health',
            description: 'Vérification de l\'état du serveur',
            responseFormat: {
                status: 'string',
                timestamp: 'string',
                uptime: 'number',
                memory: 'object',
                version: 'string'
            }
        });

        // Endpoints de réseaux WiFi
        this.registerEndpoint('networks', {
            method: 'GET',
            path: '/api/networks',
            description: 'Liste des réseaux WiFi disponibles',
            responseFormat: {
                ssid: 'string',
                signalStrength: 'number',
                frequency: 'number',
                security: 'string',
                channel: 'number',
                bssid: 'string'
            }
        });

        // Endpoints d'appareils
        this.registerEndpoint('devices', {
            method: 'GET',
            path: '/api/devices',
            description: 'Liste des appareils connectés (scan complet)',
            responseFormat: {
                ip: 'string',
                mac: 'string',
                hostname: 'string',
                deviceType: 'string',
                lastSeen: 'string',
                isActive: 'boolean',
                isLocal: 'boolean',
                manufacturerInfo: 'object',
                discoveredBy: 'string',
                source: 'string',
                security: 'string'
            }
        });

        this.registerEndpoint('devices-fast', {
            method: 'GET',
            path: '/api/devices/fast',
            description: 'Scan rapide des appareils connectés',
            responseFormat: 'same as devices'
        });

        this.registerEndpoint('devices-complete', {
            method: 'GET',
            path: '/api/devices/complete',
            description: 'Scan complet des appareils connectés',
            responseFormat: 'same as devices'
        });

        this.registerEndpoint('devices-count', {
            method: 'GET',
            path: '/api/devices/count',
            description: 'Compteur d\'appareils connectés',
            responseFormat: {
                count: 'number',
                cached: 'boolean',
                lastUpdate: 'string'
            }
        });

        // Endpoints de scan avec choix
        this.registerEndpoint('devices-scan', {
            method: 'GET',
            path: '/api/devices/scan/:mode/:scanner',
            description: 'Scan avec choix du mode et scanner',
            parameters: {
                mode: ['fast', 'complete'],
                scanner: ['original', 'improved']
            },
            responseFormat: {
                devices: 'array',
                metadata: {
                    mode: 'string',
                    scanner: 'string',
                    scanTime: 'number',
                    deviceCount: 'number',
                    timestamp: 'string'
                }
            }
        });

        // Endpoints d'identification
        this.registerEndpoint('devices-identify', {
            method: 'POST',
            path: '/api/devices/identify',
            description: 'Identifier un appareil avec Mistral AI',
            requestFormat: {
                mac: 'string'
            },
            responseFormat: {
                mac: 'string',
                identified: 'boolean',
                manufacturer: 'string',
                deviceType: 'string',
                confidence: 'number',
                timestamp: 'string'
            }
        });

        // Endpoints de fabricants
        this.registerEndpoint('manufacturers', {
            method: 'GET',
            path: '/api/manufacturers',
            description: 'Liste de tous les fabricants',
            responseFormat: {
                macPrefix: 'string',
                manufacturer: 'string',
                deviceType: 'string',
                confidence: 'number',
                addedAt: 'string'
            }
        });

        this.registerEndpoint('manufacturers-search', {
            method: 'GET',
            path: '/api/manufacturers/search/:name',
            description: 'Rechercher un fabricant par nom',
            parameters: {
                name: 'string'
            },
            responseFormat: 'array of manufacturer objects'
        });

        this.registerEndpoint('manufacturers-identify', {
            method: 'POST',
            path: '/api/manufacturers/identify',
            description: 'Identifier un fabricant par MAC',
            requestFormat: {
                mac: 'string'
            },
            responseFormat: {
                manufacturer: 'string',
                deviceType: 'string',
                confidence: 'number',
                identified: 'boolean',
                source: 'string'
            }
        });

        // Endpoints de statistiques
        this.registerEndpoint('stats', {
            method: 'GET',
            path: '/api/stats',
            description: 'Statistiques du serveur',
            responseFormat: {
                server: 'object',
                socket: 'object',
                api: 'object'
            }
        });

        // Endpoints de cache
        this.registerEndpoint('cache-clear', {
            method: 'POST',
            path: '/api/cache/clear',
            description: 'Nettoyer le cache',
            responseFormat: {
                message: 'string',
                timestamp: 'string'
            }
        });
    }

    /**
     * Enregistre un endpoint avec sa configuration
     */
    registerEndpoint(name, config) {
        this.endpoints.set(name, {
            ...config,
            registeredAt: new Date().toISOString()
        });
    }

    /**
     * Valide une requête selon la configuration de l'endpoint
     */
    validateRequest(endpointName, req) {
        const endpoint = this.endpoints.get(endpointName);
        if (!endpoint) {
            throw new Error(`Endpoint '${endpointName}' non trouvé`);
        }

        // Validation de la méthode HTTP
        if (req.method !== endpoint.method) {
            throw new Error(`Méthode HTTP invalide. Attendu: ${endpoint.method}, Reçu: ${req.method}`);
        }

        // Validation des paramètres de requête
        if (endpoint.parameters) {
            for (const [param, expectedType] of Object.entries(endpoint.parameters)) {
                const value = req.params[param] || req.query[param];

                if (Array.isArray(expectedType)) {
                    if (!expectedType.includes(value)) {
                        throw new Error(`Paramètre '${param}' invalide. Valeurs autorisées: ${expectedType.join(', ')}`);
                    }
                } else if (expectedType === 'string' && (!value || typeof value !== 'string')) {
                    throw new Error(`Paramètre '${param}' requis et doit être une chaîne`);
                }
            }
        }

        // Validation du corps de la requête
        if (endpoint.requestFormat && req.method === 'POST') {
            this.validateRequestBody(req.body, endpoint.requestFormat);
        }

        return true;
    }

    /**
     * Valide le corps de la requête
     */
    validateRequestBody(body, format) {
        for (const [field, expectedType] of Object.entries(format)) {
            const value = body[field];

            if (!value) {
                throw new Error(`Champ '${field}' requis`);
            }

            if (expectedType === 'string' && typeof value !== 'string') {
                throw new Error(`Champ '${field}' doit être une chaîne`);
            } else if (expectedType === 'number' && typeof value !== 'number') {
                throw new Error(`Champ '${field}' doit être un nombre`);
            } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
                throw new Error(`Champ '${field}' doit être un booléen`);
            }
        }
    }

    /**
     * Formate une réponse selon la configuration de l'endpoint
     */
    formatResponse(endpointName, data) {
        const endpoint = this.endpoints.get(endpointName);
        if (!endpoint) {
            throw new Error(`Endpoint '${endpointName}' non trouvé`);
        }

        // Appliquer le formatage selon le type de données
        if (Array.isArray(data)) {
            return data.map(item => this.dataFormatter.formatDevice(item));
        } else if (typeof data === 'object') {
            return this.dataFormatter.formatDevice(data);
        }

        return data;
    }

    /**
     * Génère une réponse d'erreur standardisée
     */
    formatError(error, endpointName = null) {
        const errorResponse = {
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            timestamp: new Date().toISOString(),
            endpoint: endpointName
        };

        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = error.stack;
        }

        return errorResponse;
    }

    /**
     * Gère le cache pour les réponses
     */
    getCachedResponse(key) {
        const cached = this.responseCache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            return cached.data;
        }
        return null;
    }

    /**
     * Met en cache une réponse
     */
    setCachedResponse(key, data) {
        this.responseCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Nettoie le cache expiré
     */
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, cached] of this.responseCache.entries()) {
            if ((now - cached.timestamp) >= this.cacheTTL) {
                this.responseCache.delete(key);
            }
        }
    }

    /**
     * Obtient la liste de tous les endpoints
     */
    getAllEndpoints() {
        return Array.from(this.endpoints.entries()).map(([name, config]) => ({
            name,
            method: config.method,
            path: config.path,
            description: config.description,
            responseFormat: config.responseFormat
        }));
    }

    /**
     * Génère la documentation des endpoints
     */
    generateDocumentation() {
        const docs = {
            title: 'API Endpoints Documentation',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            endpoints: this.getAllEndpoints()
        };

        return docs;
    }
}

module.exports = EndpointManager; 