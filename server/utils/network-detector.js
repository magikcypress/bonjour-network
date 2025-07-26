const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const CommandValidator = require('../security/command-validator');
const OSDetector = require('./os-detector');

class NetworkDetector {
    constructor() {
        this.connectionType = null;
        this.activeInterface = null;
        this.wifiInterfaces = [];
        this.ethernetInterfaces = [];
        this.osDetector = new OSDetector();
    }

    /**
     * Détecte le type de connexion réseau actif
     * @returns {Promise<Object>} Informations sur la connexion
     */
    async detectConnectionType() {
        try {
            console.log('🔍 Détection du type de connexion réseau...');

            // Détecter l'OS
            const osInfo = await this.osDetector.detectOS();

            // Obtenir toutes les interfaces réseau selon l'OS
            if (osInfo.isMacOS) {
                await this.getNetworkInterfacesMacOS();
            } else {
                await this.getNetworkInterfaces();
            }

            // Détecter l'interface active selon l'OS
            if (osInfo.isMacOS) {
                await this.detectActiveInterfaceMacOS();
            } else {
                await this.detectActiveInterface();
            }

            // Déterminer le type de connexion
            const result = {
                connectionType: this.connectionType,
                activeInterface: this.activeInterface,
                wifiInterfaces: this.wifiInterfaces,
                ethernetInterfaces: this.ethernetInterfaces,
                canScanWifi: this.wifiInterfaces.length > 0,
                canScanEthernet: this.ethernetInterfaces.length > 0
            };

            console.log(`📡 Type de connexion détecté: ${this.connectionType}`);
            console.log(`🔌 Interface active: ${this.activeInterface}`);
            console.log(`📶 Interfaces WiFi: ${this.wifiInterfaces.join(', ')}`);
            console.log(`🔗 Interfaces Ethernet: ${this.ethernetInterfaces.join(', ')}`);

            return result;
        } catch (error) {
            console.error('Erreur lors de la détection réseau:', error);
            return {
                connectionType: 'unknown',
                activeInterface: null,
                wifiInterfaces: [],
                ethernetInterfaces: [],
                canScanWifi: false,
                canScanEthernet: false
            };
        }
    }

    /**
     * Obtient toutes les interfaces réseau (Linux)
     */
    async getNetworkInterfaces() {
        try {
            // Utiliser ip link pour obtenir les interfaces
            const result = await CommandValidator.safeExec('ip link show');
            if (!result.success) {
                throw new Error('Impossible d\'obtenir les interfaces réseau');
            }

            const lines = result.stdout.split('\n');
            this.wifiInterfaces = [];
            this.ethernetInterfaces = [];

            for (const line of lines) {
                // Chercher les interfaces WiFi (wlan, wifi, wireless)
                if (line.includes('wlan') || line.includes('wifi') || line.includes('wireless')) {
                    const match = line.match(/(\d+):\s+(\w+):/);
                    if (match) {
                        this.wifiInterfaces.push(match[2]);
                    }
                }
                // Chercher les interfaces Ethernet (eth, enp, ethernet)
                else if (line.includes('eth') || line.includes('enp') || line.includes('ethernet')) {
                    const match = line.match(/(\d+):\s+(\w+):/);
                    if (match) {
                        this.ethernetInterfaces.push(match[2]);
                    }
                }
            }

            console.log(`📶 Interfaces WiFi trouvées: ${this.wifiInterfaces.join(', ')}`);
            console.log(`🔗 Interfaces Ethernet trouvées: ${this.ethernetInterfaces.join(', ')}`);

        } catch (error) {
            console.error('Erreur lors de l\'obtention des interfaces:', error);
        }
    }

    /**
     * Obtient toutes les interfaces réseau (macOS)
     */
    async getNetworkInterfacesMacOS() {
        try {
            // Utiliser networksetup pour obtenir les interfaces
            const result = await CommandValidator.safeExec('networksetup -listallnetworkservices');
            if (!result.success) {
                throw new Error('Impossible d\'obtenir les interfaces réseau');
            }

            const lines = result.stdout.split('\n');
            this.wifiInterfaces = [];
            this.ethernetInterfaces = [];

            for (const line of lines) {
                const service = line.trim();
                if (service && service !== 'An asterisk (*) denotes that a network service is disabled.') {
                    // Vérifier le type d'interface
                    const typeResult = await CommandValidator.safeExec(`networksetup -getinfo "${service}"`);
                    if (typeResult.success) {
                        if (typeResult.stdout.includes('Wi-Fi') || typeResult.stdout.includes('AirPort')) {
                            this.wifiInterfaces.push(service);
                        } else if (typeResult.stdout.includes('Ethernet')) {
                            this.ethernetInterfaces.push(service);
                        }
                    }
                }
            }

            console.log(`📶 Interfaces WiFi trouvées: ${this.wifiInterfaces.join(', ')}`);
            console.log(`🔗 Interfaces Ethernet trouvées: ${this.ethernetInterfaces.join(', ')}`);

        } catch (error) {
            console.error('Erreur lors de l\'obtention des interfaces macOS:', error);
        }
    }

