import React, { useState, useEffect } from 'react';
import { Wifi, RefreshCw, Signal, Zap } from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';
import NetworkStats from './components/NetworkStats';
import WiFiOptimizer from './components/WiFiOptimizer';

const API_BASE_URL = 'http://localhost:5001/api';

function App() {
    const [networks, setNetworks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Initialiser Socket.IO
        const newSocket = io('http://localhost:5001');
        setSocket(newSocket);

        // Écouter les mises à jour en temps réel
        newSocket.on('networks-updated', (updatedNetworks) => {
            console.log('📡 Réseaux mis à jour via Socket.IO:', updatedNetworks.length, 'réseaux');
            setNetworks(updatedNetworks);
        });

        // Charger les données initiales
        loadNetworks();

        return () => newSocket.close();
    }, []);

    const loadNetworks = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/networks`);
            setNetworks(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des réseaux:', error);
        } finally {
            setLoading(false);
        }
    };



    const requestScan = () => {
        console.log('🔍 Bouton "Scan temps réel" cliqué');
        if (socket) {
            console.log('📡 Émission de l\'événement request-scan via Socket.IO');
            socket.emit('request-scan');
        } else {
            console.error('❌ Socket.IO non connecté');
        }
    };

    const getSignalStrengthColor = (quality) => {
        const strength = parseInt(quality);
        if (strength >= 80) return 'text-green-500';
        if (strength >= 60) return 'text-yellow-500';
        if (strength >= 40) return 'text-orange-500';
        return 'text-red-500';
    };

    const getFrequencyBand = (frequency) => {
        const freq = parseInt(frequency);
        if (freq >= 5000) return '5 GHz';
        if (freq >= 2400) return '2.4 GHz';
        return 'N/A';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Wifi className="w-12 h-12 text-blue-600 mr-4" />
                        <h1 className="text-4xl font-bold text-gray-800">WiFi Tracker</h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        Scanner et gérer les réseaux WiFi de votre appartement
                    </p>
                </div>

                {/* Contrôles */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={loadNetworks}
                                disabled={loading}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Scanner maintenant
                            </button>
                            <button
                                onClick={requestScan}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                Scan temps réel
                            </button>
                        </div>
                        <div className="text-sm text-gray-600">
                            {networks.length} réseaux détectés
                        </div>
                    </div>
                </div>

                {/* Statistiques */}
                {networks.length > 0 && <NetworkStats networks={networks} />}

                {/* Optimisation WiFi */}
                <WiFiOptimizer />

                {/* Réseaux WiFi */}
                <div className="grid gap-6">
                    {networks.map((network, index) => (
                        <div
                            key={`${network.ssid}-${index}`}
                            className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                        <Wifi className="w-5 h-5 text-gray-600 mr-2" />
                                        <h3 className="text-xl font-semibold text-gray-800">
                                            {network.ssid || 'Réseau caché'}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <Signal className="w-4 h-4 mr-2" />
                                            <span className={getSignalStrengthColor(network.signalStrength)}>
                                                Force: {network.signalStrength}%
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Fréquence:</span> {getFrequencyBand(network.frequency)}
                                        </div>
                                        <div>
                                            <span className="font-medium">Sécurité:</span> {network.security || 'Inconnue'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* État de chargement */}
                {loading && (
                    <div className="text-center py-8">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Scan en cours...</p>
                    </div>
                )}

                {/* Message si aucun réseau */}
                {!loading && networks.length === 0 && (
                    <div className="text-center py-8">
                        <Wifi className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Aucun réseau WiFi détecté</p>
                        <button
                            onClick={loadNetworks}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Essayer à nouveau
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App; 