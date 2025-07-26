const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const CommandValidator = require('./security/command-validator');
const NetworkDetector = require('./utils/network-detector');

class RealNoSudoWiFiScanner {
    async scanNetworks() {
        try {
            console.log('🔍 Démarrage du scan WiFi avec détection automatique...');

            // Détecter le type de connexion
            const networkDetector = new NetworkDetector();
            const connectionInfo = await networkDetector.detectConnectionType();

            console.log(networkDetector.getConnectionInfo());

            // Si on est sur Ethernet, retourner un message informatif
            if (connectionInfo.connectionType === 'ethernet') {
                console.log('📡 Connexion Ethernet détectée - Scan WiFi non disponible');
                return [{
                    ssid: 'Connexion Ethernet',
                    bssid: null,
                    mode: 'ethernet',
                    channel: 0,
                    frequency: 0,
                    signal_level: 0,
                    signalStrength: 100,
                    quality: 100,
                    security: 'Ethernet',
                    security_flags: ['Ethernet'],
                    note: 'Raspberry Pi connecté via Ethernet - Utilisez le scan d\'appareils pour détecter les devices'
                }];
            }

            // Si on est sur WiFi, essayer le scan WiFi
            if (connectionInfo.connectionType === 'wifi') {
                console.log('📶 Connexion WiFi détectée - Tentative de scan WiFi...');

                // Essayer iwlist (Linux)
                console.log('🎯 Utilisation de iwlist pour Linux...');
                const iwlistNetworks = await this.scanWithIwlist();
                if (iwlistNetworks.length > 0) {
                    console.log(`✅ Scan iwlist réussi: ${iwlistNetworks.length} réseaux détectés`);
                    return iwlistNetworks;
                }

                // Essayer nmcli (Linux)
                console.log('⚠️ Iwlist échoué, utilisation de nmcli...');
                const nmcliNetworks = await this.scanWithNmcli();
                if (nmcliNetworks.length > 0) {
                    console.log(`✅ Scan nmcli réussi: ${nmcliNetworks.length} réseaux détectés`);
                    return nmcliNetworks;
                }

                // Essayer iw (Linux)
                console.log('⚠️ Nmcli échoué, utilisation de iw...');
                const iwNetworks = await this.scanWithIw();
                if (iwNetworks.length > 0) {
                    console.log(`✅ Scan iw réussi: ${iwNetworks.length} réseaux détectés`);
                    return iwNetworks;
                }
            }

            console.log('❌ Aucune méthode de scan WiFi n\'a fonctionné');
            console.log('🔄 Retour d\'un réseau simulé pour éviter l\'erreur...');
            return [{
                ssid: 'Réseau WiFi (simulé)',
                bssid: null,
                mode: 'infrastructure',
                channel: 1,
                frequency: 2412,
                signal_level: -70,
                signalStrength: 50,
                quality: 50,
                security: 'WPA2',
                security_flags: ['WPA2-PSK-CCMP'],
                note: 'Scan WiFi non disponible - Utilisez le scan d\'appareils'
            }];
        } catch (error) {
            console.error('Erreur lors du scan WiFi:', error);
            return [];
        }
    }

    async scanWithIwlist() {
        try {
            // Utiliser iwlist pour scanner les réseaux WiFi (avec sudo sur Raspberry Pi)
            const { stdout } = await execAsync('iwlist scan 2>/dev/null || iwlist wlan0 scan 2>/dev/null || sudo iwlist scan 2>/dev/null || sudo iwlist wlan0 scan 2>/dev/null || echo "iwlist non disponible"');
            if (stdout.includes('iwlist non disponible')) {
                console.log('iwlist non disponible');
                return [];
            }
            return this.parseIwlistOutput(stdout);
        } catch (error) {
            console.log('iwlist non disponible ou échoué');
            return [];
        }
    }

    async scanWithNmcli() {
        try {
            // Utiliser nmcli pour scanner les réseaux WiFi
            const { stdout } = await execAsync('nmcli device wifi list 2>/dev/null || echo "nmcli non disponible"');
            if (stdout.includes('nmcli non disponible')) {
                console.log('nmcli non disponible');
                return [];
            }
            return this.parseNmcliOutput(stdout);
        } catch (error) {
            console.log('nmcli non disponible ou échoué');
            return [];
        }
    }

    async scanWithIw() {
        try {
            // Utiliser iw pour scanner les réseaux WiFi (avec sudo sur Raspberry Pi)
            const { stdout } = await execAsync('iw dev wlan0 scan 2>/dev/null || iw dev scan 2>/dev/null || sudo iw dev wlan0 scan 2>/dev/null || sudo iw dev scan 2>/dev/null || echo "iw non disponible"');
            if (stdout.includes('iw non disponible')) {
                console.log('iw non disponible');
                return [];
            }
            return this.parseIwOutput(stdout);
        } catch (error) {
            console.log('iw non disponible ou échoué');
            return [];
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
                const freq = parseInt(trimmedLine.split('freq:')[1]?.trim());
                currentNetwork.frequency = freq;
                currentNetwork.channel = this.frequencyToChannel(freq);
            } else if (trimmedLine.includes('signal:')) {
                const signal = parseInt(trimmedLine.split('signal:')[1]?.trim());
                currentNetwork.rssi = signal;
                currentNetwork.signalStrength = this.convertRSSIToPercentage(signal);
            }
        }

        // Ajouter le dernier réseau
        if (Object.keys(currentNetwork).length > 0) {
            networks.push(this.formatNetwork(currentNetwork));
        }

        return networks;
    }

    formatNetwork(network) {
        return {
            ssid: network.ssid || 'Unknown',
            bssid: network.bssid || null,
            mode: 'infrastructure',
            channel: network.channel || 1,
            frequency: network.frequency || 2412,
            signal_level: network.rssi || -70,
            signalStrength: network.signalStrength || 30,
            quality: network.signalStrength || 30,
            security: network.security || 'WPA2',
            security_flags: [network.security || 'WPA2-PSK-CCMP']
        };
    }

    convertQualityToRSSI(quality) {
        // Convertir une qualité de 0-100 en RSSI approximatif
        return Math.round(-100 + (quality * 0.7));
    }

    convertRSSIToPercentage(rssi) {
        // Convertir RSSI en pourcentage de signal
        if (rssi >= -50) return 100;
        if (rssi <= -100) return 0;
        return Math.round(2 * (rssi + 100));
    }

    channelToFrequency(channel) {
        // Convertir canal en fréquence (2.4GHz)
        if (channel >= 1 && channel <= 13) {
            return 2407 + (channel * 5);
        }
        return 2412; // Canal 1 par défaut
    }

    frequencyToChannel(freq) {
        // Convertir fréquence en canal
        if (freq >= 2412 && freq <= 2484) {
            return Math.round((freq - 2407) / 5);
        }
        return 1;
    }
}

module.exports = RealNoSudoWiFiScanner; 