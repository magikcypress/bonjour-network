import React from 'react';
import { Wifi, Smartphone, Signal, WifiOff, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Composant de navigation avec onglets
 * Affiche les informations de connectivité et les compteurs
 */
function Navigation({
    activeTab,
    onTabChange,
    networkCount = 0,
    deviceCount = 0,
    connectivity = { api: false, socket: false }
}) {
    const { isDarkMode, toggleTheme } = useTheme();
    const tabs = [
        {
            id: 'networks',
            name: 'Réseaux WiFi',
            icon: Wifi,
            count: networkCount,
            description: 'Réseaux WiFi détectés'
        },
        {
            id: 'devices',
            name: 'Appareils',
            icon: Smartphone,
            count: deviceCount,
            description: 'Appareils connectés'
        },
        {
            id: 'dns',
            name: 'DNS & Services',
            icon: Signal,
            count: 0,
            description: 'Résolution DNS et services'
        }
    ];

    const getConnectivityStatus = () => {
        if (connectivity.api && connectivity.socket) {
            return { status: 'connected', text: 'Connecté', color: 'text-green-600' };
        } else if (connectivity.api) {
            return { status: 'partial', text: 'Connecté', color: 'text-green-600' };
        } else {
            return { status: 'disconnected', text: 'Déconnecté', color: 'text-red-600' };
        }
    };

    const connectivityStatus = getConnectivityStatus();

    return (
        <div className="mb-8">
            {/* En-tête avec titre et statut de connectivité */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Bonjour Network</h1>
                </div>

                {/* Contrôles (connectivité + thème) */}
                <div className="flex items-center space-x-4">
                    {/* Indicateur de connectivité */}
                    <div className={`flex items-center space-x-1 ${connectivityStatus.color}`}>
                        {connectivityStatus.status === 'connected' && connectivity.socket ? (
                            <Signal className="w-4 h-4" />
                        ) : connectivity.api ? (
                            <Wifi className="w-4 h-4" />
                        ) : (
                            <WifiOff className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">{connectivityStatus.text}</span>
                    </div>

                    {/* Bouton de basculement du thème */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                        title={isDarkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}
                    >
                        {isDarkMode ? (
                            <Sun className="w-5 h-5 text-yellow-500" />
                        ) : (
                            <Moon className="w-5 h-5 text-gray-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Statistiques globales */}
            <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                    <Wifi className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600 dark:text-gray-300">{networkCount} réseaux</span>
                </div>
                <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600 dark:text-gray-300">{deviceCount} appareils</span>
                </div>
            </div>

            {/* Onglets de navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                disabled={!connectivity.api && tab.id === 'networks'}
                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${isActive
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                    } ${!connectivity.api && tab.id === 'networks'
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'cursor-pointer'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{tab.name}</span>
                                {tab.count > 0 && (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Description de l'onglet actif */}
            <div className="mt-4">
                {tabs.map((tab) => {
                    if (activeTab === tab.id) {
                        return (
                            <div key={tab.id} className="flex items-center space-x-2 text-sm text-gray-600">
                                <tab.icon className="w-4 h-4" />
                                <span>{tab.description}</span>
                                {!connectivity.api && tab.id === 'networks' && (
                                    <span className="text-yellow-600 font-medium">
                                        (Mode hors ligne)
                                    </span>
                                )}
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
}

export default Navigation; 