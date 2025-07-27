const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class WifiScanner {
    constructor() {
        this.platform = process.platform;
    }

    /**
     * Scanne les réseaux WiFi disponibles
     * @returns {Promise<Array>} Liste des réseaux WiFi
     */
    async scanWifiNetworks() {
        try {
            if (this.platform !== 'darwin') {
                console.log('⚠️ Scan WiFi non supporté sur cette plateforme');
                return [];
            }

            console.log('🔍 Scan des réseaux WiFi...');

            // Méthode 1: Essayer airport (déprécié mais peut encore fonctionner)
            try {
                const result = await this.scanWithAirport();
                if (result && result.length > 0) {
                    console.log(`✅ Scan airport: ${result.length} réseaux détectés`);
                    return result;
                }
            } catch (error) {
                console.log('⚠️ Scan airport échoué, essai méthode alternative...');
            }

            // Méthode 2: Utiliser system_profiler
            try {
                const result = await this.scanWithSystemProfiler();
                if (result && result.length > 0) {
                    console.log(`✅ Scan system_profiler: ${result.length} réseaux détectés`);
                    return result;
                }
            } catch (error) {
                console.log('⚠️ Scan system_profiler échoué');
            }

            // Méthode 3: Utiliser wdutil (nouvelle méthode Apple)
            try {
                const result = await this.scanWithWdutil();
                if (result && result.length > 0) {
                    console.log(`✅ Scan wdutil: ${result.length} réseaux détectés`);
                    return result;
                }
            } catch (error) {
                console.log('⚠️ Scan wdutil échoué');
            }

            console.log('❌ Aucune méthode de scan WiFi n\'a fonctionné');
            return [];

        } catch (error) {
            console.error('❌ Erreur lors du scan WiFi:', error.message);
            return [];
        }
    }

    /**
     * Scan avec airport (déprécié)
     */
    async scanWithAirport() {
        const command = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s';
        const { stdout } = await execAsync(command, { timeout: 10000 });

        if (!stdout || stdout.trim() === '') {
            throw new Error('Aucun résultat');
        }

        const lines = stdout.trim().split('\n');
        const networks = [];

        // Vérifier si c'est le message de dépréciation
        if (stdout.includes('WARNING: The airport command line tool is deprecated')) {
            console.log('⚠️ Airport déprécié, utilisation de system_profiler...');
            throw new Error('Airport déprécié');
        }

        // Ignorer les lignes d'avertissement et la première ligne (en-tête)
        let startIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('SSID') && lines[i].includes('BSSID')) {
                startIndex = i + 1;
                break;
            }
        }

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.includes('WARNING') && !line.includes('deprecated')) {
                const parts = line.split(/\s+/);
                if (parts.length >= 6) {
                    networks.push({
                        ssid: parts[0],
                        bssid: parts[1],
                        rssi: parts[2],
                        channel: parts[3],
                        security: parts[4],
                        type: parts[5] || 'Unknown'
                    });
                }
            }
        }

        return networks;
    }

    /**
     * Scan avec system_profiler
     */
    async scanWithSystemProfiler() {
        const command = 'system_profiler SPAirPortDataType -xml';
        const { stdout } = await execAsync(command, { timeout: 15000 });

        if (!stdout || stdout.trim() === '') {
            throw new Error('Aucun résultat');
        }

        // Parser le XML pour extraire les réseaux
        const networks = [];
        const lines = stdout.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('<key>SSID_STR</key>')) {
                const ssidLine = lines[i + 1];
                const ssid = ssidLine.replace(/<string>|<\/string>/g, '').trim();

                // Chercher les autres informations
                let bssid = 'Unknown';
                let rssi = 'Unknown';
                let security = 'Unknown';

                // Chercher BSSID
                for (let j = i; j < Math.min(i + 20, lines.length); j++) {
                    if (lines[j].includes('<key>BSSID</key>')) {
                        bssid = lines[j + 1].replace(/<string>|<\/string>/g, '').trim();
                        break;
                    }
                }

                // Chercher RSSI
                for (let j = i; j < Math.min(i + 20, lines.length); j++) {
                    if (lines[j].includes('<key>RSSI</key>')) {
                        rssi = lines[j + 1].replace(/<integer>|<\/integer>/g, '').trim();
                        break;
                    }
                }

                // Chercher Security
                for (let j = i; j < Math.min(i + 20, lines.length); j++) {
                    if (lines[j].includes('<key>SECURITY</key>')) {
                        security = lines[j + 1].replace(/<string>|<\/string>/g, '').trim();
                        break;
                    }
                }

                networks.push({
                    ssid,
                    bssid,
                    rssi,
                    channel: 'Unknown',
                    security,
                    type: 'Unknown'
                });
            }
        }

        return networks;
    }

    /**
 * Scan avec wdutil (nouvelle méthode Apple)
 */
    async scanWithWdutil() {
        try {
            // Obtenir les informations du réseau actuel via wdutil
            const command = 'sudo wdutil info';
            const { stdout } = await execAsync(command, { timeout: 10000 });

            if (!stdout || stdout.trim() === '') {
                throw new Error('Aucun résultat');
            }

            // Extraire les informations du réseau actuel
            const lines = stdout.split('\n');
            let currentNetwork = null;
            let hasWifiInfo = false;

            for (const line of lines) {
                if (line.includes('SSID')) {
                    hasWifiInfo = true;
                    const ssid = line.split(':')[1]?.trim();

                    // Chercher d'autres informations
                    let bssid = 'Connected';
                    let rssi = 'Connected';
                    let security = 'Connected';
                    let channel = 'Current';

                    for (const infoLine of lines) {
                        if (infoLine.includes('BSSID')) {
                            bssid = infoLine.split(':')[1]?.trim() || 'Connected';
                        } else if (infoLine.includes('RSSI')) {
                            rssi = infoLine.split(':')[1]?.trim() || 'Connected';
                        } else if (infoLine.includes('Security')) {
                            security = infoLine.split(':')[1]?.trim() || 'Connected';
                        } else if (infoLine.includes('Channel')) {
                            channel = infoLine.split(':')[1]?.trim() || 'Current';
                        }
                    }

                    // Si le SSID est masqué, créer un réseau factice
                    if (ssid === '<redacted>' || !ssid) {
                        currentNetwork = {
                            ssid: 'Réseau WiFi Actuel (SSID masqué)',
                            bssid,
                            rssi,
                            channel,
                            security,
                            type: 'Current'
                        };
                    } else {
                        currentNetwork = {
                            ssid,
                            bssid,
                            rssi,
                            channel,
                            security,
                            type: 'Current'
                        };
                    }
                    break;
                }
            }

            // Si on a des infos WiFi mais pas de SSID, créer un réseau factice
            if (hasWifiInfo && !currentNetwork) {
                currentNetwork = {
                    ssid: 'Réseau WiFi Actuel',
                    bssid: 'Connected',
                    rssi: 'Connected',
                    channel: 'Current',
                    security: 'Connected',
                    type: 'Current'
                };
            }

            return currentNetwork ? [currentNetwork] : [];
        } catch (error) {
            console.log('⚠️ wdutil échoué:', error.message);
            return [];
        }
    }
}

module.exports = WifiScanner; 