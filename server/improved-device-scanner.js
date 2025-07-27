const CommandValidator = require('./security/command-validator');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const NetworkDetector = require('./utils/network-detector');

console.log('🔍 DEBUG: ImprovedDeviceScanner chargé avec modifications Mistral AI');

class ImprovedDeviceScanner {
    constructor(io = null) {
        this.io = io;
        this.networkRange = null;
        this.gateway = null;
        this.localIp = null;
        this.totalSteps = 0;
        this.completedSteps = 0;
    }

    emitProgress(step, status, message, data = null, command = null) {
        // Calculer le pourcentage de progression
        if (status === 'start') {
            this.completedSteps++;
        }

        const progressPercentage = this.totalSteps > 0 ? Math.round((this.completedSteps / this.totalSteps) * 100) : 0;

        const progressData = {
            step,
            status,
            message,
            timestamp: new Date().toISOString(),
            data,
            command,
            progress: progressPercentage
        };

        console.log(`📡 Émission de progression:`, progressData);

        if (this.io) {
            console.log(`🔌 Émission via Socket.IO vers tous les clients`);
            this.io.emit('scan-progress', progressData);
        } else {
            console.warn(`⚠️ Pas d'instance io disponible pour émettre la progression`);
        }

        console.log(`📡 [${step}] ${status}: ${message}${command ? ` (${command})` : ''} - Progression: ${progressPercentage}%`);
    }

