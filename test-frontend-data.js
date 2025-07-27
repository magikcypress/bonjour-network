const axios = require('axios');

async function testFrontendData() {
    try {
        console.log('🧪 Test des données frontend...');

        // Simuler ce que fait le frontend
        const response = await axios.get('http://localhost:5001/api/devices/test');
        const devices = response.data;

        console.log('📊 Données reçues:', devices.length, 'appareils');

        if (devices.length > 0) {
            const firstDevice = devices[0];
            console.log('📱 Premier appareil:');
            console.log('  - IP:', firstDevice.ip);
            console.log('  - Fabricant:', firstDevice.manufacturer);
            console.log('  - Type:', firstDevice.deviceType);
            console.log('  - Hostname:', firstDevice.hostname);

            // Vérifier si les données sont correctes pour l'affichage
            const manufacturer = firstDevice.manufacturer || 'Fabricant inconnu';
            const deviceType = firstDevice.deviceType || 'Inconnu';

            console.log('\n🎯 Données pour l\'affichage:');
            console.log('  - Fabricant affiché:', manufacturer);
            console.log('  - Type affiché:', deviceType);

            if (manufacturer !== 'Fabricant inconnu' && deviceType !== 'Inconnu') {
                console.log('✅ SUCCÈS: Les données sont correctes pour l\'affichage');
            } else {
                console.log('❌ ÉCHEC: Les données ne sont pas correctes');
            }
        }

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
    }
}

testFrontendData(); 