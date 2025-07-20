const puppeteer = require('puppeteer');

async function testAutoScanMissing() {
    console.log('🧪 Test du problème des réseaux non détectés avec scan automatique...');

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

        // Vérifier l'état initial (mode manuel)
        console.log('📊 État initial (mode manuel):');
        const initialState = await page.evaluate(() => {
            const validatedCount = document.querySelectorAll('[class*="border-blue-500"]').length;
            const invalidSection = document.querySelector('h2');
            const invalidCount = invalidSection && invalidSection.textContent.includes('non validés')
                ? invalidSection.textContent.match(/\((\d+)\)/)?.[1] || '0'
                : '0';

            // Compter tous les réseaux visibles
            const allNetworks = document.querySelectorAll('[class*="border"]');
            const totalVisible = allNetworks.length;

            return {
                validated: validatedCount,
                invalid: parseInt(invalidCount),
                totalVisible: totalVisible,
                hasInvalidSection: !!invalidSection
            };
        });

        console.log(`   Réseaux validés: ${initialState.validated}`);
        console.log(`   Réseaux non validés: ${initialState.invalid}`);
        console.log(`   Total visible: ${initialState.totalVisible}`);
        console.log(`   Section invalide: ${initialState.hasInvalidSection ? 'OUI' : 'NON'}`);

        // Chercher et activer le toggle switch "Scan automatique"
        console.log('🔍 Recherche du toggle switch "Scan automatique"...');
        const autoScanToggle = await page.evaluate(() => {
            // Chercher le toggle switch par sa structure spécifique
            const toggleSwitches = Array.from(document.querySelectorAll('button')).filter(btn => {
                const classes = btn.className || '';
                return classes.includes('h-6') && classes.includes('w-11') && classes.includes('rounded-full');
            });

            if (toggleSwitches.length > 0) {
                return {
                    found: true,
                    count: toggleSwitches.length,
                    html: toggleSwitches[0].outerHTML
                };
            }

            // Chercher par texte
            const textButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
                btn.textContent.includes('Automatique') ||
                btn.textContent.includes('Mode auto') ||
                btn.textContent.includes('Auto') ||
                btn.textContent.includes('Scan automatique')
            );

            if (textButtons.length > 0) {
                return {
                    found: true,
                    count: textButtons.length,
                    html: textButtons[0].outerHTML
                };
            }

            return {
                found: false,
                allButtons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent)
            };
        });

        console.log('📋 Toggle switch trouvé:', autoScanToggle);

        if (autoScanToggle.found) {
            console.log('🔄 Activation du scan automatique...');

            // Activer le mode automatique en cliquant sur le toggle switch
            await page.evaluate(() => {
                // Chercher le toggle switch par sa structure spécifique
                const toggleSwitches = Array.from(document.querySelectorAll('button')).filter(btn => {
                    const classes = btn.className || '';
                    return classes.includes('h-6') && classes.includes('w-11') && classes.includes('rounded-full');
                });

                if (toggleSwitches.length > 0) {
                    toggleSwitches[0].click();
                    return 'Toggle switch cliqué';
                }

                // Fallback: chercher par texte
                const textButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
                    btn.textContent.includes('Automatique') ||
                    btn.textContent.includes('Mode auto') ||
                    btn.textContent.includes('Auto') ||
                    btn.textContent.includes('Scan automatique')
                );

                if (textButtons.length > 0) {
                    textButtons[0].click();
                    return 'Bouton texte cliqué';
                }

                return 'Aucun toggle trouvé';
            });

            console.log('✅ Scan automatique activé');

            // Attendre et vérifier les changements
            console.log('⏳ Attente des scans automatiques...');

            for (let i = 1; i <= 3; i++) {
                await new Promise(resolve => setTimeout(resolve, 8000));

                const scanState = await page.evaluate((scanNumber) => {
                    const validatedCount = document.querySelectorAll('[class*="border-blue-500"]').length;
                    const invalidSection = document.querySelector('h2');
                    const invalidCount = invalidSection && invalidSection.textContent.includes('non validés')
                        ? invalidSection.textContent.match(/\((\d+)\)/)?.[1] || '0'
                        : '0';

                    const allNetworks = document.querySelectorAll('[class*="border"]');
                    const totalVisible = allNetworks.length;

                    return {
                        scanNumber: scanNumber,
                        validated: validatedCount,
                        invalid: parseInt(invalidCount),
                        totalVisible: totalVisible,
                        hasInvalidSection: !!invalidSection
                    };
                }, i);

                console.log(`📊 Scan ${i} (automatique):`);
                console.log(`   Réseaux validés: ${scanState.validated}`);
                console.log(`   Réseaux non validés: ${scanState.invalid}`);
                console.log(`   Total visible: ${scanState.totalVisible}`);
                console.log(`   Section invalide: ${scanState.hasInvalidSection ? 'OUI' : 'NON'}`);

                // Vérifier s'il y a une perte de réseaux
                if (i === 1 && scanState.totalVisible < initialState.totalVisible) {
                    console.log(`⚠️ PROBLÈME DÉTECTÉ: Perte de ${initialState.totalVisible - scanState.totalVisible} réseaux !`);
                }

                if (scanState.validated < initialState.validated) {
                    console.log(`⚠️ PROBLÈME DÉTECTÉ: Perte de ${initialState.validated - scanState.validated} réseaux validés !`);
                }
            }

            // Désactiver le mode automatique
            console.log('🔄 Désactivation du scan automatique...');
            await page.evaluate(() => {
                // Chercher le toggle switch par sa structure spécifique
                const toggleSwitches = Array.from(document.querySelectorAll('button')).filter(btn => {
                    const classes = btn.className || '';
                    return classes.includes('h-6') && classes.includes('w-11') && classes.includes('rounded-full');
                });

                if (toggleSwitches.length > 0) {
                    toggleSwitches[0].click();
                    return 'Toggle switch désactivé';
                }

                // Fallback: chercher par texte
                const textButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
                    btn.textContent.includes('Automatique') ||
                    btn.textContent.includes('Mode auto') ||
                    btn.textContent.includes('Auto') ||
                    btn.textContent.includes('Scan automatique')
                );

                if (textButtons.length > 0) {
                    textButtons[0].click();
                    return 'Bouton texte désactivé';
                }

                return 'Aucun toggle trouvé pour désactivation';
            });

            console.log('✅ Scan automatique désactivé');

            // Vérifier l'état après désactivation
            await new Promise(resolve => setTimeout(resolve, 3000));

            const finalState = await page.evaluate(() => {
                const validatedCount = document.querySelectorAll('[class*="border-blue-500"]').length;
                const invalidSection = document.querySelector('h2');
                const invalidCount = invalidSection && invalidSection.textContent.includes('non validés')
                    ? invalidSection.textContent.match(/\((\d+)\)/)?.[1] || '0'
                    : '0';

                const allNetworks = document.querySelectorAll('[class*="border"]');
                const totalVisible = allNetworks.length;

                return {
                    validated: validatedCount,
                    invalid: parseInt(invalidCount),
                    totalVisible: totalVisible,
                    hasInvalidSection: !!invalidSection
                };
            });

            console.log('📊 État final (après désactivation):');
            console.log(`   Réseaux validés: ${finalState.validated}`);
            console.log(`   Réseaux non validés: ${finalState.invalid}`);
            console.log(`   Total visible: ${finalState.totalVisible}`);
            console.log(`   Section invalide: ${finalState.hasInvalidSection ? 'OUI' : 'NON'}`);

            // Résumé des changements
            console.log('📈 Résumé des changements:');
            console.log(`   Initial - Validés: ${initialState.validated}, Total: ${initialState.totalVisible}`);
            console.log(`   Final - Validés: ${finalState.validated}, Total: ${finalState.totalVisible}`);

            if (finalState.validated < initialState.validated) {
                console.log(`❌ PROBLÈME CONFIRMÉ: Perte de ${initialState.validated - finalState.validated} réseaux validés !`);
            } else if (finalState.totalVisible < initialState.totalVisible) {
                console.log(`❌ PROBLÈME CONFIRMÉ: Perte de ${initialState.totalVisible - finalState.totalVisible} réseaux au total !`);
            } else {
                console.log('✅ Aucune perte de réseaux détectée');
            }

        } else {
            console.log('❌ Toggle switch "Scan automatique" non trouvé');
            console.log('Boutons disponibles:', autoScanToggle.allButtons);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await browser.close();
    }
}

testAutoScanMissing().catch(console.error); 