    async scanConnectedDevices(scanMode = 'complete') {
        try {
            console.log(`🔍 DEBUG: scanConnectedDevices appelé avec scanMode = "${scanMode}"`);

            // Initialiser le compteur de progression
            this.completedSteps = 0;
            this.totalSteps = scanMode === 'fast' ? 4 : 9; // 4 étapes pour fast, 9 pour complete

            this.emitProgress('scan', 'start', `Démarrage du scan ${scanMode} amélioré...`);

            // Détecter le type de connexion
            const networkDetector = new NetworkDetector();
            const connectionInfo = await networkDetector.detectConnectionType();

            console.log(networkDetector.getConnectionInfo());
            this.emitProgress('network', 'info', `Type de connexion: ${connectionInfo.connectionType}`, {
                connectionType: connectionInfo.connectionType,
                activeInterface: connectionInfo.activeInterface
            });

            // Initialiser les informations réseau
            await this.initializeNetworkInfo();

            // Timeout adapté selon le mode de scan
            const timeoutMs = scanMode === 'complete' ? 180000 : 30000; // 3 min pour complet, 30s pour rapide
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Scan timeout - ${timeoutMs / 1000} secondes dépassées`)), timeoutMs)
            );

            const scanPromise = this.performImprovedScan(scanMode);
            const result = await Promise.race([scanPromise, timeoutPromise]);

            // Formater les données avec DataFormatter avant d'envoyer via WebSocket
            const DataFormatter = require('./utils/data-formatter');
            const dataFormatter = new DataFormatter();
            const formattedDevices = dataFormatter.formatDevices(result);

            this.emitProgress('scan', 'complete', `Scan ${scanMode} terminé avec succès`, {
                deviceCount: formattedDevices.length,
                connectionType: connectionInfo.connectionType
            });

            if (this.io) {
                this.io.emit('scan-complete', { devices: formattedDevices });
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
            // Obtenir l'IP locale et la plage réseau (Linux)
            let result = await CommandValidator.safeExec('ip route get 1.1.1.1');
            if (result.success) {
                const match = result.stdout.match(/src (\d+\.\d+\.\d+\.\d+)/);
                if (match) {
                    this.localIp = match[1];
                    const parts = this.localIp.split('.');
                    this.networkRange = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
                }
            }

            // Fallback avec ifconfig si ip route échoue
            if (!this.localIp) {
                result = await CommandValidator.safeExec('ifconfig');
                if (result.success) {
                    const lines = result.stdout.split('\n');
                    for (const line of lines) {
                        if (line.includes('inet ') && !line.includes('127.0.0.1')) {
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
            }

            // Obtenir la gateway
            if (this.networkRange) {
                this.gateway = this.networkRange.replace('.0', '.1');
            }

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

        // 4. Mini-ping sweep ciblé (pour mode fast et complete)
        this.emitProgress('quick-ping', 'start', 'Mini-ping sweep ciblé...', null, 'ping -c 1 -W 300');
        try {
            const quickPingDevices = await this.quickTargetedPingSweep();
            this.addDevicesToMap(quickPingDevices, allDevices);
            this.emitProgress('quick-ping', 'success', `Mini-ping: ${quickPingDevices.length} appareils`);
        } catch (error) {
            this.emitProgress('quick-ping', 'error', `Erreur mini-ping: ${error.message}`);
        }

        if (scanMode === 'complete') {
            // 5. Ping sweep complet (comme nmap) - avec timeout plus long
            this.emitProgress('ping', 'start', 'Ping sweep complet (comme nmap)...', null, 'ping -c 1 -W 1000');
            try {
                const pingPromise = this.completePingSweep();
                const pingTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Ping sweep timeout')), 60000) // 60s au lieu de 30s
                );
                const pingDevices = await Promise.race([pingPromise, pingTimeout]);
                this.addDevicesToMap(pingDevices, allDevices);
                this.emitProgress('ping', 'success', `Ping sweep complet: ${pingDevices.length} appareils`);
            } catch (error) {
                this.emitProgress('ping', 'error', `Erreur ping: ${error.message}`);
            }

            // 6. Scan nmap (si disponible) - avec timeout court
            this.emitProgress('nmap', 'start', 'Scan nmap...', null, 'nmap -sn');
            try {
                const nmapPromise = this.scanWithNmap();
                const nmapTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Nmap timeout')), 15000)
                );
                const nmapDevices = await Promise.race([nmapPromise, nmapTimeout]);
                this.addDevicesToMap(nmapDevices, allDevices);
                this.emitProgress('nmap', 'success', `Scan nmap: ${nmapDevices.length} appareils`);
            } catch (error) {
                this.emitProgress('nmap', 'error', `Erreur nmap: ${error.message}`);
            }

            // 7. Scan arping (si disponible) - avec timeout court
            this.emitProgress('arping', 'start', 'Scan arping...', null, 'arping -c 1');
            try {
                const arpingPromise = this.scanWithArping();
                const arpingTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Arping timeout')), 15000)
                );
                const arpingDevices = await Promise.race([arpingPromise, arpingTimeout]);
                this.addDevicesToMap(arpingDevices, allDevices);
                this.emitProgress('arping', 'success', `Scan arping: ${arpingDevices.length} appareils`);
            } catch (error) {
                this.emitProgress('arping', 'error', `Erreur arping: ${error.message}`);
            }

            // 8. Scan Bonjour amélioré - avec timeout plus long
            this.emitProgress('bonjour', 'start', 'Scan Bonjour amélioré...', null, 'dns-sd -B');
            try {
                const bonjourPromise = this.improvedBonjourScan();
                const bonjourTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Bonjour timeout')), 20000) // 20s au lieu de 10s
                );
                const bonjourDevices = await Promise.race([bonjourPromise, bonjourTimeout]);
                this.addDevicesToMap(bonjourDevices, allDevices);
                this.emitProgress('bonjour', 'success', `Bonjour: ${bonjourDevices.length} services`);
            } catch (error) {
                console.warn(`⚠️ Timeout Bonjour (normal): ${error.message}`);
                this.emitProgress('bonjour', 'warning', `Bonjour timeout (normal) - ${error.message}`);
            }
        }

        let devices = Array.from(allDevices.values());
        console.log(`📊 Après fusion: ${devices.length} appareils uniques`);

        // Enrichir avec les MAC depuis ARP pour les appareils sans MAC
        devices = await this.enrichDevicesWithArp(devices);
        console.log(`📊 Après enrichissement ARP: ${devices.length} appareils`);

        // Filtrer et valider les appareils
        devices = this.validateAndFilterDevices(devices);
        console.log(`📊 Après validation: ${devices.length} appareils valides`);

        // Prioriser l'appareil local
        devices = await this.prioritizeLocalDevice(devices);
        console.log(`📊 Après priorisation locale: ${devices.length} appareils`);

        // Prioriser par qualité des données
        devices = this.prioritizeDevicesByQuality(devices);
        console.log(`📊 Après priorisation qualité: ${devices.length} appareils`);

        this.emitProgress('scan', 'success', `Scan terminé: ${devices.length} appareils valides`);

        if (devices.length > 0) {
            // Identification des fabricants - pour tous les modes
            console.log(`🔍 DEBUG: Mode de scan = "${scanMode}" (type: ${typeof scanMode}), Appareils = ${devices.length}`);

            console.log(`🔍 DEBUG: Mode ${scanMode} - Lancement identification des fabricants`);
            this.emitProgress('manufacturer', 'start', 'Identification des fabricants...', null, 'Manufacturer Database');

            try {
                const ManufacturerService = require('./manufacturer-service');
                const manufacturerService = new ManufacturerService();
                const identifiedDevices = await manufacturerService.identifyDevices(devices);

                // Re-prioriser après identification
                const finalDevices = this.prioritizeDevicesByQuality(identifiedDevices);

                this.emitProgress('manufacturer', 'success', `Identification: ${finalDevices.length} appareils`);
                return finalDevices;
            } catch (error) {
                console.error('❌ Erreur lors de l\'identification des fabricants:', error);
                this.emitProgress('manufacturer', 'error', `Erreur identification: ${error.message}`);

                // En cas d'erreur, retourner les appareils sans identification
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

    async completePingSweep() {
        if (!this.networkRange) return [];

        const devices = [];
        const baseIp = this.networkRange.split('.');
        const maxConcurrent = 20; // Plus de parallélisme pour être plus rapide

        console.log(`🎯 Ping sweep complet (comme nmap) sur toute la plage 192.168.1.0/24...`);

        // Scanner toutes les adresses de 1 à 254 (comme nmap)
        for (let batch = 0; batch < 254; batch += maxConcurrent) {
            const promises = [];

            for (let i = 0; i < maxConcurrent; i++) {
                const lastOctet = batch + i + 1;
                if (lastOctet <= 254) {
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
                            console.log(`✅ Découvert via ping complet: ${result.value.ip}`);
                        }
                    }
                } catch (error) {
                    // Continuer avec le batch suivant
                }
            }
        }

        console.log(`🎯 Ping sweep complet terminé: ${devices.length} appareils découverts`);
        return devices;
    }

    async quickTargetedPingSweep() {
        if (!this.networkRange) return [];

        const devices = [];
        const baseIp = this.networkRange.split('.');

        // IPs ciblées pour le scan rapide (les plus communes)
        const targetIps = [1, 2, 10, 100, 254]; // Gateway, début range, milieu, fin range

        console.log(`🎯 Mini-ping sweep ciblé sur ${targetIps.length} IPs typiques...`);

        // Scanner en parallèle pour plus de rapidité
        const promises = targetIps.map(async (lastOctet) => {
            const ip = `${baseIp[0]}.${baseIp[1]}.${baseIp[2]}.${lastOctet}`;
            try {
                const device = await this.pingHost(ip);
                if (device) {
                    console.log(`✅ Découvert via mini-ping: ${ip}`);
                    return device;
                }
            } catch (error) {
                // Ignorer les erreurs silencieusement
            }
            return null;
        });

        try {
            const results = await Promise.allSettled(promises);
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    devices.push(result.value);
                }
            }
        } catch (error) {
            console.error('Erreur lors du mini-ping sweep:', error);
        }

        console.log(`🎯 Mini-ping sweep terminé: ${devices.length} appareils découverts`);
        return devices;
    }

    async improvedBonjourScan() {
        try {
            const devices = [];
            // Services les plus courants seulement pour éviter les timeouts
            const services = ['_http._tcp', '_https._tcp', '_ssh._tcp'];

            console.log(`🎯 Scan Bonjour sur ${services.length} services...`);

            // Scanner les services en parallèle avec timeout individuel
            const servicePromises = services.map(async (service) => {
                try {
                    // Timeout de 3 secondes par service avec perl
                    const result = await Promise.race([
                        CommandValidator.safeExec(`perl -e 'alarm 3; exec @ARGV' "dns-sd" "-B" "${service}" "local" 2>/dev/null`),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error(`${service} timeout`)), 3000)
                        )
                    ]);

                    if (result.success) {
                        const bonjourDevices = this.parseBonjourOutput(result.stdout, service);
                        console.log(`✅ Service ${service}: ${bonjourDevices.length} appareils`);
                        return bonjourDevices;
                    }
                    return [];
                } catch (error) {
                    console.log(`⚠️ Service ${service} non disponible: ${error.message}`);
                    return [];
                }
            });

            // Attendre tous les services avec timeout global
            const results = await Promise.allSettled(servicePromises);

            for (const result of results) {
                if (result.status === 'fulfilled') {
                    devices.push(...result.value);
                }
            }

            console.log(`🎯 Scan Bonjour terminé: ${devices.length} appareils découverts`);
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
            // Timeout plus court pour le scan rapide (300ms au lieu de 500ms)
            const result = await CommandValidator.safeExec(`ping -c 1 -W 300 ${ip}`);
            // ping retourne false même quand il fonctionne (pas de réponse), donc on vérifie stdout
            if (result.stdout && result.stdout.includes('PING')) {
                // Obtenir la MAC via ARP avec timeout court
                try {
                    const arpResult = await CommandValidator.safeExec(`arp -n ${ip}`);
                    if (arpResult.success) {
                        const macMatch = arpResult.stdout.match(/at ([0-9a-fA-F:]+)/);
                        if (macMatch) {
                            return {
                                ip: ip,
                                mac: macMatch[1].toLowerCase(),
                                hostname: 'Unknown',
                                deviceType: 'Unknown',
                                lastSeen: new Date().toISOString(),
                                isActive: true,
                                source: 'ping'
                            };
                        }
                    }
                } catch (arpError) {
                    // Si ARP échoue, retourner quand même l'appareil sans MAC
                    return {
                        ip: ip,
                        mac: 'N/A',
                        hostname: 'Unknown',
                        deviceType: 'Unknown',
                        lastSeen: new Date().toISOString(),
                        isActive: true,
                        source: 'ping'
                    };
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    validateAndFilterDevices(devices) {
        console.log(`🔍 Validation et filtrage de ${devices.length} appareils...`);

        const filteredDevices = devices.filter(device => {
            // Validation IP de base
            if (!device.ip || !this.isValidIp(device.ip)) {
                console.log(`🚫 Appareil rejeté - IP invalide: ${device.ip}`);
                return false;
            }

            // Filtrage intelligent des IPs réservées
            const ip = device.ip;

            // IPs vraiment invalides
            if (ip === '127.0.0.1' || // Loopback
                ip.startsWith('169.254') || // Link-local
                ip.startsWith('224.') || // Multicast
                ip.startsWith('255.') || // Broadcast
                ip.startsWith('0.')) { // Réservé
                console.log(`🚫 Appareil rejeté - IP réservée: ${ip}`);
                return false;
            }

            // Filtrage des adresses MAC de broadcast
            if (device.mac && (
                device.mac === 'ff:ff:ff:ff:ff:ff' || // Broadcast
                device.mac === '00:00:00:00:00:00' || // Null
                device.mac.includes('ff:ff:ff') || // Broadcast patterns
                device.mac.includes('00:00:00') // Null patterns
            )) {
                console.log(`🚫 Filtrage adresse MAC de broadcast/null: ${device.ip} - ${device.mac}`);
                return false;
            }

            // Ne PAS filtrer les IPs .0 et .255 (peuvent être valides)
            // Ne PAS filtrer les IPs avec hostname = IP (peuvent être valides)

            // Validation MAC (optionnelle mais recommandée)
            if (device.mac && device.mac !== 'N/A' && !this.isValidMac(device.mac)) {
                console.log(`⚠️ MAC invalide pour ${device.ip}: ${device.mac} - mais appareil conservé`);
                // Ne pas exclure, juste logger
            }

            // Validation hostname (optionnelle)
            if (device.hostname && device.hostname === device.ip && device.mac === 'N/A') {
                console.log(`⚠️ Appareil suspect ${device.ip}: hostname=IP sans MAC`);
                // Ne pas exclure, juste logger
            }

            return true;
        });

        console.log(`✅ Validation terminée: ${filteredDevices.length} appareils conservés sur ${devices.length}`);
        return filteredDevices;
    }

    addDevicesToMap(devices, deviceMap) {
        console.log(`📥 Ajout de ${devices.length} appareils à la map (actuellement ${deviceMap.size} appareils)`);

        let newDevices = 0;
        let mergedDevices = 0;

        for (const device of devices) {
            if (!device.ip || !this.isValidIp(device.ip)) {
                console.log(`⚠️ Appareil ignoré - IP invalide: ${device.ip}`);
                continue;
            }

            const key = device.ip;
            if (!deviceMap.has(key)) {
                // Nouvel appareil
                deviceMap.set(key, {
                    ...device,
                    sources: [device.source || 'unknown'],
                    lastSeen: new Date().toISOString()
                });
                newDevices++;
                console.log(`➕ Nouvel appareil ajouté: ${device.ip} (${device.source})`);
            } else {
                // Fusion intelligente des informations
                const existing = deviceMap.get(key);
                const merged = this.mergeDeviceInfo(existing, device);
                deviceMap.set(key, merged);
                mergedDevices++;
                console.log(`🔄 Appareil fusionné: ${device.ip} (${device.source} + ${existing.source})`);
            }
        }

        console.log(`📊 Résumé ajout: ${newDevices} nouveaux, ${mergedDevices} fusionnés, total: ${deviceMap.size}`);
    }

    mergeDeviceInfo(existing, newDevice) {
        console.log(`🔄 Fusion d'appareils: ${existing.ip} (${existing.source}) + ${newDevice.source}`);

        // Logique de fusion avec priorité claire
        const merged = {
            ip: existing.ip, // Toujours garder l'IP existante
            lastSeen: new Date().toISOString(),
            sources: [...(existing.sources || [existing.source]), newDevice.source].filter((v, i, a) => a.indexOf(v) === i),
            discoveredBy: newDevice.discoveredBy || existing.discoveredBy,
            security: newDevice.security || existing.security
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

    async enrichDevicesWithArp(devices) {
        console.log(`🔍 Enrichissement ARP pour ${devices.length} appareils...`);

        try {
            // Récupérer toutes les MAC depuis ARP
            const arpDevices = await this.improvedArpScan();
            const arpMap = new Map();
            arpDevices.forEach(device => arpMap.set(device.ip, device.mac));

            let enrichedCount = 0;
            const enrichedDevices = devices.map(device => {
                // Si l'appareil n'a pas de MAC ou a 'N/A', essayer de la récupérer depuis ARP
                if ((!device.mac || device.mac === 'N/A') && arpMap.has(device.ip)) {
                    const mac = arpMap.get(device.ip);
                    if (this.isValidMac(mac)) {
                        console.log(`✅ MAC ajoutée pour ${device.ip}: ${mac}`);
                        enrichedCount++;
                        return { ...device, mac };
                    }
                }
                return device;
            });

            console.log(`✅ ${enrichedCount} appareils enrichis avec des MAC depuis ARP`);
            return enrichedDevices;
        } catch (error) {
            console.error('❌ Erreur lors de l\'enrichissement ARP:', error);
            return devices;
        }
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

            // Initialiser le service de fabricants
            await manufacturerService.loadManufacturers();

            // Timeout pour éviter le blocage (30 secondes max)
            const timeoutMs = 30000;
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout identification Mistral AI')), timeoutMs)
            );

            // Traitement avec timeout
            const identificationPromise = this.processDeviceIdentification(devices, manufacturerService);
            await Promise.race([identificationPromise, timeoutPromise]);

            return devices;
        } catch (error) {
            console.error('❌ Erreur identification Mistral AI:', error);
            // En cas d'erreur, retourner les appareils sans identification
            devices.forEach(device => {
                device.manufacturerIdentified = false;
                device.manufacturerConfidence = 0;
            });
            return devices;
        }
    }

    async processDeviceIdentification(devices, manufacturerService) {
        const devicesWithMac = devices.filter(device =>
            device.mac && device.mac !== 'N/A' && this.isValidMac(device.mac)
        );

        console.log(`🔍 Identification de ${devicesWithMac.length} appareils avec MAC valide...`);

        // Traitement en parallèle avec limite de concurrence
        const batchSize = 3; // Traiter 3 appareils en parallèle
        const results = [];

        for (let i = 0; i < devicesWithMac.length; i += batchSize) {
            const batch = devicesWithMac.slice(i, i + batchSize);
            const batchPromises = batch.map(async (device) => {
                try {
                    const manufacturerInfo = await manufacturerService.identifyManufacturer(device.mac);
                    console.log(`🔍 Résultat identification pour ${device.mac}:`, manufacturerInfo);

                    if (manufacturerInfo && manufacturerInfo.identified) {
                        // Fusion intelligente des informations fabricant
                        if (manufacturerInfo.manufacturer && manufacturerInfo.manufacturer !== 'Unknown Manufacturer') {
                            device.manufacturer = manufacturerInfo.manufacturer;
                        }

                        // Gérer les deux formats de deviceType (deviceType et device_type)
                        const deviceType = manufacturerInfo.deviceType || manufacturerInfo.device_type;
                        if (deviceType && deviceType !== 'Unknown Device') {
                            device.deviceType = deviceType;
                        }

                        // Ajouter les informations de confiance
                        device.manufacturerConfidence = manufacturerInfo.confidence || 0;
                        device.manufacturerSource = manufacturerInfo.source || 'mistral';
                        device.manufacturerIdentified = manufacturerInfo.identified;

                        console.log(`✅ Identifié: ${device.mac} → ${manufacturerInfo.manufacturer} (${deviceType}) (confiance: ${manufacturerInfo.confidence})`);
                    } else {
                        console.log(`❌ Non identifié: ${device.mac} - Raison:`, manufacturerInfo);
                        device.manufacturerIdentified = false;
                    }
                } catch (error) {
                    console.log(`⚠️ Erreur identification pour ${device.mac}:`, error.message);
                    device.manufacturerIdentified = false;
                }
            });

            // Attendre que le batch soit terminé avant de passer au suivant
            await Promise.allSettled(batchPromises);
        }

        // Marquer les appareils sans MAC comme non identifiés
        devices.forEach(device => {
            if (!device.mac || device.mac === 'N/A' || !this.isValidMac(device.mac)) {
                console.log(`⚠️ Pas de MAC valide pour ${device.ip}`);
                device.manufacturerIdentified = false;
            }
        });

        return devices;
    }

    isValidMac(mac) {
        if (!mac || mac === 'N/A') return false;

        // MAC complète (6 octets) - format standard
        const fullMacRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (fullMacRegex.test(mac)) return true;

        // MAC avec octets variables (1-2 caractères par octet)
        const flexibleMacRegex = /^([0-9A-Fa-f]{1,2}[:-]){5}([0-9A-Fa-f]{1,2})$/;
        if (flexibleMacRegex.test(mac)) {
            console.log(`⚠️ MAC flexible acceptée: ${mac}`);
            return true;
        }

        // MAC partielle (1 à 5 octets mais format valide)
        const partialMacRegex = /^([0-9A-Fa-f]{2}[:-]){1,5}([0-9A-Fa-f]{2})$/;
        if (partialMacRegex.test(mac)) {
            console.log(`⚠️ MAC partielle acceptée: ${mac}`);
            return true;
        }

        return false;
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

            console.log(`🎯 Scan nmap complet sur ${this.networkRange}/24...`);

            // Utiliser des options optimisées avec ARP scan forcé pour récupérer les MAC
            const command = `nmap -sn -PR ${this.networkRange}/24 --max-retries 1 --min-rate 200 --host-timeout 5s`;
            console.log(`🔧 Commande nmap: ${command}`);

            const result = await CommandValidator.safeExec(command);
            console.log(`📊 Résultat nmap - Success: ${result.success}, Error: ${result.error || 'none'}`);

            if (!result.success) {
                console.error(`❌ Nmap échec: ${result.error}`);
                console.error(`📄 Stdout: ${result.stdout}`);
                console.error(`📄 Stderr: ${result.stderr}`);
                throw new Error(`Nmap non disponible ou échec: ${result.error}`);
            }

            console.log(`📄 Nmap stdout (premiers 500 chars): ${result.stdout.substring(0, 500)}...`);

            const devices = [];
            const lines = result.stdout.split('\n');

            for (const line of lines) {
                // Pattern pour "Nmap scan report for 192.168.1.20"
                const simpleMatch = line.match(/Nmap scan report for (\d+\.\d+\.\d+\.\d+)/);
                if (simpleMatch) {
                    const ip = simpleMatch[1];
                    devices.push({
                        ip,
                        mac: 'N/A', // Nmap ne donne pas toujours la MAC
                        hostname: 'Unknown',
                        deviceType: 'Unknown',
                        lastSeen: new Date().toISOString(),
                        isActive: true,
                        isLocal: false,
                        manufacturerInfo: { identified: false, manufacturer: 'Unknown', confidence: 0, source: 'nmap' },
                        discoveredBy: 'nmap',
                        source: 'nmap'
                    });
                    console.log(`✅ Nmap découvert: ${ip}`);
                    continue;
                }

                // Pattern pour "Nmap scan report for pi.hole (192.168.1.58)"
                const hostnameMatch = line.match(/Nmap scan report for (.+?) \((\d+\.\d+\.\d+\.\d+)\)/);
                if (hostnameMatch) {
                    const hostname = hostnameMatch[1];
                    const ip = hostnameMatch[2];

                    devices.push({
                        ip,
                        mac: null,
                        hostname: hostname !== ip ? hostname : 'Unknown',
                        deviceType: 'Unknown',
                        lastSeen: new Date().toISOString(),
                        isActive: true,
                        isLocal: false,
                        manufacturerInfo: { identified: false, manufacturer: 'Unknown', confidence: 0, source: 'nmap' },
                        discoveredBy: 'nmap',
                        source: 'nmap'
                    });
                    console.log(`✅ Nmap découvert: ${hostname} (${ip})`);
                }
            }

            console.log(`🎯 Scan nmap terminé: ${devices.length} appareils découverts`);

            // Enrichir avec les MAC depuis la table ARP
            const arpDevices = await this.improvedArpScan();
            const arpMap = new Map();
            arpDevices.forEach(device => arpMap.set(device.ip, device.mac));

            // Fusionner les MAC trouvées
            devices.forEach(device => {
                if (arpMap.has(device.ip)) {
                    device.mac = arpMap.get(device.ip);
                    console.log(`✅ MAC ajoutée pour ${device.ip}: ${device.mac}`);
                }
            });

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