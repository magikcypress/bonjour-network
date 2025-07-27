import { useState, useEffect, useRef, useMemo } from 'react';
import apiService from '../services/api-service';
import socketService from '../services/socket-service';

export const useDataManager = (activeTab = 'networks') => {
    console.log(`[useDataManager] Hook appelé avec activeTab =`, activeTab);
    const [data, setData] = useState({
        networks: [],
        devices: [],
        dnsData: {},
        servicesData: {},
        portsData: {},
        historyData: {},
        networkCount: 0,
        deviceCount: 0
    });
    const [loading, setLoading] = useState({
        networks: false,
        devices: false,
        dns: false
    });
    const [error, setError] = useState({
        networks: null,
        devices: null,
        dns: null
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

    // Fonctions de base
    const checkConnectivity = async () => {
        try {
            await apiService.getHealth();
            setIsConnected(true);
            return true;
        } catch (error) {
            console.error('❌ Erreur de connectivité:', error);
            setIsConnected(false);
            return false;
        }
    };

    const loadNetworks = async () => {
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
    };

    const loadDevices = async () => {
        try {
            setLoading(prev => ({ ...prev, devices: true }));
            const response = await apiService.getDevices();

            // Log de débogage pour voir les données reçues
            console.log('🔍 Données appareils reçues:', response);
            if (response && response.length > 0) {
                console.log('📱 Premier appareil:', {
                    ip: response[0].ip,
                    manufacturer: response[0].manufacturer,
                    deviceType: response[0].deviceType,
                    manufacturerInfo: response[0].manufacturerInfo
                });
            }

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
    };

    const loadDnsServices = async () => {
        try {
            setLoading(prev => ({ ...prev, dns: true }));
            const response = await apiService.getDnsServices();

            console.log('🔍 Données DNS & Services reçues:', response);

            setData(prevData => ({
                ...prevData,
                dnsData: response.dnsData || {},
                servicesData: response.servicesData || {},
                historyData: response.historyData || {}
            }));
        } catch (error) {
            const errorMessage = error.message || 'Erreur lors du chargement DNS & Services';
            console.error('❌ Erreur lors du chargement DNS & Services:', errorMessage);
            setError(prev => ({ ...prev, dns: errorMessage }));
        } finally {
            setLoading(prev => ({ ...prev, dns: false }));
        }
    };

    // Chargement initial des données et gestion des WebSockets selon la page
    useEffect(() => {
        console.log(`[useDataManager] useEffect déclenché avec activeTab =`, activeTab);
        const loadInitialData = async () => {
            try {
                console.log(`[useDataManager] loadInitialData lancé pour activeTab =`, activeTab);
                console.log(`🚀 Initialisation de l'application pour la page: ${activeTab}`);

                // Vérifier la connectivité
                const isHealthy = await checkConnectivity();
                if (!isHealthy) {
                    throw new Error('Serveur non accessible');
                }

                // Charger seulement les données de base (pas de scan automatique)
                console.log('📊 Chargement des données de base (sans scan automatique)...');

                // Initialiser avec des données vides
                setData({
                    networks: [],
                    devices: [],
                    networkCount: 0,
                    deviceCount: 0
                });

                console.log('✅ Application initialisée - Scans disponibles via boutons');

                // Gestion des WebSockets selon la page active
                console.log(`🔍 Page active détectée: ${activeTab}`);
                console.log(`🔌 État WebSocket actuel: ${socketService.isSocketConnected() ? 'CONNECTÉ' : 'DÉCONNECTÉ'}`);

                // WebSocket active sur toutes les pages pour une meilleure UX
                if (activeTab === 'devices' || activeTab === 'networks') {
                    console.log('🔌 Connexion WebSocket pour une meilleure UX temps réel...');

                    // Forcer la connexion WebSocket pour toutes les pages
                    try {
                        if (!socketService.isSocketConnected()) {
                            console.log('🔌 Tentative de connexion WebSocket...');
                            await socketService.connect();
                            console.log(`🔌 État WebSocket après connexion: ${socketService.isSocketConnected() ? 'CONNECTÉ' : 'DÉCONNECTÉ'}`);

                            // Mettre à jour l'état de connectivité immédiatement
                            setSocketConnected(socketService.isSocketConnected());
                        } else {
                            console.log('✅ WebSocket déjà connectée pour une meilleure UX');
                        }
                    } catch (error) {
                        console.error('❌ Erreur lors de la connexion WebSocket:', error);
                        setSocketConnected(false);
                    }
                } else if (activeTab === 'dns') {
                    console.log('🌐 Page DNS & Services - pas de WebSocket nécessaire');
                    // Pour DNS & Services, pas de chargement automatique
                } else {
                    // Pour les autres pages, déconnecter WebSocket
                    if (socketService.isSocketConnected()) {
                        socketService.disconnect();
                        setSocketConnected(false);
                        console.log('🔌 WebSocket déconnectée (page non supportée)');
                    }
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
            // Déconnecter WebSocket seulement si on quitte toutes les pages supportées
            if (activeTab !== 'devices' && activeTab !== 'networks') {
                socketService.disconnect();
                console.log('🔌 WebSocket déconnectée (changement vers page non supportée)');
            }
        };
    }, [activeTab]); // Seulement activeTab comme dépendance

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
                    console.log('📊 Données reçues du scan:', data);

                    // Traiter les réseaux ET les appareils
                    setData(prev => {
                        const newData = {
                            ...prev,
                            networks: data.networks || prev.networks || [],
                            devices: data.devices || prev.devices || [],
                            networkCount: data.networks?.length || prev.networkCount || 0,
                            deviceCount: data.devices?.length || prev.deviceCount || 0
                        };

                        console.log('🔄 Mise à jour des données:', {
                            devices: newData.devices?.length || 0,
                            networks: newData.networks?.length || 0
                        });

                        // Log détaillé des appareils pour debug
                        if (newData.devices && newData.devices.length > 0) {
                            console.log('📱 Appareils avec fabricants:');
                            newData.devices.forEach((device, index) => {
                                console.log(`  ${index + 1}. ${device.ip}: ${device.manufacturer || 'N/A'} (${device.deviceType || 'N/A'})`);
                                console.log(`     Structure complète:`, JSON.stringify(device, null, 2));
                            });
                        }

                        return newData;
                    });

                    setScanProgress({
                        isActive: false,
                        progress: 100,
                        step: 'complete',
                        message: 'Scan terminé'
                    });

                    console.log(`✅ Scan terminé: ${data.networks?.length || 0} réseaux, ${data.devices?.length || 0} appareils`);

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
    const [socketConnected, setSocketConnected] = useState(socketService.isSocketConnected());

    // Mettre à jour socketConnected quand l'état change
    useEffect(() => {
        const updateSocketStatus = () => {
            const isConnected = socketService.isSocketConnected();
            setSocketConnected(isConnected);
            console.log(`🔌 État WebSocket mis à jour: ${isConnected ? 'CONNECTÉ' : 'DÉCONNECTÉ'}`);
        };

        // Mettre à jour immédiatement
        updateSocketStatus();

        // Écouter les changements de connexion
        const handleConnect = () => {
            console.log('🔌 Événement connect détecté');
            setSocketConnected(true);
        };

        const handleDisconnect = () => {
            console.log('🔌 Événement disconnect détecté');
            setSocketConnected(false);
        };

        const handleConnectError = (error) => {
            console.error('❌ Erreur de connexion WebSocket:', error);
            setSocketConnected(false);
        };

        socketService.on('connect', handleConnect);
        socketService.on('disconnect', handleDisconnect);
        socketService.on('connect_error', handleConnectError);

        return () => {
            socketService.off('connect', handleConnect);
            socketService.off('disconnect', handleDisconnect);
            socketService.off('connect_error', handleConnectError);
        };
    }, []);

    const connectivity = useMemo(() => ({
        api: isConnected,
        socket: socketConnected,
        lastCheck: new Date().toISOString()
    }), [isConnected, socketConnected]);

    // Exposer l'objet connectivity globalement pour qu'il soit accessible depuis les composants
    useEffect(() => {
        window.connectivity = connectivity;
        console.log('🌐 État connectivité exposé globalement:', connectivity);
    }, [connectivity]);

    return {
        // État
        data,
        loading,
        error,
        scanProgress,
        realTimeScan,
        connectivity,

        // Actions
        loadNetworks,
        loadDevices,
        loadDnsServices,
        startScan,
        cancelScan,
        startRealTimeScan,
        stopRealTimeScan,
        checkConnectivity
    };
}; 