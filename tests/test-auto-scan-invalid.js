const puppeteer = require('puppeteer');

async function testAutoScanInvalid() {
    console.log('🧪 Test du mode automatique - réseaux non validés au 2ème scan...');

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

        // Attendre un peu pour que les données initiales se chargent
        await new Promise(resolve => setTimeout(resolve, 3000));

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
        console.log(`   Section invalide présente: ${initialState.hasInvalidSection}`);

        // Activer le mode automatique
        console.log('🔄 Activation du mode automatique...');
        const toggleButtons = await page.$$('button');
        let toggleFound = false;

        for (const button of toggleButtons) {
            const text = await button.evaluate(el => el.textContent);
            if (text.includes('Automatique') || text.includes('Mode auto')) {
                await button.click();
                console.log('✅ Mode automatique activé');
                toggleFound = true;
                break;
            }
        }

        if (!toggleFound) {
            console.log('⚠️ Bouton mode automatique non trouvé, recherche alternative...');
            // Chercher par classe ou attribut
            const autoToggle = await page.$('[button.bg-gradient-to-r], .bg-gradient-to-r from-green-500 to-emerald-500, button.bg-gradient-to-r');
            if (autoToggle) {
                await autoToggle.click();
                console.log('✅ Mode automatique activé (méthode alternative)');
            }
        }

        // Attendre le premier scan automatique
        console.log('⏳ Attente du premier scan automatique...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Vérifier après le premier scan
        console.log('📊 Après premier scan automatique:');
        const firstScanState = await page.evaluate(() => {
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

        console.log(`   Réseaux validés: ${firstScanState.validated}`);
        console.log(`   Réseaux non validés: ${firstScanState.invalid}`);
        console.log(`   Section invalide présente: ${firstScanState.hasInvalidSection}`);

        // Attendre le deuxième scan automatique
        console.log('⏳ Attente du deuxième scan automatique...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Vérifier après le deuxième scan
        console.log('📊 Après deuxième scan automatique:');
        const secondScanState = await page.evaluate(() => {
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

        console.log(`   Réseaux validés: ${secondScanState.validated}`);
        console.log(`   Réseaux non validés: ${secondScanState.invalid}`);
        console.log(`   Section invalide présente: ${secondScanState.hasInvalidSection}`);

        // Analyser les changements
        console.log('📈 Analyse des changements:');
        console.log(`   Premier scan - Validés: ${firstScanState.validated}, Non validés: ${firstScanState.invalid}`);
        console.log(`   Deuxième scan - Validés: ${secondScanState.validated}, Non validés: ${secondScanState.invalid}`);

        if (secondScanState.invalid > firstScanState.invalid) {
            console.log('✅ CONFIRMÉ: Plus de réseaux non validés au 2ème scan !');
        } else if (secondScanState.hasInvalidSection && !firstScanState.hasInvalidSection) {
            console.log('✅ CONFIRMÉ: Section non validés apparue au 2ème scan !');
        } else {
            console.log('ℹ️ Aucun changement détecté dans les réseaux non validés');
        }

        // Désactiver le mode automatique
        console.log('🔄 Désactivation du mode automatique...');
        for (const button of toggleButtons) {
            const text = await button.evaluate(el => el.textContent);
            if (text.includes('Automatique') || text.includes('Mode auto')) {
                await button.click();
                console.log('✅ Mode automatique désactivé');
                break;
            }
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await browser.close();
    }
}

testAutoScanInvalid().catch(console.error); 