const ImprovedDeviceScanner = require('../server/improved-device-scanner');

async function testImprovedFastScan() {
    console.log('🧪 Test du scan rapide amélioré...\n');

    try {
        const scanner = new ImprovedDeviceScanner();

        console.log('📡 Démarrage du scan rapide...');
        const startTime = Date.now();

        const devices = await scanner.scanConnectedDevices('fast');

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`\n✅ Scan rapide terminé en ${duration}ms`);
        console.log(`📊 Résultats:`);
        console.log(`   - Appareils détectés: ${devices.length}`);

        if (devices.length > 0) {
            console.log('\n📱 Appareils détectés:');
            devices.forEach((device, index) => {
                console.log(`   ${index + 1}. ${device.ip} (${device.mac || 'N/A'}) - ${device.hostname || 'Unknown'}`);
                if (device.sources) {
                    console.log(`      Sources: ${device.sources.join(', ')}`);
                }
            });
        } else {
            console.log('❌ Aucun appareil détecté');
        }

        // Comparaison avec l'ancien comportement
        console.log('\n🔍 Analyse:');
        if (devices.length > 1) {
            console.log('✅ Le scan rapide amélioré découvre plusieurs appareils');
        } else if (devices.length === 1) {
            console.log('⚠️  Un seul appareil détecté (peut être normal selon le réseau)');
        } else {
            console.log('❌ Aucun appareil détecté (vérifier la connectivité réseau)');
        }

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
    }
}

// Exécuter le test
testImprovedFastScan(); 