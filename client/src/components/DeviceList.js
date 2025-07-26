import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Tablet, Wifi, Clock, MapPin, Zap, Search, CheckCircle, Circle, Loader, XCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { validateDevices } from '../utils/validation';

// Configuration des étapes du scan
const SCAN_STEPS = {
    fast: [
        { id: 'arp', name: 'Scan ARP', description: 'Détection des appareils via table ARP', icon: Wifi },
        { id: 'netstat', name: 'Scan netstat', description: 'Connexions réseau actives', icon: Wifi },
        { id: 'dns', name: 'Résolution DNS', description: 'Résolution DNS inversée', icon: Wifi },
        { id: 'quick-ping', name: 'Mini-ping sweep', description: 'Découverte ciblée sur IPs typiques', icon: Search }
    ],
    complete: [
        { id: 'arp', name: 'Scan ARP', description: 'Détection des appareils via table ARP', icon: Wifi },
        { id: 'netstat', name: 'Scan netstat', description: 'Connexions réseau actives', icon: Wifi },
        { id: 'dns', name: 'Résolution DNS', description: 'Résolution DNS inversée', icon: Wifi },
        { id: 'quick-ping', name: 'Mini-ping sweep', description: 'Découverte ciblée sur IPs typiques', icon: Search },
        { id: 'ping', name: 'Ping sweep', description: 'Découverte active sur 254 adresses', icon: Search },
        { id: 'nmap', name: 'Scan nmap', description: 'Découverte avec nmap (si disponible)', icon: Search },
        { id: 'arping', name: 'Scan arping', description: 'Découverte ARP active (si disponible)', icon: Search },
        { id: 'bonjour', name: 'Scan Bonjour', description: 'Services réseau (HTTP, SSH, etc.)', icon: Monitor },
        { id: 'mistral', name: 'Identification Mistral AI', description: 'Identification des fabricants', icon: Smartphone }
    ]
};

/**
 * Composant de liste des appareils connectés
 * Utilise les données passées en props pour une meilleure cohérence
 */
