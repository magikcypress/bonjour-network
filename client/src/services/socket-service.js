import io from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.eventListeners = new Map();

        // Forcer l'utilisation de localhost pour éviter les problèmes CORS
        this.baseURL = 'http://localhost:5001';
    }

    connect() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔌 Tentative de connexion Socket.IO vers:', this.baseURL);

                // Si déjà connecté, retourner directement
                if (this.isConnected && this.socket?.connected) {
                    console.log('✅ Socket.IO déjà connecté');
                    resolve(this.socket);
                    return;
                }

                // Nettoyer l'ancienne connexion si elle existe
                if (this.socket) {
                    console.log('🧹 Nettoyage de l\'ancienne connexion Socket.IO');
                    this.socket.disconnect();
                    this.socket = null;
                }

                console.log('🔌 Connexion Socket.IO...');

                // Configuration Socket.IO simplifiée
                this.socket = io(this.baseURL, {
                    transports: ['websocket', 'polling'],
                    timeout: 10000,
                    reconnection: true,
                    reconnectionAttempts: 3,
                    reconnectionDelay: 1000
                });

                this.setupEventHandlers(resolve, reject);
            } catch (error) {
                console.error('❌ Erreur lors de la connexion Socket.IO:', error);
                reject(error);
            }
        });
    }

    setupEventHandlers(resolve, reject) {
        // Connexion réussie
        this.socket.on('connect', () => {
            console.log('✅ Socket.IO connecté:', this.socket.id);
            console.log(`🔌 Socket ID: ${this.socket.id}`);
            console.log(`🌐 URL de connexion: ${this.baseURL}`);
            console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
            this.isConnected = true;
            this.reconnectAttempts = 0;
            resolve(this.socket);
        });

        // Erreur de connexion
        this.socket.on('connect_error', (error) => {
            console.error('❌ Erreur de connexion Socket.IO:', error);
            console.error('❌ Détails de l\'erreur:', {
                message: error.message,
                type: error.type,
                description: error.description,
                context: error.context
            });
            this.isConnected = false;
            reject(error);
        });

        // Déconnexion
        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket.IO déconnecté:', reason);
            console.log(`🔌 Socket ID: ${this.socket.id}`);
            console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
            console.log(`📊 Raison: ${reason}`);
            this.isConnected = false;

            if (reason === 'io server disconnect') {
                // Déconnexion forcée par le serveur
                console.warn('🚫 Déconnexion forcée par le serveur');
            }
        });

        // Événements de scan
        this.setupScanEventHandlers();
    }

    setupScanEventHandlers() {
        // Progression du scan
        this.socket.on('scan-progress', (data) => {
            console.log('📡 Progression du scan:', data);
            console.log(`📊 Étape: ${data.step || 'N/A'}`);
            console.log(`📈 Progression: ${data.progress || 0}%`);
            console.log(`💬 Message: ${data.message || 'N/A'}`);
            console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
            this.emitCustomEvent('scan-progress', data);
        });

        // Scan terminé
        this.socket.on('scan-complete', (data) => {
            console.log('✅ Scan terminé:', data);
            console.log(`📊 Résultats: ${data.devices?.length || 0} appareils détectés`);
            console.log(`⏱️ Durée totale: ${data.duration || 'N/A'}`);
            console.log(`🎯 Type de scan: ${data.scanType || 'N/A'}`);
            console.log(`📈 Progression finale: 100%`);
            this.emitCustomEvent('scan-complete', data);
        });

        // Erreur de scan
        this.socket.on('scan-error', (error) => {
            console.error('❌ Erreur de scan:', error);
            console.error(`🚨 Type d'erreur: ${error.type || 'N/A'}`);
            console.error(`💬 Message d'erreur: ${error.message || 'N/A'}`);
            console.error(`⏱️ Timestamp: ${new Date().toISOString()}`);
            this.emitCustomEvent('scan-error', error);
        });

        // Scan annulé
        this.socket.on('scan-cancelled', () => {
            console.log('🚫 Scan annulé');
            console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
            console.log(`🔌 Socket ID: ${this.socket.id}`);
            this.emitCustomEvent('scan-cancelled');
        });

        // Statut du scan en temps réel
        this.socket.on('real-time-scan-status', (status) => {
            console.log('📡 Statut du scan en temps réel:', status);
            console.log(`🔄 Activé: ${status.enabled ? 'OUI' : 'NON'}`);
            console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
            this.emitCustomEvent('real-time-scan-status', status);
        });

        // Mise à jour des réseaux
        this.socket.on('networks-updated', (networks) => {
            console.log('📡 Réseaux mis à jour:', networks.length);
            console.log(`📊 Nombre de réseaux: ${networks.length}`);
            console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
            this.emitCustomEvent('networks-updated', networks);
        });
    }

    // Émettre un événement personnalisé
    emitCustomEvent(eventName, data) {
        const listeners = this.eventListeners.get(eventName) || [];
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`❌ Erreur dans le listener ${eventName}:`, error);
            }
        });
    }

    // Ajouter un listener d'événement
    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(callback);
    }

    // Supprimer un listener d'événement
    off(eventName, callback) {
        const listeners = this.eventListeners.get(eventName) || [];
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    // Démarrer un scan
    async startScan(mode = 'fast', type = 'devices') {
        try {
            // Si Socket.IO n'est pas connecté, on ne peut pas démarrer via WebSocket
            if (!this.isConnected) {
                console.warn('⚠️ Socket.IO non connecté - démarrage impossible via WebSocket');
                return false;
            }

            console.log(`📡 Démarrage du scan ${mode} (type: ${type})...`);
            console.log(`🔍 Mode de scan: ${mode === 'complete' ? 'COMPLET (8 étapes)' : 'RAPIDE (4 étapes)'}`);
            console.log(`🎯 Type de scan: ${type}`);
            console.log(`🔌 Socket ID: ${this.socket.id}`);

            this.socket.emit('start-scan', { mode, type });

            console.log(`✅ Émission de l'événement 'start-scan' avec:`, { mode, type });
            return true;
        } catch (error) {
            console.error('❌ Erreur lors du démarrage du scan:', error);
            throw error;
        }
    }

    // Annuler un scan
    async cancelScan() {
        try {
            // Si Socket.IO n'est pas connecté, on ne peut pas annuler via WebSocket
            if (!this.isConnected) {
                console.warn('⚠️ Socket.IO non connecté - annulation impossible via WebSocket');
                return false;
            }

            console.log('🚫 Annulation du scan...');
            this.socket.emit('cancel-scan');
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'annulation du scan:', error);
            throw error;
        }
    }

    // Vérifier la connectivité
    isSocketConnected() {
        return this.isConnected && this.socket?.connected;
    }

    // Obtenir l'ID de la socket
    getSocketId() {
        return this.socket?.id;
    }

    // Déconnecter proprement
    disconnect() {
        if (this.socket) {
            console.log('🔌 Déconnexion Socket.IO...');
            this.socket.disconnect();
            this.isConnected = false;
            this.eventListeners.clear();
        }
    }

    // Nettoyer les listeners
    cleanup() {
        this.eventListeners.clear();
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }

    // Obtenir les statistiques de connexion
    getConnectionStats() {
        return {
            connected: this.isConnected,
            socketId: this.getSocketId(),
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            eventListeners: this.eventListeners.size
        };
    }

    // Méthodes pour le scan en temps réel
    startRealTimeScan() {
        if (!this.isSocketConnected()) {
            throw new Error('Socket.IO non connecté');
        }
        console.log('🔄 Démarrage du scan en temps réel...');
        this.socket.emit('start-real-time-scan');
    }

    stopRealTimeScan() {
        if (!this.isSocketConnected()) {
            throw new Error('Socket.IO non connecté');
        }
        console.log('🛑 Arrêt du scan en temps réel...');
        this.socket.emit('stop-real-time-scan');
    }

    getRealTimeScanStatus() {
        if (!this.isSocketConnected()) {
            throw new Error('Socket.IO non connecté');
        }
        console.log('📊 Demande du statut du scan en temps réel...');
        this.socket.emit('get-real-time-scan-status');
    }
}

// Créer une instance unique du service Socket.IO
const socketService = new SocketService();

export default socketService; 