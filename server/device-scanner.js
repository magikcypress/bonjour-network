const CommandValidator = require('./security/command-validator');

class DeviceScanner {
    constructor(io = null) {
        this.io = io; // Socket.IO pour les événements en temps réel
    }

    // Méthode pour émettre un événement de progrès
    emitProgress(step, status, message, data = null, command = null) {
        if (this.io) {
            this.io.emit('scan-progress', {
                step,
                status, // 'start', 'success', 'error', 'complete'
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
            this.emitProgress('scan', 'start', `Démarrage du scan ${scanMode} des appareils connectés...`);

            // Timeout global de 120 secondes pour le scan complet, 30s pour le scan rapide
            const timeoutMs = scanMode === 'complete' ? 120000 : 30000;
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Scan timeout - ${timeoutMs / 1000} secondes dépassées`)), timeoutMs)
            );

            const scanPromise = this.performScan(scanMode);

            const result = await Promise.race([scanPromise, timeoutPromise]);

            this.emitProgress('scan', 'complete', `Scan ${scanMode} terminé avec succès`, {
                deviceCount: result.length
            });

            // Envoyer l'événement scan-complete via Socket.IO si disponible
            if (this.io) {
                this.io.emit('scan-complete', { devices: result });
                console.log('📡 Événement scan-complete envoyé à tous les clients');
            }

            return result;
        } catch (error) {
            this.emitProgress('scan', 'error', `Erreur lors du scan: ${error.message}`);
            console.error('Erreur lors du scan des appareils:', error);

            // Envoyer l'événement scan-error via Socket.IO si disponible
            if (this.io) {
                this.io.emit('scan-error', { error: error.message });
                console.log('📡 Événement scan-error envoyé');
            }

            return [];
        }
    }

    async performScan(scanMode) {
        let devices = [];
        const allDevices = new Map(); // Pour éviter les doublons

        // Méthode 1: Scan ARP (méthode de base) - TOUJOURS
        this.emitProgress('arp', 'start', 'Démarrage du scan ARP...', null, 'arp -a');
        try {
            const arpPromise = this.scanWithArp();
            const arpTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('ARP timeout')), 5000)
            );
            const arpDevices = await Promise.race([arpPromise, arpTimeout]);
            this.addDevicesToMap(arpDevices, allDevices);
            this.emitProgress('arp', 'success', `Scan ARP terminé: ${arpDevices.length} appareils détectés`, { deviceCount: arpDevices.length });
        } catch (error) {
            this.emitProgress('arp', 'error', `Erreur scan ARP: ${error.message}`);
        }

        // Méthode 2: Scan netstat (connexions actives) - TOUJOURS
        this.emitProgress('netstat', 'start', 'Démarrage du scan netstat...', null, 'netstat -rn');
        try {
            const netstatPromise = this.scanWithNetstat();
            const netstatTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Netstat timeout')), 5000)
            );
            const netstatDevices = await Promise.race([netstatPromise, netstatTimeout]);
            this.addDevicesToMap(netstatDevices, allDevices);
            this.emitProgress('netstat', 'success', `Scan netstat terminé: ${netstatDevices.length} appareils détectés`, { deviceCount: netstatDevices.length });
        } catch (error) {
            this.emitProgress('netstat', 'error', `Erreur scan netstat: ${error.message}`);
        }

        // Méthode 3: Scan ifconfig (interfaces) - TOUJOURS
        this.emitProgress('ifconfig', 'start', 'Démarrage du scan ifconfig...', null, 'ifconfig en0');
        try {
            const ifconfigPromise = this.scanWithIfconfig();
            const ifconfigTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Ifconfig timeout')), 5000)
            );
            const ifconfigDevices = await Promise.race([ifconfigPromise, ifconfigTimeout]);
            this.addDevicesToMap(ifconfigDevices, allDevices);
            this.emitProgress('ifconfig', 'success', `Scan ifconfig terminé: ${ifconfigDevices.length} appareils détectés`, { deviceCount: ifconfigDevices.length });
        } catch (error) {
            this.emitProgress('ifconfig', 'error', `Erreur scan ifconfig: ${error.message}`);
        }

        // Méthodes supplémentaires seulement en mode complet
        if (scanMode === 'complete') {
            // Méthode 4: Ping sweep (découverte active) - RÉACTIVÉ pour découvrir TOUTES les IPs
            this.emitProgress('ping', 'start', 'Démarrage du ping sweep complet (254 IPs)...', null, 'ping -c 1 -W 1000 [254 IPs]');
            try {
                const pingPromise = this.scanWithPingSweep();
                const pingTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Ping sweep timeout')), 30000)
                );
                const pingDevices = await Promise.race([pingPromise, pingTimeout]);
                this.addDevicesToMap(pingDevices, allDevices);
                this.emitProgress('ping', 'success', `Ping sweep terminé: ${pingDevices.length} appareils répondants`, { deviceCount: pingDevices.length });
            } catch (error) {
                this.emitProgress('ping', 'error', `Erreur ping sweep: ${error.message}`);
            }

            // Méthode 5: Scan avec nmap (si disponible) - LIMITÉ
            this.emitProgress('nmap', 'start', 'Démarrage du scan nmap...', null, 'nmap -sn [network] --max-retries 1');
            try {
                const nmapPromise = this.scanWithNmap();
                const nmapTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Nmap timeout')), 10000)
                );
                const nmapDevices = await Promise.race([nmapPromise, nmapTimeout]);
                this.addDevicesToMap(nmapDevices, allDevices);
                this.emitProgress('nmap', 'success', `Scan nmap terminé: ${nmapDevices.length} appareils détectés`, { deviceCount: nmapDevices.length });
            } catch (error) {
                this.emitProgress('nmap', 'error', `Erreur scan nmap: ${error.message}`);
            }

            // Méthode 6: Scan avec dns-sd (découverte Bonjour) - LIMITÉ
            this.emitProgress('bonjour', 'start', 'Démarrage du scan Bonjour...', null, 'dns-sd -B [services] local');
            try {
                const bonjourPromise = this.scanWithBonjour();
                const bonjourTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Bonjour timeout')), 8000)
                );
                const bonjourDevices = await Promise.race([bonjourPromise, bonjourTimeout]);
                this.addDevicesToMap(bonjourDevices, allDevices);
                this.emitProgress('bonjour', 'success', `Scan Bonjour terminé: ${bonjourDevices.length} services découverts`, { deviceCount: bonjourDevices.length });
            } catch (error) {
                this.emitProgress('bonjour', 'error', `Erreur scan Bonjour: ${error.message}`);
            }

            // Méthode 7: Scan avec arping (si disponible) - LIMITÉ
            this.emitProgress('arping', 'start', 'Démarrage du scan arping...', null, 'arping -I en0 [gateway]');
            try {
                const arpingPromise = this.scanWithArping();
                const arpingTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Arping timeout')), 8000)
                );
                const arpingDevices = await Promise.race([arpingPromise, arpingTimeout]);
                this.addDevicesToMap(arpingDevices, allDevices);
                this.emitProgress('arping', 'success', `Scan arping terminé: ${arpingDevices.length} appareils détectés`, { deviceCount: arpingDevices.length });
            } catch (error) {
                this.emitProgress('arping', 'error', `Erreur scan arping: ${error.message}`);
            }
        }

        // Convertir la Map en tableau
        devices = Array.from(allDevices.values());

        // Si on a trop d'appareils (probablement du ping sweep), limiter aux appareils avec MAC
        if (devices.length > 50) {
            console.log(`🔍 Trop d'appareils détectés (${devices.length}), filtrage des appareils avec MAC...`);
            devices = devices.filter(device => device.mac && device.mac !== 'N/A');
            console.log(`✅ Après filtrage: ${devices.length} appareils avec MAC`);
        }

        // Identifier et mettre en premier l'appareil local
        devices = await this.prioritizeLocalDevice(devices);

        this.emitProgress('scan', 'success', `Scan ${scanMode} terminé: ${devices.length} appareils uniques détectés`);

        if (devices.length > 0) {
            // Interroger Mistral AI pour chaque appareil avec adresse MAC
            this.emitProgress('mistral', 'start', 'Démarrage de l\'identification Mistral AI...', null, 'Mistral AI API calls');
            const identifiedDevices = await this.identifyDevicesWithMistralAI(devices);
            this.emitProgress('mistral', 'success', `Identification Mistral AI terminée: ${identifiedDevices.length} appareils traités`, { deviceCount: identifiedDevices.length });
            return identifiedDevices;
        } else {
            this.emitProgress('scan', 'warning', 'Aucun appareil détecté, retour d\'une liste vide');
            return [];
        }
    }

    // Nouvelle méthode pour un scan rapide
    async scanConnectedDevicesFast() {
        return this.scanConnectedDevices('fast');
    }

    // Nouvelle méthode pour un scan complet
    async scanConnectedDevicesComplete() {
        return this.scanConnectedDevices('complete');
    }

    // Méthode pour ajouter des appareils à la Map en évitant les doublons
    addDevicesToMap(devices, deviceMap) {
        for (const device of devices) {
            // Filtrer les appareils sans IP valide ou avec des IPs de réseau/broadcast
            if (!device.ip ||
                device.ip === 'N/A' ||
                device.ip === 'unknown' ||
                !this.isValidIp(device.ip) ||
                device.ip.endsWith('.0') ||  // IP de réseau
                device.ip.endsWith('.255') || // IP de broadcast
                device.ip.includes('169.254') || // Link-local
                device.ip.includes('224.0.0') || // Multicast
                device.ip.includes('255.255.255') || // Broadcast
                device.ip.startsWith('0.') || // IPs réservées
                device.ip.startsWith('255.') || // IPs réservées
                (device.hostname === device.ip && (device.mac === 'N/A' || device.hostname === 'Unknown'))) { // Appareils avec hostname = IP et sans MAC ou hostname Unknown
                continue; // Ignorer les appareils sans IP valide
            }

            // Utiliser l'IP comme clé principale pour éviter les doublons
            const key = device.ip;
            if (key && !deviceMap.has(key)) {
                deviceMap.set(key, device);
            } else if (key && deviceMap.has(key)) {
                // Fusionner les informations si l'appareil existe déjà
                const existing = deviceMap.get(key);
                const merged = {
                    ...existing,
                    ...device,
                    hostname: device.hostname || existing.hostname,
                    deviceType: device.deviceType || existing.deviceType,
                    // Garder la MAC la plus complète (pas de 'N/A')
                    mac: (device.mac && device.mac !== 'N/A') ? device.mac : existing.mac,
                    lastSeen: new Date().toISOString()
                };
                deviceMap.set(key, merged);
            }
        }
    }

    // Méthode pour identifier et prioriser l'appareil local
    async prioritizeLocalDevice(devices) {
        try {
            // Obtenir l'IP locale
            const result = await CommandValidator.safeExec('ifconfig en0');
            if (result.success) {
                const inetLine = result.stdout.split('\n').find(line => line.includes('inet '));
                if (inetLine) {
                    const match = inetLine.match(/inet (\d+\.\d+\.\d+\.\d+)/);
                    if (match) {
                        const localIp = match[1];

                        // Chercher l'appareil local dans la liste
                        const localDeviceIndex = devices.findIndex(device => device.ip === localIp);

                        if (localDeviceIndex !== -1) {
                            // Marquer l'appareil local
                            devices[localDeviceIndex].isLocal = true;
                            devices[localDeviceIndex].hostname = devices[localDeviceIndex].hostname || 'Cet appareil';
                            devices[localDeviceIndex].deviceType = devices[localDeviceIndex].deviceType || 'Appareil local';

                            // Déplacer l'appareil local en premier
                            const localDevice = devices.splice(localDeviceIndex, 1)[0];
                            devices.unshift(localDevice);

                            console.log(`🏠 Appareil local identifié: ${localIp} - placé en premier`);
                        }

                        // Supprimer les doublons de l'appareil local (même IP)
                        const uniqueDevices = [];
                        const seenIps = new Set();

                        for (const device of devices) {
                            if (!seenIps.has(device.ip)) {
                                seenIps.add(device.ip);
                                uniqueDevices.push(device);
                            }
                        }

                        console.log(`🔍 Suppression des doublons: ${devices.length} → ${uniqueDevices.length} appareils`);
                        return uniqueDevices;
                    }
                }
            }
        } catch (error) {
            console.log('⚠️ Impossible d\'identifier l\'appareil local:', error.message);
        }

        return devices;
    }

    // Nouvelle méthode: Ping sweep pour découvrir les appareils
    async scanWithPingSweep() {
        try {
            const devices = [];
            const networkRange = await this.getNetworkRange();

            if (!networkRange) {
                console.log('⚠️ Impossible de déterminer la plage réseau pour le ping sweep');
                return [];
            }

            console.log(`🔍 Ping sweep sur la plage: ${networkRange}`);

            // Scanner TOUTES les IPs pour découvrir tous les appareils
            const maxConcurrentPings = 25; // Augmenter pour plus d'efficacité
            const totalIps = 254; // Scanner .1 à .254 pour découvrir tous les appareils

            for (let batch = 0; batch < totalIps; batch += maxConcurrentPings) {
                const promises = [];
                const batchSize = Math.min(maxConcurrentPings, totalIps - batch);

                for (let i = 0; i < batchSize; i++) {
                    const ipIndex = batch + i + 1;
                    const ip = networkRange.replace('.0', `.${ipIndex}`);
                    promises.push(this.pingHost(ip));
                }

                // Timeout de 5 secondes par batch (réduit)
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                );

                try {
                    const results = await Promise.race([
                        Promise.allSettled(promises),
                        timeoutPromise
                    ]);

                    for (const result of results) {
                        if (result.status === 'fulfilled' && result.value) {
                            devices.push(result.value);
                        }
                    }
                } catch (error) {
                    console.log(`⚠️ Timeout sur le batch ${batch + 1}, continuation...`);
                }
            }

            console.log(`✅ Ping sweep terminé: ${devices.length} appareils répondants`);
            return devices;
        } catch (error) {
            console.log('❌ Erreur lors du ping sweep:', error.message);
            return [];
        }
    }

    // Nouvelle méthode: Scan avec nmap
    async scanWithNmap() {
        try {
            const networkRange = await this.getNetworkRange();
            if (!networkRange) return [];

            // Vérifier si nmap est disponible
            try {
                await CommandValidator.safeExec('which nmap');
            } catch {
                console.log('⚠️ nmap non disponible, skip du scan nmap');
                return [];
            }

            const result = await CommandValidator.safeExec(`nmap -sn ${networkRange} --max-retries 1 --host-timeout 1s`);
            if (result.success) {
                return this.parseNmapOutput(result.stdout);
            }
            return [];
        } catch (error) {
            console.log('❌ Erreur lors du scan nmap:', error.message);
            return [];
        }
    }

    // Nouvelle méthode: Scan avec dns-sd (Bonjour)
    async scanWithBonjour() {
        try {
            const devices = [];

            // Scan des services Bonjour
            const services = ['_http._tcp', '_https._tcp', '_ssh._tcp', '_ftp._tcp', '_smb._tcp'];

            for (const service of services) {
                try {
                    const result = await CommandValidator.safeExec(`dns-sd -B ${service} local`);
                    if (result.success) {
                        const bonjourDevices = this.parseBonjourOutput(result.stdout, service);
                        devices.push(...bonjourDevices);
                    }
                } catch (error) {
                    // Ignorer les erreurs pour les services non disponibles
                }
            }

            console.log(`✅ Scan Bonjour terminé: ${devices.length} services découverts`);
            return devices;
        } catch (error) {
            console.log('❌ Erreur lors du scan Bonjour:', error.message);
            return [];
        }
    }

    // Nouvelle méthode: Scan avec arping
    async scanWithArping() {
        try {
            // Vérifier si arping est disponible
            try {
                await CommandValidator.safeExec('which arping');
            } catch {
                console.log('⚠️ arping non disponible, skip du scan arping');
                return [];
            }

            const networkRange = await this.getNetworkRange();
            if (!networkRange) return [];

            const result = await CommandValidator.safeExec(`arping -I en0 ${networkRange.replace('.0', '.1')}`);
            if (result.success) {
                return this.parseArpingOutput(result.stdout);
            }
            return [];
        } catch (error) {
            console.log('❌ Erreur lors du scan arping:', error.message);
            return [];
        }
    }

    // Méthode pour obtenir la plage réseau
    async getNetworkRange() {
        try {
            // Exécuter uniquement 'ifconfig en0' (pas de pipe)
            const result = await CommandValidator.safeExec('ifconfig en0');
            if (result.success) {
                // Filtrer la ligne contenant 'inet '
                const inetLine = result.stdout.split('\n').find(line => line.includes('inet '));
                if (inetLine) {
                    const match = inetLine.match(/inet (\d+\.\d+\.\d+\.\d+)/);
                    if (match) {
                        const ip = match[1];
                        const parts = ip.split('.');
                        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
                    }
                }
            }
            return null;
        } catch (error) {
            console.log('❌ Erreur lors de la détermination de la plage réseau:', error.message);
            return null;
        }
    }

    // Méthode pour ping un hôte
    async pingHost(ip) {
        try {
            const result = await CommandValidator.safeExec(`ping -c 1 -W 1000 ${ip}`);
            if (result.success) {
                // Essayer d'obtenir l'adresse MAC via ARP
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
                            isActive: true
                        };
                    }
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    // Parser pour nmap
    parseNmapOutput(output) {
        const devices = [];
        const lines = output.split('\n');

        for (const line of lines) {
            if (line.includes('Nmap scan report for')) {
                const match = line.match(/Nmap scan report for ([^\s]+)/);
                if (match) {
                    const hostname = match[1];
                    const ipMatch = line.match(/\(([^)]+)\)/);
                    const ip = ipMatch ? ipMatch[1] : hostname;

                    devices.push({
                        ip: ip,
                        mac: 'N/A',
                        hostname: hostname,
                        deviceType: 'Discovered Device',
                        lastSeen: new Date().toISOString(),
                        isActive: true,
                        discoveredBy: 'nmap'
                    });
                }
            }
        }

        return devices;
    }

    // Parser pour Bonjour
    parseBonjourOutput(output, service) {
        const devices = [];
        const lines = output.split('\n');

        for (const line of lines) {
            if (line.includes('Add')) {
                const match = line.match(/Add\s+([^\s]+)\s+([^\s]+)/);
                if (match) {
                    const hostname = match[1];
                    const ip = match[2];

                    devices.push({
                        ip: ip,
                        mac: 'N/A',
                        hostname: hostname,
                        deviceType: `${service} Service`,
                        lastSeen: new Date().toISOString(),
                        isActive: true,
                        discoveredBy: 'bonjour',
                        service: service
                    });
                }
            }
        }

        return devices;
    }

    // Parser pour arping
    parseArpingOutput(output) {
        const devices = [];
        const lines = output.split('\n');

        for (const line of lines) {
            if (line.includes('Unicast reply from')) {
                const match = line.match(/Unicast reply from ([^\s]+)/);
                if (match) {
                    const ip = match[1];

                    devices.push({
                        ip: ip,
                        mac: 'N/A',
                        hostname: ip,
                        deviceType: 'ARP Responder',
                        lastSeen: new Date().toISOString(),
                        isActive: true,
                        discoveredBy: 'arping'
                    });
                }
            }
        }

        return devices;
    }

    async identifyDevicesWithMistralAI(devices) {
        console.log('🤖 Début de l\'identification avec base locale + Mistral AI...');

        try {
            const ManufacturerService = require('./manufacturer-service');
            const manufacturerService = new ManufacturerService();
            await manufacturerService.loadManufacturers();

            const identifiedDevices = [];

            // Timeout de 30 secondes pour l'identification
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Identification timeout - 30 secondes dépassées')), 30000)
            );

            const identificationPromise = this.performManufacturerIdentification(devices, manufacturerService);

            return await Promise.race([identificationPromise, timeoutPromise]);
        } catch (error) {
            console.error('❌ Erreur lors de l\'identification:', error);
            return devices;
        }
    }

