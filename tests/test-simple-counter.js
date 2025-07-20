const puppeteer = require('puppeteer');

async function testSimpleCounter() {
    console.log('🧪 Test simple des compteurs...');

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

        // Récupérer tous les textes contenant "réseaux"
        const allTexts = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            const texts = elements
                .filter(el => el.textContent && el.textContent.includes('réseaux'))
                .map(el => el.textContent.trim());
            return texts;
        });

        console.log('📊 Textes contenant "réseaux":', allTexts);

        // Récupérer le HTML de la section NetworkList
        const networkListHTML = await page.evaluate(() => {
            const networkListSection = document.querySelector('.space-y-6');
            return networkListSection ? networkListSection.innerHTML : 'Non trouvé';
        });

        console.log('📄 HTML NetworkList:', networkListHTML.substring(0, 500) + '...');

        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await browser.close();
    }
}

testSimpleCounter().catch(console.error); 