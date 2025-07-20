const puppeteer = require('puppeteer');

async function testValidationDetails() {
    console.log('🧪 Test des détails de validation...');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });

    try {
        const page = await browser.newPage();

        // Écouter les logs de validation
        page.on('console', msg => {
            if (msg.text().includes('Validation') || msg.text().includes('rejeté') || msg.text().includes('validés')) {
                console.log('📱 Frontend:', msg.text());
            }
        });

        // Aller sur l'application
        console.log('🌐 Navigation...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Attendre que l'application se charge
        await page.waitForSelector('button', { timeout: 10000 });
        console.log('✅ Application chargée');

        // Attendre un peu pour voir les logs de validation
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Cliquer sur "Scanner maintenant" pour déclencher une nouvelle validation
        console.log('🔄 Clic sur "Scanner maintenant"...');
        const buttons = await page.$$('button');
        for (const button of buttons) {
            const text = await button.evaluate(el => el.textContent);
            if (text.includes('Scanner maintenant')) {
                await button.click();
                console.log('✅ Bouton cliqué');
                break;
            }
        }

        // Attendre pour voir les nouveaux logs
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('📊 Résumé de la validation:');
        console.log('- Les logs ci-dessus montrent quels réseaux sont rejetés et pourquoi');
        console.log('- Les réseaux "détectés" sont tous ceux du serveur');
        console.log('- Les réseaux "validés" sont ceux qui passent la validation frontend');

        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await browser.close();
    }
}

testValidationDetails().catch(console.error); 