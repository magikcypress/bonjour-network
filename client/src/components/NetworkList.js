import React from 'react';
import { Wifi, RefreshCw, Signal, AlertCircle, AlertTriangle } from 'lucide-react';
import NetworkStats from './NetworkStats';
import { validateNetworks } from '../utils/validation';

/**
 * Composant de liste des réseaux WiFi
 * Utilise les données passées en props pour une meilleure cohérence
 */
function NetworkList({
    networks = [],
    loading = false,
    error = null,
    onRefresh,
    startScan,
    connectivity = { api: false, socket: false }
}) {
    // Validation des données reçues
    const validatedNetworks = React.useMemo(() => {
        try {
            return validateNetworks(networks);
        } catch (error) {
            console.error('❌ Erreur de validation des réseaux:', error);
            return [];
        }
    }, [networks]);

    // Réseaux non validés (détectés mais rejetés par la validation)
    const invalidNetworks = React.useMemo(() => {
        try {
            const validatedIds = new Set(validatedNetworks.map(n => `${n.ssid}-${n.bssid}`));
            return networks.filter(network => {
                const networkId = `${network.ssid}-${network.bssid}`;
                return !validatedIds.has(networkId);
            });
        } catch (error) {
            console.error('❌ Erreur lors du calcul des réseaux invalides:', error);
            return [];
        }
    }, [networks, validatedNetworks]);

    // Gestionnaire de scan manuel
    const handleManualScan = async () => {
        if (!connectivity.api) {
            console.warn('⚠️ API non disponible pour le scan');
            return;
        }

        try {
            console.log('🔍 Démarrage du scan manuel...');
            // Utiliser onRefresh pour un scan via API REST
            await onRefresh();
        } catch (error) {
            console.error('❌ Erreur lors du scan manuel:', error);
        }
    };

    const getSignalStrengthColor = (quality) => {
        if (!quality || isNaN(quality)) return 'text-gray-400';

        const strength = parseInt(quality);
        if (strength >= 80) return 'text-green-500';
        if (strength >= 60) return 'text-yellow-500';
        if (strength >= 40) return 'text-orange-500';
        return 'text-red-500';
    };

    const getFrequencyBand = (frequency) => {
        if (!frequency || isNaN(frequency)) return 'N/A';

        const freq = parseInt(frequency);
        if (freq >= 5000) return '5 GHz';
        if (freq >= 2400) return '2.4 GHz';
        return 'N/A';
    };

    const formatSSID = (ssid) => {
        if (!ssid || ssid.trim() === '') return 'Réseau caché';
        return ssid.length > 32 ? `${ssid.substring(0, 32)}...` : ssid;
    };

    return (
        <div className="space-y-6">
            {/* Contrôles */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleManualScan}
                            disabled={loading || !connectivity.api}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Scanner maintenant
                        </button>
                    </div>

                    <div className="text-sm text-gray-600">
                        {networks.length} réseaux détectés ({validatedNetworks.length} validés)
                    </div>
                </div>

                {/* Indicateur de connectivité */}
                {!connectivity.api && (
                    <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
                        <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm">
                                Mode hors ligne - données en cache
                            </span>
                        </div>
                    </div>
                )}
            </div>

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

            {/* Statistiques */}
            {validatedNetworks.length > 0 && <NetworkStats networks={validatedNetworks} />}

            {/* Réseaux WiFi validés */}
            <div className="grid gap-6">
                {validatedNetworks.map((network, index) => (
                    <div
                        key={`${network.ssid}-${network.bssid}-${index}`}
                        className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-200"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center mb-2">
                                    <Wifi className="w-5 h-5 text-gray-600 mr-2" />
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        {formatSSID(network.ssid)}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <Signal className="w-4 h-4 mr-2" />
                                        <span className={getSignalStrengthColor(network.signalStrength)}>
                                            Force: {network.signalStrength || 'N/A'}%
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium">Fréquence:</span> {getFrequencyBand(network.frequency)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Sécurité:</span> {network.security || 'Inconnue'}
                                    </div>
                                </div>

                                {/* Informations supplémentaires */}
                                {network.bssid && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        <span className="font-medium">BSSID:</span> {network.bssid}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Réseaux WiFi non validés */}
            {invalidNetworks.length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center mb-4">
                        <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-800">
                            Réseaux détectés mais non validés ({invalidNetworks.length})
                        </h2>
                    </div>

                    <div className="grid gap-4">
                        {invalidNetworks.map((network, index) => (
                            <div
                                key={`invalid-${network.ssid}-${network.bssid}-${index}`}
                                className="bg-orange-50 border border-orange-200 rounded-lg p-4 border-l-4 border-orange-400"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
                                            <h3 className="text-lg font-medium text-gray-800">
                                                {formatSSID(network.ssid || 'Réseau inconnu')}
                                            </h3>
                                        </div>

                                        <div className="text-sm text-gray-600">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <div>
                                                    <span className="font-medium">BSSID:</span> {network.bssid || 'N/A'}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Canal:</span> {network.channel || 'N/A'}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Fréquence:</span> {network.frequency || 'N/A'}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Sécurité:</span> {network.security || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-2 text-xs text-orange-600">
                                            <span className="font-medium">Raison:</span> Données incomplètes ou invalides
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* État de chargement */}
            {loading && (
                <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Scan en cours...</p>
                </div>
            )}

            {/* Message si aucun réseau */}
            {!loading && validatedNetworks.length === 0 && !error && (
                <div className="text-center py-8">
                    <Wifi className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun réseau WiFi détecté</p>
                    {connectivity.api && (
                        <button
                            onClick={handleManualScan}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Scanner Maintenant
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default NetworkList; 