import { useState, useEffect, useRef, useMemo } from 'react';
import apiService from '../services/api-service';
import socketService from '../services/socket-service';

export const useDataManager = (activeTab = 'networks') => {
    const [data, setData] = useState({
        networks: [],
        devices: [],
        networkCount: 0,
        deviceCount: 0
    });
    const [loading, setLoading] = useState({
        networks: false,
        devices: false
    });
    const [error, setError] = useState({
        networks: null,
        devices: null
    });
    const [realTimeScan, setRealTimeScan] = useState({
        enabled: false,
        lastUpdate: null
    });
    const [isConnected, setIsConnected] = useState(false);
    const [scanProgress, setScanProgress] = useState(null);

    // Références pour éviter les re-exécutions
    const scanTimeoutRef = useRef(null);
    const realTimeSetupRef = useRef(false); // Nouvelle référence pour la configuration du scan en temps réel

    // Stabiliser les fonctions avec useMemo
    const stableFunctions = useMemo(() => ({
        checkConnectivity: async () => {
            try {
                await apiService.getHealth();
                setIsConnected(true);
                return true;
            } catch (error) {
                console.error('❌ Erreur de connectivité:', error);
                setIsConnected(false);
                return false;
            }
        },
        loadNetworks: async () => {
            try {
                setLoading(prev => ({ ...prev, networks: true }));
                const response = await apiService.getNetworks();
                setData(prevData => ({
                    ...prevData,
                    networks: response || [],
                    networkCount: response?.length || 0
                }));
            } catch (error) {
                const errorMessage = error.message || 'Erreur lors du chargement des réseaux';
                console.error('❌ Erreur lors du chargement des réseaux:', errorMessage);
                setError(prev => ({ ...prev, networks: errorMessage }));
            } finally {
                setLoading(prev => ({ ...prev, networks: false }));
            }
        },
        loadDevices: async () => {
            try {
                setLoading(prev => ({ ...prev, devices: true }));
                const response = await apiService.getDevices();
                setData(prevData => ({
                    ...prevData,
                    devices: response || [],
                    deviceCount: response?.length || 0
                }));
            } catch (error) {
                const errorMessage = error.message || 'Erreur lors du chargement des appareils';
                console.error('❌ Erreur lors du chargement des appareils:', errorMessage);
                setError(prev => ({ ...prev, devices: errorMessage }));
            } finally {
                setLoading(prev => ({ ...prev, devices: false }));
            }
        }
    }), []); // Pas de dépendances pour stabiliser

    // Chargement initial des données et gestion des WebSockets selon la page
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                console.log('🚀 Initialisation de l\'application...');

                // Vérifier la connectivité
                const isHealthy = await stableFunctions.checkConnectivity();
                if (!isHealthy) {
                    throw new Error('Serveur non accessible');
                }

                // Charger les données initiales via API REST
                const [networksResponse, devicesResponse] = await Promise.all([
                    apiService.getNetworks(),
                    apiService.getDevices()
                ]);

                console.log('📊 Réponses API:', {
                    networks: networksResponse,
                    devices: devicesResponse
                });

                setData({
                    networks: networksResponse || [],
                    devices: devicesResponse || [],
                    networkCount: networksResponse?.length || 0,
                    deviceCount: devicesResponse?.length || 0
                });

                console.log('✅ Données initiales chargées via API REST');

                // Gestion des WebSockets selon la page active
                if (activeTab === 'devices') {
                    // Page DeviceList : WebSocket toujours active
                    console.log('🔌 Connexion WebSocket pour la page devices...');
                    if (!socketService.isSocketConnected()) {
                        await socketService.connect();
                    }
                } else if (activeTab === 'networks') {
                    // Page NetworkList : WebSocket inactive par défaut, activable via toggle
                    console.log('📡 Page NetworkList : WebSocket inactive par défaut');
                }

            } catch (error) {
                const errorMessage = error.message || 'Erreur lors du chargement initial';
                console.error('❌ Erreur lors du chargement initial:', errorMessage);
                setError({ networks: errorMessage, devices: null });
            }
        };

        loadInitialData();

        // Cleanup lors du changement de page
        return () => {
            if (activeTab !== 'devices') {
                // Déconnecter WebSocket si on quitte la page devices
                socketService.disconnect();
                console.log('🔌 WebSocket déconnectée (changement de page)');
            }
        };
    }, [stableFunctions, activeTab]); // Ajouter activeTab comme dépendance

    // Fonction pour démarrer un scan avec WebSocket
    const startScan = async (mode = 'fast') => {
        if (scanProgress?.isActive) {
            console.warn('⚠️ Un scan est déjà en cours');
            return;
        }

        try {
            console.log('🔌 Connexion WebSocket pour le scan...');

            // Connecter WebSocket sur les pages devices et networks
            if (activeTab === 'devices' || activeTab === 'networks') {
                if (!socketService.isSocketConnected()) {
                    await socketService.connect();
                }
            } else {
                console.log('⚠️ WebSocket non disponible sur cette page');
                return;
            }

            const started = await socketService.startScan(mode, activeTab === 'networks' ? 'networks' : 'devices');
            if (started) {
                setScanProgress({
                    isActive: true,
                    progress: 0,
                    step: 'initialisation',
                    message: 'Démarrage du scan...'
                });

                setError(prev => ({ ...prev, scan: null }));

                // Configurer les listeners Socket.IO pour le scan
                const handleScanProgress = (data) => {
                    setScanProgress(prev => ({
                        ...prev,
                        progress: data.progress || 0,
                        step: data.step || '',
                        message: data.message || ''
                    }));
                };

                const handleScanComplete = (data) => {
                    setData(prev => ({
                        ...prev,
                        networks: data.networks || [],
                        networkCount: data.networks?.length || 0
                    }));

                    setScanProgress({
                        isActive: false,
                        progress: 100,
                        step: 'complete',
                        message: 'Scan terminé'
                    });

                    console.log(`✅ Scan terminé: ${data.networks?.length || 0} réseaux`);

                    // NE PAS déconnecter WebSocket après le scan en temps réel
                    // socketService.disconnect();

                    // Nettoyer les listeners
                    socketService.off('scan-progress', handleScanProgress);
                    socketService.off('scan-complete', handleScanComplete);
                };

                const handleScanError = (error) => {
                    console.error('❌ Erreur de scan:', error);
                    setError(prev => ({ ...prev, scan: error.message || 'Erreur lors du scan' }));
                    setScanProgress({
                        isActive: false,
                        progress: 0,
                        step: 'error',
                        message: 'Erreur lors du scan'
                    });

                    // Déconnecter WebSocket en cas d'erreur
                    socketService.disconnect();
                    console.log('🔌 WebSocket déconnecté après erreur');

                    // Nettoyer les listeners
                    socketService.off('scan-progress', handleScanProgress);
                    socketService.off('scan-complete', handleScanComplete);
                    socketService.off('scan-error', handleScanError);
                };

                // Ajouter les listeners
                socketService.on('scan-progress', handleScanProgress);
                socketService.on('scan-complete', handleScanComplete);
                socketService.on('scan-error', handleScanError);

                // Timeout de sécurité
                scanTimeoutRef.current = setTimeout(() => {
                    if (scanProgress?.isActive) {
                        console.warn('⏰ Timeout du scan');
                        handleScanError({ message: 'Timeout du scan' });
                    }
                }, 60000); // 60 secondes
            } else {
                console.log('⚠️ Démarrage impossible - WebSocket non connecté');
            }
        } catch (error) {
            console.error('❌ Erreur lors du démarrage du scan:', error);
            setError(prev => ({ ...prev, scan: error.message }));
            setScanProgress({
                isActive: false,
                progress: 0,
                step: 'error',
                message: 'Erreur lors du démarrage du scan'
            });
        }
    };

    // Annuler le scan
    const cancelScan = async () => {
        if (!scanProgress?.isActive) return;

        try {
            // Sur les pages devices et networks
            if (activeTab !== 'devices' && activeTab !== 'networks') {
                console.log('⚠️ WebSocket non disponible sur cette page');
                return;
            }

            const cancelled = await socketService.cancelScan();
            if (cancelled) {
                setScanProgress({
                    isActive: false,
                    progress: 0,
                    step: 'cancelled',
                    message: 'Scan annulé'
                });

                // Déconnecter WebSocket seulement si on n'est pas sur la page devices
                if (activeTab !== 'devices') {
                    socketService.disconnect();
                    console.log('🔌 WebSocket déconnectée après annulation');
                } else {
                    console.log('🔌 WebSocket maintenue active pour la page devices');
                }

                // Nettoyer le timeout
                if (scanTimeoutRef.current) {
                    clearTimeout(scanTimeoutRef.current);
                    scanTimeoutRef.current = null;
                }

                console.log('🚫 Scan annulé');
            } else {
                console.log('⚠️ Annulation impossible - WebSocket non connecté');
                // Annuler localement même si WebSocket n'est pas connecté
                setScanProgress({
                    isActive: false,
                    progress: 0,
                    step: 'cancelled',
                    message: 'Scan annulé (local)'
                });
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'annulation du scan:', error);
        }
    };

    // Fonctions pour contrôler le scan en temps réel (seulement quand toggle activé)
    const startRealTimeScan = async () => {
        try {
            console.log('🔌 Démarrage du scan en temps réel...');
            console.log('📊 État actuel:', { activeTab, socketConnected: socketService.isSocketConnected() });

            // Connecter WebSocket seulement sur la page des réseaux
            if (activeTab === 'networks') {
                if (!socketService.isSocketConnected()) {
                    console.log('🔌 Connexion WebSocket...');
                    await socketService.connect();
                    console.log('✅ WebSocket connecté');
                } else {
                    console.log('✅ WebSocket déjà connecté');
                }
            } else {
                console.log('⚠️ WebSocket non disponible sur cette page');
                return;
            }

            // Configuration unique du scan en temps réel
            if (!realTimeSetupRef.current) {
                console.log('🔌 Configuration du scan en temps réel...');
                realTimeSetupRef.current = true;

                const handleRealTimeScanStatus = (status) => {
                    console.log('📡 Statut du scan en temps réel reçu:', status);
                    setRealTimeScan(prev => ({
                        ...prev,
                        enabled: status.enabled,
                        lastUpdate: new Date().toISOString()
                    }));
                };

                const handleNetworksUpdated = (networks) => {
                    console.log(`📡 Réseaux mis à jour: ${networks.length} réseaux`);
                    setData(prevData => ({
                        ...prevData,
                        networks: networks,
                        networkCount: networks.length
                    }));
                };

                // Écouter les événements Socket.IO
                socketService.on('real-time-scan-status', handleRealTimeScanStatus);
                socketService.on('networks-updated', handleNetworksUpdated);

                // Demander le statut actuel
                try {
                    socketService.getRealTimeScanStatus();
                } catch (error) {
                    console.warn('⚠️ Impossible de récupérer le statut du scan en temps réel:', error);
                }
            }

            console.log('🔄 Envoi de la demande de scan en temps réel...');
            await socketService.startRealTimeScan();
            console.log('✅ Demande de scan en temps réel envoyée');
        } catch (error) {
            console.error('❌ Erreur lors du démarrage du scan en temps réel:', error);
        }
    };

    const stopRealTimeScan = async () => {
        try {
            // Seulement sur la page des réseaux
            if (activeTab !== 'networks') {
                console.log('⚠️ WebSocket non disponible sur cette page');
                return;
            }

            await socketService.stopRealTimeScan();

            // Déconnecter WebSocket seulement si on n'est pas sur la page devices
            if (activeTab !== 'devices') {
                socketService.disconnect();
                console.log('🔌 WebSocket déconnectée après arrêt du scan en temps réel');
            } else {
                console.log('🔌 WebSocket maintenue active pour la page devices');
            }

            realTimeSetupRef.current = false;
        } catch (error) {
            console.error('❌ Erreur lors de l\'arrêt du scan en temps réel:', error);
        }
    };

    // Stabiliser l'objet connectivity avec useMemo
    const socketConnected = socketService.isSocketConnected();
    const connectivity = useMemo(() => ({
        api: isConnected,
        socket: socketConnected,
        lastCheck: new Date().toISOString()
    }), [isConnected, socketConnected]);

    return {
        // État
        data,
        loading,
        error,
        scanProgress,
        realTimeScan,
        connectivity,

        // Actions
        loadNetworks: stableFunctions.loadNetworks,
        loadDevices: stableFunctions.loadDevices,
        startScan,
        cancelScan,
        startRealTimeScan,
        stopRealTimeScan,
        checkConnectivity: stableFunctions.checkConnectivity
    };
}; 