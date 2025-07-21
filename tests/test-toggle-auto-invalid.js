const puppeteer = require('puppeteer');

async function testToggleAutoInvalid() {
    console.log('🧪 Test spécifique du toggle automatique - réseaux non validés...');

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

        // Trouver le toggle switch
        console.log('🔍 Recherche du toggle switch...');
        const toggleSwitch = await page.evaluate(() => {
            // Chercher différents types de toggles
            const toggles = [
                ...document.querySelectorAll('button.bg-gradient-to-r'),
                ...document.querySelectorAll('button[role="switch"]'),
                ...document.querySelectorAll('.bg-gradient-to-r from-green-500 to-emerald-500'),
                ...document.querySelectorAll('button.bg-gradient-to-r'),
                ...document.querySelectorAll('[class*="toggle"]')
            ];

            return toggles.length > 0 ? toggles[0].outerHTML : 'Aucun toggle trouvé';
        });

        console.log('📊 Toggle switch trouvé:', toggleSwitch);

        // Vérifier l'état initial
        console.log('📊 État initial:');
        const initialState = await page.evaluate(() => {
            const validatedCount = document.querySelectorAll('[class*="border-blue-500"]').length;
            const invalidSection = document.querySelector('h2');
            const invalidCount = invalidSection && invalidSection.textContent.includes('non validés')
                ? invalidSection.textContent.match(/\((\d+)\)/)?.[1] || '0'
                : '0';

            return {
                validated: validatedCount,
                invalid: parseInt(invalidCount),
                hasInvalidSection: !!invalidSection
            };
        });

        console.log(`   Réseaux validés: ${initialState.validated}`);
        console.log(`   Réseaux non validés: ${initialState.invalid}`);

        // Activer le mode automatique en cliquant sur le toggle
        console.log('🔄 Activation du mode automatique...');

        // Essayer différentes méthodes pour activer le toggle
        const toggleActivated = await page.evaluate(() => {
            // Méthode 1: Chercher un bouton avec du texte lié à l'automatique
            const autoButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
                btn.textContent.includes('Automatique') ||
                btn.textContent.includes('Mode auto') ||
                btn.textContent.includes('Auto')
            );

            if (autoButtons.length > 0) {
                autoButtons[0].click();
                return 'Bouton automatique cliqué';
            }

            // Méthode 2: Chercher un toggle switch
            const toggles = document.querySelectorAll('button.bg-gradient-to-r, button[role="switch"], .bg-gradient-to-r from-green-500 to-emerald-500');
            if (toggles.length > 0) {
                toggles[0].click();
                return 'Toggle switch cliqué';
            }

            // Méthode 3: Chercher par classe
            const toggleByClass = document.querySelector('[class*="toggle"], [class*="switch"]');
            if (toggleByClass) {
                toggleByClass.click();
                return 'Toggle par classe cliqué';
            }

            return 'Aucun toggle trouvé';
        });

        console.log(`✅ ${toggleActivated}`);

        // Attendre et vérifier les changements
        console.log('⏳ Attente des scans automatiques...');

        for (let i = 1; i <= 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 8000));

            const scanState = await page.evaluate(() => {
                const validatedCount = document.querySelectorAll('[class*="border-blue-500"]').length;
                const invalidSection = document.querySelector('h2');
                const invalidCount = invalidSection && invalidSection.textContent.includes('non validés')
                    ? invalidSection.textContent.match(/\((\d+)\)/)?.[1] || '0'
                    : '0';

                return {
                    validated: validatedCount,
                    invalid: parseInt(invalidCount),
                    hasInvalidSection: !!invalidSection
                };
            });

            console.log(`📊 Scan ${i}:`);
            console.log(`   Réseaux validés: ${scanState.validated}`);
            console.log(`   Réseaux non validés: ${scanState.invalid}`);
            console.log(`   Section invalide: ${scanState.hasInvalidSection ? 'OUI' : 'NON'}`);

            if (scanState.hasInvalidSection && i >= 2) {
                console.log(`✅ CONFIRMÉ: Réseaux non validés apparus au scan ${i} !`);
            }
        }

        // Désactiver le mode automatique
        console.log('🔄 Désactivation du mode automatique...');
        await page.evaluate(() => {
            const autoButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
                btn.textContent.includes('Automatique') ||
                btn.textContent.includes('Mode auto') ||
                btn.textContent.includes('Auto')
            );

            if (autoButtons.length > 0) {
                autoButtons[0].click();
                return 'Mode automatique désactivé';
            }

            const toggles = document.querySelectorAll('button.bg-gradient-to-r, button[role="switch"], .bg-gradient-to-r from-green-500 to-emerald-500');
            if (toggles.length > 0) {
                toggles[0].click();
                return 'Toggle désactivé';
            }

            return 'Aucun toggle trouvé pour désactivation';
        });

        console.log('✅ Mode automatique désactivé');

        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await browser.close();
    }
}

testToggleAutoInvalid().catch(console.error); 