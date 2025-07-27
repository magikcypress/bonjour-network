import React from 'react';
import { Wifi, Smartphone, Signal, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Composant de navigation par onglets
 */
function TabNavigation({ activeTab, onTabChange, networkCount = 0, deviceCount = 0, dnsCount = 0, lastUpdated = null }) {
    const { isDarkMode, toggleTheme } = useTheme();
    const tabs = [
        {
            id: 'networks',
            name: 'Réseaux WiFi',
            icon: Wifi,
            description: 'Réseaux WiFi détectés'
        },
        {
            id: 'devices',
            name: 'Appareils',
            icon: Smartphone,
            description: 'Appareils connectés'
        },
        {
            id: 'dns',
            name: 'DNS & Services',
            icon: Signal,
            description: 'Résolution DNS et services'
        }
    ];

    return (
        <div className="mb-6">
            {/* Titre de l'application */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Bonjour Network</h1>

                {/* Bouton de basculement du thème */}
                <button
                    onClick={() => {
                        console.log('🔘 Bouton thème cliqué, isDarkMode:', isDarkMode);
                        toggleTheme();
                    }}
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

            {/* Métriques globales */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                        <Wifi className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-600 dark:text-gray-300">{networkCount} réseaux</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-green-600" />
                        <span className="text-gray-600 dark:text-gray-300">{deviceCount} appareils</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Signal className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-600 dark:text-gray-300">{dnsCount} DNS</span>
                    </div>
                </div>
                {lastUpdated && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Dernière mise à jour: {new Date(lastUpdated).toLocaleTimeString()}
                    </div>
                )}
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
                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${isActive
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.name}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}

export default TabNavigation; 