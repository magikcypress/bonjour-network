const puppeteer = require('puppeteer');

async function testPuppeteerConfig() {
    console.log('🔍 Test de la configuration Puppeteer...');

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });

        console.log('✅ Puppeteer lancé avec succès');

        const page = await browser.newPage();
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

        console.log('✅ Page chargée avec succès');

        const title = await page.title();
        console.log(`📄 Titre de la page: ${title}`);

        await browser.close();
        console.log('✅ Test terminé avec succès');

    } catch (error) {
        console.error('❌ Erreur lors du test Puppeteer:', error.message);
        process.exit(1);
    }
}

testPuppeteerConfig(); 