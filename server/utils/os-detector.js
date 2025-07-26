const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class OSDetector {
    constructor() {
        this.os = null;
        this.platform = null;
    }

    /**
     * Détecte le système d'exploitation
     * @returns {Promise<Object>} Informations sur l'OS
     */
    async detectOS() {
        try {
            // Détecter la plateforme Node.js
            this.platform = process.platform;

            // Détecter l'OS spécifique
            if (this.platform === 'darwin') {
                this.os = 'macos';
            } else if (this.platform === 'linux') {
                // Détecter si c'est un Raspberry Pi
                try {
                    const { stdout } = await execAsync('cat /proc/cpuinfo | grep -i raspberry');
                    if (stdout.includes('Raspberry Pi')) {
                        this.os = 'raspberry-pi';
                    } else {
                        this.os = 'linux';
                    }
                } catch (error) {
                    this.os = 'linux';
                }
            } else if (this.platform === 'win32') {
                this.os = 'windows';
            } else {
                this.os = 'unknown';
            }

            console.log(`🖥️ Système détecté: ${this.os} (${this.platform})`);

            return {
                os: this.os,
                platform: this.platform,
                isMacOS: this.os === 'macos',
                isLinux: this.os === 'linux',
                isRaspberryPi: this.os === 'raspberry-pi',
                isWindows: this.os === 'windows'
            };
        } catch (error) {
            console.error('Erreur lors de la détection OS:', error);
            return {
                os: 'unknown',
                platform: process.platform,
                isMacOS: false,
                isLinux: false,
                isRaspberryPi: false,
                isWindows: false
            };
        }
    }

    /**
     * Obtient les commandes WiFi appropriées pour l'OS
     * @returns {Object} Commandes WiFi
     */
    getWiFiCommands() {
        if (this.os === 'macos') {
            return {
                scan: 'airport -s',
                info: 'system_profiler SPAirPortDataType',
                setup: 'networksetup -listallhardwareports',
                type: 'macos'
            };
        } else if (this.os === 'raspberry-pi' || this.os === 'linux') {
            return {
                scan: 'iwlist scan',
                info: 'iwconfig',
                setup: 'ip link show',
                type: 'linux'
            };
        } else {
            return {
                scan: null,
                info: null,
                setup: null,
                type: 'unknown'
            };
        }
    }

    /**
     * Obtient les commandes de scan réseau appropriées pour l'OS
     * @returns {Object} Commandes de scan réseau
     */
    getNetworkScanCommands() {
        if (this.os === 'macos') {
            return {
                arp: 'arp -a',
                netstat: 'netstat -rn',
                ping: 'ping -c 1',
                nmap: 'nmap -sn',
                type: 'macos'
            };
        } else if (this.os === 'raspberry-pi' || this.os === 'linux') {
            return {
                arp: 'arp -a',
                netstat: 'netstat -rn',
                ping: 'ping -c 1',
                nmap: 'nmap -sn',
                type: 'linux'
            };
        } else {
            return {
                arp: null,
                netstat: null,
                ping: null,
                nmap: null,
                type: 'unknown'
            };
        }
    }

    /**
     * Vérifie si une commande est disponible
     * @param {string} command - Commande à vérifier
     * @returns {Promise<boolean>}
     */
    async isCommandAvailable(command) {
        try {
            await execAsync(`which ${command}`);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtient les informations système
     * @returns {string}
     */
    getSystemInfo() {
        return `🖥️ Système: ${this.os} (${this.platform})`;
    }
}

module.exports = OSDetector; 