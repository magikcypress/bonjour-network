const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class RealWiFiScanner {
    constructor() {
        this.airportPath = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';
    }

    async scanNetworks() {
        try {
            // Essayer d'abord wdutil pour obtenir le réseau actuel
            const currentNetwork = await this.getCurrentNetworkInfo();

            // Essayer de scanner avec airport (peut ne pas fonctionner)
            let additionalNetworks = [];
            try {
                const { stdout } = await execAsync(`${this.airportPath} -s`);
                additionalNetworks = this.parseAirportOutput(stdout);
            } catch (airportError) {
                console.log('airport command dépréciée, utilisation de wdutil uniquement');
            }

            // Combiner les réseaux
            const allNetworks = [currentNetwork, ...additionalNetworks].filter(network => network);

            return allNetworks;
        } catch (error) {
            console.error('Erreur lors du scan WiFi:', error);
            return [];
        }
    }

    async getCurrentNetworkInfo() {
        try {
            const { stdout } = await execAsync('sudo wdutil info');
            const lines = stdout.split('\n');
            const networkInfo = {};

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.includes('SSID')) {
                    networkInfo.ssid = trimmedLine.split(':')[1]?.trim() || 'Réseau actuel';
                } else if (trimmedLine.includes('RSSI')) {
                    networkInfo.rssi = trimmedLine.split(':')[1]?.trim() || '-50';
                } else if (trimmedLine.includes('Channel')) {
                    networkInfo.channel = trimmedLine.split(':')[1]?.trim() || '6';
                } else if (trimmedLine.includes('Security')) {
                    networkInfo.security = trimmedLine.split(':')[1]?.trim() || 'WPA3';
                } else if (trimmedLine.includes('BSSID')) {
                    networkInfo.bssid = trimmedLine.split(':')[1]?.trim() || 'N/A';
                }
            }

            if (networkInfo.ssid && networkInfo.ssid !== 'Réseau actuel') {
                return {
                    ssid: networkInfo.ssid,
                    bssid: networkInfo.bssid || 'N/A',
                    rssi: networkInfo.rssi,
                    channel: networkInfo.channel,
                    security: networkInfo.security,
                    signalStrength: this.convertRSSIToPercentage(networkInfo.rssi),
                    frequency: this.channelToFrequency(networkInfo.channel),
                    lastSeen: new Date().toISOString(),
                    isCurrentNetwork: true
                };
            }

            return null;
        } catch (error) {
            console.error('Erreur lors de la récupération du réseau actuel:', error);
            return null;
        }
    }

    parseAirportOutput(output) {
        const lines = output.trim().split('\n');
        const networks = [];

        // Ignorer les lignes d'avertissement et d'en-tête
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.includes('WARNING') || line.includes('SSID') || line.includes('For diagnosing')) {
                continue;
            }

            // Parser chaque ligne de réseau
            const parts = line.split(/\s+/);
            if (parts.length >= 5) {
                const network = {
                    ssid: parts[0],
                    bssid: parts[1] || 'N/A',
                    rssi: parts[2] || '-50',
                    channel: parts[3] || '6',
                    security: parts[4] || 'Unknown',
                    signalStrength: this.convertRSSIToPercentage(parts[2] || '-50'),
                    frequency: this.channelToFrequency(parts[3] || '6'),
                    lastSeen: new Date().toISOString()
                };
                networks.push(network);
            }
        }

        return networks;
    }

    convertRSSIToPercentage(rssi) {
        const rssiValue = parseInt(rssi);
        if (isNaN(rssiValue)) return 50;

        // Conversion RSSI vers pourcentage
        // RSSI typique: -100 (très faible) à -30 (très fort)
        const percentage = Math.max(0, Math.min(100, ((rssiValue + 100) * 100) / 70));
        return Math.round(percentage);
    }

    channelToFrequency(channel) {
        const channelNum = parseInt(channel);
        if (isNaN(channelNum)) return 'N/A';

        // Conversion canal vers fréquence
        if (channelNum >= 1 && channelNum <= 14) {
            return (2407 + (channelNum * 5)).toString(); // 2.4GHz
        } else if (channelNum >= 36 && channelNum <= 165) {
            return (5000 + (channelNum * 5)).toString(); // 5GHz
        } else if (channelNum >= 1 && channelNum <= 233) {
            return (5950 + (channelNum * 5)).toString(); // 6GHz
        }

        return 'N/A';
    }

    // Méthode pour simuler des réseaux voisins basés sur le réseau actuel
    async generateNeighborNetworks(currentNetwork) {
        if (!currentNetwork) return [];

        const neighbors = [];
        const baseChannel = parseInt(currentNetwork.channel) || 6;
        const baseSSID = currentNetwork.ssid;

        // Simuler quelques réseaux voisins
        const neighborSSIDs = [
            `${baseSSID}_Guest`,
            'Voisin_WiFi',
            'Cafe_Internet',
            'Office_Network',
            'Public_WiFi'
        ];

        neighborSSIDs.forEach((ssid, index) => {
            const channel = (baseChannel + index + 1) % 13 || 1;
            const rssi = -50 - (index * 10);

            neighbors.push({
                ssid: ssid,
                bssid: `AA:BB:CC:DD:EE:${(index + 1).toString().padStart(2, '0')}`,
                rssi: rssi.toString(),
                channel: channel.toString(),
                security: index % 2 === 0 ? 'WPA2' : 'WPA3',
                signalStrength: this.convertRSSIToPercentage(rssi),
                frequency: this.channelToFrequency(channel.toString()),
                lastSeen: new Date().toISOString(),
                isSimulated: true
            });
        });

        return neighbors;
    }
}

module.exports = RealWiFiScanner; 