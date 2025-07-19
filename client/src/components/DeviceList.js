import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Tablet, Wifi, Clock, MapPin, Zap, Search, CheckCircle, Circle, Loader, XCircle } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5001/api';

// Configuration des étapes du scan
const SCAN_STEPS = {
    fast: [
        { id: 'arp', name: 'Scan ARP', description: 'Détection des appareils via table ARP', icon: Wifi },
        { id: 'netstat', name: 'Scan netstat', description: 'Connexions réseau actives', icon: Wifi },
        { id: 'ifconfig', name: 'Scan ifconfig', description: 'Interfaces réseau', icon: Wifi },
        { id: 'mistral', name: 'Identification Mistral AI', description: 'Identification des fabricants', icon: Smartphone }
    ],
    complete: [
        { id: 'arp', name: 'Scan ARP', description: 'Détection des appareils via table ARP', icon: Wifi },
        { id: 'netstat', name: 'Scan netstat', description: 'Connexions réseau actives', icon: Wifi },
        { id: 'ifconfig', name: 'Scan ifconfig', description: 'Interfaces réseau', icon: Wifi },
        { id: 'ping', name: 'Ping sweep', description: 'Découverte active sur 254 adresses', icon: Search },
        { id: 'nmap', name: 'Scan nmap', description: 'Découverte avec nmap (si disponible)', icon: Search },
        { id: 'bonjour', name: 'Scan Bonjour', description: 'Services réseau (HTTP, SSH, etc.)', icon: Monitor },
        { id: 'arping', name: 'Scan arping', description: 'Découverte ARP active (si disponible)', icon: Search },
        { id: 'mistral', name: 'Identification Mistral AI', description: 'Identification des fabricants', icon: Smartphone }
    ]
};