    /**
     * Détecte l'interface réseau active (Linux)
     */
    async detectActiveInterface() {
        try {
            // Obtenir l'IP locale et l'interface associée
            const result = await CommandValidator.safeExec('ip route get 1.1.1.1');
            if (!result.success) {
                throw new Error('Impossible d\'obtenir l\'interface active');
            }

            // Parser la sortie pour obtenir l'interface
            const match = result.stdout.match(/dev\s+(\w+)/);
            if (match) {
                this.activeInterface = match[1];

                // Déterminer le type de connexion
                if (this.wifiInterfaces.includes(this.activeInterface)) {
                    this.connectionType = 'wifi';
                } else if (this.ethernetInterfaces.includes(this.activeInterface)) {
                    this.connectionType = 'ethernet';
                } else {
                    this.connectionType = 'unknown';
                }
            } else {
                this.activeInterface = null;
                this.connectionType = 'unknown';
            }

        } catch (error) {
            console.error('Erreur lors de la détection de l\'interface active:', error);
            this.activeInterface = null;
            this.connectionType = 'unknown';
        }
    }

    /**
     * Détecte l'interface réseau active (macOS)
     */
    async detectActiveInterfaceMacOS() {
        try {
            // Obtenir l'interface active via route
            const result = await CommandValidator.safeExec('route -n get 1.1.1.1');
            if (!result.success) {
                throw new Error('Impossible d\'obtenir l\'interface active');
            }

            // Parser la sortie pour obtenir l'interface
            const match = result.stdout.match(/interface:\s+(\w+)/);
            if (match) {
                this.activeInterface = match[1];

                // Déterminer le type de connexion
                if (this.wifiInterfaces.includes(this.activeInterface)) {
                    this.connectionType = 'wifi';
                } else if (this.ethernetInterfaces.includes(this.activeInterface)) {
                    this.connectionType = 'ethernet';
                } else {
                    this.connectionType = 'unknown';
                }
            } else {
                this.activeInterface = null;
                this.connectionType = 'unknown';
            }

        } catch (error) {
            console.error('Erreur lors de la détection de l\'interface active macOS:', error);
            this.activeInterface = null;
            this.connectionType = 'unknown';
        }
    }

    /**
     * Vérifie si le scan WiFi est possible
     * @returns {Promise<boolean>}
     */
    async canScanWifi() {
        if (this.connectionType !== 'wifi') {
            return false;
        }

        // Vérifier si les outils WiFi sont disponibles
        try {
            const iwlistResult = await CommandValidator.safeExec('which iwlist');
            const nmcliResult = await CommandValidator.safeExec('which nmcli');
            const iwResult = await CommandValidator.safeExec('which iw');

            return iwlistResult.success || nmcliResult.success || iwResult.success;
        } catch (error) {
            return false;
        }
    }

    /**
     * Vérifie si le scan Ethernet est possible
     * @returns {Promise<boolean>}
     */
    async canScanEthernet() {
        if (this.connectionType !== 'ethernet') {
            return false;
        }

        // Vérifier si les outils de scan réseau sont disponibles
        try {
            const arpScanResult = await CommandValidator.safeExec('which arp-scan');
            const nmapResult = await CommandValidator.safeExec('which nmap');
            const arpingResult = await CommandValidator.safeExec('which arping');

            return arpScanResult.success || nmapResult.success || arpingResult.success;
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtient les interfaces recommandées pour le scan
     * @returns {Promise<Object>}
     */
    async getRecommendedInterfaces() {
        const connection = await this.detectConnectionType();

        return {
            wifi: this.wifiInterfaces.length > 0 ? this.wifiInterfaces[0] : null,
            ethernet: this.ethernetInterfaces.length > 0 ? this.ethernetInterfaces[0] : null,
            active: this.activeInterface,
            connectionType: this.connectionType
        };
    }

    /**
 * Génère un message d'information sur la connexion
 * @returns {string}
 */
    getConnectionInfo() {
        let info = `🔍 Détection réseau:\n`;
        info += `📡 Type de connexion: ${this.connectionType || 'Inconnu'}\n`;
        info += `🔌 Interface active: ${this.activeInterface || 'Aucune'}\n`;

        if (this.wifiInterfaces.length > 0) {
            info += `📶 Interfaces WiFi: ${this.wifiInterfaces.join(', ')}\n`;
        }

        if (this.ethernetInterfaces.length > 0) {
            info += `🔗 Interfaces Ethernet: ${this.ethernetInterfaces.join(', ')}\n`;
        }

        return info;
    }
}

module.exports = NetworkDetector; 