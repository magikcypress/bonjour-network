import React from 'react';
import { BarChart3, Wifi, Shield, Signal } from 'lucide-react';

const NetworkStats = ({ networks }) => {
    const stats = {
        total: networks.length,
        secured: networks.filter(n => n.security && n.security !== 'Open').length,
        unsecured: networks.filter(n => !n.security || n.security === 'Open').length,
        strongSignal: networks.filter(n => parseInt(n.signalStrength) >= 80).length,
        weakSignal: networks.filter(n => parseInt(n.signalStrength) < 40).length,
        blocked: networks.filter(n => n.isBlocked).length,
        frequency2_4: networks.filter(n => {
            const freq = parseInt(n.frequency);
            return freq >= 2400 && freq < 5000;
        }).length,
        frequency5: networks.filter(n => {
            const freq = parseInt(n.frequency);
            return freq >= 5000;
        }).length
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Statistiques des réseaux</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Wifi className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Total</div>
                </div>

                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{stats.secured}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Sécurisés</div>
                </div>

                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <Signal className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">{stats.strongSignal}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Signal fort</div>
                </div>

                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <Shield className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Bloqués</div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Répartition par fréquence</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">2.4 GHz</span>
                            <span className="font-semibold dark:text-white">{stats.frequency2_4}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">5 GHz</span>
                            <span className="font-semibold dark:text-white">{stats.frequency5}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Sécurité</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Sécurisés</span>
                            <span className="font-semibold text-green-600">{stats.secured}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Non sécurisés</span>
                            <span className="font-semibold text-red-600">{stats.unsecured}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Qualité du signal</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Signal fort</span>
                            <span className="font-semibold text-green-600">{stats.strongSignal}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Signal faible</span>
                            <span className="font-semibold text-red-600">{stats.weakSignal}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkStats; 