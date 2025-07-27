import React, { useState } from 'react';
import { Globe, Server, History, RefreshCw, AlertCircle, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

/**
 * Composant DNS & Services
 * Affiche les résultats des scans DNS et services réseau
 */
function DnsServicesList({
    dnsData = {},
    servicesData = {},
    historyData = {},
    loading = false,
    error = null,
    onRefresh,
    onStartScan
}) {
    const { hosts = [], statistics = {} } = dnsData;
    const { services = [], bonjour = [] } = servicesData;
    const { cache = [], recent = [] } = historyData;

    // État pour afficher/masquer les hôtes en échec
    const [showFailedHosts, setShowFailedHosts] = useState(false);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'open':
            case 'resolved':
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'closed':
            case 'failed':
            case 'error':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open':
            case 'resolved':
            case 'success':
                return 'text-green-600 bg-green-100';
            case 'closed':
            case 'failed':
            case 'error':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-yellow-600 bg-yellow-100';
        }
    };

    return (
        <div className="space-y-6">
            {/* Contrôles */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onStartScan}
                            disabled={loading}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Scanner DNS & Services
                        </button>

                        {/* Toggle pour afficher/masquer les hôtes en échec */}
                        {hosts.filter(host => !host.resolved).length > 0 && (
                            <button
                                onClick={() => setShowFailedHosts(!showFailedHosts)}
                                className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                                {showFailedHosts ? (
                                    <>
                                        <EyeOff className="w-4 h-4 mr-2" />
                                        Masquer les échecs
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Voir tous les hôtes
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="text-sm text-gray-600">
                        {hosts.filter(host => host.resolved).length} hôtes résolus, {hosts.filter(host => !host.resolved).length} échecs
                    </div>
                </div>
            </div>

            {/* Métriques DNS en haut de page */}
            {hosts.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-blue-600">{statistics.total || 0}</div>
                            <div className="text-sm text-gray-600">Total</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">{statistics.resolved || 0}</div>
                            <div className="text-sm text-gray-600">Résolus</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">{statistics.failed || 0}</div>
                            <div className="text-sm text-gray-600">Échecs</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-600">{statistics.avgTime || 0}ms</div>
                            <div className="text-sm text-gray-600">Temps moyen</div>
                        </div>
                    </div>
                    {!showFailedHosts && hosts.filter(host => !host.resolved).length > 0 && (
                        <div className="mt-3 text-center">
                            <p className="text-sm text-gray-600">
                                💡 Utilisez "Voir tous les hôtes" pour afficher les {hosts.filter(host => !host.resolved).length} hôtes en échec
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Erreur */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                        <span className="text-red-800">{error}</span>
                    </div>
                </div>
            )}

            {/* Section 1 : Résolution DNS */}
            <div className="bg-white rounded-lg shadow-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Globe className="w-5 h-5 mr-2" />
                        Résolution DNS
                    </h3>
                </div>
                <div className="p-6">
                    {hosts.length > 0 ? (
                        <div className="space-y-6">
                            {/* Hôtes résolus */}
                            {hosts.filter(host => host.resolved).length > 0 && (
                                <div>
                                    <h4 className="text-md font-medium text-green-700 mb-3 flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Hôtes résolus ({hosts.filter(host => host.resolved).length})
                                    </h4>
                                    <div className="space-y-2">
                                        {hosts.filter(host => host.resolved).map((host, index) => (
                                            <div key={`resolved-${index}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                                <div className="flex items-center space-x-3">
                                                    {getStatusIcon('resolved')}
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">{host.name}</div>
                                                        <div className="text-sm text-gray-500">{host.ip}</div>
                                                        {host.details && (
                                                            <div className="text-xs text-green-600 mt-1">
                                                                {host.details.explanation}
                                                                {/* Debug: {JSON.stringify(host.details)} */}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full text-green-600 bg-green-100">
                                                        Résolu
                                                    </span>
                                                    {host.time && (
                                                        <span className="text-xs text-gray-500">{host.time}ms</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Hôtes en échec (conditionnel) */}
                            {hosts.filter(host => !host.resolved).length > 0 && showFailedHosts && (
                                <div>
                                    <h4 className="text-md font-medium text-red-700 mb-3 flex items-center">
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Hôtes en échec ({hosts.filter(host => !host.resolved).length})
                                    </h4>
                                    <div className="space-y-2">
                                        {hosts.filter(host => !host.resolved).map((host, index) => (
                                            <div key={`failed-${index}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                                                <div className="flex items-center space-x-3">
                                                    {getStatusIcon('failed')}
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">{host.name}</div>
                                                        <div className="text-sm text-gray-500">{host.ip || 'Non résolu'}</div>
                                                        {host.details && (
                                                            <div className="text-xs text-red-600 mt-1">
                                                                {host.details.explanation}
                                                                {/* Debug: {JSON.stringify(host.details)} */}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full text-red-600 bg-red-100">
                                                        Échec
                                                    </span>
                                                    {host.time && (
                                                        <span className="text-xs text-gray-500">{host.time}ms</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Aucun hôte DNS détecté</p>
                            <p className="text-sm text-gray-500 mb-4">
                                Cliquez sur "Scanner DNS & Services" pour commencer
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 2 : Services Découverts */}
            <div className="bg-white rounded-lg shadow-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Server className="w-5 h-5 mr-2" />
                        Services Découverts
                    </h3>
                </div>
                <div className="p-6">
                    {services.length > 0 || bonjour.length > 0 ? (
                        <div className="space-y-4">
                            {/* Services standards */}
                            {services.map((service, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        {getStatusIcon(service.status)}
                                        <div>
                                            <div className="font-medium text-gray-900">{service.name}</div>
                                            <div className="text-sm text-gray-500">{service.host}:{service.port}</div>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(service.status)}`}>
                                        {service.status === 'open' ? 'Ouvert' : 'Fermé'}
                                    </span>
                                </div>
                            ))}

                            {/* Services Bonjour */}
                            {bonjour.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Services Bonjour</h4>
                                    {bonjour.map((service, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg mb-2">
                                            <div className="flex items-center space-x-3">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                <div>
                                                    <div className="font-medium text-gray-900">{service.name}</div>
                                                    <div className="text-sm text-gray-500">{service.service} (port {service.port})</div>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600">
                                                Bonjour
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Server className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Aucun service détecté</p>
                            <p className="text-sm text-gray-500 mb-4">
                                Cliquez sur "Scanner DNS & Services" pour commencer
                            </p>
                        </div>
                    )}
                </div>
            </div>



            {/* Section 4 : Historique */}
            <div className="bg-white rounded-lg shadow-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <History className="w-5 h-5 mr-2" />
                        Historique DNS
                    </h3>
                </div>
                <div className="p-6">
                    {cache.length > 0 || recent.length > 0 ? (
                        <div className="space-y-4">
                            {/* Cache DNS */}
                            {cache.length > 0 && (
                                <div>
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Cache DNS</h4>
                                    {cache.slice(0, 5).map((entry, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                                                <div className="text-xs text-gray-500">{entry.ip}</div>
                                            </div>
                                            <span className="text-xs text-gray-500">{entry.ttl}s</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Résolutions récentes */}
                            {recent.length > 0 && (
                                <div>
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Résolutions récentes</h4>
                                    {recent.slice(0, 5).map((entry, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded mb-2">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                                                <div className="text-xs text-gray-500">{entry.ip}</div>
                                            </div>
                                            <span className="text-xs text-gray-500">{entry.timestamp}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Aucun historique disponible</p>
                            <p className="text-sm text-gray-500 mb-4">
                                L'historique sera disponible après les premiers scans
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DnsServicesList; 