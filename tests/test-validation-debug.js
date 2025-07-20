const puppeteer = require('puppeteer');

async function testValidationDebug() {
    console.log('🧪 Test de débogage de la validation...');

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

        // Injecter du code pour déboguer la validation
        const debugInfo = await page.evaluate(() => {
            // Récupérer les données de réseaux depuis le state React
            const debugData = {
                networks: [],
                validatedNetworks: [],
                invalidNetworks: [],
                validationLogs: []
            };

            // Essayer de récupérer les données depuis les composants React
            const networkElements = document.querySelectorAll('[class*="border-blue-500"]');
            const invalidElements = document.querySelectorAll('[class*="border-orange"]');

            debugData.validatedCount = networkElements.length;
            debugData.invalidCount = invalidElements.length;

            // Chercher les logs de validation dans la console
            console.log('🔍 Recherche des logs de validation...');

            // Essayer de récupérer les données depuis le localStorage ou sessionStorage
            try {
                const storedData = localStorage.getItem('wifi-networks') || sessionStorage.getItem('wifi-networks');
                if (storedData) {
                    debugData.storedData = JSON.parse(storedData);
                }
            } catch (e) {
                debugData.storedDataError = e.message;
            }

            return debugData;
        });

        console.log('📊 Données de débogage:', debugInfo);

        // Activer le mode automatique pour voir les changements
        console.log('🔄 Activation du mode automatique...');
        await page.evaluate(() => {
            const autoButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
                btn.textContent.includes('Automatique') ||
                btn.textContent.includes('Mode auto') ||
                btn.textContent.includes('Auto')
            );

            if (autoButtons.length > 0) {
                autoButtons[0].click();
                return 'Mode automatique activé';
            }

            return 'Aucun bouton automatique trouvé';
        });

        // Attendre et vérifier les changements
        console.log('⏳ Attente des scans automatiques...');

        for (let i = 1; i <= 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 8000));

            const scanDebug = await page.evaluate((scanNumber) => {
                const networkElements = document.querySelectorAll('[class*="border-blue-500"]');
                const invalidElements = document.querySelectorAll('[class*="border-orange"]');
                const invalidSection = document.querySelector('h2');
                const invalidSectionText = invalidSection ? invalidSection.textContent : null;

                // Chercher spécifiquement la section des réseaux non validés
                const allH2s = Array.from(document.querySelectorAll('h2'));
                const invalidSectionH2 = allH2s.find(h2 => h2.textContent.includes('non validés'));

                return {
                    scanNumber: scanNumber,
                    validatedCount: networkElements.length,
                    invalidCount: invalidElements.length,
                    hasInvalidSection: !!invalidSectionH2,
                    invalidSectionText: invalidSectionH2 ? invalidSectionH2.textContent : invalidSectionText,
                    allNetworkElements: document.querySelectorAll('[class*="border"]').length,
                    allH2s: allH2s.map(h2 => h2.textContent)
                };
            }, i);

            console.log(`📊 Scan ${i}:`, scanDebug);

            // Vérifier s'il y a des réseaux avec des données manquantes
            const networkDetails = await page.evaluate(() => {
                const networks = Array.from(document.querySelectorAll('[class*="border"]'));
                return networks.map(network => {
                    const text = network.textContent;
                    const hasSignal = text.includes('Force:') && !text.includes('Force: N/A');
                    const hasFrequency = text.includes('Fréquence:') && !text.includes('Fréquence: N/A');
                    const hasSecurity = text.includes('Sécurité:') && !text.includes('Sécurité: N/A');

                    return {
                        hasSignal,
                        hasFrequency,
                        hasSecurity,
                        text: text.substring(0, 100) + '...'
                    };
                });
            });

            console.log(`📋 Détails des réseaux (scan ${i}):`);
            networkDetails.forEach((detail, index) => {
                console.log(`   Réseau ${index + 1}: Signal=${detail.hasSignal}, Fréquence=${detail.hasFrequency}, Sécurité=${detail.hasSecurity}`);
            });
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await browser.close();
    }
}

testValidationDebug().catch(console.error); 