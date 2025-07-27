const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class WifiSystemProfilerScanner {
    constructor() {
        this.platform = process.platform;
    }

    /**
     * Scanne les réseaux WiFi en utilisant system_profiler
     * @returns {Promise<Array>} Liste des réseaux WiFi
     */
    async scanNetworks() {
        try {
            if (this.platform !== 'darwin') {
                console.log('⚠️ system_profiler non supporté sur cette plateforme');
                return [];
            }

            console.log('🔍 Scan des réseaux WiFi avec system_profiler...');

            const { stdout } = await execAsync('system_profiler SPAirPortDataType', { timeout: 15000 });

            if (!stdout || stdout.trim() === '') {
                throw new Error('Aucun résultat de system_profiler');
            }

            const networks = this.parseSystemProfilerOutput(stdout);
            console.log(`✅ system_profiler: ${networks.length} réseaux détectés`);

            return networks;

        } catch (error) {
            console.error('❌ Erreur lors du scan WiFi avec system_profiler:', error.message);
            return [];
        }
    }

    /**
     * Parse la sortie de system_profiler
     */
    parseSystemProfilerOutput(output) {
        const networks = [];
        const lines = output.split('\n');

        let currentNetwork = null;
        let inOtherNetworks = false;
        let inCurrentNetwork = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Ignorer les lignes vides
            if (!trimmedLine) continue;

            // Calculer l'indentation
            const indentation = line.length - line.trimStart().length;

            // Détecter la section "Other Local Wi-Fi Networks"
            if (trimmedLine === 'Other Local Wi-Fi Networks:') {
                inOtherNetworks = true;
                inCurrentNetwork = false;
                continue;
            }

            // Détecter la section "Current Network Information"
            if (trimmedLine === 'Current Network Information:') {
                inCurrentNetwork = true;
                inOtherNetworks = false;
                continue;
            }

            // Si on est dans une section de réseaux
            if (inOtherNetworks || inCurrentNetwork) {
                // Nouveau réseau (ligne avec ":" et indentation minimale)
                if (trimmedLine.includes(':') && indentation <= 12 && !trimmedLine.startsWith('PHY Mode') && !trimmedLine.startsWith('Channel') && !trimmedLine.startsWith('Security') && !trimmedLine.startsWith('Signal') && !trimmedLine.startsWith('Network Type')) {
                    // Sauvegarder le réseau précédent
                    if (currentNetwork && currentNetwork.ssid && currentNetwork.ssid !== 'Unknown') {
                        networks.push(currentNetwork);
                    }

                    // Commencer un nouveau réseau
                    const ssid = trimmedLine.replace(':', '').trim();
                    currentNetwork = {
                        ssid,
                        bssid: 'Unknown',
                        rssi: 'Unknown',
                        channel: 'Unknown',
                        security: 'Unknown',
                        frequency: 2412,
                        quality: 50,
                        phyMode: 'Unknown',
                        networkType: 'Infrastructure'
                    };
                }

                // Parser les propriétés du réseau (lignes avec plus d'indentation)
                if (currentNetwork && indentation > 12 && trimmedLine.includes(':')) {
                    const [key, value] = trimmedLine.split(':').map(s => s.trim());

                    switch (key) {
                        case 'PHY Mode': {
                            currentNetwork.phyMode = value;
                            break;
                        }
                        case 'Channel': {
                            const channelMatch = value.match(/(\d+)/);
                            if (channelMatch) {
                                currentNetwork.channel = channelMatch[1];
                                currentNetwork.frequency = this.getFrequencyFromChannel(parseInt(channelMatch[1]));
                            }
                            break;
                        }
                        case 'Security':
                            currentNetwork.security = value;
                            break;
                        case 'Signal / Noise':
                            if (value.includes('dBm')) {
                                const signalPart = value.split('/')[0].trim();
                                const rssi = signalPart.replace('dBm', '').trim();
                                currentNetwork.rssi = rssi;
                                currentNetwork.quality = this.getQualityFromRssi(parseInt(rssi));
                            }
                            break;
                        case 'Network Type':
                            currentNetwork.networkType = value;
                            break;
                    }
                }
            }
        }

        // Ajouter le dernier réseau
        if (currentNetwork && currentNetwork.ssid && currentNetwork.ssid !== 'Unknown') {
            networks.push(currentNetwork);
        }

        // Filtrer les réseaux valides
        return networks.filter(network =>
            network.ssid &&
            network.ssid !== 'Unknown' &&
            !network.ssid.includes('PHY Mode') &&
            !network.ssid.includes('Channel') &&
            !network.ssid.includes('Security') &&
            !network.ssid.includes('Signal') &&
            !network.ssid.includes('Network Type')
        );
    }

    /**
     * Convertir le canal en fréquence
     */
    getFrequencyFromChannel(channel) {
        if (!channel || isNaN(channel)) return 2412;

        const ch = parseInt(channel);
        if (ch >= 1 && ch <= 13) return 2407 + (ch * 5);
        if (ch >= 36 && ch <= 165) return 5000 + (ch * 5);
        if (ch >= 1 && ch <= 93) return 5950 + (ch * 5); // 6GHz
        return 2412;
    }

    /**
     * Convertir RSSI en qualité
     */
    getQualityFromRssi(rssi) {
        if (!rssi || isNaN(rssi)) return 50;

        const rssiValue = parseInt(rssi);
        if (rssiValue >= -50) return 100;
        if (rssiValue >= -60) return 80;
        if (rssiValue >= -70) return 60;
        if (rssiValue >= -80) return 40;
        return 20;
    }
}

module.exports = WifiSystemProfilerScanner; 