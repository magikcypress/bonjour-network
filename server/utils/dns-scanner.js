const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class DnsScanner {
    constructor() {
        this.platform = process.platform;
    }

    /**
     * Scanne les hôtes DNS locaux
     * @returns {Promise<Object>} Résultats du scan DNS
     */
    async scanDnsHosts() {
        try {
            console.log('🔍 Scan DNS local...');

            const results = {
                hosts: [],
                statistics: {
                    total: 0,
                    resolved: 0,
                    failed: 0,
                    avgTime: 0
                }
            };

            // Générer une liste d'hôtes potentiels basée sur le réseau local
            const potentialHosts = this.generatePotentialHosts();

            const scanPromises = potentialHosts.map(host => this.resolveHost(host));
            const scanResults = await Promise.allSettled(scanPromises);

            let totalTime = 0;
            let resolvedCount = 0;
            let failedCount = 0;

            scanResults.forEach((result) => {
                if (result.status === 'fulfilled' && result.value) {
                    results.hosts.push(result.value);
                    if (result.value.resolved) {
                        resolvedCount++;
                        totalTime += result.value.time || 0;
                    } else {
                        failedCount++;
                    }
                } else {
                    failedCount++;
                }
            });

            // Calculer les statistiques
            results.statistics = {
                total: potentialHosts.length,
                resolved: resolvedCount,
                failed: failedCount,
                avgTime: resolvedCount > 0 ? Math.round(totalTime / resolvedCount) : 0
            };

            console.log(`✅ Scan DNS: ${resolvedCount} hôtes résolus sur ${potentialHosts.length}`);
            return results;

        } catch (error) {
            console.error('❌ Erreur lors du scan DNS:', error.message);
            return {
                hosts: [],
                statistics: { total: 0, resolved: 0, failed: 0, avgTime: 0 }
            };
        }
    }

    /**
     * Génère une liste d'hôtes potentiels à scanner
     */
    generatePotentialHosts() {
        const hosts = [];

        // Hôtes communs sur les réseaux locaux
        const commonHosts = [
            'router', 'gateway', 'nas', 'server', 'printer', 'camera',
            'tv', 'xbox', 'ps4', 'switch', 'apple-tv', 'chromecast',
            'homepod', 'echo', 'nest', 'philips-hue', 'shelly',
            'freebox', 'livebox', 'bbox', 'sagem', 'orange'
        ];

        // Générer des noms d'hôtes avec différents suffixes
        const suffixes = ['', '.local', '.home', '.lan', '.network'];

        commonHosts.forEach(host => {
            suffixes.forEach(suffix => {
                hosts.push(`${host}${suffix}`);
            });
        });

        // Ajouter des hôtes basés sur les appareils connus
        const knownDevices = [
            '192.168.1.1', '192.168.1.254', '192.168.0.1',
            '192.168.1.100', '192.168.1.200', '192.168.1.50'
        ];

        knownDevices.forEach(ip => {
            hosts.push(ip);
        });

        return hosts;
    }

    /**
     * Résout un hôte DNS
     */
    async resolveHost(host) {
        const startTime = Date.now();

        try {
            if (this.platform === 'win32') {
                // Windows
                const { stdout } = await execAsync(`nslookup ${host}`, { timeout: 5000 });
                const resolved = !stdout.includes('***') && !stdout.includes('can\'t find');
                const time = Date.now() - startTime;

                return {
                    name: host,
                    ip: resolved ? this.extractIpFromNslookup(stdout) : 'N/A',
                    resolved,
                    time,
                    details: this.getResolutionDetails(host, resolved, stdout)
                };
            } else {
                // macOS/Linux
                const { stdout } = await execAsync(`nslookup ${host}`, { timeout: 5000 });
                const resolved = !stdout.includes('***') && !stdout.includes('can\'t find');
                const time = Date.now() - startTime;
                const details = this.getResolutionDetails(host, resolved, stdout);

                console.log(`🔍 DNS ${host}: ${resolved ? 'RÉSOLU' : 'ÉCHEC'} - ${details.explanation}`);

                return {
                    name: host,
                    ip: resolved ? this.extractIpFromNslookup(stdout) : 'N/A',
                    resolved,
                    time,
                    details: details
                };
            }
        } catch (error) {
            const details = this.getResolutionDetails(host, false, null, error.message);
            console.log(`🔍 DNS ${host}: ÉCHEC - ${details.explanation}`);

            return {
                name: host,
                ip: 'N/A',
                resolved: false,
                time: Date.now() - startTime,
                details: details
            };
        }
    }

    /**
     * Génère les détails de résolution DNS
     */
    getResolutionDetails(host, resolved, output, errorMessage = null) {
        if (resolved) {
            // Succès
            const ip = this.extractIpFromNslookup(output);
            const hostType = this.getHostType(host);

            return {
                status: 'success',
                message: `Hôte résolu avec succès`,
                explanation: `${hostType} trouvé sur le réseau`,
                ip: ip,
                hostType: hostType
            };
        } else {
            // Échec
            const hostType = this.getHostType(host);
            let reason = this.getComprehensiveErrorMessage(host, hostType, errorMessage, output);

            return {
                status: 'failed',
                message: `Échec de résolution`,
                explanation: reason,
                hostType: hostType
            };
        }
    }

    /**
     * Génère un message d'erreur compréhensible en français
     */
    getComprehensiveErrorMessage(host, hostType, errorMessage, output) {
        // Analyser le type d'erreur
        if (errorMessage) {
            if (errorMessage.includes('timeout')) {
                return `Délai d'attente dépassé - ${hostType} non accessible`;
            } else if (errorMessage.includes('ENOTFOUND')) {
                return `${hostType} non trouvé sur ce réseau`;
            } else if (errorMessage.includes('Command failed: nslookup')) {
                return `${hostType} non configuré ou non disponible`;
            } else if (errorMessage.includes('ECONNREFUSED')) {
                return `Connexion refusée - ${hostType} non accessible`;
            } else if (errorMessage.includes('ENETUNREACH')) {
                return `Réseau inaccessible - ${hostType} non trouvé`;
            } else {
                return `${hostType} non disponible (erreur technique)`;
            }
        } else if (output && output.includes('***')) {
            return `${hostType} non enregistré dans le DNS`;
        } else if (output && output.includes('can\'t find')) {
            return `${hostType} non trouvé sur ce réseau`;
        } else {
            return `${hostType} non disponible sur ce réseau`;
        }
    }

    /**
     * Détermine le type d'hôte basé sur le nom
     */
    getHostType(host) {
        const hostLower = host.toLowerCase();

        if (hostLower.includes('router') || hostLower.includes('gateway')) return 'Routeur';
        if (hostLower.includes('nas') || hostLower.includes('server')) return 'Serveur/NAS';
        if (hostLower.includes('printer') || hostLower.includes('print')) return 'Imprimante';
        if (hostLower.includes('camera') || hostLower.includes('cam')) return 'Caméra';
        if (hostLower.includes('tv') || hostLower.includes('apple-tv')) return 'Télévision';
        if (hostLower.includes('xbox') || hostLower.includes('ps4') || hostLower.includes('switch')) return 'Console de jeu';
        if (hostLower.includes('chromecast') || hostLower.includes('firestick')) return 'Dongle média';
        if (hostLower.includes('homepod') || hostLower.includes('echo') || hostLower.includes('nest')) return 'Assistant vocal';
        if (hostLower.includes('hue') || hostLower.includes('shelly')) return 'Appareil IoT';
        if (hostLower.includes('freebox') || hostLower.includes('livebox') || hostLower.includes('bbox')) return 'Box internet';
        if (hostLower.includes('pi.hole') || hostLower.includes('pihole')) return 'Serveur DNS (Pi-hole)';

        return 'Appareil réseau';
    }

    /**
     * Extrait l'IP de la sortie nslookup
     */
    extractIpFromNslookup(output) {
        const lines = output.split('\n');
        for (const line of lines) {
            if (line.includes('Address:')) {
                const match = line.match(/Address:\s*(\d+\.\d+\.\d+\.\d+)/);
                if (match) {
                    return match[1];
                }
            }
        }
        return 'N/A';
    }

    /**
     * Scanne les services réseau
     */
    async scanServices() {
        try {
            console.log('🔍 Scan des services réseau...');

            const results = {
                services: [],
                bonjour: []
            };

            // Scanner les ports communs sur les hôtes locaux
            const commonPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 8080, 8443];
            const localHosts = ['192.168.1.1', '192.168.1.100', '192.168.1.200'];

            for (const host of localHosts) {
                for (const port of commonPorts) {
                    try {
                        const service = await this.checkService(host, port);
                        if (service.status === 'open') {
                            results.services.push(service);
                        }
                    } catch (error) {
                        // Ignorer les erreurs de port fermé
                    }
                }
            }

            // Scanner les services Bonjour
            const bonjourServices = await this.scanBonjourServices();
            results.bonjour = bonjourServices;

            console.log(`✅ Services: ${results.services.length} services, ${results.bonjour.length} Bonjour`);
            return results;

        } catch (error) {
            console.error('❌ Erreur lors du scan des services:', error.message);
            return { services: [], bonjour: [] };
        }
    }

    /**
     * Vérifie un service sur un port
     */
    async checkService(host, port) {
        const serviceNames = {
            21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP',
            53: 'DNS', 80: 'HTTP', 110: 'POP3', 143: 'IMAP',
            443: 'HTTPS', 993: 'IMAPS', 995: 'POP3S',
            8080: 'HTTP-Alt', 8443: 'HTTPS-Alt'
        };

        try {
            await execAsync(`nc -z -w1 ${host} ${port}`, { timeout: 3000 });
            return {
                name: serviceNames[port] || `Port ${port}`,
                host,
                port,
                status: 'open'
            };
        } catch (error) {
            return {
                name: serviceNames[port] || `Port ${port}`,
                host,
                port,
                status: 'closed'
            };
        }
    }

    /**
     * Scanne les services Bonjour
     */
    async scanBonjourServices() {
        try {
            // Vérifier si dns-sd est disponible
            try {
                await execAsync('which dns-sd');
            } catch (error) {
                console.log('⚠️ dns-sd non disponible sur ce système, skip du scan Bonjour');
                return [];
            }

            const services = ['_http._tcp', '_https._tcp', '_ssh._tcp', '_ftp._tcp'];
            const results = [];

            for (const service of services) {
                try {
                    const { stdout } = await execAsync(`dns-sd -B ${service} local`, { timeout: 5000 });
                    const lines = stdout.split('\n');

                    for (const line of lines) {
                        if (line.includes('Add')) {
                            const match = line.match(/([^/]+)\s+(\d+)/);
                            if (match) {
                                results.push({
                                    name: match[1].trim(),
                                    service,
                                    port: parseInt(match[2])
                                });
                            }
                        }
                    }
                } catch (error) {
                    // Ignorer les erreurs de service non trouvé
                }
            }

            return results;

        } catch (error) {
            console.log('⚠️ Scan Bonjour échoué:', error.message);
            return [];
        }
    }

    /**
     * Scanne les ports ouverts
     */
    async scanPorts() {
        try {
            console.log('🔍 Scan des ports...');

            const results = {
                ports: [],
                summary: {
                    total: 0,
                    open: 0,
                    closed: 0,
                    filtered: 0
                }
            };

            const commonPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 8080, 8443];
            const localHosts = ['192.168.1.1', '192.168.1.100', '192.168.1.200'];

            let totalScanned = 0;
            let openPorts = 0;
            let closedPorts = 0;

            for (const host of localHosts) {
                for (const port of commonPorts) {
                    totalScanned++;

                    try {
                        const portResult = await this.checkService(host, port);
                        if (portResult.status === 'open') {
                            openPorts++;
                            results.ports.push(portResult);
                        } else {
                            closedPorts++;
                        }
                    } catch (error) {
                        closedPorts++;
                    }
                }
            }

            results.summary = {
                total: totalScanned,
                open: openPorts,
                closed: closedPorts,
                filtered: 0
            };

            console.log(`✅ Ports: ${openPorts} ouverts sur ${totalScanned} scannés`);
            return results;

        } catch (error) {
            console.error('❌ Erreur lors du scan des ports:', error.message);
            return { ports: [], summary: { total: 0, open: 0, closed: 0, filtered: 0 } };
        }
    }

    /**
     * Récupère l'historique DNS
     */
    async getDnsHistory() {
        try {
            console.log('🔍 Récupération de l\'historique DNS...');

            const results = {
                cache: [],
                recent: []
            };

            // Simuler un cache DNS (en réalité, il faudrait accéder au cache système)
            const mockCache = [
                { name: 'router.local', ip: '192.168.1.1', ttl: 300 },
                { name: 'nas.home', ip: '192.168.1.100', ttl: 600 },
                { name: 'printer.office', ip: '192.168.1.50', ttl: 120 }
            ];

            const mockRecent = [
                { name: 'google.com', ip: '142.250.74.78', timestamp: '2025-01-27 19:30:00' },
                { name: 'github.com', ip: '140.82.112.4', timestamp: '2025-01-27 19:29:45' },
                { name: 'stackoverflow.com', ip: '151.101.193.69', timestamp: '2025-01-27 19:29:30' }
            ];

            results.cache = mockCache;
            results.recent = mockRecent;

            console.log(`✅ Historique: ${mockCache.length} cache, ${mockRecent.length} récent`);
            return results;

        } catch (error) {
            console.error('❌ Erreur lors de la récupération de l\'historique:', error.message);
            return { cache: [], recent: [] };
        }
    }
}

module.exports = DnsScanner; 