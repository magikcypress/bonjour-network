const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class CommandValidator {
    // Liste blanche des commandes autorisées
    static allowedCommands = new Set([
        // Commandes réseau de base
        'arp', 'netstat', 'ifconfig', 'ping', 'nmap', 'dns-sd',

        // Commandes WiFi macOS
        'airport', 'system_profiler', 'networksetup', 'wdutil',

        // Commandes de découverte réseau
        'arping', 'scutil',

        // Commandes de test
        'which', 'echo', 'cat', 'grep'
    ]);

    // Paramètres autorisés pour chaque commande
    static allowedParams = {
        'arp': ['-a', '-n'],
        'netstat': ['-rn', '-an'],
        'ifconfig': ['en0', 'en1', 'lo0'],
        'ping': ['-c', '1', '-W', '1000'],
        'nmap': ['-sn', '--max-retries', '1', '--host-timeout', '1s'],
        'dns-sd': ['-B', '_http._tcp', '_https._tcp', '_ssh._tcp', '_ftp._tcp', '_smb._tcp', 'local'],
        'airport': ['-s'],
        'system_profiler': ['SPAirPortDataType'],
        'networksetup': ['-listallnetworkservices', '-getinfo'],
        'arping': ['-I', 'en0'],
        'scutil': ['--nwi'],
        'which': ['nmap', 'arping'],
        'wdutil': ['info']
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
                if (!validParams.includes(param) && !this.isValidIpOrMac(param)) {
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
     * Exécute une commande de manière sécurisée
     * @param {string} command - La commande à exécuter
     * @returns {Promise<Object>} - Résultat de l'exécution
     */
    static async safeExec(command) {
        if (!this.validate(command)) {
            throw new Error(`Commande non autorisée: ${command}`);
        }

        try {
            const result = await execAsync(command, {
                timeout: 10000, // Timeout de 10 secondes
                maxBuffer: 1024 * 1024 // Buffer max de 1MB
            });

            return {
                success: true,
                stdout: result.stdout,
                stderr: result.stderr
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                stdout: error.stdout || '',
                stderr: error.stderr || ''
            };
        }
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