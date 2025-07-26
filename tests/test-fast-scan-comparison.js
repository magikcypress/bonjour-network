const ImprovedDeviceScanner = require('../server/improved-device-scanner');

async function testFastScanComparison() {
    console.log('🔬 Comparaison scan rapide avant/après amélioration...\n');

    try {
        const scanner = new ImprovedDeviceScanner();

        // Test 1: Scan rapide avec mini-ping (nouveau)
        console.log('📡 Test 1: Scan rapide avec mini-ping sweep...');
        const startTime1 = Date.now();
        const devicesWithPing = await scanner.scanConnectedDevices('fast');
        const duration1 = Date.now() - startTime1;

        console.log(`✅ Terminé en ${duration1}ms - ${devicesWithPing.length} appareils`);

        // Test 2: Simulation de l'ancien scan (sans mini-ping)
        console.log('\n📡 Test 2: Simulation ancien scan (ARP + netstat + DNS uniquement)...');
        const startTime2 = Date.now();

        // Simuler l'ancien comportement en ne gardant que les sources ARP, netstat, DNS
        const oldStyleDevices = devicesWithPing.filter(device => {
            const sources = device.sources || [device.source];
            return sources.some(source => ['arp', 'netstat', 'dns'].includes(source));
        });

        const duration2 = Date.now() - startTime2;

        console.log(`✅ Terminé en ${duration2}ms - ${oldStyleDevices.length} appareils`);

        // Comparaison
        console.log('\n📊 Comparaison:');
        console.log(`   Nouveau scan (avec mini-ping): ${devicesWithPing.length} appareils`);
        console.log(`   Ancien scan (sans mini-ping):  ${oldStyleDevices.length} appareils`);

        const improvement = devicesWithPing.length - oldStyleDevices.length;
        if (improvement > 0) {
            console.log(`   ✅ Amélioration: +${improvement} appareils découverts`);
        } else if (improvement === 0) {
            console.log(`   ⚠️  Aucune amélioration (normal si réseau peu peuplé)`);
        } else {
            console.log(`   ❌ Régression: ${improvement} appareils (erreur de filtrage?)`);
        }

        // Détail des appareils découverts par mini-ping
        const pingDiscoveredDevices = devicesWithPing.filter(device => {
            const sources = device.sources || [device.source];
            return sources.includes('ping');
        });

        if (pingDiscoveredDevices.length > 0) {
            console.log(`\n🎯 Appareils découverts par mini-ping:`);
            pingDiscoveredDevices.forEach((device, index) => {
                console.log(`   ${index + 1}. ${device.ip} (${device.mac || 'N/A'})`);
            });
        }

        // Recommandations
        console.log('\n💡 Recommandations:');
        if (devicesWithPing.length > oldStyleDevices.length) {
            console.log('✅ Le mini-ping sweep améliore la détection');
        } else if (devicesWithPing.length === oldStyleDevices.length && devicesWithPing.length > 0) {
            console.log('✅ Le mini-ping sweep maintient la détection sans ralentir');
        } else {
            console.log('⚠️  Le mini-ping sweep n\'apporte pas d\'amélioration visible');
        }

    } catch (error) {
        console.error('❌ Erreur lors de la comparaison:', error.message);
    }
}

// Exécuter le test
testFastScanComparison(); 