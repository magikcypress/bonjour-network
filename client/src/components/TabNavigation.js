import React from 'react';
import { Monitor, Wifi, Globe } from 'lucide-react';

/**
 * Composant de navigation par onglets
 * Organise les différents types de scans (Appareils, Réseaux, DNS & Services)
 */
function TabNavigation({ activeTab, onTabChange }) {
    const tabs = [
        {
            id: 'devices',
            title: 'Appareils',
            icon: Monitor,
            description: 'Détection des appareils connectés au réseau'
        },
        {
            id: 'networks',
            title: 'Réseaux',
            icon: Wifi,
            description: 'Scan des réseaux WiFi extérieurs'
        },
        {
            id: 'dns',
            title: 'DNS & Services',
            icon: Globe,
            description: 'Résolution DNS et services réseau'
        }
    ];

    return (
        <div className="bg-white rounded-lg shadow-lg mb-6">
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`
                                    group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center text-sm font-medium hover:text-gray-700 focus:z-10 focus:outline-none
                                    ${isActive
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }
                                `}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <div className="flex items-center justify-center space-x-2">
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <span className="font-medium">{tab.title}</span>
                                </div>
                                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 transition-all duration-200"
                                    style={{ opacity: isActive ? 1 : 0 }} />
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Description de l'onglet actif */}
            <div className="px-6 py-4 bg-gray-50">
                <p className="text-sm text-gray-600">
                    {tabs.find(tab => tab.id === activeTab)?.description}
                </p>
            </div>
        </div>
    );
}

export default TabNavigation; 