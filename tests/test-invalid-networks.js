const puppeteer = require('puppeteer');

async function testInvalidNetworks() {
    console.log('🧪 Test des réseaux non validés...');

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

        // Vérifier s'il y a des réseaux non validés
        const invalidNetworksSection = await page.evaluate(() => {
            const section = document.querySelector('h2');
            if (section && section.textContent.includes('Réseaux détectés mais non validés')) {
                return {
                    title: section.textContent,
                    count: section.textContent.match(/\((\d+)\)/)?.[1] || '0'
                };
            }
            return null;
        });

        if (invalidNetworksSection) {
            console.log('✅ Section réseaux non validés trouvée:');
            console.log(`   Titre: ${invalidNetworksSection.title}`);
            console.log(`   Nombre: ${invalidNetworksSection.count} réseaux`);
        } else {
            console.log('ℹ️ Aucune section réseaux non validés trouvée (normal si tous les réseaux sont valides)');
        }

        // Vérifier les icônes d'avertissement
        const alertIcons = await page.evaluate(() => {
            const icons = Array.from(document.querySelectorAll('svg'));
            const alertIcons = icons.filter(icon =>
                icon.innerHTML.includes('AlertTriangle') ||
                icon.innerHTML.includes('alert-triangle')
            );
            return alertIcons.length;
        });

        console.log(`📊 Icônes d'avertissement trouvées: ${alertIcons}`);

        // Cliquer sur "Scanner maintenant" pour voir s'il y a de nouveaux réseaux non validés
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

        // Attendre et vérifier à nouveau
        await new Promise(resolve => setTimeout(resolve, 3000));

        const newInvalidNetworksSection = await page.evaluate(() => {
            const section = document.querySelector('h2');
            if (section && section.textContent.includes('Réseaux détectés mais non validés')) {
                return {
                    title: section.textContent,
                    count: section.textContent.match(/\((\d+)\)/)?.[1] || '0'
                };
            }
            return null;
        });

        if (newInvalidNetworksSection) {
            console.log('✅ Section réseaux non validés après scan:');
            console.log(`   Titre: ${newInvalidNetworksSection.title}`);
            console.log(`   Nombre: ${newInvalidNetworksSection.count} réseaux`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await browser.close();
    }
}

testInvalidNetworks().catch(console.error); 