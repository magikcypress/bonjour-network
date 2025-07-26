const ImprovedDeviceScanner = require('../server/improved-device-scanner');

async function testCompleteScan() {
    console.log('🧪 Test du scan complet avec identification Mistral AI...\n');

    try {
        const scanner = new ImprovedDeviceScanner();

        console.log('📡 Démarrage du scan complet...');
        const startTime = Date.now();

        const devices = await scanner.scanConnectedDevices('complete');

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`\n✅ Scan complet terminé en ${duration}ms`);
        console.log(`📊 Résultats:`);
        console.log(`   - Appareils détectés: ${devices.length}`);

        if (devices.length > 0) {
            console.log('\n📱 Appareils détectés:');
            devices.forEach((device, index) => {
                console.log(`   ${index + 1}. ${device.ip} (${device.mac || 'N/A'}) - ${device.hostname || 'Unknown'}`);
                if (device.manufacturerIdentified) {
                    console.log(`      Fabricant: ${device.manufacturer} (confiance: ${device.manufacturerConfidence})`);
                }
                if (device.sources) {
                    console.log(`      Sources: ${device.sources.join(', ')}`);
                }
            });
        } else {
            console.log('❌ Aucun appareil détecté');
        }

        // Vérifier que le scan ne s'est pas bloqué
        console.log('\n🔍 Analyse:');
        if (duration < 60000) { // Moins d'1 minute
            console.log('✅ Le scan complet s\'est terminé rapidement (pas de blocage)');
        } else if (duration < 120000) { // Moins de 2 minutes
            console.log('⚠️ Le scan complet a pris du temps mais s\'est terminé');
        } else {
            console.log('❌ Le scan complet a pris trop de temps (possible blocage)');
        }

        // Vérifier l'identification Mistral AI
        const identifiedDevices = devices.filter(device => device.manufacturerIdentified);
        console.log(`   - Appareils identifiés par Mistral AI: ${identifiedDevices.length}/${devices.length}`);

    } catch (error) {
        console.error('❌ Erreur lors du test du scan complet:', error.message);
    }
}

// Exécuter le test
testCompleteScan(); 