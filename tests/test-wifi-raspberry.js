#!/usr/bin/env node

const RealNoSudoWiFiScanner = require('../server/real-no-sudo-scanner');
const OSDetector = require('../server/utils/os-detector');

async function testWifiScan() {
    console.log('🧪 Test du scan WiFi sur Raspberry Pi...\n');

    try {
        // Détecter l'OS
        const osDetector = new OSDetector();
        const osInfo = await osDetector.detectOS();
        console.log(`🖥️ Système détecté: ${osInfo.os} (${osInfo.platform})`);
        console.log(`📱 isMacOS: ${osInfo.isMacOS}`);
        console.log(`🐧 isLinux: ${osInfo.isLinux}`);
        console.log(`🍓 isRaspberryPi: ${osInfo.isRaspberryPi}\n`);

        // Tester le scan WiFi
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
        console.error(error.stack);
    }
}

// Exécuter le test
testWifiScan(); 