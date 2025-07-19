const DeviceScanner = require('./device-scanner');

async function compareScanModes() {
    console.log('🚀 Comparaison des modes de scan...');

    const scanner = new DeviceScanner();

    try {
        // Test du scan rapide
        console.log('\n📡 === SCAN RAPIDE ===');
        const fastStartTime = Date.now();
        const fastDevices = await scanner.scanConnectedDevicesFast();
        const fastDuration = (Date.now() - fastStartTime) / 1000;

        console.log(`✅ Scan rapide terminé en ${fastDuration.toFixed(1)} secondes`);
        console.log(`📊 Appareils détectés: ${fastDevices.length}`);

        // Afficher les appareils du scan rapide
        fastDevices.forEach((device, index) => {
            console.log(`   ${index + 1}. ${device.hostname || device.ip} (${device.discoveredBy || 'ARP'})`);
        });

        // Test du scan complet
        console.log('\n📡 === SCAN COMPLET ===');
        const completeStartTime = Date.now();
        const completeDevices = await scanner.scanConnectedDevicesComplete();
        const completeDuration = (Date.now() - completeStartTime) / 1000;

        console.log(`✅ Scan complet terminé en ${completeDuration.toFixed(1)} secondes`);
        console.log(`📊 Appareils détectés: ${completeDevices.length}`);

        // Afficher les appareils du scan complet
        completeDevices.forEach((device, index) => {
            console.log(`   ${index + 1}. ${device.hostname || device.ip} (${device.discoveredBy || 'ARP'})`);
        });

        // Comparaison
        console.log('\n📈 === COMPARAISON ===');
        console.log(`⏱️  Temps rapide: ${fastDuration.toFixed(1)}s`);
        console.log(`⏱️  Temps complet: ${completeDuration.toFixed(1)}s`);
        console.log(`📊 Différence: ${completeDevices.length - fastDevices.length} appareils supplémentaires`);
        console.log(`🚀 Gain de performance: ${((completeDuration / fastDuration) * 100).toFixed(0)}% plus lent`);

        // Appareils uniques au scan complet
        const fastIps = new Set(fastDevices.map(d => d.ip));
        const uniqueToComplete = completeDevices.filter(d => !fastIps.has(d.ip));

        if (uniqueToComplete.length > 0) {
            console.log('\n🔍 Appareils découverts uniquement par le scan complet:');
            uniqueToComplete.forEach((device, index) => {
                console.log(`   ${index + 1}. ${device.hostname || device.ip} (${device.discoveredBy})`);
            });
        }

        // Statistiques par méthode de découverte
        console.log('\n📊 Statistiques par méthode de découverte:');
        const discoveryStats = {};
        completeDevices.forEach(device => {
            const method = device.discoveredBy || 'ARP';
            discoveryStats[method] = (discoveryStats[method] || 0) + 1;
        });

        Object.entries(discoveryStats).forEach(([method, count]) => {
            console.log(`   ${method}: ${count} appareils`);
        });

    } catch (error) {
        console.error('❌ Erreur lors de la comparaison:', error);
    }
}

compareScanModes(); 