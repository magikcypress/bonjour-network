const puppeteer = require('puppeteer');

async function testFrontendWebSocket() {
    console.log('🧪 Test du frontend WebSocket...');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });

    try {
        const page = await browser.newPage();

        // Écouter les logs de la console
        page.on('console', msg => {
            if (msg.text().includes('WebSocket') || msg.text().includes('Socket') || msg.text().includes('scan')) {
                console.log('📱 Frontend:', msg.text());
            }
        });

        // Aller sur l'application
        console.log('🌐 Navigation...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Attendre que l'application se charge
        await page.waitForSelector('button', { timeout: 10000 });
        console.log('✅ Application chargée');

        // Attendre un peu pour que les WebSockets se connectent
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Chercher le toggle switch
        console.log('🔍 Recherche du toggle switch...');
        const toggleSwitch = await page.$('button[class*="inline-flex h-6 w-11"]');

        if (toggleSwitch) {
            console.log('✅ Toggle switch trouvé');

            // Cliquer sur le toggle switch
            console.log('🔄 Clic sur le toggle switch...');
            await toggleSwitch.click();
            console.log('✅ Toggle switch cliqué');

            // Attendre pour voir les logs
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Cliquer à nouveau pour désactiver
            console.log('🔄 Second clic sur le toggle switch...');
            await toggleSwitch.click();
            console.log('✅ Toggle switch cliqué à nouveau');

            await new Promise(resolve => setTimeout(resolve, 3000));

        } else {
            console.log('❌ Toggle switch non trouvé');
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await browser.close();
    }
}

testFrontendWebSocket().catch(console.error); 