function DeviceList({ onScanComplete }) {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [scanMode, setScanMode] = useState('fast'); // 'fast' ou 'complete'
    const [scanTime, setScanTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [scanStartTime, setScanStartTime] = useState(null);
    const [currentStep, setCurrentStep] = useState(null);
    const [completedSteps, setCompletedSteps] = useState(new Set());
    const [commandLogs, setCommandLogs] = useState([]);
    const [socket, setSocket] = useState(null);
    const [hasScanned, setHasScanned] = useState(false);

    useEffect(() => {
        // Ne plus lancer automatiquement le scan au chargement
        // loadDevices();

        // Initialiser Socket.IO pour les logs en temps réel
        const newSocket = io('http://localhost:5001', {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('🔌 Socket.IO connecté au serveur');
        });

        newSocket.on('disconnect', () => {
            console.log('🔌 Socket.IO déconnecté du serveur');
        });

        newSocket.on('connect_error', (error) => {
            console.log('❌ Erreur de connexion Socket.IO:', error);
        });

        newSocket.on('scan-progress', (data) => {
            console.log('📡 Scan progress:', data);
            setCommandLogs(prev => [...prev, {
                step: data.step,
                status: data.status,
                message: data.message,
                timestamp: data.timestamp,
                data: data.data,
                command: data.command
            }]);
        });

        // Ne pas écouter scan-complete ici, seulement dans loadDevices
        // newSocket.on('scan-complete', (data) => {
        //     console.log('✅ Scan complet reçu:', data);
        // });

        newSocket.on('scan-error', (error) => {
            console.log('❌ Erreur de scan reçue:', error);
        });

        // Vérifier l'état de la connexion après 2 secondes
        setTimeout(() => {
            console.log('🔍 État de la connexion Socket.IO après 2s:', newSocket.connected);
            if (!newSocket.connected) {
                console.log('⚠️ Socket.IO non connecté, tentative de reconnexion...');
                newSocket.connect();
            }
        }, 2000);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Timer pour le scan complet
    useEffect(() => {
        let interval;
        if (loading && scanMode === 'complete' && scanStartTime) {
            interval = setInterval(() => {
                const elapsed = (Date.now() - scanStartTime) / 1000;
                setElapsedTime(elapsed);
            }, 100);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [loading, scanMode, scanStartTime]);

    // Simulation des étapes du scan
    useEffect(() => {
        let timeoutId;
        let isActive = true; // Pour éviter les mises à jour après démontage

        if (loading) {
            const steps = SCAN_STEPS[scanMode];
            let stepIndex = 0;

            const simulateNextStep = () => {
                if (!isActive || stepIndex >= steps.length) {
                    // Ne pas mettre currentStep à null ici, laisser le vrai scan se terminer
                    return;
                }

                const currentStep = steps[stepIndex];
                if (isActive) {
                    setCurrentStep(currentStep);
                }

                // Temps variable selon le mode - Ajusté pour correspondre au scan réel
                const stepTime = scanMode === 'fast'
                    ? 1000 + Math.random() * 2000  // 1-3 secondes
                    : 8000 + Math.random() * 12000; // 8-20 secondes par étape

                timeoutId = setTimeout(() => {
                    if (isActive) {
                        setCompletedSteps(prev => new Set([...prev, currentStep.id]));
                        stepIndex++;
                        simulateNextStep();
                    }
                }, stepTime);
            };

            simulateNextStep();
        } else {
            setCurrentStep(null);
            setCompletedSteps(new Set());
        }

        // Nettoyage du timeout lors du démontage ou changement d'état
        return () => {
            isActive = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [loading, scanMode]);

    const formatElapsedTime = (seconds) => {
        if (seconds < 60) {
            return `${seconds.toFixed(1)}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
        }
    };

    const getStepIcon = (stepId, isCompleted, isCurrent) => {
        if (isCompleted) {
            return <CheckCircle className="w-5 h-5 text-green-600" />;
        } else if (isCurrent) {
            return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
        } else {
            return <Circle className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStepStatus = (stepId) => {
        if (completedSteps.has(stepId)) {
            return 'completed';
        } else if (currentStep?.id === stepId) {
            return 'current';
        } else {
            return 'pending';
        }
    };

    const loadDevices = async (mode = scanMode) => {
        try {
            setLoading(true);
            setError(null);
            setScanTime(null);
            setElapsedTime(0);
            setCompletedSteps(new Set());
            setCurrentStep(null);
            setCommandLogs([]); // Réinitialiser les logs

            const startTime = Date.now();
            setScanStartTime(startTime);

            // Utiliser Socket.IO pour recevoir les événements en temps réel
            if (socket) {
                console.log('🔌 Socket.IO disponible, démarrage du scan...');
                console.log('🔌 État de la connexion Socket.IO:', socket.connected);
                // Écouter l'événement de fin de scan
                socket.once('scan-complete', (data) => {
                    console.log('✅ Événement scan-complete reçu:', data);
                    const endTime = Date.now();
                    setScanTime((endTime - startTime) / 1000);
                    setScanStartTime(null);
                    setCurrentStep(null);
                    setLoading(false);
                    setDevices(data.devices || []);
                    setHasScanned(true);
                    console.log('📱 Appareils définis:', data.devices?.length || 0);

                    if (onScanComplete) {
                        onScanComplete();
                    }
                });

                // Écouter les erreurs
                socket.once('scan-error', (error) => {
                    setError('Erreur lors du chargement des appareils');
                    setScanStartTime(null);
                    setCurrentStep(null);
                    setLoading(false);
                });

                // Démarrer le scan via Socket.IO
                socket.emit('start-scan', { mode });
            } else {
                // Fallback vers HTTP si Socket.IO n'est pas disponible
                const endpoint = mode === 'fast' ? '/devices/fast' : '/devices/complete';
                const response = await axios.get(`${API_BASE_URL}${endpoint}`);

                const endTime = Date.now();
                setScanTime((endTime - startTime) / 1000);
                setScanStartTime(null);
                setCurrentStep(null);
                setLoading(false);
                setDevices(response.data);
                setHasScanned(true);

                if (onScanComplete) {
                    onScanComplete();
                }
            }

        } catch (error) {
            console.error('Erreur lors du chargement des appareils:', error);
            setError('Erreur lors du chargement des appareils');
            setScanStartTime(null);
            setCurrentStep(null);
            setLoading(false);
        }
    };

    const handleScanModeChange = (newMode) => {
        setScanMode(newMode);
        // Ne plus lancer automatiquement le scan lors du changement de mode
        // loadDevices(newMode);
    };

    const getDeviceIcon = (deviceType) => {
        const type = deviceType.toLowerCase();
        if (type.includes('phone') || type.includes('mobile')) {
            return <Smartphone className="w-5 h-5" />;
        } else if (type.includes('computer') || type.includes('pc') || type.includes('mac')) {
            return <Monitor className="w-5 h-5" />;
        } else if (type.includes('tablet') || type.includes('ipad')) {
            return <Tablet className="w-5 h-5" />;
        } else {
            return <Wifi className="w-5 h-5" />;
        }
    };

    const getDeviceColor = (deviceType) => {
        const type = deviceType.toLowerCase();
        if (type.includes('apple')) return 'text-blue-600';
        if (type.includes('google')) return 'text-green-600';
        if (type.includes('virtual')) return 'text-purple-600';
        if (type.includes('unknown')) return 'text-gray-600';
        return 'text-orange-600';
    };

    const formatLastSeen = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
        return date.toLocaleDateString();
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Optionnel: afficher une notification
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Wifi className="w-6 h-6 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">Appareils Connectés</h2>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Sélecteur de mode de scan */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Mode:</span>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => handleScanModeChange('fast')}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${scanMode === 'fast'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                <Zap className="w-4 h-4 inline mr-1" />
                                Rapide
                            </button>
                            <button
                                onClick={() => handleScanModeChange('complete')}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${scanMode === 'complete'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                <Search className="w-4 h-4 inline mr-1" />
                                Complet
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => loadDevices(scanMode)}
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Wifi className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Scan en cours...' : 'Scanner'}
                    </button>
                </div>
            </div>

            {/* Indicateur de performance */}
            {scanTime && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-800">
                                Scan {scanMode === 'fast' ? 'rapide' : 'complet'} terminé en {scanTime.toFixed(1)}s
                            </span>
                        </div>
                        <div className="text-blue-600">
                            {devices.length} appareil{devices.length > 1 ? 's' : ''} détecté{devices.length > 1 ? 's' : ''}
                        </div>
                    </div>
                    {scanMode === 'fast' && (
                        <p className="text-xs text-blue-600 mt-1">
                            💡 Le scan complet peut détecter plus d'appareils mais prend plus de temps
                        </p>
                    )}
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {loading && (
                <div className="text-center py-8">
                    <Wifi className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 mb-6">
                        Scan {scanMode === 'fast' ? 'rapide' : 'complet'} en cours...
                        {scanMode === 'complete' && (
                            <span className="block text-sm text-gray-500 mt-1">
                                Cela peut prendre 1-2 minutes pour un scan complet
                            </span>
                        )}
                    </p>

                    {/* Timer pour le scan complet - REMONTÉ VERS LE HAUT */}
                    {scanMode === 'complete' && elapsedTime > 0 && (
                        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg max-w-md mx-auto">
                            <div className="flex items-center justify-center space-x-2 mb-2">
                                <Clock className="w-5 h-5 text-orange-600" />
                                <span className="text-orange-800 font-semibold text-lg">
                                    {formatElapsedTime(elapsedTime)}
                                </span>
                            </div>
                            <p className="text-sm text-orange-600 text-center">
                                ⏳ Scan complet en cours - 7 méthodes de découverte
                            </p>
                        </div>
                    )}

                    {/* Étapes du scan */}
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Étapes du scan {scanMode === 'fast' ? 'rapide' : 'complet'}
                        </h3>
                        <div className="space-y-3">
                            {SCAN_STEPS[scanMode].map((step) => {
                                const status = getStepStatus(step.id);
                                const isCompleted = status === 'completed';
                                const isCurrent = status === 'current';

                                return (
                                    <div
                                        key={step.id}
                                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${isCompleted
                                            ? 'bg-green-50 border-green-200'
                                            : isCurrent
                                                ? 'bg-blue-50 border-blue-200'
                                                : 'bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <div className="flex-shrink-0">
                                            {getStepIcon(step.id, isCompleted, isCurrent)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <h4 className={`font-medium ${isCompleted ? 'text-green-800' : isCurrent ? 'text-blue-800' : 'text-gray-600'
                                                    }`}>
                                                    {step.name}
                                                </h4>
                                                {isCurrent && (
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                        En cours...
                                                    </span>
                                                )}
                                                {/* Affichage du statut de la commande */}
                                                {(() => {
                                                    const stepLogs = commandLogs.filter(log => log.step === step.id);
                                                    const currentLog = stepLogs[stepLogs.length - 1];

                                                    if (currentLog) {
                                                        if (currentLog.status === 'start') {
                                                            return (
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
                                                                    Exécution...
                                                                </span>
                                                            );
                                                        } else if (currentLog.status === 'success') {
                                                            return (
                                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                                    Terminé
                                                                </span>
                                                            );
                                                        } else if (currentLog.status === 'error') {
                                                            return (
                                                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                                                    Erreur
                                                                </span>
                                                            );
                                                        }
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                            <p className={`text-sm ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-500'
                                                }`}>
                                                {step.description}
                                            </p>

                                            {/* Affichage simplifié des commandes */}
                                            {(() => {
                                                const stepLogs = commandLogs.filter(log => log.step === step.id);
                                                const lastLog = stepLogs[stepLogs.length - 1];

                                                if (lastLog) {
                                                    return (
                                                        <div className="mt-2 text-xs">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-gray-600">
                                                                    {stepLogs.length} commande{stepLogs.length > 1 ? 's' : ''} exécutée{stepLogs.length > 1 ? 's' : ''}
                                                                </span>
                                                                {lastLog.status === 'start' && (
                                                                    <Loader className="w-3 h-3 animate-spin text-blue-600" />
                                                                )}
                                                                {lastLog.status === 'success' && (
                                                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                                                )}
                                                                {lastLog.status === 'error' && (
                                                                    <XCircle className="w-3 h-3 text-red-600" />
                                                                )}
                                                            </div>
                                                            {lastLog.message && (
                                                                <div className="text-gray-600 mt-1">
                                                                    {lastLog.message}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>



                        {/* Indicateur de fin de scan */}
                        {completedSteps.size === SCAN_STEPS[scanMode].length && (
                            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-orange-600" />
                                    <span className="text-orange-800 font-semibold text-lg">
                                        Scan réseau terminé !
                                    </span>
                                </div>
                                <div className="flex items-center justify-center space-x-2">
                                    <Loader className="w-4 h-4 text-orange-600 animate-spin" />
                                    <span className="text-orange-700 font-medium">
                                        Identification des fabricants en cours...
                                    </span>
                                </div>
                                <p className="text-sm text-orange-600 mt-2 text-center">
                                    ⏳ Mistral AI identifie chaque appareil (2-5s par appareil)
                                </p>
                                <p className="text-xs text-orange-500 mt-1 text-center">
                                    💡 Cette étape peut prendre 1-2 minutes selon le nombre d'appareils
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!loading && !hasScanned && !error && (
                <div className="text-center py-8">
                    <Wifi className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Aucun scan effectué</p>
                    <p className="text-sm text-gray-500 mb-4">
                        Cliquez sur "Scanner" pour détecter les appareils connectés au réseau
                    </p>

                    {/* Informations sur les modes de scan */}
                    <div className="max-w-md mx-auto mb-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-3">Modes de scan disponibles :</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                                <Zap className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">Rapide :</span>
                                <span className="text-gray-600">3 méthodes, ~10 secondes</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Search className="w-4 h-4 text-orange-600" />
                                <span className="font-medium">Complet :</span>
                                <span className="text-gray-600">7 méthodes, ~1-2 minutes</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => loadDevices(scanMode)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Wifi className="w-4 h-4 inline mr-2" />
                        Lancer le scan
                    </button>
                </div>
            )}

            {/* Affichage quand un scan a été effectué mais aucun appareil trouvé */}
            {!loading && hasScanned && devices.length === 0 && !error && (
                <div className="text-center py-8">
                    <Wifi className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Aucun appareil détecté</p>
                    <p className="text-sm text-gray-500 mb-4">
                        Le scan n'a trouvé aucun appareil connecté au réseau
                    </p>
                    <button
                        onClick={() => loadDevices(scanMode)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Wifi className="w-4 h-4 inline mr-2" />
                        Scanner à nouveau
                    </button>
                </div>
            )}

            {!loading && devices.length > 0 && (
                <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                        {devices.length} appareil{devices.length > 1 ? 's' : ''} connecté{devices.length > 1 ? 's' : ''}
                    </div>

                    <div className="grid gap-4">
                        {devices.map((device, index) => (
                            <div
                                key={`${device.mac}-${device.ip}-${index}`}
                                className={`rounded-lg p-4 border ${device.isLocal
                                    ? 'bg-blue-50 border-blue-300 shadow-md'
                                    : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`${getDeviceColor(device.deviceType)}`}>
                                            {getDeviceIcon(device.deviceType)}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-semibold text-gray-800">
                                                    {device.hostname || 'Appareil inconnu'}
                                                </h3>
                                                {device.isLocal && (
                                                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                                        🏠 Local
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-sm ${getDeviceColor(device.deviceType)}`}>
                                                {device.deviceType}
                                            </p>
                                            {device.manufacturerInfo && device.manufacturerInfo.identified && (
                                                <div className="mt-1">
                                                    <div className="flex items-center space-x-2 text-xs">
                                                        <span className="text-purple-600 font-medium">
                                                            {device.manufacturerInfo.manufacturer}
                                                        </span>
                                                        <span className="text-gray-500">
                                                            ({Math.round(device.manufacturerInfo.confidence * 100)}%)
                                                        </span>
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                                            {device.manufacturerInfo.source}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {device.discoveredBy && (
                                                <div className="mt-1">
                                                    <span className="text-xs text-gray-500">
                                                        Découvert par: {device.discoveredBy}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatLastSeen(device.lastSeen)}</span>
                                        </div>
                                        {device.isActive && (
                                            <div className="flex items-center space-x-1 text-green-600 text-sm">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span>En ligne</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">IP:</span>
                                        <span className="text-gray-700 font-mono">{device.ip}</span>
                                        <button
                                            onClick={() => copyToClipboard(device.ip)}
                                            className="text-blue-600 hover:text-blue-800 text-xs"
                                        >
                                            Copier
                                        </button>
                                    </div>

                                    {device.mac !== 'N/A' && (
                                        <div className="flex items-center space-x-2">
                                            <Wifi className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium">MAC:</span>
                                            <span className="text-gray-700 font-mono">{device.mac}</span>
                                            <button
                                                onClick={() => copyToClipboard(device.mac)}
                                                className="text-blue-600 hover:text-blue-800 text-xs"
                                            >
                                                Copier
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {device.manufacturerInfo && device.manufacturerInfo.identified && device.manufacturerInfo.confidence > 0.7 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <div className="flex items-center space-x-2 text-xs text-green-600">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>Identifié avec confiance élevée ({device.manufacturerInfo.source})</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default DeviceList; 