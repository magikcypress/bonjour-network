import React, { useState, useEffect } from 'react';
import { Settings, TrendingUp, AlertTriangle, CheckCircle, Wifi } from 'lucide-react';
import axios from 'axios';

const WiFiOptimizer = () => {
    const [optimizationData, setOptimizationData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchOptimization = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5001/api/optimization');
            setOptimizationData(response.data);
        } catch (error) {
            console.error('Erreur lors de l\'optimisation:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOptimization();
    }, []);

    const getBandColor = (band) => {
        return band === '5GHz' ? 'text-blue-600' : 'text-green-600';
    };

    const getCongestionLevel = (congestion) => {
        if (congestion.averagePerChannel <= 2) return { level: 'Faible', color: 'text-green-600' };
        if (congestion.averagePerChannel <= 4) return { level: 'Modérée', color: 'text-yellow-600' };
        return { level: 'Élevée', color: 'text-red-600' };
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                    <Settings className="w-6 h-6 text-blue-600 mr-2 animate-spin" />
                    <h2 className="text-xl font-semibold text-gray-800">Optimisation WiFi</h2>
                </div>
                <p className="text-gray-600">Analyse en cours...</p>
            </div>
        );
    }

    if (!optimizationData) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                    <Settings className="w-6 h-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-800">Optimisation WiFi</h2>
                </div>
                <p className="text-gray-600">Aucune donnée d'optimisation disponible</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Settings className="w-6 h-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-800">Optimisation WiFi</h2>
                </div>
                <button
                    onClick={fetchOptimization}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Actualiser
                </button>
            </div>

            {/* Recommandations par bande */}
            <div className="grid gap-6 mb-6">
                {Object.entries(optimizationData.recommendations).map(([band, rec]) => {
                    const congestion = getCongestionLevel(rec.congestion);
                    return (
                        <div key={band} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                    <Wifi className={`w-5 h-5 mr-2 ${getBandColor(band)}`} />
                                    <h3 className={`text-lg font-semibold ${getBandColor(band)}`}>
                                        {band}
                                    </h3>
                                </div>
                                <div className="text-sm text-gray-600">
                                    Congestion: <span className={congestion.color}>{congestion.level}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Canal recommandé</h4>
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                        <span className="text-2xl font-bold text-green-600">{rec.recommended}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Canaux alternatifs</h4>
                                    <div className="flex space-x-2">
                                        {rec.alternatives.map((channel, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                            >
                                                {channel}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 text-sm text-gray-600">
                                <p>Réseaux détectés: {rec.congestion.totalNetworks}</p>
                                <p>Canaux utilisés: {rec.congestion.usedChannels}</p>
                                <p>Moyenne par canal: {rec.congestion.averagePerChannel.toFixed(1)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Suggestions d'amélioration */}
            {optimizationData.suggestions.length > 0 && (
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                        Suggestions d'amélioration
                    </h3>
                    <div className="space-y-3">
                        {optimizationData.suggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-700">{suggestion.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Conseils généraux */}
            <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Conseils d'optimisation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Position du routeur</h4>
                        <ul className="space-y-1">
                            <li>• Placez-le au centre de votre espace</li>
                            <li>• Élevez-le à hauteur de poitrine</li>
                            <li>• Évitez les obstacles métalliques</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Configuration</h4>
                        <ul className="space-y-1">
                            <li>• Utilisez le canal recommandé</li>
                            <li>• Activez le WiFi 5GHz si disponible</li>
                            <li>• Mettez à jour le firmware</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WiFiOptimizer; 