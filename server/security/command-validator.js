const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class CommandValidator {
    // Liste blanche des commandes autorisées
    static allowedCommands = new Set([
        // Commandes réseau de base
        'arp', 'netstat', 'ifconfig', 'ping', 'nmap', 'dns-sd',

        // Commandes réseau Linux
        'ip',

        // Commandes WiFi macOS
        'airport', 'system_profiler', 'networksetup', 'wdutil', 'route',

        // Commandes WiFi Linux/Raspberry Pi
        'iwlist', 'nmcli', 'iw', 'iwconfig',

        // Commandes de découverte réseau
        'arping', 'scutil', 'arp-scan',

        // Commandes système avec sudo
        'sudo',

        // Commandes de test
        'which', 'echo', 'cat', 'grep', 'perl'
    ]);

    // Paramètres autorisés pour chaque commande
    static allowedParams = {
        'arp': ['-a', '-n'],
        'netstat': ['-rn', '-an'],
        'ifconfig': ['en0', 'en1', 'lo0', 'wlan0', 'eth0'],
        'ping': ['-c', '1', '-W', '1000', '500', '300'],
        'nmap': ['-sn', '-PR', '--max-retries', '1', '--min-rate', '100', '200', '--host-timeout', '1s', '5s', '192.168.1.0/24'],
        'dns-sd': ['-B', '_http._tcp', '_https._tcp', '_ssh._tcp', '_ftp._tcp', '_smb._tcp', '_airplay._tcp', 'local', '2>/dev/null'],
        'airport': ['-s'],
        'system_profiler': ['SPAirPortDataType'],
        'networksetup': ['-listallnetworkservices', '-getinfo', 'Wi-Fi', 'AirPort', 'Ethernet', 'AX88179A'],
        '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport': ['-s'],
        'arping': ['-I', 'en0', 'wlan0', 'eth0', '-c', '1', '-W', '1000'],
        'scutil': ['--nwi'],
        'route': ['-n', 'get', '1.1.1.1'],
        'which': ['nmap', 'arping', 'arp-scan', 'iwlist', 'nmcli', 'iw'],
        'perl': ['-e'],
        'wdutil': ['info'],
        // Commandes Linux/Raspberry Pi
        'iwlist': ['scan', 'wlan0', 'eth0'],
        'nmcli': ['device', 'wifi', 'list'],
        'iw': ['dev', 'wlan0', 'scan'],
        'iwconfig': ['wlan0', 'eth0'],
        'arp-scan': ['--localnet', '--timeout', '1000', '--interface', 'wlan0', 'eth0'],
        'sudo': ['arp-scan', 'nmap', 'arping', 'iwlist', 'iw', '--localnet', '--timeout', '1000', '-sn', '--max-retries', '1', '--host-timeout', '1s', '192.168.1.0/24', 'scan', 'wlan0', 'eth0', '-I', '-c', '1', '-W', '1000'],
        'ip': ['route', 'get', 'addr', 'show', 'link', '1.1.1.1', '192.168.1.1'],
        'airport': ['-s'],
        'system_profiler': ['SPAirPortDataType']
    };

    /**
     * Valide une commande système
     * @param {string} command - La commande à valider
     * @returns {boolean} - True si la commande est autorisée
     */
    static validate(command) {
        if (!command || typeof command !== 'string') {
            return false;
        }

        // Nettoyer et parser la commande
        const parts = command.trim().split(/\s+/);
        const baseCommand = parts[0];

        // Vérifier si la commande de base est autorisée
        if (!this.allowedCommands.has(baseCommand)) {
            console.warn(`🚫 Commande non autorisée: ${baseCommand}`);
            return false;
        }

        // Vérifier les paramètres pour les commandes critiques
        if (this.allowedParams[baseCommand]) {
            const params = parts.slice(1);
            const validParams = this.allowedParams[baseCommand];

            for (const param of params) {
                if (!validParams.includes(param) &&
                    !this.isValidIpOrMac(param) &&
                    !(baseCommand === 'networksetup' && this.isValidNetworkService(param))) {
                    console.warn(`🚫 Paramètre non autorisé pour ${baseCommand}: ${param}`);
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Valide une adresse IP
     * @param {string} ip - L'adresse IP à valider
     * @returns {boolean} - True si l'IP est valide
     */
    static isValidIp(ip) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    }

    /**
     * Valide une adresse MAC
     * @param {string} mac - L'adresse MAC à valider
     * @returns {boolean} - True si la MAC est valide
     */
    static isValidMac(mac) {
        const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        return macRegex.test(mac);
    }

    /**
     * Valide une IP ou MAC
     * @param {string} value - La valeur à valider
     * @returns {boolean} - True si c'est une IP ou MAC valide
     */
    static isValidIpOrMac(value) {
        return this.isValidIp(value) || this.isValidMac(value);
    }

    /**
     * Valide un nom de service réseau
     * @param {string} serviceName - Le nom du service à valider
     * @returns {boolean} - True si le nom de service est valide
     */
    static isValidNetworkService(serviceName) {
        if (!serviceName || typeof serviceName !== 'string') {
            return false;
        }

        // Noms de services autorisés pour networksetup
        const allowedServices = ['Wi-Fi', 'AirPort', 'Ethernet', 'Thunderbolt Ethernet'];

        // Vérifier si le service est dans la liste autorisée
        return allowedServices.some(service =>
            serviceName.includes(service) || serviceName === service
        );
    }

    /**
     * Exécute une commande de manière sécurisée
     * @param {string} command - La commande à exécuter
     * @returns {Promise<Object>} - Résultat de l'exécution
     */
    static async safeExec(command) {
        console.log(`🔧 CommandValidator - Validation de: ${command}`);

        if (!this.validate(command)) {
            console.error(`🚫 CommandValidator - Commande rejetée: ${command}`);
            throw new Error(`Commande non autorisée: ${command}`);
        }

        console.log(`✅ CommandValidator - Commande autorisée: ${command}`);

        // Détecter si on est sur Raspberry Pi/Linux
        const isRaspberryPi = this.detectRaspberryPi();

        // Ajouter sudo automatiquement pour certaines commandes sur Raspberry Pi
        let finalCommand = command;
        if (isRaspberryPi && this.needsSudo(command)) {
            finalCommand = `sudo ${command}`;
        }

        console.log(`🔧 CommandValidator - Exécution: ${finalCommand}`);

        try {
            const result = await execAsync(finalCommand, {
                timeout: 60000, // Timeout de 60 secondes pour nmap
                maxBuffer: 1024 * 1024 // Buffer max de 1MB
            });

            console.log(`✅ CommandValidator - Succès: ${command}`);
            return {
                success: true,
                stdout: result.stdout,
                stderr: result.stderr
            };
        } catch (error) {
            console.error(`❌ CommandValidator - Échec: ${command} - ${error.message}`);
            return {
                success: false,
                error: error.message,
                stdout: error.stdout || '',
                stderr: error.stderr || ''
            };
        }
    }

    /**
     * Détecte si on est sur Raspberry Pi
     * @returns {boolean} - True si on est sur Raspberry Pi
     */
    static detectRaspberryPi() {
        try {
            // Vérifier si on est sur Raspberry Pi
            const fs = require('fs');
            if (fs.existsSync('/proc/cpuinfo')) {
                const cpuinfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
                return cpuinfo.includes('Raspberry Pi');
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Détermine si une commande nécessite sudo sur Raspberry Pi
     * @param {string} command - La commande à vérifier
     * @returns {boolean} - True si sudo est nécessaire
     */
    static needsSudo(command) {
        const sudoCommands = [
            'arp-scan',
            'nmap',
            'arping',
            'iwlist',
            'iw'
        ];

        const baseCommand = command.trim().split(/\s+/)[0];
        return sudoCommands.includes(baseCommand);
    }

    /**
     * Exécute plusieurs commandes de manière sécurisée
     * @param {Array<string>} commands - Les commandes à exécuter
     * @returns {Promise<Array<Object>>} - Résultats de l'exécution
     */
    static async safeExecMultiple(commands) {
        const results = [];

        for (const command of commands) {
            const result = await this.safeExec(command);
            results.push({
                command,
                ...result
            });
        }

        return results;
    }

    /**
     * Log une tentative d'exécution de commande
     * @param {string} command - La commande exécutée
     * @param {boolean} success - Si l'exécution a réussi
     */
    static logCommandExecution(command, success) {
        const timestamp = new Date().toISOString();
        const status = success ? 'SUCCESS' : 'FAILED';

        console.log(`[${timestamp}] ${status} - Command: ${command}`);

        // En production, on pourrait logger dans un fichier
        if (process.env.NODE_ENV === 'production') {
            // TODO: Implémenter un vrai système de logging
            // logger.info(`Command execution: ${command} - ${status}`);
        }
    }
}

module.exports = CommandValidator; 