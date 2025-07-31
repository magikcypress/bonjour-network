const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class RaspberryWifiScanner {
    constructor() {
        this.interface = 'wlan0'; // Interface WiFi par défaut sur Raspberry Pi
    }

    async scanNetworks() {
        console.log('🍓 Scan WiFi optimisé pour Raspberry Pi...');

        try {
            // Essayer plusieurs méthodes de scan
            const methods = [
                this.scanWithIwlist.bind(this),
                this.scanWithNmcli.bind(this),
                this.scanWithIw.bind(this),
                this.scanWithIwconfig.bind(this)
            ];

            for (const method of methods) {
                try {
                    console.log(`🔍 Tentative avec ${method.name}...`);
                    const networks = await method();
                    if (networks && networks.length > 0) {
                        console.log(`✅ ${method.name}: ${networks.length} réseaux détectés`);
                        return networks;
                    }
                } catch (error) {
                    console.log(`⚠️ ${method.name} échoué: ${error.message}`);
                }
            }

            console.log('❌ Aucune méthode de scan n\'a fonctionné');
            return this.getFallbackNetwork();
        } catch (error) {
            console.error('Erreur lors du scan WiFi:', error);
            return this.getFallbackNetwork();
        }
    }

    async scanWithIwlist() {
        try {
            // Essayer avec et sans sudo, avec différentes interfaces
            const commands = [
                `sudo iwlist ${this.interface} scan`,
                `iwlist ${this.interface} scan`,
                'sudo iwlist scan',
                'iwlist scan'
            ];

            for (const command of commands) {
                try {
                    console.log(`   Tentative: ${command}`);
                    const { stdout } = await execAsync(command, { timeout: 10000 });

                    if (stdout && !stdout.includes('No scan results')) {
                        return this.parseIwlistOutput(stdout);
                    }
                } catch (error) {
                    console.log(`   Échec: ${command}`);
                }
            }

            throw new Error('Aucune commande iwlist n\'a fonctionné');
        } catch (error) {
            throw error;
        }
    }

    async scanWithNmcli() {
        try {
            const commands = [
                'nmcli device wifi list',
                'sudo nmcli device wifi list',
                'nmcli -t -f SSID,BSSID,CHAN,RATE,SIGNAL,SECURITY device wifi list'
            ];

            for (const command of commands) {
                try {
                    console.log(`   Tentative: ${command}`);
                    const { stdout } = await execAsync(command, { timeout: 8000 });

                    if (stdout && stdout.trim()) {
                        return this.parseNmcliOutput(stdout);
                    }
                } catch (error) {
                    console.log(`   Échec: ${command}`);
                }
            }

            throw new Error('Aucune commande nmcli n\'a fonctionné');
        } catch (error) {
            throw error;
        }
    }

    async scanWithIw() {
        try {
            const commands = [
                `sudo iw dev ${this.interface} scan`,
                `iw dev ${this.interface} scan`,
                'sudo iw dev scan',
                'iw dev scan'
            ];

            for (const command of commands) {
                try {
                    console.log(`   Tentative: ${command}`);
                    const { stdout } = await execAsync(command, { timeout: 8000 });

                    if (stdout && stdout.trim()) {
                        return this.parseIwOutput(stdout);
                    }
                } catch (error) {
                    console.log(`   Échec: ${command}`);
                }
            }

            throw new Error('Aucune commande iw n\'a fonctionné');
        } catch (error) {
            throw error;
        }
    }

    async scanWithIwconfig() {
        try {
            // Obtenir les informations de l'interface WiFi actuelle
            const { stdout } = await execAsync(`iwconfig ${this.interface}`, { timeout: 5000 });
            return this.parseIwconfigOutput(stdout);
        } catch (error) {
            throw error;
        }
    }

    parseIwlistOutput(output) {
        const networks = [];
        const lines = output.split('\n');
        let currentNetwork = {};

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.includes('Cell')) {
                if (Object.keys(currentNetwork).length > 0) {
                    networks.push(this.formatNetwork(currentNetwork));
                }
                currentNetwork = {};
            } else if (trimmedLine.includes('ESSID:')) {
                const essid = trimmedLine.split('"')[1] || 'Unknown';
                currentNetwork.ssid = essid;
            } else if (trimmedLine.includes('Address:')) {
                const bssid = trimmedLine.split('Address:')[1]?.trim();
                currentNetwork.bssid = bssid;
            } else if (trimmedLine.includes('Channel:')) {
                const channel = parseInt(trimmedLine.split('Channel:')[1]?.trim()) || 1;
                currentNetwork.channel = channel;
                currentNetwork.frequency = this.channelToFrequency(channel);
            } else if (trimmedLine.includes('Quality=')) {
                const qualityMatch = trimmedLine.match(/Quality=(\d+)\/\d+/);
                if (qualityMatch) {
                    const quality = parseInt(qualityMatch[1]);
                    currentNetwork.signalStrength = quality;
                    currentNetwork.rssi = this.convertQualityToRSSI(quality);
                }
            } else if (trimmedLine.includes('Encryption key:')) {
                const encrypted = trimmedLine.includes('on');
                currentNetwork.security = encrypted ? 'WPA2' : 'Open';
            }
        }

        // Ajouter le dernier réseau
        if (Object.keys(currentNetwork).length > 0) {
            networks.push(this.formatNetwork(currentNetwork));
        }

        return networks;
    }

    parseNmcliOutput(output) {
        const networks = [];
        const lines = output.split('\n').slice(1); // Ignorer l'en-tête

        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 8) {
                const network = {
                    ssid: parts[0],
                    bssid: parts[1],
                    mode: parts[2],
                    channel: parseInt(parts[3]) || 1,
                    frequency: this.channelToFrequency(parseInt(parts[3]) || 1),
                    signalStrength: parseInt(parts[4]) || 30,
                    security: parts[5] || 'WPA2',
                    rssi: this.convertQualityToRSSI(parseInt(parts[4]) || 30)
                };
                networks.push(this.formatNetwork(network));
            }
        }

        return networks;
    }

    parseIwOutput(output) {
        const networks = [];
        const lines = output.split('\n');
        let currentNetwork = {};

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.includes('BSS')) {
                if (Object.keys(currentNetwork).length > 0) {
                    networks.push(this.formatNetwork(currentNetwork));
                }
                currentNetwork = {};
            } else if (trimmedLine.includes('SSID:')) {
                const ssid = trimmedLine.split('SSID:')[1]?.trim();
                currentNetwork.ssid = ssid;
            } else if (trimmedLine.includes('BSSID:')) {
                const bssid = trimmedLine.split('BSSID:')[1]?.trim();
                currentNetwork.bssid = bssid;
            } else if (trimmedLine.includes('freq:')) {
                const freqMatch = trimmedLine.match(/freq:\s*(\d+)/);
                if (freqMatch) {
                    const freq = parseInt(freqMatch[1]);
                    currentNetwork.frequency = freq;
                    currentNetwork.channel = this.frequencyToChannel(freq);
                }
            } else if (trimmedLine.includes('signal:')) {
                const signalMatch = trimmedLine.match(/signal:\s*(-?\d+)/);
                if (signalMatch) {
                    const rssi = parseInt(signalMatch[1]);
                    currentNetwork.rssi = rssi;
                    currentNetwork.signalStrength = this.convertRSSIToPercentage(rssi);
                }
            }
        }

        // Ajouter le dernier réseau
        if (Object.keys(currentNetwork).length > 0) {
            networks.push(this.formatNetwork(currentNetwork));
        }

        return networks;
    }

    parseIwconfigOutput(output) {
        const networks = [];
        const lines = output.split('\n');
        let currentNetwork = {};

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.includes('ESSID:')) {
                const essid = trimmedLine.split('"')[1] || 'Unknown';
                currentNetwork.ssid = essid;
            } else if (trimmedLine.includes('Access Point:')) {
                const bssid = trimmedLine.split('Access Point:')[1]?.trim();
                currentNetwork.bssid = bssid;
            } else if (trimmedLine.includes('Frequency:')) {
                const freqMatch = trimmedLine.match(/Frequency:(\d+\.\d+)/);
                if (freqMatch) {
                    const freq = parseFloat(freqMatch[1]);
                    currentNetwork.frequency = freq * 1000; // Convertir en MHz
                    currentNetwork.channel = this.frequencyToChannel(freq * 1000);
                }
            } else if (trimmedLine.includes('Link Quality=')) {
                const qualityMatch = trimmedLine.match(/Link Quality=(\d+)\/\d+/);
                if (qualityMatch) {
                    const quality = parseInt(qualityMatch[1]);
                    currentNetwork.signalStrength = quality;
                    currentNetwork.rssi = this.convertQualityToRSSI(quality);
                }
            }
        }

        if (Object.keys(currentNetwork).length > 0) {
            currentNetwork.security = 'WPA2'; // Par défaut
            networks.push(this.formatNetwork(currentNetwork));
        }

        return networks;
    }

    formatNetwork(network) {
        return {
            ssid: network.ssid || 'Unknown',
            bssid: network.bssid || 'N/A',
            mode: network.mode || 'infrastructure',
            channel: network.channel || 1,
            frequency: network.frequency || 2412,
            signal_level: network.rssi || -70,
            signalStrength: network.signalStrength || 30,
            quality: network.quality || network.signalStrength || 30,
            security: network.security || 'WPA2',
            security_flags: [network.security || 'WPA2-PSK-CCMP']
        };
    }

    convertQualityToRSSI(quality) {
        // Convertir la qualité (0-100) en RSSI (-100 à -30)
        return Math.max(-100, -30 - (100 - quality) * 0.7);
    }

    convertRSSIToPercentage(rssi) {
        // Convertir RSSI (-100 à -30) en pourcentage (0-100)
        return Math.max(0, Math.min(100, 100 + rssi));
    }

    channelToFrequency(channel) {
        if (channel >= 1 && channel <= 13) return 2407 + (channel * 5);
        if (channel >= 36 && channel <= 165) return 5000 + (channel * 5);
        return 2412;
    }

    frequencyToChannel(freq) {
        if (freq >= 2400 && freq <= 2484) return Math.round((freq - 2407) / 5);
        if (freq >= 5000 && freq <= 5825) return Math.round((freq - 5000) / 5);
        return 1;
    }

    getFallbackNetwork() {
        return [{
            ssid: 'Réseau WiFi (scan limité)',
            bssid: 'N/A',
            mode: 'infrastructure',
            channel: 1,
            frequency: 2412,
            signal_level: -70,
            signalStrength: 50,
            quality: 50,
            security: 'WPA2',
            security_flags: ['WPA2-PSK-CCMP'],
            note: 'Scan WiFi limité - Utilisez le scan d\'appareils pour plus d\'informations'
        }];
    }
}

module.exports = RaspberryWifiScanner; 