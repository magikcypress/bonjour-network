import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from './components/Navigation';
import NetworkList from './components/NetworkList';
import DeviceList from './components/DeviceList';

const API_BASE_URL = 'http://localhost:5001/api';

function App() {
    const [activeTab, setActiveTab] = useState('networks');
    const [networkCount, setNetworkCount] = useState(0);
    const [deviceCount, setDeviceCount] = useState(0);

    useEffect(() => {
        // Charger les compteurs initiaux
        loadCounts();

        // Mise à jour automatique désactivée pour éviter les scans en boucle
        // const interval = setInterval(loadCounts, 30000);
        // return () => clearInterval(interval);
    }, []);

    const loadCounts = async () => {
        try {
            // Charger le nombre de réseaux
            const networksResponse = await axios.get(`${API_BASE_URL}/networks`);
            setNetworkCount(networksResponse.data.length);

            // Charger le nombre d'appareils
            const devicesResponse = await axios.get(`${API_BASE_URL}/devices`);
            setDeviceCount(devicesResponse.data.length);
        } catch (error) {
            console.error('Erreur lors du chargement des compteurs:', error);
        }
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
    };

    const handleScanComplete = () => {
        // Recharger les données après le scan
        loadCounts();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {/* Navigation avec onglets */}
                <Navigation
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    networkCount={networkCount}
                    deviceCount={deviceCount}
                />

                {/* Contenu des onglets */}
                <div className="space-y-6">
                    {activeTab === 'networks' && <NetworkList />}
                    {activeTab === 'devices' && <DeviceList onScanComplete={handleScanComplete} />}
                </div>
            </div>
        </div>
    );
}

export default App; 