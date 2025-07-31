#!/usr/bin/env node

const axios = require('axios');
const io = require('socket.io-client');

async function testAPIOnly() {
    console.log('🧪 Test des API uniquement (sans navigateur)...\n');

    const baseURL = 'http://localhost:5001';
    const clientURL = 'http://localhost:3000';

    try {
        // ===== TEST 1: Vérification du serveur =====
        console.log('🔍 TEST 1: Vérification du serveur...');
        try {
            const healthResponse = await axios.get(`${baseURL}/api/health`);
            console.log('✅ Serveur en ligne:', healthResponse.status);
        } catch (error) {
            console.log('❌ Serveur hors ligne:', error.message);
            return;
        }

        // ===== TEST 2: Test des appareils =====
        console.log('\n📱 TEST 2: Test des appareils...');
        try {
            const devicesResponse = await axios.get(`${baseURL}/api/devices`);
            console.log(`✅ Appareils récupérés: ${devicesResponse.data.length} appareils`);

            if (devicesResponse.data.length > 0) {
                console.log('📋 Exemples d\'appareils:');
                devicesResponse.data.slice(0, 3).forEach((device, index) => {
                    console.log(`   ${index + 1}. ${device.ip} - ${device.deviceType || 'Unknown'}`);
                });
            }
        } catch (error) {
            console.log('❌ Erreur récupération appareils:', error.message);
        }

        // ===== TEST 3: Test des réseaux WiFi =====
        console.log('\n📶 TEST 3: Test des réseaux WiFi...');
        try {
            const networksResponse = await axios.get(`${baseURL}/api/wifi`);
            console.log(`✅ Réseaux WiFi récupérés: ${networksResponse.data.length} réseaux`);

            if (networksResponse.data.length > 0) {
                console.log('📋 Exemples de réseaux:');
                networksResponse.data.slice(0, 3).forEach((network, index) => {
                    console.log(`   ${index + 1}. ${network.ssid} - Canal ${network.channel}`);
                });
            }
        } catch (error) {
            console.log('❌ Erreur récupération réseaux:', error.message);
        }

        // ===== TEST 4: Test DNS & Services =====
        console.log('\n🌐 TEST 4: Test DNS & Services...');
        try {
            const dnsResponse = await axios.get(`${baseURL}/api/dns`);
            console.log(`✅ DNS récupérés: ${dnsResponse.data.resolved.length} résolus, ${dnsResponse.data.failed.length} échecs`);

            if (dnsResponse.data.resolved.length > 0) {
                console.log('📋 Exemples DNS résolus:');
                dnsResponse.data.resolved.slice(0, 3).forEach((dns, index) => {
                    console.log(`   ${index + 1}. ${dns.host} -> ${dns.ip}`);
                });
            }
        } catch (error) {
            console.log('❌ Erreur récupération DNS:', error.message);
        }

        // ===== TEST 5: Test WebSocket =====
        console.log('\n🔌 TEST 5: Test WebSocket...');
        try {
            const socket = io(baseURL);

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout WebSocket'));
                }, 5000);

                socket.on('connect', () => {
                    console.log('✅ WebSocket connecté');
                    clearTimeout(timeout);
                    resolve();
                });

                socket.on('connect_error', (error) => {
                    console.log('❌ Erreur connexion WebSocket:', error.message);
                    clearTimeout(timeout);
                    reject(error);
                });
            });

            socket.disconnect();
        } catch (error) {
            console.log('❌ Erreur WebSocket:', error.message);
        }

        // ===== TEST 6: Test scan en temps réel =====
        console.log('\n🔄 TEST 6: Test scan en temps réel...');
        try {
            const realtimeResponse = await axios.get(`${baseURL}/api/realtime/status`);
            console.log('✅ Statut scan temps réel:', realtimeResponse.data);
        } catch (error) {
            console.log('❌ Erreur statut scan temps réel:', error.message);
        }

        // ===== TEST 7: Test des statistiques =====
        console.log('\n📊 TEST 7: Test des statistiques...');
        try {
            const statsResponse = await axios.get(`${baseURL}/api/stats`);
            console.log('✅ Statistiques récupérées:', statsResponse.data);
        } catch (error) {
            console.log('❌ Erreur récupération statistiques:', error.message);
        }

        console.log('\n🎉 Tests API terminés !');

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Exécuter les tests
testAPIOnly(); 