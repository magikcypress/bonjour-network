const puppeteer = require('puppeteer');

async function testServerData() {
    console.log('🧪 Test des données envoyées par le serveur...');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });

    try {
        const page = await browser.newPage();

        // Intercepter les messages WebSocket
        await page.setRequestInterception(true);

        const networkData = [];

        page.on('request', request => {
            request.continue();
        });

        page.on('response', response => {
            if (response.url().includes('socket.io')) {
                console.log('📡 WebSocket response détectée');
            }
        });

        // Écouter les messages WebSocket
        await page.evaluateOnNewDocument(() => {
            window.networkData = [];

            // Intercepter les messages WebSocket
            const originalEmit = window.io?.emit;
            if (window.io) {
                window.io.emit = function (event, data) {
                    if (event === 'networks-updated') {
                        console.log('📡 Données réseaux reçues:', data);
                        window.networkData.push(data);
                    }
                    return originalEmit.apply(this, arguments);
                };
            }
        });

        // Aller sur l'application
        console.log('🌐 Navigation...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Attendre que l'application se charge
        await page.waitForSelector('button', { timeout: 10000 });
        console.log('✅ Application chargée');

        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 3000));

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

        // Attendre et analyser les données
        console.log('⏳ Attente des données du serveur...');

        for (let i = 1; i <= 2; i++) {
            await new Promise(resolve => setTimeout(resolve, 8000));

            const serverData = await page.evaluate(() => {
                return window.networkData || [];
            });

            console.log(`📊 Scan ${i} - Données du serveur:`);
            if (serverData.length > 0) {
                const lastData = serverData[serverData.length - 1];
                console.log(`   Nombre de réseaux: ${lastData.length}`);

                if (lastData.length > 0) {
                    const sampleNetwork = lastData[0];
                    console.log(`   Exemple de réseau:`);
                    console.log(`     SSID: ${sampleNetwork.ssid}`);
                    console.log(`     BSSID: ${sampleNetwork.bssid}`);
                    console.log(`     SignalStrength: ${sampleNetwork.signalStrength}`);
                    console.log(`     Frequency: ${sampleNetwork.frequency}`);
                    console.log(`     Channel: ${sampleNetwork.channel}`);
                    console.log(`     Security: ${sampleNetwork.security}`);
                }
            } else {
                console.log('   Aucune donnée reçue');
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

testServerData().catch(console.error); 