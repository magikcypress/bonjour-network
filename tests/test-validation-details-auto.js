const puppeteer = require('puppeteer');

async function testValidationDetailsAuto() {
    console.log('🧪 Test détaillé de la validation en mode automatique...');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });

    try {
        const page = await browser.newPage();

        // Aller sur l'application
        console.log('🌐 Navigation...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Attendre que l'application se charge
        await page.waitForSelector('button', { timeout: 10000 });
        console.log('✅ Application chargée');

        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Vérifier l'état initial
        console.log('📊 État initial (mode manuel):');
        const initialState = await page.evaluate(() => {
            const validatedCount = document.querySelectorAll('[class*="border-blue-500"]').length;
            const invalidCount = document.querySelectorAll('[class*="border-orange"]').length;

            return {
                validated: validatedCount,
                invalid: invalidCount,
                total: validatedCount + invalidCount
            };
        });

        console.log(`   Réseaux validés: ${initialState.validated}`);
        console.log(`   Réseaux non validés: ${initialState.invalid}`);
        console.log(`   Total: ${initialState.total}`);

        // Activer le mode automatique
        console.log('🔄 Activation du mode automatique...');
        await page.evaluate(() => {
            const toggleSwitches = Array.from(document.querySelectorAll('button')).filter(btn => {
                const classes = btn.className || '';
                return classes.includes('h-6') && classes.includes('w-11') && classes.includes('rounded-full');
            });

            if (toggleSwitches.length > 0) {
                toggleSwitches[0].click();
                return 'Toggle switch activé';
            }

            return 'Aucun toggle trouvé';
        });

        console.log('✅ Mode automatique activé');

        // Attendre et analyser les changements
        console.log('⏳ Attente des scans automatiques...');

        for (let i = 1; i <= 2; i++) {
            await new Promise(resolve => setTimeout(resolve, 8000));

            const scanState = await page.evaluate((scanNumber) => {
                const validatedCount = document.querySelectorAll('[class*="border-blue-500"]').length;
                const invalidCount = document.querySelectorAll('[class*="border-orange"]').length;

                // Analyser les réseaux non validés pour voir leurs données
                const invalidNetworks = Array.from(document.querySelectorAll('[class*="border-orange"]'));
                const invalidDetails = invalidNetworks.map(network => {
                    const text = network.textContent;
                    return {
                        hasSignal: text.includes('Force:') && !text.includes('Force: N/A'),
                        hasFrequency: text.includes('Fréquence:') && !text.includes('Fréquence: N/A'),
                        hasSecurity: text.includes('Sécurité:') && !text.includes('Sécurité: N/A'),
                        hasChannel: text.includes('Canal:') && !text.includes('Canal: N/A'),
                        text: text.substring(0, 150) + '...'
                    };
                });

                return {
                    scanNumber: scanNumber,
                    validated: validatedCount,
                    invalid: invalidCount,
                    total: validatedCount + invalidCount,
                    invalidDetails: invalidDetails.slice(0, 3) // Limiter à 3 pour éviter le spam
                };
            });

            console.log(`📊 Scan ${i} (automatique):`);
            console.log(`   Réseaux validés: ${scanState.validated}`);
            console.log(`   Réseaux non validés: ${scanState.invalid}`);
            console.log(`   Total: ${scanState.total}`);

            console.log(`📋 Détails des réseaux non validés (scan ${i}):`);
            scanState.invalidDetails.forEach((detail, index) => {
                console.log(`   Réseau ${index + 1}: Signal=${detail.hasSignal}, Fréquence=${detail.hasFrequency}, Sécurité=${detail.hasSecurity}, Canal=${detail.hasChannel}`);
                console.log(`   Texte: ${detail.text}`);
            });

            // Analyser les changements
            if (scanState.validated < initialState.validated) {
                console.log(`⚠️ PROBLÈME: Perte de ${initialState.validated - scanState.validated} réseaux validés !`);
                console.log(`   Raison probable: Données avec valeurs par défaut (N/A, 50, etc.)`);
            }
        }

        // Désactiver le mode automatique
        console.log('🔄 Désactivation du mode automatique...');
        await page.evaluate(() => {
            const toggleSwitches = Array.from(document.querySelectorAll('button')).filter(btn => {
                const classes = btn.className || '';
                return classes.includes('h-6') && classes.includes('w-11') && classes.includes('rounded-full');
            });

            if (toggleSwitches.length > 0) {
                toggleSwitches[0].click();
                return 'Toggle switch désactivé';
            }

            return 'Aucun toggle trouvé';
        });

        console.log('✅ Mode automatique désactivé');

        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await browser.close();
    }
}

testValidationDetailsAuto().catch(console.error); 