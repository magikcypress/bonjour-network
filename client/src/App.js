import React, { useState, useEffect } from 'react';
import { useDataManager } from './hooks/useDataManager';
import { useMetricsStorage } from './hooks/useMetricsStorage';
import { ThemeProvider } from './contexts/ThemeContext';
import TabNavigation from './components/TabNavigation';
import NetworkList from './components/NetworkList';
import DeviceList from './components/DeviceList';
import DnsServicesList from './components/DnsServicesList';
import Footer from './components/Footer';

/**
 * Composant principal de l'application WiFi Tracker
 * Utilise les services et hooks refactorisés pour une gestion cohérente des données
 */
function App() {
    const [activeTab, setActiveTab] = useState('networks');

    // Utiliser le hook de gestion des données
    const {
        data,
        loading,
        error,
        scanProgress,
        realTimeScan,
        connectivity: dataManagerConnectivity,
        loadNetworks,
        loadDevices,
        loadDnsServices,
        startScan,
        cancelScan,
        startRealTimeScan,
        stopRealTimeScan
    } = useDataManager(activeTab);

    // Utiliser le hook de gestion des métriques
    const { metrics, updateMetrics } = useMetricsStorage();

    // Mettre à jour les métriques quand les données changent
    useEffect(() => {
        const newMetrics = {
            networkCount: data.networkCount || 0,
            deviceCount: data.deviceCount || 0,
            dnsCount: data.dnsCount || 0
        };

        console.log('📊 Mise à jour des métriques:', {
            newMetrics,
            currentMetrics: metrics,
            data: {
                networkCount: data.networkCount,
                deviceCount: data.deviceCount,
                dnsCount: data.dnsCount
            }
        });

        // Mettre à jour seulement si les valeurs ont changé
        if (
            newMetrics.networkCount !== metrics.networkCount ||
            newMetrics.deviceCount !== metrics.deviceCount ||
            newMetrics.dnsCount !== metrics.dnsCount
        ) {
            console.log('🔄 Mise à jour des métriques dans localStorage');
            updateMetrics(newMetrics);
        }
    }, [data.networkCount, data.deviceCount, data.dnsCount, metrics, updateMetrics]);

    // Gestionnaire de changement d'onglet
    const handleTabChange = (tabId) => {
        console.log('🔄 Changement d\'onglet vers:', tabId);
        console.log('📊 État connectivité:', dataManagerConnectivity);
        console.log('🔌 État WebSocket avant changement:', dataManagerConnectivity.socket);
        console.log('🌐 État API avant changement:', dataManagerConnectivity.api);

        // Permettre le changement d'onglet même si la connectivité n'est pas parfaite
        // Seulement empêcher si vraiment aucune connexion API
        if (!dataManagerConnectivity.api) {
            console.warn('⚠️ Aucune connexion API disponible, changement d\'onglet ignoré');
            return;
        }

        setActiveTab(tabId);
        console.log('✅ Onglet changé vers:', tabId);
        console.log('🔌 WebSocket devrait se connecter automatiquement si onglet = devices');
    };

    // Gestionnaire de scan terminé
    const handleScanComplete = async () => {
        try {
            // Recharger les données après le scan
            await loadNetworks();
            if (activeTab === 'devices') {
                await loadDevices('fast');
            }
        } catch (error) {
            console.error('❌ Erreur lors du rechargement après scan:', error);
        }
    };

    // Gestionnaire de démarrage de scan
    const handleStartScan = async (mode = 'fast') => {
        try {
            if (activeTab === 'networks') {
                // Pour les réseaux, utiliser loadNetworks (API REST)
                console.log('🔍 Scan des réseaux via API REST...');
                await loadNetworks();
            } else {
                // Pour les devices, utiliser startScan (WebSocket)
                console.log('🔍 Scan des devices via WebSocket...');
                await startScan(mode);
            }
        } catch (error) {
            console.error('❌ Erreur lors du démarrage du scan:', error);
        }
    };

    // Gestionnaire d'annulation de scan
    const handleCancelScan = async () => {
        try {
            await cancelScan();
        } catch (error) {
            console.error('❌ Erreur lors de l\'annulation du scan:', error);
        }
    };

    return (
        <ThemeProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
                <div className="flex-1">
                    <div className="container mx-auto px-4 py-8">
                        {/* Indicateur de connectivité */}
                        {!dataManagerConnectivity.api && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                    <span className="text-sm font-medium">
                                        Serveur backend non accessible
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Navigation par onglets avec titre et métriques */}
                        <TabNavigation
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                            networkCount={metrics.networkCount}
                            deviceCount={metrics.deviceCount}
                            dnsCount={metrics.dnsCount}
                            lastUpdated={metrics.lastUpdated}
                        />



                        {/* Contenu des onglets */}
                        <div className="space-y-6">
                            {activeTab === 'networks' && (
                                <NetworkList
                                    networks={data.networks}
                                    loading={loading.networks}
                                    error={error.networks}
                                    onRefresh={loadNetworks}
                                    startScan={handleStartScan}
                                    connectivity={dataManagerConnectivity}
                                    realTimeScan={realTimeScan}
                                    onStartRealTimeScan={startRealTimeScan}
                                    onStopRealTimeScan={stopRealTimeScan}
                                />
                            )}
                            {activeTab === 'devices' && (
                                <DeviceList
                                    devices={data.devices}
                                    loading={loading.devices}
                                    error={error.devices}
                                    scanProgress={scanProgress}
                                    onScanComplete={handleScanComplete}
                                    onStartScan={handleStartScan}
                                    onCancelScan={handleCancelScan}
                                    connectivity={dataManagerConnectivity}
                                />
                            )}
                            {activeTab === 'dns' && (
                                <DnsServicesList
                                    dnsData={data.dnsData || {}}
                                    servicesData={data.servicesData || {}}
                                    historyData={data.historyData || {}}
                                    loading={loading.dns}
                                    error={error.dns}
                                    onRefresh={loadDnsServices}
                                    onStartScan={loadDnsServices}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </ThemeProvider>
    );
}

export default App; 