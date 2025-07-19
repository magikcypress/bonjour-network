const DeviceScanner = require('./device-scanner');

async function testDeepScan() {
    console.log('🚀 Test du scanner approfondi...');

    const scanner = new DeviceScanner();

    try {
        console.log('⏳ Démarrage du scan (cela peut prendre 1-2 minutes)...');
        const startTime = Date.now();

        const devices = await scanner.scanConnectedDevices();

        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        console.log(`\n✅ Scan terminé en ${duration.toFixed(1)} secondes`);
        console.log(`📊 Résultats: ${devices.length} appareils détectés\n`);

        // Afficher les détails de chaque appareil
        devices.forEach((device, index) => {
            console.log(`${index + 1}. ${device.hostname || device.ip}`);
            console.log(`   IP: ${device.ip}`);
            console.log(`   MAC: ${device.mac}`);
            console.log(`   Type: ${device.deviceType}`);
            console.log(`   Découvert par: ${device.discoveredBy || 'ARP'}`);
            if (device.mistralAI) {
                console.log(`   Fabricant: ${device.mistralAI.manufacturer}`);
                console.log(`   Confiance: ${device.mistralAI.confidence}%`);
            }
            console.log('');
        });

        // Statistiques par méthode de découverte
        const discoveryStats = {};
        devices.forEach(device => {
            const method = device.discoveredBy || 'ARP';
            discoveryStats[method] = (discoveryStats[method] || 0) + 1;
        });

        console.log('📈 Statistiques par méthode de découverte:');
        Object.entries(discoveryStats).forEach(([method, count]) => {
            console.log(`   ${method}: ${count} appareils`);
        });

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    }
}

testDeepScan(); 