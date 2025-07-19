// Module d'optimisation WiFi légal
const wifi = require('node-wifi');

class WiFiOptimizer {
    constructor() {
        this.channels = {
            '2.4GHz': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            '5GHz': [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 149, 153, 157, 161, 165]
        };
    }

    // Analyser les canaux utilisés
    async analyzeChannels() {
        try {
            const networks = await wifi.scan();
            const channelUsage = {};

            networks.forEach(network => {
                const freq = parseInt(network.frequency);
                const channel = this.frequencyToChannel(freq);
                const band = freq >= 5000 ? '5GHz' : '2.4GHz';

                if (!channelUsage[band]) {
                    channelUsage[band] = {};
                }

                if (!channelUsage[band][channel]) {
                    channelUsage[band][channel] = [];
                }

                channelUsage[band][channel].push({
                    ssid: network.ssid,
                    signal: network.quality,
                    security: network.security
                });
            });

            return channelUsage;
        } catch (error) {
            console.error('Erreur lors de l\'analyse des canaux:', error);
            return {};
        }
    }

    // Convertir fréquence en canal
    frequencyToChannel(freq) {
        if (freq >= 2412 && freq <= 2484) {
            return Math.round((freq - 2412) / 5) + 1;
        } else if (freq >= 5170 && freq <= 5825) {
            return Math.round((freq - 5170) / 5) + 34;
        }
        return null;
    }

    // Recommander le meilleur canal
    recommendBestChannel(channelUsage) {
        const recommendations = {};

        Object.keys(channelUsage).forEach(band => {
            const availableChannels = this.channels[band];
            const bestChannels = this.findLeastCrowdedChannels(availableChannels, channelUsage[band]);

            recommendations[band] = {
                recommended: bestChannels[0],
                alternatives: bestChannels.slice(1, 3),
                congestion: this.calculateCongestion(channelUsage[band])
            };
        });

        return recommendations;
    }

    // Trouver les canaux les moins encombrés
    findLeastCrowdedChannels(availableChannels, usage) {
        const channelScores = {};

        availableChannels.forEach(channel => {
            const networks = usage[channel] || [];
            const interference = this.calculateInterference(channel, usage);
            channelScores[channel] = {
                channel,
                networks: networks.length,
                interference,
                score: networks.length + interference
            };
        });

        return Object.values(channelScores)
            .sort((a, b) => a.score - b.score)
            .map(item => item.channel);
    }

    // Calculer l'interférence
    calculateInterference(targetChannel, usage) {
        let interference = 0;

        Object.keys(usage).forEach(channel => {
            const channelDiff = Math.abs(targetChannel - parseInt(channel));
            if (channelDiff <= 2) {
                interference += usage[channel].length * (3 - channelDiff);
            }
        });

        return interference;
    }

    // Calculer la congestion
    calculateCongestion(usage) {
        const totalNetworks = Object.values(usage).reduce((sum, networks) => sum + networks.length, 0);
        const usedChannels = Object.keys(usage).length;
        return {
            totalNetworks,
            usedChannels,
            averagePerChannel: totalNetworks / usedChannels || 0
        };
    }

    // Générer des recommandations d'optimisation
    async generateOptimizationReport() {
        const channelUsage = await this.analyzeChannels();
        const recommendations = this.recommendBestChannel(channelUsage);

        return {
            timestamp: new Date().toISOString(),
            channelUsage,
            recommendations,
            suggestions: this.generateSuggestions(channelUsage, recommendations)
        };
    }

    // Générer des suggestions d'amélioration
    generateSuggestions(channelUsage, recommendations) {
        const suggestions = [];

        Object.keys(recommendations).forEach(band => {
            const rec = recommendations[band];

            if (rec.congestion.averagePerChannel > 3) {
                suggestions.push({
                    type: 'high_congestion',
                    band,
                    message: `Forte congestion sur ${band}. Considérez passer au ${band === '2.4GHz' ? '5GHz' : 'WiFi 6'}.`
                });
            }

            if (rec.congestion.usedChannels > 10) {
                suggestions.push({
                    type: 'many_channels',
                    band,
                    message: `Beaucoup de canaux utilisés sur ${band}. Optimisez la position de votre routeur.`
                });
            }
        });

        return suggestions;
    }
}

module.exports = WiFiOptimizer; 