    async performManufacturerIdentification(devices, manufacturerService) {
        const identifiedDevices = [];

        for (const device of devices) {
            try {
                if (device.mac && device.mac !== 'N/A') {
                    console.log(`🔍 Identification fabricant pour: ${device.mac}`);
                    const identification = await manufacturerService.identifyManufacturer(device.mac);

                    console.log(`✅ Résultat identification pour ${device.mac}:`, identification);

                    // Mettre à jour le type d'appareil avec l'identification
                    const updatedDevice = {
                        ...device,
                        deviceType: identification.manufacturer,
                        manufacturerInfo: {
                            manufacturer: identification.manufacturer,
                            deviceType: identification.deviceType,
                            confidence: identification.confidence,
                            identified: identification.identified,
                            source: identification.source || 'mistral'
                        }
                    };

                    identifiedDevices.push(updatedDevice);
                } else {
                    console.log(`⚠️ Pas d'adresse MAC pour: ${device.ip}`);
                    identifiedDevices.push(device);
                }
            } catch (error) {
                console.error(`❌ Erreur identification pour ${device.mac}:`, error);
                identifiedDevices.push(device);
            }
        }

        console.log(`✅ Identification terminée: ${identifiedDevices.length} appareils traités`);
        return identifiedDevices;
    }

