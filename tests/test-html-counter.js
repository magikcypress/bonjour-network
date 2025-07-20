const puppeteer = require('puppeteer');

async function testHtmlCounter() {
    console.log('🧪 Test HTML des compteurs...');

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

        // Récupérer tous les éléments contenant "réseaux"
        const elements = await page.evaluate(() => {
            const allElements = Array.from(document.querySelectorAll('*'));
            const networkElements = allElements.filter(el =>
                el.textContent &&
                el.textContent.includes('réseaux') &&
                el.children.length === 0 // Éléments sans enfants (texte direct)
            );

            return networkElements.map(el => ({
                tagName: el.tagName,
                className: el.className,
                textContent: el.textContent.trim(),
                outerHTML: el.outerHTML
            }));
        });

        console.log('📊 Éléments contenant "réseaux":');
        elements.forEach((el, index) => {
            console.log(`${index + 1}. <${el.tagName} class="${el.className}">`);
            console.log(`   Texte: "${el.textContent}"`);
            console.log(`   HTML: ${el.outerHTML}`);
            console.log('');
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await browser.close();
    }
}

testHtmlCounter().catch(console.error); 