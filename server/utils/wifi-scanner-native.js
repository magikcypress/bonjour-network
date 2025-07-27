const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class WifiScannerNative {
    constructor() {
        this.platform = process.platform;
    }

    /**
     * Scanne les réseaux WiFi disponibles en utilisant l'API native macOS
     * @returns {Promise<Array>} Liste des réseaux WiFi
     */
    async scanWifiNetworks() {
        try {
            if (this.platform !== 'darwin') {
                console.log('⚠️ Scan WiFi natif non supporté sur cette plateforme');
                return [];
            }

            console.log('🔍 Scan des réseaux WiFi (méthode native)...');

            // Utiliser AppleScript pour accéder à l'API CoreWLAN
            const networks = await this.scanWithAppleScript();

            if (networks && networks.length > 0) {
                console.log(`✅ Scan natif: ${networks.length} réseaux détectés`);
                return networks;
            }

            console.log('❌ Aucun réseau détecté avec la méthode native');
            return [];

        } catch (error) {
            console.error('❌ Erreur lors du scan WiFi natif:', error.message);
            return [];
        }
    }

    /**
     * Scan avec AppleScript utilisant l'API CoreWLAN
     */
    async scanWithAppleScript() {
        const script = `
            tell application "System Events"
                set wifiNetworks to {}
                
                -- Essayer d'obtenir les réseaux via l'API WiFi
                try
                    set wifiInterface to do shell script "networksetup -listallhardwareports | grep -A 1 'Wi-Fi' | grep 'Device:' | awk '{print $2}'"
                    
                    -- Utiliser airport pour scanner (même si déprécié, peut encore fonctionner)
                    set scanResult to do shell script "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s 2>/dev/null"
                    
                    -- Parser le résultat
                    set networkLines to paragraphs of scanResult
                    repeat with line in networkLines
                        if line contains "SSID" and line contains "BSSID" then
                            -- Ignorer l'en-tête
                        else if line is not "" and line does not contain "WARNING" then
                            set networkInfo to words of line
                            if (count of networkInfo) ≥ 6 then
                                set networkData to {ssid:item 1 of networkInfo, bssid:item 2 of networkInfo, rssi:item 3 of networkInfo, channel:item 4 of networkInfo, security:item 5 of networkInfo}
                                set end of wifiNetworks to networkData
                            end if
                        end if
                    end repeat
                on error
                    -- Fallback: utiliser system_profiler
                    try
                        set profilerResult to do shell script "system_profiler SPAirPortDataType -xml 2>/dev/null"
                        -- Parser XML pour extraire les réseaux
                        set networkCount to 0
                        repeat with i from 1 to (count of paragraphs of profilerResult)
                            set line to paragraph i of profilerResult
                            if line contains "SSID_STR" then
                                set networkCount to networkCount + 1
                                set ssid to do shell script "echo '" & line & "' | sed 's/.*<string>\\(.*\\)<\\/string>.*/\\1/'"
                                set networkData to {ssid:ssid, bssid:"Unknown", rssi:"Unknown", channel:"Unknown", security:"Unknown"}
                                set end of wifiNetworks to networkData
                            end if
                        end repeat
                    end try
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
                            type: 'WiFi'
                        });
                    }
                }
            }

            return networks;

        } catch (error) {
            console.log('⚠️ AppleScript échoué, essai méthode alternative...');
            return await this.scanWithAlternativeMethod();
        }
    }

    /**
     * Méthode alternative utilisant des commandes système
     */
    async scanWithAlternativeMethod() {
        try {
            // Essayer d'utiliser networksetup pour lister les réseaux connus
            const { stdout } = await execAsync('networksetup -listallnetworkservices', { timeout: 5000 });

            if (stdout.includes('Wi-Fi')) {
                // Essayer d'obtenir des informations sur le réseau actuel
                const { stdout: wifiInfo } = await execAsync('networksetup -getinfo "Wi-Fi"', { timeout: 5000 });

                const networks = [];
                const lines = wifiInfo.split('\n');

                for (const line of lines) {
                    if (line.includes('SSID')) {
                        const ssid = line.split(':')[1]?.trim();
                        if (ssid && ssid !== '<redacted>') {
                            networks.push({
                                ssid,
                                bssid: 'Current',
                                rssi: 'Connected',
                                channel: 'Current',
                                security: 'Current',
                                type: 'Current'
                            });
                        }
                    }
                }

                return networks;
            }

            return [];

        } catch (error) {
            console.log('⚠️ Méthode alternative échouée');
            return [];
        }
    }
}

module.exports = WifiScannerNative; 