    async scanWithArp() {
        try {
            // Utiliser arp -a pour obtenir la table ARP
            const result = await CommandValidator.safeExec('arp -a');
            if (result.success) {
                return this.parseArpOutput(result.stdout);
            }
            return [];
        } catch (error) {
            console.log('arp -a non disponible');
            return [];
        }
    }

    async scanWithNetstat() {
        try {
            // Utiliser netstat pour les connexions actives
            const result = await CommandValidator.safeExec('netstat -rn');
            if (result.success) {
                return this.parseNetstatOutput(result.stdout);
            }
            return [];
        } catch (error) {
            console.log('netstat non disponible');
            return [];
        }
    }

    async scanWithIfconfig() {
        try {
            // Utiliser ifconfig pour les interfaces réseau
            const result = await CommandValidator.safeExec('ifconfig');
            if (result.success) {
                return this.parseIfconfigOutput(result.stdout);
            }
            return [];
        } catch (error) {
            console.log('ifconfig non disponible');
            return [];
        }
    }

    parseArpOutput(output) {
        const lines = output.split('\n');
        const devices = [];
        const seenDevices = new Set();

        for (const line of lines) {
            if (line.trim() && !line.includes('Address') && !line.includes('Interface')) {
                // Pattern pour macOS: ? (192.168.1.44) at 22:fc:ed:1f:76:4 on en0
                const arpMatch = line.match(/\? \(([^)]+)\) at ([0-9a-fA-F:]+) on/);
                if (arpMatch) {
                    const ip = arpMatch[1];
                    const mac = arpMatch[2];

                    if (CommandValidator.isValidIp(ip) && !ip.includes('169.254') && !ip.includes('224.0.0') && !ip.includes('255.255.255') && !ip.includes('ff:ff:ff:ff:ff:ff')) {
                        const deviceKey = `${ip}-${mac}`;
                        if (!seenDevices.has(deviceKey)) {
                            seenDevices.add(deviceKey);
                            devices.push({
                                ip: ip,
                                mac: mac,
                                hostname: this.extractHostname(line),
                                deviceType: this.guessDeviceType(mac),
                                lastSeen: new Date().toISOString(),
                                isActive: true
                            });
                        }
                    }
                }

                // Pattern pour les appareils avec nom: TIREXNAS (192.168.1.118) at 6c:bf:b5:4:24:7c
                const namedMatch = line.match(/([^(]+) \(([^)]+)\) at ([0-9a-fA-F:]+)/);
                if (namedMatch) {
                    const hostname = namedMatch[1].trim();
                    const ip = namedMatch[2];
                    const mac = namedMatch[3];

                    if (CommandValidator.isValidIp(ip) && !ip.includes('169.254') && !ip.includes('224.0.0') && !ip.includes('255.255.255') && !ip.includes('ff:ff:ff:ff:ff:ff')) {
                        const deviceKey = `${ip}-${mac}`;
                        if (!seenDevices.has(deviceKey)) {
                            seenDevices.add(deviceKey);
                            devices.push({
                                ip: ip,
                                mac: mac,
                                hostname: hostname,
                                deviceType: this.guessDeviceType(mac),
                                lastSeen: new Date().toISOString(),
                                isActive: true
                            });
                        }
                    }
                }
            }
        }

