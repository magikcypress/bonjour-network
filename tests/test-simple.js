#!/usr/bin/env node

const axios = require('axios');

async function testSimple() {
    console.log('🧪 Test simple de l\'application...\n');

    const baseURL = 'http://localhost:5001';

    try {
        // ===== TEST 1: Vérification du serveur =====
        console.log('🔍 TEST 1: Vérification du serveur...');
        try {
            const healthResponse = await axios.get(`${baseURL}/api/health`, { timeout: 5000 });
            console.log('✅ Serveur en ligne:', healthResponse.status);
        } catch (error) {
            console.log('❌ Serveur hors ligne:', error.message);
            console.log('💡 Assurez-vous que le serveur est démarré avec: npm start');
            return;
        }

        // ===== TEST 2: Test des appareils =====
        console.log('\n📱 TEST 2: Test des appareils...');
        try {
            const devicesResponse = await axios.get(`${baseURL}/api/devices`, { timeout: 10000 });
            console.log(`✅ Appareils récupérés: ${devicesResponse.data.length} appareils`);

            if (devicesResponse.data.length > 0) {
                console.log('📋 Exemples d\'appareils:');
                devicesResponse.data.slice(0, 3).forEach((device, index) => {
                    console.log(`   ${index + 1}. ${device.ip} - ${device.deviceType || 'Unknown'} - ${device.manufacturer || 'Unknown'}`);
                });
            } else {
                console.log('⚠️ Aucun appareil détecté');
            }
        } catch (error) {
            console.log('❌ Erreur récupération appareils:', error.message);
        }

        // ===== TEST 3: Test des réseaux WiFi =====
        console.log('\n📶 TEST 3: Test des réseaux WiFi...');
        try {
            const networksResponse = await axios.get(`${baseURL}/api/wifi`, { timeout: 10000 });
            console.log(`✅ Réseaux WiFi récupérés: ${networksResponse.data.length} réseaux`);

            if (networksResponse.data.length > 0) {
                console.log('📋 Exemples de réseaux:');
                networksResponse.data.slice(0, 3).forEach((network, index) => {
                    console.log(`   ${index + 1}. ${network.ssid} - Canal ${network.channel} - ${network.security}`);
                });
            } else {
                console.log('⚠️ Aucun réseau WiFi détecté');
            }
        } catch (error) {
            console.log('❌ Erreur récupération réseaux:', error.message);
        }

        // ===== TEST 4: Test DNS & Services =====
        console.log('\n🌐 TEST 4: Test DNS & Services...');
        try {
            const dnsResponse = await axios.get(`${baseURL}/api/dns`, { timeout: 15000 });
            console.log(`✅ DNS récupérés: ${dnsResponse.data.resolved.length} résolus, ${dnsResponse.data.failed.length} échecs`);

            if (dnsResponse.data.resolved.length > 0) {
                console.log('📋 Exemples DNS résolus:');
                dnsResponse.data.resolved.slice(0, 3).forEach((dns, index) => {
                    console.log(`   ${index + 1}. ${dns.host} -> ${dns.ip} (${dns.type})`);
                });
            }

            if (dnsResponse.data.failed.length > 0) {
                console.log('📋 Exemples DNS échoués:');
                dnsResponse.data.failed.slice(0, 3).forEach((dns, index) => {
                    console.log(`   ${index + 1}. ${dns.host} - ${dns.error}`);
                });
            }
        } catch (error) {
            console.log('❌ Erreur récupération DNS:', error.message);
        }

        // ===== TEST 5: Test scan en temps réel =====
        console.log('\n🔄 TEST 5: Test scan en temps réel...');
        try {
            const realtimeResponse = await axios.get(`${baseURL}/api/realtime/status`, { timeout: 5000 });
            console.log('✅ Statut scan temps réel:', realtimeResponse.data);
        } catch (error) {
            console.log('❌ Erreur statut scan temps réel:', error.message);
        }

        // ===== TEST 6: Test des statistiques =====
        console.log('\n📊 TEST 6: Test des statistiques...');
        try {
            const statsResponse = await axios.get(`${baseURL}/api/stats`, { timeout: 5000 });
            console.log('✅ Statistiques récupérées:', statsResponse.data);
        } catch (error) {
            console.log('❌ Erreur récupération statistiques:', error.message);
        }

        console.log('\n🎉 Tests simples terminés !');
        console.log('\n💡 Pour tester l\'interface web, ouvrez: http://localhost:3000');

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Exécuter les tests
testSimple(); 