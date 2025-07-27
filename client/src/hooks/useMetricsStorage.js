import { useState, useEffect } from 'react';

/**
 * Hook pour gérer la sauvegarde des métriques dans localStorage
 */
export const useMetricsStorage = () => {
    const [metrics, setMetrics] = useState({
        networkCount: 0,
        deviceCount: 0,
        dnsCount: 0,
        lastUpdated: null
    });

    // Charger les métriques depuis localStorage au démarrage
    useEffect(() => {
        try {
            const savedMetrics = localStorage.getItem('bonjour-network-metrics');
            console.log('📊 Métriques chargées depuis localStorage:', savedMetrics);
            if (savedMetrics) {
                const parsedMetrics = JSON.parse(savedMetrics);
                console.log('📊 Métriques parsées:', parsedMetrics);
                setMetrics(parsedMetrics);
            }
        } catch (error) {
            console.warn('⚠️ Erreur lors du chargement des métriques:', error);
        }
    }, []);

    // Fonction pour mettre à jour les métriques
    const updateMetrics = (newMetrics) => {
        const updatedMetrics = {
            ...metrics,
            ...newMetrics,
            lastUpdated: new Date().toISOString()
        };

        console.log('💾 Sauvegarde des métriques:', updatedMetrics);
        setMetrics(updatedMetrics);

        // Sauvegarder dans localStorage
        try {
            localStorage.setItem('bonjour-network-metrics', JSON.stringify(updatedMetrics));
            console.log('✅ Métriques sauvegardées dans localStorage');
        } catch (error) {
            console.warn('⚠️ Erreur lors de la sauvegarde des métriques:', error);
        }
    };

    // Fonction pour réinitialiser les métriques
    const resetMetrics = () => {
        const defaultMetrics = {
            networkCount: 0,
            deviceCount: 0,
            dnsCount: 0,
            lastUpdated: null
        };

        setMetrics(defaultMetrics);
        localStorage.removeItem('bonjour-network-metrics');
    };

    return {
        metrics,
        updateMetrics,
        resetMetrics
    };
}; 