        return devices;
    }

    parseNetstatOutput(output) {
        const lines = output.split('\n');
        const devices = [];

        for (const line of lines) {
            if (line.includes('link#') || line.includes('default')) {
                const parts = line.split(/\s+/);
                if (parts.length >= 2) {
                    const ip = parts[0];
                    // Vérifier que l'IP est valide et n'est pas une IP locale ou broadcast
                    if (this.isValidIp(ip) &&
                        !ip.includes('127.0.0.1') &&
                        !ip.includes('169.254') &&
                        !ip.includes('224.0.0') &&
                        !ip.includes('255.255.255') &&
                        !ip.startsWith('0.') &&
                        !ip.startsWith('255.')) {
                        devices.push({
                            ip: ip,
                            mac: 'N/A',
                            hostname: 'Unknown',
                            deviceType: 'Unknown',
                            lastSeen: new Date().toISOString(),
                            isActive: true
                        });
                    }
                }
            }
        }

        return devices;
    }

    parseIfconfigOutput(output) {
        const lines = output.split('\n');
        const devices = [];
        let currentInterface = null;
        const seenIps = new Set();

        for (const line of lines) {
            if (line.includes('inet ') && !line.includes('127.0.0.1')) {
                const ipMatch = line.match(/inet (\d+\.\d+\.\d+\.\d+)/);
                if (ipMatch) {
                    const ip = ipMatch[1];
                    // Vérifier que l'IP est valide et n'est pas déjà vue
                    if (this.isValidIp(ip) &&
                        !ip.includes('169.254') &&
                        !ip.includes('224.0.0') &&
                        !ip.includes('255.255.255') &&
                        !ip.startsWith('0.') &&
                        !ip.startsWith('255.') &&
                        !seenIps.has(ip)) {

                        seenIps.add(ip);
                        devices.push({
                            ip: ip,
                            mac: 'N/A',
                            hostname: currentInterface || 'Local Device',
                            deviceType: 'Local Device',
                            lastSeen: new Date().toISOString(),
                            isActive: true
                        });
                    }
                }
            } else if (line.includes('ether ')) {
                const macMatch = line.match(/ether ([0-9a-fA-F:]+)/);
                if (macMatch) {
                    currentInterface = macMatch[1];
                }
            }
        }

        return devices;
    }

    isValidMac(mac) {
        return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac);
    }

    isValidIp(ip) {
        return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
    }

    extractHostname(line) {
        // Essayer d'extraire un nom d'hôte de la ligne
        const hostnameMatch = line.match(/\(([^)]+)\)/);
        if (hostnameMatch) {
            const hostname = hostnameMatch[1];
            // Vérifier que ce n'est pas une IP
            if (!this.isValidIp(hostname)) {
                return hostname;
            }
        }

        // Essayer de trouver un nom après l'IP
        const parts = line.split(/\s+/);
        for (let i = 2; i < parts.length; i++) {
            if (parts[i] &&
                !parts[i].includes('ether') &&
                !parts[i].includes('ifscope') &&
                !this.isValidIp(parts[i])) {
                return parts[i];
            }
        }

        return 'Unknown';
    }

    guessDeviceType(mac) {
        // Deviner le type d'appareil basé sur l'adresse MAC
        const prefix = mac.substring(0, 8).toUpperCase();

        const manufacturers = {
            'B8:27:EB': 'Raspberry Pi',
            '6C:BF:B5': 'Synology',
            '22:FC:ED': 'Apple',
            '48:E1:5C': 'Samsung',
            '96:E8:40': 'LG',
            'BC:D0:74': 'Xiaomi',
            '38:7:16': 'TP-Link'
        };

        return manufacturers[prefix] || 'Unknown';
    }

    async getDeviceInfo(mac) {
        try {
            // Récupérer des informations supplémentaires sur l'appareil
            const deviceInfo = {
                mac: mac,
                manufacturer: this.guessDeviceType(mac),
                lastSeen: new Date().toISOString(),
                isActive: true
            };

            return deviceInfo;
        } catch (error) {
            console.error('Erreur lors de la récupération des infos appareil:', error);
            return null;
        }
    }
}

module.exports = DeviceScanner; 