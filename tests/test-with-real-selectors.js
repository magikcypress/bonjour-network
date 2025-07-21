// Test mis à jour avec les sélecteurs réels
const puppeteer = require('puppeteer');

async function testWithRealSelectors() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3000');
    
    // Test du toggle switch avec les vraies classes CSS
    const toggleSwitch = await page.$('button.bg-gradient-to-r');
    if (toggleSwitch) {
        console.log('✅ Toggle switch trouvé avec les vraies classes CSS');
        await toggleSwitch.click();
    }
    
    // Test du bouton de scan
    const scanButton = await page.$('button:has-text("Scanner maintenant")');
    if (scanButton) {
        console.log('✅ Bouton de scan trouvé');
        await scanButton.click();
    }
    
    // Test des éléments de réseau avec les vraies classes
    const networkItems = await page.$$('div.bg-white.rounded-lg');
    console.log(`✅ ${networkItems.length} éléments de réseau trouvés`);
    
    await browser.close();
}

testWithRealSelectors().catch(console.error);
