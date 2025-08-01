#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testAccessibilitySystem() {
    console.log('🧪 Test d\'accessibilité avec outils système...\n');

    const baseURL = 'http://localhost:3000';
    const urls = [
        { name: 'Page d\'accueil', url: '/' },
        { name: 'Page Appareils', url: '/appareils' },
        { name: 'Page Réseaux', url: '/reseaux' },
        { name: 'Page DNS & Services', url: '/dns' }
    ];

    let hasErrors = false;

    for (const page of urls) {
        try {
            console.log(`📋 Test de ${page.name}...`);

            // Test de connectivité avec curl
            const fullUrl = `${baseURL}${page.url}`;
            const { stdout: html } = await execAsync(`curl -s -f "${fullUrl}"`, { timeout: 10000 });

            if (!html) {
                console.log(`❌ ${page.name}: Pas de réponse`);
                hasErrors = true;
                continue;
            }

            console.log(`✅ ${page.name}: Accessible`);

            // Vérifications basiques avec grep
            const checks = [
                { name: 'Balise title', pattern: '<title>', found: html.includes('<title>') },
                { name: 'Balise main', pattern: '<main', found: html.includes('<main') },
                { name: 'Balise nav', pattern: '<nav', found: html.includes('<nav') },
                { name: 'Attribut lang', pattern: 'lang=', found: html.includes('lang=') },
                { name: 'Classes Tailwind', pattern: 'class=', found: html.includes('class=') },
                { name: 'Mode sombre', pattern: 'dark:', found: html.includes('dark:') },
                { name: 'Structure HTML', pattern: '<html', found: html.includes('<html') },
                { name: 'Meta viewport', pattern: 'viewport', found: html.includes('viewport') }
            ];

            console.log(`   📋 Vérifications HTML:`);
            checks.forEach(check => {
                if (check.found) {
                    console.log(`      ✅ ${check.name}`);
                } else {
                    console.log(`      ❌ ${check.name} manquant`);
                    hasErrors = true;
                }
            });

            // Vérifications spécifiques à l'accessibilité
            const a11yChecks = [
                { name: 'Contraste (classes dark)', pattern: 'dark:', found: html.includes('dark:') },
                { name: 'Responsive (classes sm/md/lg)', pattern: 'sm:|md:|lg:', found: /sm:|md:|lg:/.test(html) },
                { name: 'Focus visible', pattern: 'focus-visible', found: html.includes('focus-visible') },
                { name: 'Aria labels', pattern: 'aria-label', found: html.includes('aria-label') },
                { name: 'Alt text', pattern: 'alt=', found: html.includes('alt=') }
            ];

            console.log(`   🎯 Vérifications d'accessibilité:`);
            a11yChecks.forEach(check => {
                if (check.found) {
                    console.log(`      ✅ ${check.name}`);
                } else {
                    console.log(`      ⚠️  ${check.name} (optionnel)`);
                }
            });

        } catch (error) {
            console.log(`❌ ${page.name}: ${error.message}`);
            hasErrors = true;
        }
    }

    // Test du serveur backend
    try {
        console.log('\n🔍 Test du serveur backend...');
        const { stdout: healthResponse } = await execAsync('curl -s -f http://localhost:5001/api/health', { timeout: 5000 });

        if (healthResponse) {
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
                    const { stdout } = await execAsync(`curl -s -f http://localhost:5001${endpoint.url}`, { timeout: 5000 });
                    if (stdout) {
                        console.log(`   ✅ ${endpoint.name}`);
                    } else {
                        console.log(`   ❌ ${endpoint.name}`);
                        hasErrors = true;
                    }
                } catch (error) {
                    console.log(`   ❌ ${endpoint.name}: ${error.message}`);
                    hasErrors = true;
                }
            }
        } else {
            console.log('❌ Serveur backend inaccessible');
            hasErrors = true;
        }
    } catch (error) {
        console.log(`❌ Erreur serveur backend: ${error.message}`);
        hasErrors = true;
    }

    // Test des ports
    try {
        console.log('\n🔌 Test des ports...');
        const { stdout: ports } = await execAsync('netstat -tlnp 2>/dev/null | grep -E ":(3000|5001)" || echo "Ports non trouvés"');
        console.log(`📋 Ports actifs:\n${ports}`);
    } catch (error) {
        console.log(`⚠️ Impossible de vérifier les ports: ${error.message}`);
    }

    // Résumé
    console.log('\n📊 Résumé des tests:');
    if (hasErrors) {
        console.log('❌ Des problèmes ont été trouvés');
        process.exit(1);
    } else {
        console.log('✅ Tous les tests d\'accessibilité sont passés !');
        process.exit(0);
    }
}

// Gestion des erreurs
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Erreur non gérée:', reason);
    process.exit(1);
});

// Exécuter les tests
testAccessibilitySystem(); 