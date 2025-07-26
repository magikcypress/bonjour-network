const ImprovedDeviceScanner = require('../server/improved-device-scanner');

async function testScanSynchronization() {
    console.log('🔬 Test de synchronisation scan frontend/backend...\n');

    try {
        const scanner = new ImprovedDeviceScanner();

        console.log('📡 Démarrage du scan rapide avec synchronisation...');
        const startTime = Date.now();

        // Simuler les étapes comme le frontend les recevrait
        const expectedSteps = ['arp', 'netstat', 'dns', 'quick-ping'];
        const receivedSteps = [];

        // Intercepter les émissions de progression
        const originalEmitProgress = scanner.emitProgress.bind(scanner);
        scanner.emitProgress = function (step, status, message, data, command) {
            console.log(`📡 [${step}] ${status}: ${message}`);
            receivedSteps.push(step);
            originalEmitProgress(step, status, message, data, command);
        };

        const devices = await scanner.scanConnectedDevices('fast');

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`\n✅ Scan terminé en ${duration}ms`);
        console.log(`📊 Résultats:`);
        console.log(`   - Appareils détectés: ${devices.length}`);
        console.log(`   - Étapes attendues: ${expectedSteps.join(', ')}`);
        console.log(`   - Étapes reçues: ${receivedSteps.join(', ')}`);

        // Vérifier la synchronisation
        const missingSteps = expectedSteps.filter(step => !receivedSteps.includes(step));
        const extraSteps = receivedSteps.filter(step => !expectedSteps.includes(step));

        if (missingSteps.length === 0 && extraSteps.length === 0) {
            console.log('✅ Synchronisation parfaite entre frontend et backend');
        } else {
            if (missingSteps.length > 0) {
                console.log(`❌ Étapes manquantes: ${missingSteps.join(', ')}`);
            }
            if (extraSteps.length > 0) {
                console.log(`⚠️ Étapes supplémentaires: ${extraSteps.join(', ')}`);
            }
        }

        // Vérifier l'ordre des étapes
        let orderCorrect = true;
        for (let i = 0; i < Math.min(expectedSteps.length, receivedSteps.length); i++) {
            if (expectedSteps[i] !== receivedSteps[i]) {
                console.log(`❌ Ordre incorrect à l'index ${i}: attendu ${expectedSteps[i]}, reçu ${receivedSteps[i]}`);
                orderCorrect = false;
            }
        }

        if (orderCorrect) {
            console.log('✅ Ordre des étapes correct');
        }

    } catch (error) {
        console.error('❌ Erreur lors du test de synchronisation:', error.message);
    }
}

// Exécuter le test
testScanSynchronization(); 