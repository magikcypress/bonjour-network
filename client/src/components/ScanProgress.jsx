import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
    CheckCircle,
    XCircle,
    Clock,
    Wifi,
    Activity,
    Server,
    Globe,
    Smartphone,
    Loader
} from 'lucide-react';

const ScanProgress = ({ isVisible, onComplete }) => {
    const [progress, setProgress] = useState({});
    const [currentStep, setCurrentStep] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [socket, setSocket] = useState(null);
    const [commandLogs, setCommandLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('progress'); // 'progress' ou 'logs'

    useEffect(() => {
        if (isVisible && !socket) {
            const newSocket = io('http://localhost:5001');
            setSocket(newSocket);

            newSocket.on('scan-progress', (data) => {
                console.log('📡 Scan progress:', data);
                setProgress(prev => ({
                    ...prev,
                    [data.step]: {
                        status: data.status,
                        message: data.message,
                        timestamp: data.timestamp,
                        data: data.data
                    }
                }));
                setCurrentStep(data.step);

                // Ajouter aux logs de commandes
                setCommandLogs(prev => [...prev, {
                    step: data.step,
                    status: data.status,
                    message: data.message,
                    timestamp: data.timestamp,
                    data: data.data
                }]);

                if (data.status === 'complete' || data.status === 'error') {
                    setIsScanning(false);
                    if (data.status === 'complete' && onComplete) {
                        onComplete();
                    }
                } else if (data.status === 'start') {
                    setIsScanning(true);
                }
            });

            return () => {
                newSocket.disconnect();
            };
        }
    }, [isVisible, socket, onComplete]);

    const getStepIcon = (step) => {
        const icons = {
            'arp-scan': <Activity className="w-4 h-4" />,
            'netstat-scan': <Server className="w-4 h-4" />,
            'ifconfig-scan': <Wifi className="w-4 h-4" />,
            'ping-sweep': <Globe className="w-4 h-4" />,
            'nmap-scan': <Server className="w-4 h-4" />,
            'bonjour-scan': <Smartphone className="w-4 h-4" />,
            'arping-scan': <Activity className="w-4 h-4" />,
            'mistral-ai': <Smartphone className="w-4 h-4" />,
            'scan': <Wifi className="w-4 h-4" />
        };
        return icons[step] || <Activity className="w-4 h-4" />;
    };

    const getStepName = (step) => {
        const names = {
            'arp-scan': 'Scan ARP',
            'netstat-scan': 'Scan Netstat',
            'ifconfig-scan': 'Scan Ifconfig',
            'ping-sweep': 'Ping Sweep',
            'nmap-scan': 'Scan Nmap',
            'bonjour-scan': 'Scan Bonjour',
            'arping-scan': 'Scan Arping',
            'mistral-ai': 'Identification Mistral AI',
            'scan': 'Scan Général'
        };
        return names[step] || step;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'start':
                return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success':
                return 'text-green-600';
            case 'error':
                return 'text-red-600';
            case 'start':
                return 'text-blue-600';
            case 'warning':
                return 'text-yellow-600';
            default:
                return 'text-gray-600';
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Progrès du Scan</h3>
                    <div className="flex items-center space-x-2">
                        {isScanning && (
                            <>
                                <Loader className="w-4 h-4 animate-spin text-blue-500" />
                                <span className="text-sm text-gray-600">En cours...</span>
                            </>
                        )}
                        <span className="text-xs text-gray-500">
                            {commandLogs.length} événements
                        </span>
                    </div>
                </div>

                {/* Onglets */}
                <div className="flex space-x-1 mb-4">
                    <button
                        onClick={() => setActiveTab('progress')}
                        className={`px-3 py-1 text-sm rounded ${activeTab === 'progress'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Progrès
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-3 py-1 text-sm rounded ${activeTab === 'logs'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Logs Backend ({commandLogs.length})
                    </button>
                </div>

                {activeTab === 'progress' ? (
                    <div className="space-y-3">
                        {Object.entries(progress).map(([step, data]) => (
                            <div
                                key={step}
                                className={`p-3 rounded-lg border ${currentStep === step ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    {getStepIcon(step)}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium text-sm">
                                                {getStepName(step)}
                                            </span>
                                            {getStatusIcon(data.status)}
                                            {data.status === 'start' && data.command && (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
                                                    Exécution...
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs mt-1 ${getStatusColor(data.status)}`}>
                                            {data.message}
                                        </p>
                                        {data.command && (
                                            <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                                                <div className="font-medium mb-1 flex items-center">
                                                    💻 Commande exécutée:
                                                    {data.status === 'start' && (
                                                        <Loader className="w-3 h-3 animate-spin text-blue-600 ml-2" />
                                                    )}
                                                </div>
                                                <div className="font-mono text-blue-700 bg-blue-100 p-1 rounded text-xs">
                                                    {data.command}
                                                </div>
                                            </div>
                                        )}
                                        {data.data && (
                                            <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                                <div className="font-medium mb-1 flex items-center">
                                                    📊 Résultats:
                                                    {data.status === 'success' && (
                                                        <CheckCircle className="w-3 h-3 text-green-600 ml-2" />
                                                    )}
                                                </div>
                                                {Object.entries(data.data).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between bg-white p-1 rounded">
                                                        <span className="font-medium text-gray-700">{key}:</span>
                                                        <span className="text-gray-900 font-mono">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {data.timestamp && (
                                            <div className="mt-1 text-xs text-gray-400">
                                                {new Date(data.timestamp).toLocaleTimeString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {commandLogs.map((log, index) => (
                            <div
                                key={index}
                                className={`p-2 rounded text-xs font-mono ${log.status === 'error' ? 'bg-red-50 text-red-700' :
                                    log.status === 'success' ? 'bg-green-50 text-green-700' :
                                        log.status === 'start' ? 'bg-blue-50 text-blue-700' :
                                            'bg-gray-50 text-gray-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-bold">[{log.step}]</span>
                                    <span className="text-gray-500">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="mt-1">
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-block px-1 rounded text-xs ${log.status === 'error' ? 'bg-red-200' :
                                            log.status === 'success' ? 'bg-green-200' :
                                                log.status === 'start' ? 'bg-blue-200' :
                                                    'bg-gray-200'
                                            }`}>
                                            {log.status.toUpperCase()}
                                        </span>
                                        <span className="text-sm">{log.message}</span>
                                        {log.status === 'start' && log.command && (
                                            <Loader className="w-3 h-3 animate-spin text-blue-600" />
                                        )}
                                    </div>
                                </div>
                                {log.command && (
                                    <div className="mt-1 text-gray-600">
                                        <div className="ml-4 font-mono text-xs bg-gray-100 p-1 rounded border-l-2 border-blue-400 pl-2">
                                            💻 {log.command}
                                        </div>
                                    </div>
                                )}
                                {log.data && Object.keys(log.data).length > 0 && (
                                    <div className="mt-1 text-gray-600">
                                        <div className="ml-4 bg-green-50 p-2 rounded border-l-2 border-green-400">
                                            <div className="font-medium text-green-800 mb-1">📊 Résultats:</div>
                                            {Object.entries(log.data).map(([key, value]) => (
                                                <div key={key} className="text-xs">
                                                    <span className="font-medium text-green-700">{key}:</span>
                                                    <span className="text-green-900 font-mono ml-1">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {Object.keys(progress).length === 0 && activeTab === 'progress' && (
                    <div className="text-center py-8">
                        <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                        <p className="text-gray-600">Initialisation du scan...</p>
                    </div>
                )}

                {commandLogs.length === 0 && activeTab === 'logs' && (
                    <div className="text-center py-8">
                        <Server className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">En attente des logs backend...</p>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Étapes complétées: {Object.values(progress).filter(p => p.status === 'success').length}</span>
                        <span>Total: {Object.keys(progress).length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScanProgress; 