import React from 'react';
import { Wifi, Smartphone, Home } from 'lucide-react';

function Navigation({ activeTab, onTabChange, networkCount = 0, deviceCount = 0 }) {
    const tabs = [
        {
            id: 'networks',
            name: 'Réseaux WiFi',
            icon: <Wifi className="w-5 h-5" />,
            description: 'Scanner et analyser les réseaux WiFi',
            count: networkCount
        },
        {
            id: 'devices',
            name: 'Appareils Connectés',
            icon: <Smartphone className="w-5 h-5" />,
            description: 'Voir tous les appareils connectés au réseau',
            count: deviceCount
        }
    ];

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-center mb-6">
                <Home className="w-8 h-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-800">WiFi Tracker</h1>
            </div>

            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-all duration-200 ${activeTab === tab.id
                            ? 'bg-white text-blue-600 shadow-md'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                    >
                        {tab.icon}
                        <span className="font-medium">{tab.name}</span>
                        {tab.count > 0 && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-4 text-center">
                <p className="text-gray-600 text-sm">
                    {tabs.find(tab => tab.id === activeTab)?.description}
                </p>
            </div>
        </div>
    );
}

export default Navigation; 