function DeviceList({
    devices = [],
    loading = false,
    error = null,
    scanProgress = { isActive: false, progress: 0, step: '', message: '' },
    onScanComplete,
    onStartScan,
    onCancelScan,
    connectivity = { api: false, socket: false }
}) {
    const [scanMode, setScanMode] = useState('fast');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [scanStartTime, setScanStartTime] = useState(null);
    const [currentStep, setCurrentStep] = useState(null);
    const [completedSteps, setCompletedSteps] = useState(new Set());
    const [copiedText, setCopiedText] = useState(null);

    // Récupérer l'état de connectivité depuis window.connectivity si pas disponible en props
    const [localConnectivity, setLocalConnectivity] = useState(connectivity);

    useEffect(() => {
        const updateConnectivity = () => {
            if (window.connectivity) {
                setLocalConnectivity(window.connectivity);
            }
        };

        // Mettre à jour immédiatement
        updateConnectivity();

        // Écouter les changements de connectivité
        const interval = setInterval(updateConnectivity, 1000);

        return () => clearInterval(interval);
    }, []);

    // Utiliser la connectivité locale si disponible, sinon celle des props
    const currentConnectivity = localConnectivity.socket !== undefined ? localConnectivity : connectivity;

    // Validation des données reçues
    const validatedDevices = React.useMemo(() => {
        try {
            if (!devices || !Array.isArray(devices)) {
                console.warn('⚠️ Données d\'appareils invalides:', devices);
                return [];
            }
            return validateDevices(devices);
        } catch (error) {
            console.error('❌ Erreur de validation des appareils:', error);
            return [];
        }
    }, [devices]);

    // Gestion du temps de scan
    useEffect(() => {
        let interval;
        if (scanProgress?.isActive && scanMode === 'complete' && scanStartTime) {
            interval = setInterval(() => {
                const elapsed = (Date.now() - scanStartTime) / 1000;
                setElapsedTime(elapsed);
            }, 100);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [scanProgress?.isActive, scanMode, scanStartTime]);

    // Écoute des vraies étapes WebSocket au lieu de simulation
    useEffect(() => {
        if (scanProgress?.isActive && scanProgress.step) {
            // Filtrer les étapes non pertinentes pour l'affichage
            const relevantSteps = ['arp', 'netstat', 'dns', 'quick-ping', 'ping', 'nmap', 'arping', 'bonjour', 'mistral'];

            if (relevantSteps.includes(scanProgress.step)) {
                // Mettre à jour l'étape courante basée sur les données WebSocket
                const currentStepData = SCAN_STEPS[scanMode].find(step => step.id === scanProgress.step);
                if (currentStepData) {
                    setCurrentStep(currentStepData);
                }

                // Marquer les étapes comme complétées basées sur le statut
                if (scanProgress.step && scanProgress.message &&
                    (scanProgress.message.includes('terminé') ||
                        scanProgress.message.includes('succès') ||
                        scanProgress.message.includes('appareils') ||
                        scanProgress.message.includes('hostnames résolus') ||
                        scanProgress.message.includes('services'))) {
                    setCompletedSteps(prev => new Set([...prev, scanProgress.step]));
                }
            }
        } else if (!scanProgress?.isActive) {
            setCurrentStep(null);
            setCompletedSteps(new Set());
        }
    }, [scanProgress?.isActive, scanProgress?.step, scanProgress?.message, scanMode]);

    // Gestionnaire de démarrage de scan
    const handleStartScan = async (mode = scanMode) => {
        if (!currentConnectivity.socket) {
            console.warn('⚠️ Socket.IO non disponible pour le scan');
            return;
        }

        try {
            setScanMode(mode);
            setScanStartTime(Date.now());
            setElapsedTime(0);
            setCompletedSteps(new Set());

            await onStartScan(mode);
        } catch (error) {
            console.error('❌ Erreur lors du démarrage du scan:', error);
        }
    };

    // Gestionnaire d'annulation de scan
    const handleCancelScan = async () => {
        try {
            await onCancelScan();
        } catch (error) {
            console.error('❌ Erreur lors de l\'annulation du scan:', error);
        }
    };

    // Gestionnaire de changement de mode
    const handleScanModeChange = (newMode) => {
        setScanMode(newMode);
    };

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

    const getDeviceIcon = (deviceType) => {
        switch (deviceType?.toLowerCase()) {
            case 'smartphone':
            case 'mobile':
                return <Smartphone className="w-5 h-5" />;
            case 'tablet':
                return <Tablet className="w-5 h-5" />;
            case 'computer':
            case 'pc':
            case 'laptop':
                return <Monitor className="w-5 h-5" />;
            default:
                return <Wifi className="w-5 h-5" />;
        }
    };

    const getDeviceColor = (deviceType) => {
        switch (deviceType?.toLowerCase()) {
            case 'smartphone':
            case 'mobile':
                return 'bg-blue-100 text-blue-800';
            case 'tablet':
                return 'bg-purple-100 text-purple-800';
            case 'computer':
            case 'pc':
            case 'laptop':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatLastSeen = (timestamp) => {
        if (!timestamp) return 'Jamais';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Il y a ${diffHours}h`;

        const diffDays = Math.floor(diffHours / 24);
        return `Il y a ${diffDays}j`;
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(text);
            setTimeout(() => setCopiedText(null), 2000);
        } catch (error) {
            console.error('❌ Erreur lors de la copie:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Contrôles de scan */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => handleStartScan('fast')}
                            disabled={scanProgress?.isActive || !currentConnectivity.socket}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Scan rapide
                        </button>
                        <button
                            onClick={() => handleStartScan('complete')}
                            disabled={scanProgress?.isActive || !currentConnectivity.socket}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            Scan complet
                        </button>
                        {scanProgress?.isActive && (
                            <button
                                onClick={handleCancelScan}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Annuler
                            </button>
                        )}
                    </div>
                    <div className="text-sm text-gray-600">
                        {validatedDevices.length} appareils détectés
                    </div>
                </div>

                {/* Sélecteur de mode */}
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">Mode de scan:</span>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleScanModeChange('fast')}
                            className={`px-3 py-1 text-sm rounded-lg ${scanMode === 'fast'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                                }`}
                        >
                            Rapide
                        </button>
                        <button
                            onClick={() => handleScanModeChange('complete')}
                            className={`px-3 py-1 text-sm rounded-lg ${scanMode === 'complete'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                                }`}
                        >
                            Complet
                        </button>
                    </div>
                </div>

                {/* Indicateur de connectivité */}
                {!currentConnectivity.socket && (
                    <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
                        <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm">
                                Socket.IO non disponible - scan en temps réel désactivé
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Progression du scan */}
            {scanProgress?.isActive && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Progression du scan
                            </h3>
                            <span className="text-sm text-gray-600">
                                {formatElapsedTime(elapsedTime)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${scanProgress.progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Étapes du scan */}
                    <div className="space-y-3">
                        {SCAN_STEPS[scanMode].map((step) => {
                            const status = getStepStatus(step.id);
                            const isCompleted = status === 'completed';
                            const isCurrent = status === 'current';

                            return (
                                <div
                                    key={step.id}
                                    className={`flex items-center p-3 rounded-lg ${isCurrent ? 'bg-blue-50 border border-blue-200' : ''
                                        }`}
                                >
                                    <div className="mr-3">
                                        {getStepIcon(step.id, isCompleted, isCurrent)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-800">
                                            {step.name}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {step.description}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Message de progression */}
                    {scanProgress.message && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center">
                                <Loader className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                                <span className="text-sm text-blue-800">{scanProgress.message}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Message d'erreur */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Erreur:</span>
                        <span className="text-sm ml-2">{error}</span>
                    </div>
                </div>
            )}

            {/* Liste des appareils */}
            <div className="grid gap-6">
                {validatedDevices.map((device, index) => (
                    <div
                        key={`${device.ip}-${device.mac}-${index}`}
                        className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-200"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center mb-3">
                                    <div className={`p-2 rounded-lg mr-3 ${getDeviceColor(device.deviceType)}`}>
                                        {getDeviceIcon(device.deviceType)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {device.hostname || device.ip}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {device.manufacturer || 'Fabricant inconnu'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        <span className="font-medium">IP:</span>
                                        <span className="ml-2 font-mono">{device.ip}</span>
                                        <button
                                            onClick={() => copyToClipboard(device.ip)}
                                            className="ml-2 p-1 hover:bg-gray-100 rounded"
                                        >
                                            {copiedText === device.ip ? (
                                                <Check className="w-3 h-3 text-green-600" />
                                            ) : (
                                                <Copy className="w-3 h-3 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex items-center">
                                        <Wifi className="w-4 h-4 mr-2" />
                                        <span className="font-medium">MAC:</span>
                                        <span className="ml-2 font-mono">{device.mac}</span>
                                        <button
                                            onClick={() => copyToClipboard(device.mac)}
                                            className="ml-2 p-1 hover:bg-gray-100 rounded"
                                        >
                                            {copiedText === device.mac ? (
                                                <Check className="w-3 h-3 text-green-600" />
                                            ) : (
                                                <Copy className="w-3 h-3 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span className="font-medium">Dernière vue:</span>
                                        <span className="ml-2">{formatLastSeen(device.lastSeen)}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">Type:</span>
                                        <span className="ml-2 capitalize">{device.deviceType || 'Inconnu'}</span>
                                    </div>
                                </div>

                                {/* Informations supplémentaires */}
                                {device.os && (
                                    <div className="mt-3 text-xs text-gray-500">
                                        <span className="font-medium">OS:</span> {device.os}
                                    </div>
                                )}
                                {device.discoveredBy && (
                                    <div className="mt-1 text-xs text-gray-500">
                                        <span className="font-medium">Découvert par:</span> {device.discoveredBy}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* État de chargement */}
            {loading && (
                <div className="text-center py-8">
                    <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Chargement des appareils...</p>
                </div>
            )}

            {/* Message si aucun appareil */}
            {!loading && validatedDevices.length === 0 && !error && !scanProgress?.isActive && (
                <div className="text-center py-8">
                    <Wifi className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun appareil détecté</p>
                    <p className="text-sm text-gray-500 mb-4">
                        Lancez un scan pour découvrir les appareils connectés au réseau
                    </p>
                    {currentConnectivity.socket && (
                        <button
                            onClick={() => handleStartScan('fast')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Lancer un scan
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default DeviceList; 