const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class RealWifiScanner {
    constructor() {
        this.networks = [];
    }

    async scanNetworks() {
        console.log('🔍 Démarrage du scan des vrais réseaux WiFi...');

        try {
            // Méthode 1: Essayer avec airport (déprécié mais parfois fonctionne)
            const airportResult = await this.scanWithAirport();
            if (airportResult.length > 0) {
                console.log(`✅ Scan airport réussi: ${airportResult.length} réseaux`);
                return airportResult;
            }

            // Méthode 2: Essayer avec wdutil
            const wdutilResult = await this.scanWithWdutil();
            if (wdutilResult.length > 0) {
                console.log(`✅ Scan wdutil réussi: ${wdutilResult.length} réseaux`);
                return wdutilResult;
            }

            // Méthode 3: Essayer avec system_profiler
            const systemProfilerResult = await this.scanWithSystemProfiler();
            if (systemProfilerResult.length > 0) {
                console.log(`✅ Scan system_profiler réussi: ${systemProfilerResult.length} réseaux`);
                return systemProfilerResult;
            }

            console.log('❌ Aucune méthode de scan n\'a fonctionné');
            return [];

        } catch (error) {
            console.error('❌ Erreur lors du scan:', error.message);
            return [];
        }
    }

    async scanWithAirport() {
        try {
            const { stdout } = await execAsync('sudo /System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s');

            if (!stdout || stdout.includes('WARNING')) {
                return [];
            }

            const networks = [];
            const lines = stdout.split('\n');

            for (const line of lines) {
                if (line.trim() === '' || line.includes('SSID') || line.includes('BSSID')) {
                    continue;
                }

                const parts = line.trim().split(/\s+/);
                if (parts.length >= 6) {
                    const network = {
                        ssid: parts[0],
                        bssid: parts[1],
                        rssi: parseInt(parts[2]),
                        channel: parseInt(parts[3]),
                        security: parts[4],
                        mode: 'infrastructure',
                        frequency: 2400 + (parseInt(parts[3]) - 1) * 5,
                        signal_level: parseInt(parts[2]),
                        quality: Math.max(0, Math.min(100, 100 + parseInt(parts[2]))),
                        security_flags: [parts[4]]
                    };
                    networks.push(network);
                }
            }

            return networks;
        } catch (error) {
            console.log('⚠️ Scan airport échoué:', error.message);
            return [];
        }
    }

    async scanWithWdutil() {
        try {
            const { stdout } = await execAsync('sudo wdutil dump');

            if (!stdout) {
                return [];
            }

            const networks = [];
            const lines = stdout.split('\n');
            let currentNetwork = null;

            for (const line of lines) {
                if (line.includes('SSID')) {
                    if (currentNetwork) {
                        networks.push(currentNetwork);
                    }
                    currentNetwork = {};
                    const ssidMatch = line.match(/SSID\s*:\s*(.+)/);
                    if (ssidMatch) {
                        currentNetwork.ssid = ssidMatch[1].trim();
                    }
                } else if (line.includes('BSSID') && currentNetwork) {
                    const bssidMatch = line.match(/BSSID\s*:\s*(.+)/);
                    if (bssidMatch) {
                        currentNetwork.bssid = bssidMatch[1].trim();
                    }
                } else if (line.includes('RSSI') && currentNetwork) {
                    const rssiMatch = line.match(/RSSI\s*:\s*(-?\d+)/);
                    if (rssiMatch) {
                        const rssi = parseInt(rssiMatch[1]);
                        currentNetwork.signal_level = rssi;
                        currentNetwork.quality = Math.max(0, Math.min(100, 100 + rssi));
                    }
                } else if (line.includes('Channel') && currentNetwork) {
                    const channelMatch = line.match(/Channel\s*:\s*(\d+)/);
                    if (channelMatch) {
                        const channel = parseInt(channelMatch[1]);
                        currentNetwork.channel = channel;
                        currentNetwork.frequency = 2400 + (channel - 1) * 5;
                    }
                }
            }

            if (currentNetwork) {
                networks.push(currentNetwork);
            }

            return networks;
        } catch (error) {
            console.log('⚠️ Scan wdutil échoué:', error.message);
            return [];
        }
    }

    async scanWithSystemProfiler() {
        try {
            const { stdout } = await execAsync('sudo system_profiler SPAirPortDataType -xml');

            if (!stdout) {
                return [];
            }

            const networks = [];
            const lines = stdout.split('\n');
            let currentNetwork = null;

            for (const line of lines) {
                if (line.includes('<key>SSID_STR</key>')) {
                    if (currentNetwork) {
                        networks.push(currentNetwork);
                    }
                    currentNetwork = {};
                } else if (line.includes('<string>') && currentNetwork) {
                    const match = line.match(/<string>(.*?)<\/string>/);
                    if (match) {
                        if (!currentNetwork.ssid) {
                            currentNetwork.ssid = match[1];
                        } else if (!currentNetwork.bssid) {
                            currentNetwork.bssid = match[1];
                        }
                    }
                } else if (line.includes('<key>CHANNEL</key>') && currentNetwork) {
                    const nextLine = lines[lines.indexOf(line) + 1];
                    const match = nextLine.match(/<integer>(.*?)<\/integer>/);
                    if (match) {
                        const channel = parseInt(match[1]);
                        currentNetwork.channel = channel;
                        currentNetwork.frequency = 2400 + (channel - 1) * 5;
                    }
                } else if (line.includes('<key>RSSI</key>') && currentNetwork) {
                    const nextLine = lines[lines.indexOf(line) + 1];
                    const match = nextLine.match(/<integer>(.*?)<\/integer>/);
                    if (match) {
                        const rssi = parseInt(match[1]);
                        currentNetwork.signal_level = rssi;
                        currentNetwork.quality = Math.max(0, Math.min(100, 100 + rssi));
                    }
                }
            }

            if (currentNetwork) {
                networks.push(currentNetwork);
            }

            return networks;
        } catch (error) {
            console.log('⚠️ Scan system_profiler échoué:', error.message);
            return [];
        }
    }
}

module.exports = RealWifiScanner; 