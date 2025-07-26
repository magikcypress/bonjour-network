import axios from 'axios';

class ApiService {
    constructor() {
        // Forcer l'utilisation de localhost pour éviter les problèmes CORS
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        this.timeout = 15000;
        this.retryAttempts = 3;
        this.retryDelay = 1000;

        this.setupAxios();
    }

    setupAxios() {
        // Configuration axios avec intercepteurs
        axios.defaults.baseURL = this.baseURL;
        axios.defaults.timeout = this.timeout;
        axios.defaults.headers.common['Content-Type'] = 'application/json';

        // Intercepteur pour les requêtes
        axios.interceptors.request.use(
            (config) => {
                // Ajouter des headers de sécurité
                config.headers['X-Requested-With'] = 'XMLHttpRequest';
                config.headers['X-Client-Version'] = process.env.REACT_APP_VERSION || '1.0.0';

                // Log de la requête (en développement)
                if (process.env.NODE_ENV === 'development') {
                    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
                }

                return config;
            },
            (error) => {
                console.error('❌ Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Intercepteur pour les réponses
        axios.interceptors.response.use(
            (response) => {
                // Log de la réponse (en développement)
                if (process.env.NODE_ENV === 'development') {
                    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
                }
                return response;
            },
            (error) => {
                this.handleApiError(error);
                return Promise.reject(error);
            }
        );
    }

    handleApiError(error) {
        const errorInfo = {
            message: error.message || 'Erreur inconnue',
            status: error.response?.status,
            url: error.config?.url,
            timestamp: new Date().toISOString()
        };

        // Log détaillé des erreurs
        console.error('❌ API Error:', {
            message: errorInfo.message,
            status: errorInfo.status,
            url: errorInfo.url,
            timestamp: errorInfo.timestamp
        });

        // Gestion spécifique des erreurs
        if (error.code === 'ERR_NETWORK') {
            console.warn('🌐 Network Error: Serveur backend non accessible');
        } else if (error.response?.status === 429) {
            console.warn('⏰ Rate Limit: Trop de requêtes');
        } else if (error.response?.status === 403) {
            console.warn('🚫 Forbidden: Accès refusé');
        }
    }

    async makeRequest(config, retryCount = 0) {
        try {
            return await axios(config);
        } catch (error) {
            if (retryCount < this.retryAttempts && this.shouldRetry(error)) {
                console.log(`🔄 Retry attempt ${retryCount + 1}/${this.retryAttempts}`);
                await this.delay(this.retryDelay * (retryCount + 1));
                return this.makeRequest(config, retryCount + 1);
            }
            throw error;
        }
    }

    shouldRetry(error) {
        // Retry sur les erreurs réseau et 5xx
        return error.code === 'ERR_NETWORK' ||
            (error.response?.status >= 500 && error.response?.status < 600);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Health Check
    async healthCheck() {
        try {
            const response = await this.makeRequest({
                method: 'GET',
                url: '/health',
                timeout: 5000
            });
            return response.data;
        } catch (error) {
            throw new Error('Serveur backend non accessible');
        }
    }

    // Obtenir le statut de santé (alias pour healthCheck)
    async getHealth() {
        return this.healthCheck();
    }

    // Obtenir les réseaux (alias pour scanNetworks)
    async getNetworks() {
        return this.scanNetworks();
    }

    // Obtenir les appareils (alias pour scanDevicesFast)
    async getDevices() {
        return this.scanDevicesFast();
    }

    // Scan des réseaux WiFi
    async scanNetworks() {
        try {
            const response = await this.makeRequest({
                method: 'GET',
                url: '/networks',
                timeout: 30000 // Augmenter le timeout à 30 secondes
            });
            return this.validateNetworks(response.data);
        } catch (error) {
            const errorMessage = error.message || 'Erreur lors du scan des réseaux';
            console.error('Erreur lors du scan des réseaux:', errorMessage);
            throw new Error(errorMessage);
        }
    }

    // Scan rapide des appareils
    async scanDevicesFast() {
        try {
            const response = await this.makeRequest({
                method: 'GET',
                url: '/devices/fast',
                timeout: 15000
            });
            return this.validateDevices(response.data);
        } catch (error) {
            console.error('Erreur lors du scan rapide:', error.message || error);
            throw new Error(error.message || 'Erreur lors du scan rapide');
        }
    }

    // Scan complet des appareils
    async scanDevicesComplete() {
        try {
            const response = await this.makeRequest({
                method: 'GET',
                url: '/devices/complete',
                timeout: 30000
            });
            return this.validateDevices(response.data);
        } catch (error) {
            console.error('Erreur lors du scan complet:', error.message || error);
            throw new Error(error.message || 'Erreur lors du scan complet');
        }
    }

    // Compteur d'appareils avec cache
    async getDeviceCount() {
        try {
            const response = await this.makeRequest({
                method: 'GET',
                url: '/devices/count',
                timeout: 10000
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors du chargement du compteur:', error.message || error);
            return { count: 0, cached: true, error: true };
        }
    }

    // Données de test
    async getTestDevices() {
        try {
            const response = await this.makeRequest({
                method: 'GET',
                url: '/devices/test',
                timeout: 5000
            });
            return this.validateDevices(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des données de test:', error.message || error);
            throw new Error(error.message || 'Erreur lors du chargement des données de test');
        }
    }

    // Statistiques du serveur
    async getServerStats() {
        try {
            const response = await this.makeRequest({
                method: 'GET',
                url: '/stats',
                timeout: 5000
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error.message || error);
            throw new Error(error.message || 'Erreur lors du chargement des statistiques');
        }
    }

    // Validation des réseaux WiFi
    validateNetworks(networks) {
        if (!Array.isArray(networks)) {
            console.warn('❌ Les données de réseaux ne sont pas un tableau');
            return [];
        }

        return networks.map(network => ({
            ssid: this.sanitizeString(network.ssid),
            signalStrength: this.sanitizeNumber(network.quality || network.signalStrength, 0, 100),
            frequency: this.sanitizeNumber(network.frequency, 0, 100000),
            security: this.sanitizeString(network.security),
            channel: this.sanitizeNumber(network.channel, 1, 165),
            bssid: this.sanitizeMac(network.bssid),
            mode: this.sanitizeString(network.mode),
            signal_level: this.sanitizeNumber(network.signal_level, -100, 0),
            security_flags: Array.isArray(network.security_flags) ? network.security_flags : []
        })).filter(network => network.ssid); // Ne pas exiger le bssid
    }

    // Validation des appareils
    validateDevices(devices) {
        if (!Array.isArray(devices)) {
            console.warn('❌ Les données d\'appareils ne sont pas un tableau');
            return [];
        }

        return devices.map(device => ({
            ip: this.sanitizeIp(device.ip),
            mac: this.sanitizeMac(device.mac),
            hostname: this.sanitizeString(device.hostname),
            deviceType: this.sanitizeDeviceType(device.deviceType),
            lastSeen: this.sanitizeTimestamp(device.lastSeen),
            isActive: Boolean(device.isActive),
            isLocal: Boolean(device.isLocal),
            manufacturerInfo: this.validateManufacturerInfo(device.manufacturerInfo),
            discoveredBy: this.sanitizeString(device.discoveredBy),
            source: this.sanitizeString(device.source),
            security: this.sanitizeString(device.security)
        })).filter(device => device.ip && device.mac);
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

    sanitizeString(str) {
        if (!str || typeof str !== 'string') return null;
        return str.trim().substring(0, 100) || null;
    }

    sanitizeNumber(num, min, max) {
        const number = Number(num);
        if (isNaN(number)) return null;
        return Math.max(min, Math.min(max, number));
    }

    sanitizeDeviceType(deviceType) {
        if (!deviceType || typeof deviceType !== 'string') return 'Unknown';
        const validTypes = ['Router', 'Smartphone', 'Laptop', 'Desktop', 'Tablet', 'IoT', 'Unknown'];
        return validTypes.includes(deviceType) ? deviceType : 'Unknown';
    }

    sanitizeTimestamp(timestamp) {
        if (!timestamp) return new Date().toISOString();
        try {
            const date = new Date(timestamp);
            return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
        } catch (error) {
            return new Date().toISOString();
        }
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

    // Test de connectivité
    async testConnectivity() {
        try {
            const health = await this.healthCheck();
            return {
                connected: true,
                server: health,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Créer une instance unique du service API
const apiService = new ApiService();

export default apiService; 