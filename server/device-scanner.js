const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class DeviceScanner {
    constructor(io = null) {
        this.io = io;
        this.scanSteps = {
            fast: ['arp', 'netstat'],
            complete: ['arp', 'netstat', 'ifconfig', 'ping', 'nmap', 'arping', 'bonjour']
        };
    }

    async scanConnectedDevices(mode = 'fast') {
        console.log(`🔍 Démarrage du scan ${mode} des appareils connectés`);

        const steps = this.scanSteps[mode] || this.scanSteps.fast;
        const devices = new Map();

        for (const step of steps) {
            try {
                console.log(`📡 Étape: ${step}`);
                const stepDevices = await this[`scanWith${step.charAt(0).toUpperCase() + step.slice(1)}`]();

                // Fusionner les résultats
                stepDevices.forEach(device => {
                    const key = device.mac || device.ip;
                    if (key && !devices.has(key)) {
                        devices.set(key, device);
                    } else if (key && devices.has(key)) {
                        // Fusionner les informations
                        const existing = devices.get(key);
                        devices.set(key, { ...existing, ...device });
                    }
                });

                // Émettre le progrès si Socket.IO est disponible
                if (this.io) {
                    this.io.emit('scan-progress', {
                        step,
                        progress: (steps.indexOf(step) + 1) / steps.length * 100,
                        devicesFound: devices.size
                    });
                }

            } catch (error) {
                console.error(`❌ Erreur lors de l'étape ${step}:`, error);
            }
        }

        const result = Array.from(devices.values());
        console.log(`✅ Scan ${mode} terminé: ${result.length} appareils détectés`);

        // Émettre le résultat final si Socket.IO est disponible
        if (this.io) {
            this.io.emit('scan-complete', { devices: result });
        }

        return result;
    }

    async scanWithArp() {
        try {
            const { stdout } = await execAsync('arp -a');
            const devices = [];

            const lines = stdout.split('\n');
            for (const line of lines) {
                const match = line.match(/\(([\d.]+)\) at ([a-fA-F0-9:]+)/);
                if (match) {
                    devices.push({
                        ip: match[1],
                        mac: match[2].toLowerCase(),
                        discoveredBy: 'arp',
                        lastSeen: new Date().toISOString(),
                        isActive: true
                    });
                }
            }

            return devices;
        } catch (error) {
            console.error('Erreur lors du scan ARP:', error);
            return [];
        }
    }

    async scanWithNetstat() {
        try {
            const { stdout } = await execAsync('netstat -rn');
            const devices = [];

            const lines = stdout.split('\n');
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 4 && parts[0] === 'default') {
                    const gateway = parts[1];
                    if (gateway && gateway !== '0.0.0.0') {
                        devices.push({
                            ip: gateway,
                            discoveredBy: 'netstat',
                            lastSeen: new Date().toISOString(),
                            isActive: true,
                            deviceType: 'Gateway'
                        });
                    }
                }
            }

            return devices;
        } catch (error) {
            console.error('Erreur lors du scan netstat:', error);
            return [];
        }
    }

    async scanWithIfconfig() {
        try {
            const { stdout } = await execAsync('ifconfig');
            const devices = [];

            const lines = stdout.split('\n');
            let currentInterface = null;

            for (const line of lines) {
                const interfaceMatch = line.match(/^(\w+):/);
                if (interfaceMatch) {
                    currentInterface = interfaceMatch[1];
                }

                const inetMatch = line.match(/inet ([\d.]+)/);
                if (inetMatch && currentInterface) {
                    devices.push({
                        ip: inetMatch[1],
                        interface: currentInterface,
                        discoveredBy: 'ifconfig',
                        lastSeen: new Date().toISOString(),
                        isActive: true,
                        deviceType: 'Local Interface'
                    });
                }
            }

            return devices;
        } catch (error) {
            console.error('Erreur lors du scan ifconfig:', error);
            return [];
        }
    }

    async scanWithPing() {
        try {
            const devices = [];
            const networkPrefix = '192.168.1'; // À adapter selon votre réseau

            for (let i = 1; i <= 254; i++) {
                const ip = `${networkPrefix}.${i}`;
                try {
                    await execAsync(`ping -c 1 -W 1 ${ip}`);
                    devices.push({
                        ip,
                        discoveredBy: 'ping',
                        lastSeen: new Date().toISOString(),
                        isActive: true
                    });
                } catch (error) {
                    // Host unreachable, continuer
                }
            }

            return devices;
        } catch (error) {
            console.error('Erreur lors du scan ping:', error);
            return [];
        }
    }

    async scanWithNmap() {
        try {
            const { stdout } = await execAsync('nmap -sn 192.168.1.0/24');
            const devices = [];

            const lines = stdout.split('\n');
            for (const line of lines) {
                const match = line.match(/Nmap scan report for ([\d.]+)/);
                if (match) {
                    devices.push({
                        ip: match[1],
                        discoveredBy: 'nmap',
                        lastSeen: new Date().toISOString(),
                        isActive: true
                    });
                }
            }

            return devices;
        } catch (error) {
            console.error('Erreur lors du scan nmap:', error);
            return [];
        }
    }

    async scanWithArping() {
        try {
            const devices = [];
            const networkPrefix = '192.168.1';

            for (let i = 1; i <= 254; i++) {
                const ip = `${networkPrefix}.${i}`;
                try {
                    const { stdout } = await execAsync(`arping -c 1 -W 1 ${ip}`);
                    const macMatch = stdout.match(/([a-fA-F0-9:]{17})/);
                    if (macMatch) {
                        devices.push({
                            ip,
                            mac: macMatch[1].toLowerCase(),
                            discoveredBy: 'arping',
                            lastSeen: new Date().toISOString(),
                            isActive: true
                        });
                    }
                } catch (error) {
                    // Host unreachable, continuer
                }
            }

            return devices;
        } catch (error) {
            console.error('Erreur lors du scan arping:', error);
            return [];
        }
    }

    async scanWithBonjour() {
        try {
            // Vérifier si dns-sd est disponible
            try {
                await execAsync('which dns-sd');
            } catch (error) {
                console.log('⚠️ dns-sd non disponible sur ce système, skip du scan Bonjour');
                return [];
            }

            const { stdout } = await execAsync('dns-sd -B _services._dns-sd._udp local');
            const devices = [];

            const lines = stdout.split('\n');
            for (const line of lines) {
                const match = line.match(/^(\S+)\s+(\S+)/);
                if (match) {
                    devices.push({
                        hostname: match[1],
                        service: match[2],
                        discoveredBy: 'bonjour',
                        lastSeen: new Date().toISOString(),
                        isActive: true
                    });
                }
            }

            return devices;
        } catch (error) {
            console.error('Erreur lors du scan bonjour:', error);
            return [];
        }
    }
}

module.exports = DeviceScanner; 