const puppeteer = require('puppeteer');

async function testCounters() {
    console.log('🧪 Test de synchronisation des compteurs...');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });

    try {
        const page = await browser.newPage();

        // Écouter les logs de la console
        page.on('console', msg => {
            if (msg.text().includes('réseaux') || msg.text().includes('Validation') || msg.text().includes('networkCount')) {
                console.log('📱 Frontend:', msg.text());
            }
        });

        // Aller sur l'application
        console.log('🌐 Navigation...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Attendre que l'application se charge
        await page.waitForSelector('button', { timeout: 10000 });
        console.log('✅ Application chargée');

        // Attendre un peu pour que les données se chargent
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Récupérer le compteur de la navigation
        const navCounter = await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            const navElement = spans.find(span => span.textContent.includes('réseaux') && !span.textContent.includes('détectés'));
            if (navElement) {
                const text = navElement.textContent;
                const match = text.match(/(\d+)\s+réseaux/);
                return match ? parseInt(match[1]) : 0;
            }
            return 0;
        });

        console.log(`📊 Compteur Navigation: ${navCounter}`);

        // Récupérer le compteur de la page NetworkList
        const listCounter = await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            console.log('🔍 Tous les spans trouvés:', spans.map(s => s.textContent));
            const listElement = spans.find(span => span.textContent.includes('réseaux détectés'));
            if (listElement) {
                const text = listElement.textContent;
                console.log('📊 Texte du span NetworkList:', text);
                // Chercher le premier nombre (réseaux détectés)
                const match = text.match(/(\d+)\s+réseaux détectés/);
                return match ? parseInt(match[1]) : 0;
            }
            return 0;
        });

        console.log(`📊 Compteur NetworkList: ${listCounter}`);

        // Cliquer sur le bouton "Scanner maintenant"
        console.log('🔄 Clic sur "Scanner maintenant"...');
        const buttons = await page.$$('button');
        const scanButton = buttons.find(async button => {
            const text = await button.evaluate(el => el.textContent);
            return text.includes('Scanner maintenant');
        });
        if (scanButton) {
            await scanButton.click();
            console.log('✅ Bouton cliqué');

            // Attendre un peu
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Récupérer les nouveaux compteurs
            const newNavCounter = await page.evaluate(() => {
                const spans = Array.from(document.querySelectorAll('span'));
                const navElement = spans.find(span => span.textContent.includes('réseaux') && !span.textContent.includes('détectés'));
                if (navElement) {
                    const text = navElement.textContent;
                    const match = text.match(/(\d+)\s+réseaux/);
                    return match ? parseInt(match[1]) : 0;
                }
                return 0;
            });

            const newListCounter = await page.evaluate(() => {
                const spans = Array.from(document.querySelectorAll('span'));
                const listElement = spans.find(span => span.textContent.includes('réseaux détectés'));
                if (listElement) {
                    const text = listElement.textContent;
                    // Chercher le premier nombre (réseaux détectés)
                    const match = text.match(/(\d+)\s+réseaux détectés/);
                    return match ? parseInt(match[1]) : 0;
                }
                return 0;
            });

            console.log(`📊 Nouveau compteur Navigation: ${newNavCounter}`);
            console.log(`📊 Nouveau compteur NetworkList: ${newListCounter}`);

            // Vérifier la synchronisation
            if (newNavCounter === newListCounter) {
                console.log('✅ Compteurs synchronisés !');
            } else {
                console.log(`❌ Compteurs non synchronisés: Navigation=${newNavCounter}, NetworkList=${newListCounter}`);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await browser.close();
    }
}

testCounters().catch(console.error); 