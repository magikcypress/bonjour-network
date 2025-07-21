const puppeteer = require('puppeteer');

async function testWebSocketProgressSteps() {
    console.log('🧪 Test de vérification des étapes de progression WebSocket...');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    try {
        const page = await browser.newPage();

        // Capturer tous les logs de la console
        const consoleLogs = [];
        page.on('console', msg => {
            consoleLogs.push(msg.text());
            console.log('🌐 Console:', msg.text());
        });

        console.log('🌐 Navigation vers l\'application...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        await page.waitForSelector('.container', { timeout: 10000 });
        console.log('✅ Application chargée');

        // Aller sur la page Appareils
        console.log('📱 Navigation vers la page Appareils...');
        const devicesTab = await page.$('button[data-tab="devices"]');
        if (devicesTab) {
            await devicesTab.click();
            await page.waitForTimeout(3000); // Attendre le chargement et la connexion WebSocket
            console.log('✅ Page Appareils chargée');
        }

        // Attendre que la WebSocket se connecte
        console.log('🔌 Attente de la connexion WebSocket...');
        await page.waitForTimeout(2000);

        // Vérifier les logs de connexion WebSocket
        const websocketLogs = consoleLogs.filter(log =>
            log.includes('Socket.IO') ||
            log.includes('WebSocket') ||
            log.includes('🔌') ||
            log.includes('📡')
        );

        console.log('📊 Logs WebSocket trouvés:');
        websocketLogs.forEach(log => console.log(`   ${log}`));

        // Lancer un scan complet
        console.log('🔍 Lancement du scan complet...');
        const completeScanButton = await page.$('button:has-text("Scan Complet")');
        if (completeScanButton) {
            await completeScanButton.click();
            console.log('✅ Bouton Scan Complet cliqué');
        }

        // Observer les étapes de progression pendant 60 secondes
        console.log('⏳ Observation des étapes de progression (60 secondes)...');

        const progressSteps = [];
        const websocketEvents = [];

        for (let i = 0; i < 20; i++) { // 20 vérifications de 3 secondes = 60 secondes
            await page.waitForTimeout(3000);

            // Récupérer l'état actuel de la progression UI
            const currentProgress = await page.evaluate(() => {
                const progressContainer = document.querySelector('[div.bg-white.rounded-lg[class*="p-6"]]');
                const stepElement = document.querySelector('[div.flex.items-center]');
                const messageElement = document.querySelector('[span.text-sm]');
                const progressBar = document.querySelector('[div.w-full.bg-gray-200]');

                return {
                    step: stepElement ? stepElement.textContent : null,
                    message: messageElement ? messageElement.textContent : null,
                    progress: progressBar ? progressBar.style.width : null,
                    isActive: progressContainer ? true : false,
                    timestamp: new Date().toISOString()
                };
            });

            if (currentProgress.step) {
                progressSteps.push(currentProgress);
                console.log(`📊 UI - Étape: ${currentProgress.step}, Message: ${currentProgress.message}`);
            }

            // Vérifier les nouveaux logs WebSocket
            const newWebSocketLogs = consoleLogs.filter(log =>
                (log.includes('📡') || log.includes('scan-progress')) &&
                !websocketEvents.some(event => event.log === log)
            );

            newWebSocketLogs.forEach(log => {
                websocketEvents.push({ log, timestamp: new Date().toISOString() });
                console.log(`🔌 WebSocket: ${log}`);
            });
        }

        // Analyser la correspondance
        console.log('\n📋 ANALYSE DE LA CORRESPONDANCE:');
        console.log('='.repeat(50));

        console.log(`📊 Étapes UI détectées: ${progressSteps.length}`);
        progressSteps.forEach((step, index) => {
            console.log(`   ${index + 1}. ${step.step} - ${step.message}`);
        });

        console.log(`\n🔌 Événements WebSocket détectés: ${websocketEvents.length}`);
        websocketEvents.forEach((event, index) => {
            console.log(`   ${index + 1}. ${event.log}`);
        });

        // Vérifier la synchronisation
        console.log('\n🔍 VÉRIFICATION DE LA SYNCHRONISATION:');
        console.log('='.repeat(50));

        if (progressSteps.length > 0 && websocketEvents.length > 0) {
            console.log('✅ Des étapes UI et des événements WebSocket ont été détectés');

            // Vérifier si les étapes correspondent
            const hasCorrespondence = progressSteps.some(uiStep =>
                websocketEvents.some(wsEvent =>
                    wsEvent.log.includes(uiStep.step) ||
                    wsEvent.log.includes(uiStep.message)
                )
            );

            if (hasCorrespondence) {
                console.log('✅ Correspondance détectée entre UI et WebSocket');
            } else {
                console.log('⚠️ Aucune correspondance directe détectée');
            }
        } else {
            console.log('❌ Problème: Pas assez de données pour analyser');
        }

        // Vérifier l'état final
        console.log('\n📊 ÉTAT FINAL:');
        console.log('='.repeat(50));

        const finalState = await page.evaluate(() => {
            const isScanActive = document.querySelector('[div.bg-white.rounded-lg[class*="p-6"]]') !== null;
            const deviceCount = document.querySelectorAll('div.bg-white.rounded-lg.shadow-lg').length;
            const websocketConnected = window.socketService && window.socketService.isSocketConnected();

            return { isScanActive, deviceCount, websocketConnected };
        });

        console.log(`   Scan actif: ${finalState.isScanActive ? 'OUI' : 'NON'}`);
        console.log(`   Appareils détectés: ${finalState.deviceCount}`);
        console.log(`   WebSocket connectée: ${finalState.websocketConnected ? 'OUI' : 'NON'}`);

        console.log('\n✅ Test de vérification terminé');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await browser.close();
    }
}

// Exécuter le test
testWebSocketProgressSteps().catch(console.error); 