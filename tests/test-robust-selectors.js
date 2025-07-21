// Exemple de test avec des sélecteurs robustes
const puppeteer = require('puppeteer');

async function testWithRobustSelectors() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3000');
    
    // Test du toggle switch avec sélecteur robuste
    const toggleSwitch = await page.$('button.bg-gradient-to-r');
    if (toggleSwitch) {
        console.log('✅ Toggle switch trouvé avec sélecteur robuste');
        await toggleSwitch.click();
    }
    
    // Test du bouton de scan avec sélecteur de texte
    const scanButton = await page.$('button:has-text("Scanner maintenant")');
    if (scanButton) {
        console.log('✅ Bouton de scan trouvé');
        await scanButton.click();
    }
    
    // Test des éléments de réseau avec sélecteur simple
    const networkItems = await page.$$('div.bg-white.rounded-lg.shadow-lg');
    console.log(`✅ ${networkItems.length} éléments de réseau trouvés`);
    
    // Test des compteurs avec sélecteur de texte
    const networkCount = await page.$('div:has-text("réseaux détectés")');
    if (networkCount) {
        console.log('✅ Compteur de réseaux trouvé');
    }
    
    await browser.close();
}

testWithRobustSelectors().catch(console.error);
