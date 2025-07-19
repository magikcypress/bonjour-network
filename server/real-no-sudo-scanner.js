const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class RealNoSudoWiFiScanner {
    async scanNetworks() {
        try {
            console.log('🔍 Démarrage du scan WiFi réel sans sudo...');

            // Méthode 1: Utiliser airport (sans sudo)
            const airportNetworks = await this.scanWithAirport();
            if (airportNetworks.length > 0) {
                console.log(`✅ Scan airport réussi: ${airportNetworks.length} réseaux détectés`);
                return airportNetworks;
            }

            // Méthode 2: Utiliser system_profiler
            const profilerNetworks = await this.scanWithSystemProfiler();
            if (profilerNetworks.length > 0) {
                console.log(`✅ Scan system_profiler réussi: ${profilerNetworks.length} réseaux détectés`);
                return profilerNetworks;
            }

            // Méthode 3: Utiliser networksetup
            const networksetupNetworks = await this.scanWithNetworksetup();
            if (networksetupNetworks.length > 0) {
                console.log(`✅ Scan networksetup réussi: ${networksetupNetworks.length} réseaux détectés`);
                return networksetupNetworks;
            }

            console.log('❌ Aucune méthode de scan n\'a fonctionné');
            return [];

        } catch (error) {
            console.error('Erreur lors du scan WiFi:', error);
            return [];
        }
    }

    async scanWithAirport() {
        try {
            // Essayer airport -s (peut fonctionner sans sudo sur certains systèmes)
            const { stdout } = await execAsync('airport -s');
            return this.parseAirportOutput(stdout);
        } catch (error) {
            console.log('airport -s non disponible sans sudo');
            return [];
        }
    }

    async scanWithSystemProfiler() {
        try {
            // Utiliser system_profiler pour obtenir les infos WiFi
            const { stdout } = await execAsync('system_profiler SPAirPortDataType');
            return this.parseSystemProfilerOutput(stdout);
        } catch (error) {
            console.log('system_profiler non disponible');
            return [];
        }
    }

    async scanWithNetworksetup() {
        try {
            // Utiliser networksetup pour obtenir les infos réseau
            const { stdout } = await execAsync('networksetup -listallnetworkservices');
            const services = stdout.split('\n').filter(line => line.trim() && !line.includes('*'));

            const networks = [];
            for (const service of services) {
                if (service.includes('Wi-Fi') || service.includes('AirPort')) {
                    const networkInfo = await this.getNetworkInfoForService(service.trim());
                    if (networkInfo) {
                        networks.push(networkInfo);
                    }
                }
            }

            return networks;
        } catch (error) {
            console.log('networksetup non disponible');
            return [];
        }
    }

    async getNetworkInfoForService(serviceName) {
        try {
            // Obtenir les infos du service WiFi
            const { stdout } = await execAsync(`networksetup -getinfo "${serviceName}"`);

            const lines = stdout.split('\n');
            const info = {
                ssid: serviceName,
                security: 'Unknown',
                signalStrength: 50,
                frequency: 'N/A',
                channel: 'N/A',
                lastSeen: new Date().toISOString()
            };

            for (const line of lines) {
                if (line.includes('IP address')) {
                    const ipMatch = line.match(/IP address: (.+)/);
                    if (ipMatch) {
                        info.ip = ipMatch[1];
                    }
                }
            }

            return info;
        } catch (error) {
            return null;
        }
    }

    parseAirportOutput(output) {
        const lines = output.split('\n');
        const networks = [];

        // Ignorer les lignes d'en-tête et les avertissements
        for (const line of lines) {
            if (line.trim() && !line.includes('SSID') && !line.includes('Warning') && !line.includes('deprecated')) {
                const parts = line.split(/\s+/);
                if (parts.length >= 6) {
                    const network = {
                        ssid: parts[0],
                        bssid: parts[1],
                        rssi: parts[2],
                        channel: parts[3],
                        security: parts[4],
                        signalStrength: this.convertRSSIToPercentage(parts[2]),
                        frequency: this.channelToFrequency(parts[3]),
                        lastSeen: new Date().toISOString()
                    };
                    networks.push(network);
                }
            }
        }

        return networks;
    }

    parseSystemProfilerOutput(output) {
        const lines = output.split('\n');
        const networks = [];
        let currentNetwork = null;
        let inOtherNetworks = false;

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Détecter la section "Other Local Wi-Fi Networks"
            if (trimmedLine.includes('Other Local Wi-Fi Networks:')) {
                inOtherNetworks = true;
                continue;
            }

            // Détecter un nouveau réseau (nom se terminant par ':')
            if (inOtherNetworks && trimmedLine.endsWith(':') && !trimmedLine.includes('PHY Mode') && !trimmedLine.includes('Channel') && !trimmedLine.includes('Network Type') && !trimmedLine.includes('Security')) {
                if (currentNetwork) {
                    networks.push(currentNetwork);
                }
                currentNetwork = {
                    ssid: trimmedLine.slice(0, -1).trim(), // Enlever le ':'
                    security: 'Unknown',
                    signalStrength: 50,
                    frequency: 'N/A',
                    channel: 'N/A',
                    lastSeen: new Date().toISOString()
                };
            } else if (currentNetwork && trimmedLine.includes('Channel:')) {
                const channelMatch = trimmedLine.match(/Channel: (\d+)/);
                if (channelMatch) {
                    currentNetwork.channel = channelMatch[1];
                    currentNetwork.frequency = this.channelToFrequency(channelMatch[1]);
                }
            } else if (currentNetwork && trimmedLine.includes('Security:')) {
                const securityMatch = trimmedLine.match(/Security: (.+)/);
                if (securityMatch) {
                    currentNetwork.security = securityMatch[1];
                }
            } else if (currentNetwork && trimmedLine.includes('Signal / Noise:')) {
                const signalMatch = trimmedLine.match(/Signal \/ Noise: (-\d+) dBm/);
                if (signalMatch) {
                    const rssi = signalMatch[1];
                    currentNetwork.rssi = rssi;
                    currentNetwork.signalStrength = this.convertRSSIToPercentage(rssi);
                }
            }
        }

        if (currentNetwork) {
            networks.push(currentNetwork);
        }

        return networks;
    }

    convertRSSIToPercentage(rssi) {
        const rssiValue = parseInt(rssi);
        if (isNaN(rssiValue)) return 50;

        // Conversion RSSI vers pourcentage
        const percentage = Math.max(0, Math.min(100, ((rssiValue + 100) * 100) / 70));
        return Math.round(percentage);
    }

    channelToFrequency(channel) {
        const channelNum = parseInt(channel);
        if (isNaN(channelNum)) return 'N/A';

        if (channelNum >= 1 && channelNum <= 14) {
            return (2407 + (channelNum * 5)).toString(); // 2.4GHz
        } else if (channelNum >= 36 && channelNum <= 165) {
            return (5000 + (channelNum * 5)).toString(); // 5GHz
        }

        return 'N/A';
    }
}

module.exports = RealNoSudoWiFiScanner; 