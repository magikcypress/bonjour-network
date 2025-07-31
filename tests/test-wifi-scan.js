#!/usr/bin/env node

const RealNoSudoWiFiScanner = require('../server/real-no-sudo-scanner');

async function testWifiScan() {
    console.log('🧪 Test du scan WiFi...\n');

    try {
        const scanner = new RealNoSudoWiFiScanner();
        console.log('🔍 Lancement du scan WiFi...\n');

        const networks = await scanner.scanNetworks();

        console.log(`✅ Scan terminé: ${networks.length} réseaux détectés\n`);

        if (networks.length > 0) {
            console.log('📋 Réseaux détectés:');
            networks.forEach((network, index) => {
                console.log(`${index + 1}. ${network.ssid}`);
                console.log(`   - BSSID: ${network.bssid || 'N/A'}`);
                console.log(`   - Canal: ${network.channel}`);
                console.log(`   - Sécurité: ${network.security}`);
                console.log(`   - Qualité: ${network.quality || network.signalStrength || 'N/A'}`);
                console.log('');
            });
        } else {
            console.log('❌ Aucun réseau détecté');
        }

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
    }
}

// Exécuter le test
testWifiScan(); 