const CommandValidator = require('./security/command-validator');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔍 DEBUG: ImprovedDeviceScanner chargé avec modifications Mistral AI');

class ImprovedDeviceScanner {
    constructor(io = null) {
        this.io = io;
        this.networkRange = null;
        this.gateway = null;
        this.localIp = null;
    }

    emitProgress(step, status, message, data = null, command = null) {
        if (this.io) {
            this.io.emit('scan-progress', {
                step,
                status,
                message,
                timestamp: new Date().toISOString(),
                data,
                command
            });
        }
        console.log(`📡 [${step}] ${status}: ${message}${command ? ` (${command})` : ''}`);
    }

    async scanConnectedDevices(scanMode = 'complete') {
        try {
            console.log(`🔍 DEBUG: scanConnectedDevices appelé avec scanMode = "${scanMode}"`);
            this.emitProgress('scan', 'start', `Démarrage du scan ${scanMode} amélioré...`);

            // Initialiser les informations réseau
            await this.initializeNetworkInfo();

            const timeoutMs = scanMode === 'complete' ? 90000 : 25000;
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Scan timeout - ${timeoutMs / 1000} secondes dépassées`)), timeoutMs)
            );

            const scanPromise = this.performImprovedScan(scanMode);
            const result = await Promise.race([scanPromise, timeoutPromise]);

            this.emitProgress('scan', 'complete', `Scan ${scanMode} terminé avec succès`, {
                deviceCount: result.length
            });

            if (this.io) {
                this.io.emit('scan-complete', { devices: result });
            }

            return result;
        } catch (error) {
            this.emitProgress('scan', 'error', `Erreur lors du scan: ${error.message}`);
            console.error('Erreur lors du scan des appareils:', error);
            if (this.io) {
                this.io.emit('scan-error', { error: error.message });
            }
            return [];
        }
    }

    async initializeNetworkInfo() {
        try {
            // Obtenir l'IP locale et la plage réseau
            const result = await CommandValidator.safeExec('ifconfig en0');
            if (result.success) {
                const lines = result.stdout.split('\n');
                for (const line of lines) {
                    if (line.includes('inet ')) {
                        const match = line.match(/inet (\d+\.\d+\.\d+\.\d+)/);
                        if (match) {
                            this.localIp = match[1];
                            const parts = this.localIp.split('.');
                            this.networkRange = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
                            break;
                        }
                    }
                }
            }

            // Obtenir la gateway (simplifié)
            this.gateway = this.networkRange ? this.networkRange.replace('.0', '.1') : null;

            console.log(`🌐 Informations réseau: IP=${this.localIp}, Réseau=${this.networkRange}, Gateway=${this.gateway}`);
        } catch (error) {
            console.error('Erreur lors de l\'initialisation réseau:', error);
        }
    }

    async performImprovedScan(scanMode) {
        const allDevices = new Map();

        // 1. Scan ARP amélioré (base)
        this.emitProgress('arp', 'start', 'Scan ARP amélioré...', null, 'arp -an');
        try {
            const arpDevices = await this.improvedArpScan();
            this.addDevicesToMap(arpDevices, allDevices);
            this.emitProgress('arp', 'success', `Scan ARP: ${arpDevices.length} appareils`);
        } catch (error) {
            this.emitProgress('arp', 'error', `Erreur ARP: ${error.message}`);
        }

        // 2. Scan netstat amélioré
        this.emitProgress('netstat', 'start', 'Scan netstat amélioré...', null, 'netstat -rn');
        try {
            const netstatDevices = await this.improvedNetstatScan();
            this.addDevicesToMap(netstatDevices, allDevices);
            this.emitProgress('netstat', 'success', `Scan netstat: ${netstatDevices.length} appareils`);
        } catch (error) {
            this.emitProgress('netstat', 'error', `Erreur netstat: ${error.message}`);
        }

        // 3. Scan DNS inversé pour les appareils découverts
        this.emitProgress('dns', 'start', 'Résolution DNS inversée...', null, 'nslookup');
        try {
            const dnsDevices = await this.reverseDnsScan(Array.from(allDevices.values()));
            this.addDevicesToMap(dnsDevices, allDevices);
            this.emitProgress('dns', 'success', `DNS inversé: ${dnsDevices.length} hostnames résolus`);
        } catch (error) {
            this.emitProgress('dns', 'error', `Erreur DNS: ${error.message}`);
        }

        if (scanMode === 'complete') {
            // 4. Ping sweep intelligent (seulement les IPs probables)
            this.emitProgress('ping', 'start', 'Ping sweep intelligent...', null, 'ping -c 1 -W 500');
            try {
                const pingDevices = await this.intelligentPingSweep();
                this.addDevicesToMap(pingDevices, allDevices);
                this.emitProgress('ping', 'success', `Ping sweep: ${pingDevices.length} appareils`);
            } catch (error) {
                this.emitProgress('ping', 'error', `Erreur ping: ${error.message}`);
            }

            // 5. Scan nmap (si disponible)
            this.emitProgress('nmap', 'start', 'Scan nmap...', null, 'nmap -sn');
            try {
                const nmapDevices = await this.scanWithNmap();
                this.addDevicesToMap(nmapDevices, allDevices);
                this.emitProgress('nmap', 'success', `Scan nmap: ${nmapDevices.length} appareils`);
            } catch (error) {
                this.emitProgress('nmap', 'error', `Erreur nmap: ${error.message}`);
            }

            // 6. Scan arping (si disponible)
            this.emitProgress('arping', 'start', 'Scan arping...', null, 'arping -c 1');
            try {
                const arpingDevices = await this.scanWithArping();
                this.addDevicesToMap(arpingDevices, allDevices);
                this.emitProgress('arping', 'success', `Scan arping: ${arpingDevices.length} appareils`);
            } catch (error) {
                this.emitProgress('arping', 'error', `Erreur arping: ${error.message}`);
            }

            // 7. Scan Bonjour amélioré
            this.emitProgress('bonjour', 'start', 'Scan Bonjour amélioré...', null, 'dns-sd -B');
            try {
                const bonjourDevices = await this.improvedBonjourScan();
                this.addDevicesToMap(bonjourDevices, allDevices);
                this.emitProgress('bonjour', 'success', `Bonjour: ${bonjourDevices.length} services`);
            } catch (error) {
                this.emitProgress('bonjour', 'error', `Erreur Bonjour: ${error.message}`);
            }
        }

        let devices = Array.from(allDevices.values());

        // Filtrer et valider les appareils
        devices = this.validateAndFilterDevices(devices);

        // Prioriser l'appareil local
        devices = await this.prioritizeLocalDevice(devices);

        // Prioriser par qualité des données
        devices = this.prioritizeDevicesByQuality(devices);

        this.emitProgress('scan', 'success', `Scan terminé: ${devices.length} appareils valides`);

        if (devices.length > 0) {
            // Identification Mistral AI - seulement en mode complet ou si explicitement demandé
            console.log(`🔍 DEBUG: Mode de scan = "${scanMode}" (type: ${typeof scanMode}), Appareils = ${devices.length}`);

            if (scanMode === 'complete') {
                console.log('🔍 DEBUG: Mode complet - Lancement identification Mistral AI');
                this.emitProgress('mistral', 'start', 'Identification Mistral AI...', null, 'Mistral AI API');
                const identifiedDevices = await this.identifyDevicesWithMistralAI(devices);

                // Re-prioriser après identification
                const finalDevices = this.prioritizeDevicesByQuality(identifiedDevices);

                this.emitProgress('mistral', 'success', `Identification: ${finalDevices.length} appareils`);
                return finalDevices;
            } else {
                // Mode fast - pas d'identification Mistral AI
                console.log(`🔍 DEBUG: Mode rapide (${scanMode}) - Identification Mistral AI ignorée`);
                this.emitProgress('mistral', 'skip', 'Identification Mistral AI ignorée (mode rapide)', null, 'Skipped');
                const finalDevices = this.prioritizeDevicesByQuality(devices);
                return finalDevices;
            }
        }

        return [];
    }

    async improvedArpScan() {
        try {
            const result = await CommandValidator.safeExec('arp -a');
            if (!result.success) return [];

            const devices = [];
            const lines = result.stdout.split('\n');

            for (const line of lines) {
                if (!line.trim() || line.includes('Address') || line.includes('Interface')) continue;

                // Format: ? (192.168.1.1) at aa:bb:cc:dd:ee:ff on en0 ifscope [ethernet]
                const match = line.match(/\(([^)]+)\) at ([0-9a-fA-F:]+) on/);
                if (match) {
                    const ip = match[1];
                    const mac = match[2];

                    if (this.isValidIp(ip) && this.isValidMac(mac)) {
                        devices.push({
                            ip: ip,
                            mac: mac,
                            hostname: 'Unknown',
                            deviceType: 'Unknown',
                            lastSeen: new Date().toISOString(),
                            isActive: true,
                            source: 'arp'
                        });
                    }
                }
            }

            return devices;
        } catch (error) {
            console.error('Erreur scan ARP amélioré:', error);
            return [];
        }
    }

    async improvedNetstatScan() {
        try {
            const result = await CommandValidator.safeExec('netstat -an');
            if (!result.success) return [];

            const devices = [];
            const lines = result.stdout.split('\n');

            for (const line of lines) {
                if (!line.trim() || line.includes('Internet') || line.includes('Destination')) continue;

                const parts = line.split(/\s+/);
                if (parts.length >= 4) {
                    const ip = parts[0];
                    const gateway = parts[1];

                    if (this.isValidIp(ip) && this.isValidIp(gateway) &&
                        ip !== '0.0.0.0' && ip !== '127.0.0.1' &&
                        !ip.startsWith('169.254') && !ip.startsWith('224.') && !ip.startsWith('255.')) {

                        devices.push({
                            ip: ip,
                            mac: 'N/A',
                            hostname: 'Unknown',
                            deviceType: 'Unknown',
                            lastSeen: new Date().toISOString(),
                            isActive: true,
                            source: 'netstat'
                        });
                    }
                }
            }

            return devices;
        } catch (error) {
            console.error('Erreur scan netstat amélioré:', error);
            return [];
        }
    }

    async reverseDnsScan(devices) {
        const dnsDevices = [];

        for (const device of devices) {
            if (device.ip && device.ip !== 'N/A') {
                try {
                    // Utiliser une méthode alternative pour la résolution DNS
                    const result = await CommandValidator.safeExec(`ping -c 1 -W 1000 ${device.ip}`);
                    if (result.success) {
                        // Essayer d'obtenir le hostname via une autre méthode
                        const hostname = this.extractHostnameFromPing(result.stdout);
                        if (hostname && hostname !== device.ip) {
                            dnsDevices.push({
                                ...device,
                                hostname: hostname,
                                source: 'dns'
                            });
                        }
                    }
                } catch (error) {
                    // Ignorer les erreurs DNS
                }
            }
        }

        return dnsDevices;
    }

    extractHostnameFromPing(output) {
        // Essayer d'extraire un hostname du ping
        const lines = output.split('\n');
        for (const line of lines) {
            if (line.includes('PING')) {
                const match = line.match(/PING ([^:]+)/);
                if (match) {
                    const hostname = match[1];
                    if (hostname && !this.isValidIp(hostname)) {
                        return hostname;
                    }
                }
            }
        }
        return null;
    }

    async intelligentPingSweep() {
        if (!this.networkRange) return [];

        const devices = [];
        const baseIp = this.networkRange.split('.');
        const maxConcurrent = 10; // Réduit pour éviter les timeouts
        const commonIps = [1, 2, 10, 20, 50, 100, 150, 200, 254]; // IPs communes

        // Scanner d'abord les IPs communes
        for (const lastOctet of commonIps) {
            const ip = `${baseIp[0]}.${baseIp[1]}.${baseIp[2]}.${lastOctet}`;
            try {
                const device = await this.pingHost(ip);
                if (device) {
                    devices.push(device);
                }
            } catch (error) {
                // Ignorer les erreurs
            }
        }

        // Scanner par batches pour les autres IPs
        for (let batch = 0; batch < 254; batch += maxConcurrent) {
            const promises = [];

            for (let i = 0; i < maxConcurrent; i++) {
                const lastOctet = batch + i + 1;
                if (lastOctet <= 254 && !commonIps.includes(lastOctet)) {
                    const ip = `${baseIp[0]}.${baseIp[1]}.${baseIp[2]}.${lastOctet}`;
                    promises.push(this.pingHost(ip));
                }
            }

            if (promises.length > 0) {
                try {
                    const results = await Promise.allSettled(promises);
                    for (const result of results) {
                        if (result.status === 'fulfilled' && result.value) {
                            devices.push(result.value);
                        }
                    }
                } catch (error) {
                    // Continuer avec le batch suivant
                }
            }
        }

        return devices;
    }

    async improvedBonjourScan() {
        try {
            const devices = [];
            const services = ['_http._tcp', '_https._tcp', '_ssh._tcp', '_ftp._tcp', '_smb._tcp', '_airplay._tcp'];

            for (const service of services) {
                try {
                    const result = await CommandValidator.safeExec(`dns-sd -B ${service} local 2>/dev/null`);
                    if (result.success) {
                        const bonjourDevices = this.parseBonjourOutput(result.stdout, service);
                        devices.push(...bonjourDevices);
                    }
                } catch (error) {
                    // Ignorer les services non disponibles
                }
            }

            return devices;
        } catch (error) {
            console.error('Erreur scan Bonjour amélioré:', error);
            return [];
        }
    }

    parseBonjourOutput(output, service) {
        const devices = [];
        const lines = output.split('\n');

        for (const line of lines) {
            if (line.includes('Add') && line.includes('_tcp')) {
                const match = line.match(/Add\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/);
                if (match) {
                    const hostname = match[1];
                    const ip = match[2];

                    if (this.isValidIp(ip)) {
                        devices.push({
                            ip: ip,
                            mac: 'N/A',
                            hostname: hostname,
                            deviceType: service.replace('_', '').replace('._tcp', ''),
                            lastSeen: new Date().toISOString(),
                            isActive: true,
                            source: 'bonjour'
                        });
                    }
                }
            }
        }

        return devices;
    }

    async pingHost(ip) {
        try {
            const result = await CommandValidator.safeExec(`ping -c 1 -W 500 ${ip}`);
            if (result.success) {
                // Obtenir la MAC via ARP
                const arpResult = await CommandValidator.safeExec(`arp -n ${ip}`);
                if (arpResult.success) {
                    const macMatch = arpResult.stdout.match(/at ([0-9a-fA-F:]+)/);
                    if (macMatch) {
                        return {
                            ip: ip,
                            mac: macMatch[1],
                            hostname: 'Unknown',
                            deviceType: 'Unknown',
                            lastSeen: new Date().toISOString(),
                            isActive: true,
                            source: 'ping'
                        };
                    }
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    validateAndFilterDevices(devices) {
        return devices.filter(device => {
            // Validation IP de base
            if (!device.ip || !this.isValidIp(device.ip)) return false;

            // Filtrage intelligent des IPs réservées
            const ip = device.ip;

            // IPs vraiment invalides
            if (ip === '127.0.0.1' || // Loopback
                ip.startsWith('169.254') || // Link-local
                ip.startsWith('224.') || // Multicast
                ip.startsWith('255.') || // Broadcast
                ip.startsWith('0.')) { // Réservé
                return false;
            }

            // Ne PAS filtrer les IPs .0 et .255 (peuvent être valides)
            // Ne PAS filtrer les IPs avec hostname = IP (peuvent être valides)

            // Validation MAC (optionnelle mais recommandée)
            if (device.mac && device.mac !== 'N/A' && !this.isValidMac(device.mac)) {
                console.log(`⚠️ MAC invalide pour ${device.ip}: ${device.mac}`);
                // Ne pas exclure, juste logger
            }

            // Validation hostname (optionnelle)
            if (device.hostname && device.hostname === device.ip && device.mac === 'N/A') {
                console.log(`⚠️ Appareil suspect ${device.ip}: hostname=IP sans MAC`);
                // Ne pas exclure, juste logger
            }

            return true;
        });
    }

    addDevicesToMap(devices, deviceMap) {
        for (const device of devices) {
            if (!device.ip || !this.isValidIp(device.ip)) continue;

            const key = device.ip;
            if (!deviceMap.has(key)) {
                // Nouvel appareil
                deviceMap.set(key, {
                    ...device,
                    sources: [device.source || 'unknown'],
                    lastSeen: new Date().toISOString()
                });
            } else {
                // Fusion intelligente des informations
                const existing = deviceMap.get(key);
                const merged = this.mergeDeviceInfo(existing, device);
                deviceMap.set(key, merged);
            }
        }
    }

    mergeDeviceInfo(existing, newDevice) {
        // Logique de fusion avec priorité claire
        const merged = {
            ip: existing.ip, // Toujours garder l'IP existante
            lastSeen: new Date().toISOString(),
            sources: [...(existing.sources || [existing.source]), newDevice.source].filter((v, i, a) => a.indexOf(v) === i)
        };

        // MAC : Priorité aux MAC complètes
        if (newDevice.mac && newDevice.mac !== 'N/A' && this.isValidMac(newDevice.mac)) {
            merged.mac = newDevice.mac;
        } else if (existing.mac && existing.mac !== 'N/A' && this.isValidMac(existing.mac)) {
            merged.mac = existing.mac;
        } else {
            merged.mac = newDevice.mac || existing.mac || 'N/A';
        }

        // Hostname : Priorité aux noms non-génériques
        const existingHostname = existing.hostname || '';
        const newHostname = newDevice.hostname || '';

        if (newHostname && newHostname !== 'Unknown' && newHostname !== existing.ip) {
            merged.hostname = newHostname;
        } else if (existingHostname && existingHostname !== 'Unknown' && existingHostname !== existing.ip) {
            merged.hostname = existingHostname;
        } else {
            merged.hostname = newHostname || existingHostname || 'Unknown';
        }

        // DeviceType : Priorité aux types spécifiques
        const existingType = existing.deviceType || '';
        const newType = newDevice.deviceType || '';

        if (newType && newType !== 'Unknown' && newType !== 'Unknown Device') {
            merged.deviceType = newType;
        } else if (existingType && existingType !== 'Unknown' && existingType !== 'Unknown Device') {
            merged.deviceType = existingType;
        } else {
            merged.deviceType = newType || existingType || 'Unknown';
        }

        // Manufacturer : Fusion intelligente
        if (newDevice.manufacturer && newDevice.manufacturer !== 'Unknown Manufacturer') {
            merged.manufacturer = newDevice.manufacturer;
        } else if (existing.manufacturer && existing.manufacturer !== 'Unknown Manufacturer') {
            merged.manufacturer = existing.manufacturer;
        }

        // Confidence : Garder la plus haute
        const existingConfidence = existing.confidence || 0;
        const newConfidence = newDevice.confidence || 0;
        merged.confidence = Math.max(existingConfidence, newConfidence);

        // Propriétés additionnelles
        if (newDevice.isActive !== undefined) merged.isActive = newDevice.isActive;
        if (existing.isActive !== undefined) merged.isActive = existing.isActive || merged.isActive;

        if (newDevice.isLocal !== undefined) merged.isLocal = newDevice.isLocal;
        if (existing.isLocal !== undefined) merged.isLocal = existing.isLocal || merged.isLocal;

        return merged;
    }

    async prioritizeLocalDevice(devices) {
        if (!this.localIp) return devices;

        const localDevice = devices.find(device => device.ip === this.localIp);
        if (localDevice) {
            localDevice.isLocalDevice = true;
            return [localDevice, ...devices.filter(device => device.ip !== this.localIp)];
        }

        return devices;
    }

    async identifyDevicesWithMistralAI(devices) {
        try {
            const ManufacturerService = require('./manufacturer-service');
            const manufacturerService = new ManufacturerService();

            for (const device of devices) {
                if (device.mac && device.mac !== 'N/A' && this.isValidMac(device.mac)) {
                    try {
                        const manufacturerInfo = await manufacturerService.identifyManufacturer(device.mac);
                        if (manufacturerInfo && manufacturerInfo.identified) {
                            // Fusion intelligente des informations fabricant
                            if (manufacturerInfo.manufacturer && manufacturerInfo.manufacturer !== 'Unknown Manufacturer') {
                                device.manufacturer = manufacturerInfo.manufacturer;
                            }

                            // Ne pas écraser le deviceType existant, seulement si pas défini
                            if (!device.deviceType || device.deviceType === 'Unknown' || device.deviceType === 'Unknown Device') {
                                device.deviceType = manufacturerInfo.deviceType || device.deviceType;
                            }

                            // Ajouter les informations de confiance
                            device.manufacturerConfidence = manufacturerInfo.confidence || 0;
                            device.manufacturerSource = manufacturerInfo.source || 'mistral';
                            device.manufacturerIdentified = manufacturerInfo.identified;

                            console.log(`✅ Identifié: ${device.mac} → ${manufacturerInfo.manufacturer} (confiance: ${manufacturerInfo.confidence})`);
                        } else {
                            console.log(`❌ Non identifié: ${device.mac}`);
                            device.manufacturerIdentified = false;
                        }
                    } catch (error) {
                        console.log(`⚠️ Erreur identification pour ${device.mac}:`, error.message);
                        device.manufacturerIdentified = false;
                    }
                } else {
                    console.log(`⚠️ Pas de MAC valide pour ${device.ip}`);
                    device.manufacturerIdentified = false;
                }
            }

            return devices;
        } catch (error) {
            console.error('❌ Erreur identification Mistral AI:', error);
            return devices;
        }
    }

    isValidMac(mac) {
        if (!mac || mac === 'N/A') return false;
        const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        return macRegex.test(mac);
    }

    isValidIp(ip) {
        if (!ip || ip === 'N/A') return false;
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    }

    evaluateDeviceQuality(device) {
        let score = 0;
        const sources = device.sources || [device.source];

        // Score basé sur les sources
        if (sources.includes('arp')) score += 10; // ARP = très fiable
        if (sources.includes('ping')) score += 8; // Ping = fiable
        if (sources.includes('nmap')) score += 7; // Nmap = fiable
        if (sources.includes('netstat')) score += 5; // Netstat = moyen
        if (sources.includes('bonjour')) score += 4; // Bonjour = limité
        if (sources.includes('dns')) score += 3; // DNS = variable

        // Score basé sur les informations disponibles
        if (device.mac && device.mac !== 'N/A' && this.isValidMac(device.mac)) score += 5;
        if (device.hostname && device.hostname !== 'Unknown' && device.hostname !== device.ip) score += 3;
        if (device.manufacturer && device.manufacturer !== 'Unknown Manufacturer') score += 2;
        if (device.deviceType && device.deviceType !== 'Unknown') score += 2;
        if (device.manufacturerIdentified) score += 3;

        // Score basé sur la confiance
        if (device.manufacturerConfidence) {
            score += Math.floor(device.manufacturerConfidence * 5);
        }

        return score;
    }

    prioritizeDevicesByQuality(devices) {
        return devices.sort((a, b) => {
            const qualityA = this.evaluateDeviceQuality(a);
            const qualityB = this.evaluateDeviceQuality(b);
            return qualityB - qualityA;
        });
    }

    // Scan avec nmap
    async scanWithNmap() {
        try {
            if (!this.networkRange) {
                throw new Error('Plage réseau non disponible');
            }

            const result = await CommandValidator.safeExec(`nmap -sn ${this.networkRange}/24`);
            if (!result.success) {
                throw new Error('Nmap non disponible ou échec');
            }

            const devices = [];
            const lines = result.stdout.split('\n');

            for (const line of lines) {
                const match = line.match(/Nmap scan report for (.+?) \((\d+\.\d+\.\d+\.\d+)\)/);
                if (match) {
                    const hostname = match[1];
                    const ip = match[2];

                    devices.push({
                        ip,
                        mac: null, // Nmap ne donne pas toujours la MAC
                        hostname: hostname !== ip ? hostname : 'Unknown',
                        deviceType: 'Unknown',
                        lastSeen: new Date().toISOString(),
                        isActive: true,
                        isLocal: false,
                        manufacturerInfo: { identified: false, manufacturer: 'Unknown', confidence: 0, source: 'nmap' },
                        discoveredBy: 'nmap',
                        source: 'nmap'
                    });
                }
            }

            return devices;
        } catch (error) {
            console.error('Erreur lors du scan nmap:', error);
            return [];
        }
    }

    // Scan avec arping
    async scanWithArping() {
        try {
            if (!this.networkRange) {
                throw new Error('Plage réseau non disponible');
            }

            const devices = [];
            const baseIP = this.networkRange.split('.');

            // Tester quelques IPs communes
            const testIPs = [
                `${baseIP[0]}.${baseIP[1]}.${baseIP[2]}.1`, // Gateway
                `${baseIP[0]}.${baseIP[1]}.${baseIP[2]}.2`,
                `${baseIP[0]}.${baseIP[1]}.${baseIP[2]}.10`,
                `${baseIP[0]}.${baseIP[1]}.${baseIP[2]}.100`,
                `${baseIP[0]}.${baseIP[1]}.${baseIP[2]}.254`
            ];

            for (const ip of testIPs) {
                try {
                    const result = await CommandValidator.safeExec(`arping -c 1 -W 1000 ${ip}`);
                    if (result.success && result.stdout.includes('reply')) {
                        const macMatch = result.stdout.match(/from (\d+\.\d+\.\d+\.\d+) \[([0-9a-fA-F:]+)\]/);
                        if (macMatch) {
                            const mac = macMatch[2].toLowerCase();
                            devices.push({
                                ip,
                                mac,
                                hostname: 'Unknown',
                                deviceType: 'Unknown',
                                lastSeen: new Date().toISOString(),
                                isActive: true,
                                isLocal: false,
                                manufacturerInfo: { identified: false, manufacturer: 'Unknown', confidence: 0, source: 'arping' },
                                discoveredBy: 'arping',
                                source: 'arping'
                            });
                        }
                    }
                } catch (error) {
                    // Ignorer les erreurs pour les IPs non répondues
                }
            }

            return devices;
        } catch (error) {
            console.error('Erreur lors du scan arping:', error);
            return [];
        }
    }
}

module.exports = ImprovedDeviceScanner; 