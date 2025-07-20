const puppeteer = require('puppeteer');

async function testPreciseCounter() {
    console.log('🧪 Test précis des compteurs...');

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

        // Récupérer précisément les compteurs
        const counters = await page.evaluate(() => {
            // Navigation counter
            const navSpans = Array.from(document.querySelectorAll('span'));
            const navSpan = navSpans.find(span =>
                span.textContent.includes('réseaux') &&
                !span.textContent.includes('détectés') &&
                !span.textContent.includes('validés')
            );
            const navMatch = navSpan ? navSpan.textContent.match(/(\d+)\s+réseaux/) : null;
            const navCounter = navMatch ? parseInt(navMatch[1]) : 0;

            // NetworkList counter
            const listDivs = Array.from(document.querySelectorAll('div'));
            const listDiv = listDivs.find(div =>
                div.textContent.includes('réseaux détectés')
            );
            const listMatch = listDiv ? listDiv.textContent.match(/(\d+)\s+réseaux détectés/) : null;
            const listCounter = listMatch ? parseInt(listMatch[1]) : 0;

            // Validated counter
            const validatedMatch = listDiv ? listDiv.textContent.match(/\((\d+)\s+validés\)/) : null;
            const validatedCounter = validatedMatch ? parseInt(validatedMatch[1]) : 0;

            return {
                navCounter,
                listCounter,
                validatedCounter,
                navText: navSpan ? navSpan.textContent : 'Non trouvé',
                listText: listDiv ? listDiv.textContent : 'Non trouvé'
            };
        });

        console.log('📊 Résultats précis:');
        console.log(`- Navigation: ${counters.navCounter} (${counters.navText})`);
        console.log(`- NetworkList: ${counters.listCounter} (${counters.listText})`);
        console.log(`- Validés: ${counters.validatedCounter}`);

        if (counters.navCounter !== counters.listCounter) {
            console.log(`❌ Différence détectée: Navigation=${counters.navCounter}, NetworkList=${counters.listCounter}`);
            console.log(`📝 Différence: ${counters.navCounter - counters.listCounter} réseaux`);
        } else {
            console.log('✅ Compteurs synchronisés');
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await browser.close();
    }
}

testPreciseCounter().catch(console.error); 