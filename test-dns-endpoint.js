const axios = require('axios');

async function testDnsEndpoint() {
    try {
        console.log('🧪 Test de l\'endpoint DNS & Services...');

        const response = await axios.get('http://localhost:5001/api/dns-services', {
            timeout: 70000 // 70 secondes de timeout
        });

        console.log('✅ Endpoint DNS & Services fonctionne !');
        console.log('📊 Données reçues:');
        console.log('- Hôtes DNS:', response.data.dnsData?.hosts?.length || 0);
        console.log('- Services:', response.data.servicesData?.services?.length || 0);
        console.log('- Ports:', response.data.portsData?.ports?.length || 0);
        console.log('- Historique:', response.data.historyData?.cache?.length || 0);

        // Afficher quelques exemples
        if (response.data.dnsData?.hosts?.length > 0) {
            console.log('\n🔍 Exemples d\'hôtes DNS:');
            response.data.dnsData.hosts.slice(0, 3).forEach(host => {
                console.log(`  - ${host.name} -> ${host.ip} (${host.resolved ? 'Résolu' : 'Échec'})`);
            });
        }

        if (response.data.servicesData?.services?.length > 0) {
            console.log('\n🔧 Exemples de services:');
            response.data.servicesData.services.slice(0, 3).forEach(service => {
                console.log(`  - ${service.name} sur ${service.host}:${service.port} (${service.status})`);
            });
        }

        if (response.data.portsData?.ports?.length > 0) {
            console.log('\n🚪 Exemples de ports:');
            response.data.portsData.ports.slice(0, 3).forEach(port => {
                console.log(`  - Port ${port.port} (${port.service}) sur ${port.host} (${port.status})`);
            });
        }

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📄 Données:', error.response.data);
        }
    }
}

// Attendre un peu que le serveur démarre
setTimeout(testDnsEndpoint, 3000); 