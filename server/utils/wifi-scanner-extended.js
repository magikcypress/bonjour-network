const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class WifiScannerExtended {
    constructor() {
        this.platform = process.platform;
    }

    /**
     * Scanne les réseaux WiFi extérieurs en utilisant AppleScript
     * @returns {Promise<Array>} Liste des réseaux WiFi
     */
    async scanExternalNetworks() {
        try {
            if (this.platform !== 'darwin') {
                console.log('⚠️ Scan WiFi externe non supporté sur cette plateforme');
                return [];
            }

            console.log('🔍 Scan des réseaux WiFi extérieurs...');

            // Méthode 1: Essayer avec AppleScript et airport
            try {
                const networks = await this.scanWithAppleScript();
                if (networks && networks.length > 0) {
                    console.log(`✅ Scan AppleScript: ${networks.length} réseaux détectés`);
                    return networks;
                }
            } catch (error) {
                console.log('⚠️ AppleScript échoué, essai méthode alternative...');
            }

            // Méthode 2: Utiliser system_profiler
            try {
                const networks = await this.scanWithSystemProfiler();
                if (networks && networks.length > 0) {
                    console.log(`✅ System Profiler: ${networks.length} réseaux détectés`);
                    return networks;
                }
            } catch (error) {
                console.log('⚠️ System Profiler échoué');
            }

            // Méthode 3: Utiliser networksetup pour les réseaux connus
            try {
                const networks = await this.scanKnownNetworks();
                if (networks && networks.length > 0) {
                    console.log(`✅ Réseaux connus: ${networks.length} réseaux détectés`);
                    return networks;
                }
            } catch (error) {
                console.log('⚠️ Scan des réseaux connus échoué');
            }

            console.log('❌ Aucune méthode de scan externe n\'a fonctionné');
            return [];

        } catch (error) {
            console.error('❌ Erreur lors du scan WiFi externe:', error.message);
            return [];
        }
    }

    /**
     * Scan avec AppleScript utilisant airport
     */
    async scanWithAppleScript() {
        const script = `
            tell application "System Events"
                set wifiNetworks to {}
                
                try
                    -- Essayer d'utiliser airport pour scanner
                    set scanResult to do shell script "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s 2>/dev/null"
                    
                    -- Parser le résultat
                    set networkLines to paragraphs of scanResult
                    repeat with line in networkLines
                        if line contains "SSID" and line contains "BSSID" then
                            -- Ignorer l'en-tête
                        else if line is not "" and line does not contain "WARNING" and line does not contain "deprecated" then
                            set networkInfo to words of line
                            if (count of networkInfo) ≥ 6 then
                                set networkData to {ssid:item 1 of networkInfo, bssid:item 2 of networkInfo, rssi:item 3 of networkInfo, channel:item 4 of networkInfo, security:item 5 of networkInfo}
                                set end of wifiNetworks to networkData
                            end if
                        end if
                    end repeat
                on error
                    -- Si airport ne fonctionne pas, essayer une autre méthode
                    set wifiNetworks to {}
                end try
                
                return wifiNetworks
            end tell
        `;

        try {
            const { stdout } = await execAsync(`osascript -e '${script}'`, { timeout: 15000 });

            if (!stdout || stdout.trim() === '') {
                return [];
            }

            // Parser le résultat AppleScript
            const networks = [];
            const lines = stdout.trim().split('\n');

            for (const line of lines) {
                if (line.includes('ssid:') || line.includes('SSID:')) {
                    const parts = line.split(',');
                    const network = {};

                    for (const part of parts) {
                        const [key, value] = part.split(':').map(s => s.trim());
                        if (key && value) {
                            network[key.toLowerCase()] = value;
                        }
                    }

                    if (network.ssid && network.ssid !== 'Unknown') {
                        networks.push({
                            ssid: network.ssid,
                            bssid: network.bssid || 'Unknown',
                            rssi: network.rssi || 'Unknown',
                            channel: network.channel || 'Unknown',
                            security: network.security || 'Unknown',
                            frequency: this.getFrequencyFromChannel(network.channel),
                            quality: this.getQualityFromRssi(network.rssi)
                        });
                    }
                }
            }

            return networks;

        } catch (error) {
            console.log('⚠️ AppleScript échoué:', error.message);
            return [];
        }
    }

    /**
     * Scan avec system_profiler
     */
    async scanWithSystemProfiler() {
        try {
            // Vérifier si system_profiler est disponible
            try {
                await execAsync('which system_profiler');
            } catch (error) {
                console.log('⚠️ system_profiler non disponible sur ce système');
                return [];
            }

            const { stdout } = await execAsync('system_profiler SPAirPortDataType -xml', { timeout: 15000 });

            if (!stdout || stdout.trim() === '') {
                return [];
            }

            const networks = [];
            const lines = stdout.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('<key>SSID_STR</key>')) {
                    const ssidLine = lines[i + 1];
                    const ssid = ssidLine.replace(/<string>|<\/string>/g, '').trim();

                    if (ssid && ssid !== 'Unknown') {
                        networks.push({
                            ssid,
                            bssid: 'Unknown',
                            rssi: 'Unknown',
                            channel: 'Unknown',
                            security: 'Unknown',
                            frequency: 2412,
                            quality: 50
                        });
                    }
                }
            }

            return networks;

        } catch (error) {
            console.log('⚠️ System Profiler échoué:', error.message);
            return [];
        }
    }

    /**
     * Scan des réseaux connus via networksetup
     */
    async scanKnownNetworks() {
        try {
            const { stdout } = await execAsync('networksetup -listpreferredwirelessnetworks "Wi-Fi"', { timeout: 10000 });

            if (!stdout || stdout.trim() === '') {
                return [];
            }

            const networks = [];
            const lines = stdout.trim().split('\n');

            for (const line of lines) {
                if (line.trim() && !line.includes('Error')) {
                    networks.push({
                        ssid: line.trim(),
                        bssid: 'Known Network',
                        rssi: 'Unknown',
                        channel: 'Unknown',
                        security: 'Known',
                        frequency: 2412,
                        quality: 50
                    });
                }
            }

            return networks;

        } catch (error) {
            console.log('⚠️ Scan des réseaux connus échoué:', error.message);
            return [];
        }
    }

    /**
     * Convertir le canal en fréquence
     */
    getFrequencyFromChannel(channel) {
        if (!channel || channel === 'Unknown') return 2412;

        const ch = parseInt(channel);
        if (ch >= 1 && ch <= 13) return 2407 + (ch * 5);
        if (ch >= 36 && ch <= 165) return 5000 + (ch * 5);
        return 2412;
    }

    /**
     * Convertir RSSI en qualité
     */
    getQualityFromRssi(rssi) {
        if (!rssi || rssi === 'Unknown') return 50;

        const rssiValue = parseInt(rssi);
        if (rssiValue >= -50) return 100;
        if (rssiValue >= -60) return 80;
        if (rssiValue >= -70) return 60;
        if (rssiValue >= -80) return 40;
        return 20;
    }
}

module.exports = WifiScannerExtended; 