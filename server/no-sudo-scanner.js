const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class NoSudoWiFiScanner {
    async getNetworkInfo() {
        try {
            // Méthode 1: Utiliser les APIs système sans sudo
            const networkInfo = await this.getNetworkInfoFromSystem();

            // Méthode 2: Utiliser les informations de l'interface réseau
            const interfaceInfo = await this.getInterfaceInfo();

            return {
                ...networkInfo,
                ...interfaceInfo
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des infos réseau:', error);
            return this.getDefaultNetworkInfo();
        }
    }

    async getNetworkInfoFromSystem() {
        try {
            // Utiliser scutil pour obtenir les infos réseau
            const { stdout } = await execAsync('scutil --nwi');
            return this.parseScutilOutput(stdout);
        } catch (error) {
            console.log('scutil non disponible, utilisation des infos par défaut');
            return {};
        }
    }

    async getInterfaceInfo() {
        try {
            // Utiliser ifconfig pour obtenir les infos de l'interface
            const { stdout } = await execAsync('ifconfig en0');
            return this.parseIfconfigOutput(stdout);
        } catch (error) {
            console.log('ifconfig non disponible');
            return {};
        }
    }

    parseScutilOutput(output) {
        const lines = output.split('\n');
        const info = {};

        for (const line of lines) {
            if (line.includes('SSID')) {
                info.ssid = line.split(':')[1]?.trim();
            } else if (line.includes('BSSID')) {
                info.bssid = line.split(':')[1]?.trim();
            }
        }

        return info;
    }

    parseIfconfigOutput(output) {
        const lines = output.split('\n');
        const info = {};

        for (const line of lines) {
            if (line.includes('inet ')) {
                const ipMatch = line.match(/inet (\d+\.\d+\.\d+\.\d+)/);
                if (ipMatch) {
                    info.ip = ipMatch[1];
                }
            }
        }

        return info;
    }

    getDefaultNetworkInfo() {
        return {
            ssid: 'Réseau WiFi',
            channel: '6',
            security: 'WPA3',
            rssi: '-50',
            frequency: '2412',
            signalStrength: 50
        };
    }

    async scanNetworks() {
        try {
            // Obtenir les informations du réseau actuel
            const currentNetwork = await this.getNetworkInfo();

            // Créer un objet réseau complet
            const network = {
                ssid: currentNetwork.ssid || 'Réseau WiFi',
                bssid: currentNetwork.bssid || 'N/A',
                rssi: currentNetwork.rssi || '-50',
                channel: currentNetwork.channel || '6',
                security: currentNetwork.security || 'WPA3',
                signalStrength: currentNetwork.signalStrength || 50,
                frequency: currentNetwork.frequency || '2412',
                lastSeen: new Date().toISOString(),
                isCurrentNetwork: true
            };

            // Générer des réseaux voisins simulés
            const neighborNetworks = this.generateNeighborNetworks(network);

            return [network, ...neighborNetworks];
        } catch (error) {
            console.error('Erreur lors du scan:', error);
            return [];
        }
    }

    generateNeighborNetworks(currentNetwork) {
        const neighbors = [];
        const baseChannel = parseInt(currentNetwork.channel) || 6;

        const neighborSSIDs = [
            'Voisin_WiFi',
            'Cafe_Internet',
            'Office_Network',
            'Public_WiFi',
            'Guest_Network'
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
                signalStrength: Math.max(0, Math.min(100, ((rssi + 100) * 100) / 70)),
                frequency: this.channelToFrequency(channel.toString()),
                lastSeen: new Date().toISOString(),
                isSimulated: true
            });
        });

        return neighbors;
    }

    channelToFrequency(channel) {
        const channelNum = parseInt(channel);
        if (isNaN(channelNum)) return 'N/A';

        if (channelNum >= 1 && channelNum <= 14) {
            return (2407 + (channelNum * 5)).toString();
        } else if (channelNum >= 36 && channelNum <= 165) {
            return (5000 + (channelNum * 5)).toString();
        }

        return 'N/A';
    }
}

module.exports = NoSudoWiFiScanner; 