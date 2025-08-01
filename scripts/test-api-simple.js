#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testAPISimple() {
    console.log('🧪 Test API simple...\n');

    const baseURL = 'http://localhost:5001';
    const clientURL = 'http://localhost:3000';

    try {
        // Test du serveur backend
        console.log('🔍 Test du serveur backend...');
        try {
            const { stdout: healthResponse } = await execAsync(`curl -s -f ${baseURL}/api/health`, { timeout: 5000 });
            console.log('✅ Serveur backend accessible');

            // Test des endpoints API
            const apiEndpoints = [
                { name: 'API Health', url: '/api/health' },
                { name: 'API Devices', url: '/api/devices' },
                { name: 'API WiFi', url: '/api/wifi' },
                { name: 'API DNS', url: '/api/dns' },
                { name: 'API Stats', url: '/api/stats' }
            ];

            for (const endpoint of apiEndpoints) {
                try {
                    const { stdout } = await execAsync(`curl -s -f ${baseURL}${endpoint.url}`, { timeout: 5000 });
                    if (stdout) {
                        console.log(`   ✅ ${endpoint.name}`);
                    } else {
                        console.log(`   ❌ ${endpoint.name}`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${endpoint.name}: ${error.message}`);
                }
            }
        } catch (error) {
            console.log('❌ Serveur backend inaccessible:', error.message);
        }

        // Test du client frontend
        console.log('\n🌐 Test du client frontend...');
        try {
            const { stdout: frontendResponse } = await execAsync(`curl -s -f ${clientURL}`, { timeout: 10000 });

            if (frontendResponse) {
                console.log('✅ Frontend accessible');

                // Vérifications basiques du HTML
                const html = frontendResponse;
                const checks = [
                    { name: 'Balise title', found: html.includes('<title>') },
                    { name: 'Balise main', found: html.includes('<main') },
                    { name: 'Balise nav', found: html.includes('<nav') },
                    { name: 'Attribut lang', found: html.includes('lang=') },
                    { name: 'Classes Tailwind', found: html.includes('class=') },
                    { name: 'Mode sombre', found: html.includes('dark:') }
                ];

                console.log('📋 Vérifications HTML:');
                checks.forEach(check => {
                    if (check.found) {
                        console.log(`   ✅ ${check.name}`);
                    } else {
                        console.log(`   ❌ ${check.name} manquant`);
                    }
                });
            } else {
                console.log('❌ Frontend inaccessible');
            }
        } catch (error) {
            console.log('❌ Erreur frontend:', error.message);
        }

        // Test des pages spécifiques
        console.log('\n📄 Test des pages spécifiques...');
        const pages = [
            { name: 'Page d\'accueil', url: '/' },
            { name: 'Page Appareils', url: '/appareils' },
            { name: 'Page Réseaux', url: '/reseaux' },
            { name: 'Page DNS & Services', url: '/dns' }
        ];

        for (const page of pages) {
            try {
                const { stdout } = await execAsync(`curl -s -f "${clientURL}${page.url}"`, { timeout: 5000 });
                if (stdout) {
                    console.log(`   ✅ ${page.name}`);
                } else {
                    console.log(`   ❌ ${page.name}`);
                }
            } catch (error) {
                console.log(`   ❌ ${page.name}: ${error.message}`);
            }
        }

        // Test de performance
        console.log('\n⚡ Test de performance...');
        try {
            const startTime = Date.now();
            await execAsync(`curl -s -f ${baseURL}/api/health`, { timeout: 5000 });
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            console.log(`Temps de réponse API: ${responseTime}ms`);

            if (responseTime < 5000) {
                console.log('✅ Performance acceptable');
            } else {
                console.log('⚠️ Temps de réponse élevé');
            }
        } catch (error) {
            console.log('❌ Test de performance échoué:', error.message);
        }

        // Test des ports
        console.log('\n🔌 Test des ports...');
        try {
            const { stdout: ports } = await execAsync('netstat -tlnp 2>/dev/null | grep -E ":(3000|5001)" || echo "Ports non trouvés"');
            console.log(`📋 Ports actifs:\n${ports}`);
        } catch (error) {
            console.log(`⚠️ Impossible de vérifier les ports: ${error.message}`);
        }

        console.log('\n🎉 Tests API simples terminés !');

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
        process.exit(1);
    }
}

// Gestion des erreurs
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Erreur non gérée:', reason);
    process.exit(1);
});

// Exécuter les tests
testAPISimple(); 